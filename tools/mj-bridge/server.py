"""
MJ 生图桥接服务 —— 把本机的 Midjourney 自动化（mxai-rpa-mcp）包装成
OpenAI 兼容的 /v1/images/generations 接口，画布可以直接当成一个渠道来填。

为什么需要它：
  mxai-rpa-mcp 是 Playwright 浏览器自动化，必须跑在有桌面环境、且已登录
  mxai.cn 的机器上。画布在浏览器里，不能直接调它，所以中间加一层 HTTP。

为什么是 OpenAI 兼容格式：
  画布的渠道系统本来就支持 OpenAI 协议，这样 MJ 不需要改画布任何代码，
  在渠道配置里填这个服务的地址 + 模型名 midjourney 就能用。

启动：
  pip install -r requirements.txt
  python server.py            # 默认监听 127.0.0.1:8765

注意：
  - 只监听 127.0.0.1。公网页面是 https，直接填 http://127.0.0.1:8765 会被
    浏览器按混合内容拦掉，需要先用 cloudflared 暴露成 https。
  - 生成是付费动作，调用即消耗本机 MJ 账号的积分。
"""

from __future__ import annotations

import base64
import json
import mimetypes
import os
import subprocess
import sys
import time
import uuid
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

HERE = Path(__file__).resolve().parent
RUNNER = HERE / "mj_run.js"
RESULTS_DIR = HERE / ".results"
RESULTS_DIR.mkdir(exist_ok=True)

MODEL_NAME = os.environ.get("MJ_BRIDGE_MODEL", "midjourney")
DEFAULT_VERSION = os.environ.get("MJ_BRIDGE_VERSION", "v8.2")
DEFAULT_TIMEOUT_MS = int(os.environ.get("MJ_BRIDGE_TIMEOUT_MS", "300000"))

app = FastAPI(title="MJ Bridge", version="1.0")

# 画布部署在别的域名下，必须放开跨域；锁死为本地桥接用途，不承载敏感数据。
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerationRequest(BaseModel):
    prompt: str = ""
    model: str | None = None
    n: int = Field(default=1, ge=1, le=15)
    size: str | None = None
    quality: str | None = None
    aspect: str | None = None


def size_to_aspect(size: str | None, fallback: str = "9:16") -> str:
    """把画布传来的像素尺寸（如 1024x1536）换算成 MJ 的 --ar 比例。"""
    if not size:
        return fallback
    try:
        width, height = (int(part) for part in size.lower().split("x", 1))
    except (ValueError, AttributeError):
        return fallback
    if width <= 0 or height <= 0:
        return fallback
    ratio = width / height
    # MJ 只能用有限的几档宽高比，取最接近的一档。
    candidates = {
        "1:1": 1.0,
        "9:16": 9 / 16,
        "16:9": 16 / 9,
        "2:3": 2 / 3,
        "3:2": 3 / 2,
        "3:4": 3 / 4,
        "4:3": 4 / 3,
        "4:5": 4 / 5,
        "5:4": 5 / 4,
    }
    name, _ = min(candidates.items(), key=lambda item: abs(item[1] - ratio))
    return name


def run_mj(prompt: str, aspect: str, timeout_ms: int) -> dict:
    """调 Node 侧跑一次生图，返回解析后的结果字典。"""
    if not RUNNER.exists():
        raise HTTPException(status_code=500, detail=f"缺少 {RUNNER}")
    command = [
        "node",
        str(RUNNER),
        "--prompt",
        prompt,
        "--aspect",
        aspect,
        "--out-dir",
        str(RESULTS_DIR),
        "--prefix",
        f"mj_{uuid.uuid4().hex[:8]}",
        "--version",
        DEFAULT_VERSION,
        "--timeout",
        str(timeout_ms),
    ]
    started = time.time()
    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout_ms / 1000 + 120,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="MJ 生成超时")

    stdout = (completed.stdout or "").strip()
    if not stdout:
        tail = (completed.stderr or "").strip().splitlines()[-5:]
        raise HTTPException(status_code=502, detail="MJ 桥接没有返回结果：" + " | ".join(tail))

    try:
        payload = json.loads(stdout.splitlines()[-1])
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="MJ 桥接返回了无法解析的内容：" + stdout[:200])

    payload["seconds"] = round(time.time() - started, 1)
    if completed.returncode == 2 or payload.get("needLogin"):
        raise HTTPException(status_code=401, detail=payload.get("error") or "MXAI 未登录")
    return payload


def file_to_b64(path_value: str) -> str:
    data = Path(path_value).read_bytes()
    mime = mimetypes.guess_type(path_value)[0] or "image/png"
    return f"data:{mime};base64," + base64.b64encode(data).decode("ascii")


@app.get("/health")
def health():
    return {
        "ok": True,
        "model": MODEL_NAME,
        "runner": str(RUNNER),
        "runnerExists": RUNNER.exists(),
        "version": DEFAULT_VERSION,
    }


@app.get("/v1/models")
def list_models():
    """画布的「拉取模型列表」会打这个接口。"""
    return {"object": "list", "data": [{"id": MODEL_NAME, "object": "model", "owned_by": "mxai"}]}


@app.post("/v1/images/generations")
def generate(request: GenerationRequest):
    prompt = (request.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt 不能为空")

    # MJ 一次出的是四宫格整图，n>1 只能靠重复调用凑，串行跑避免抢占同一个浏览器。
    aspect = request.aspect or size_to_aspect(request.size)
    images: list[dict] = []
    errors: list[str] = []

    for index in range(request.n):
        payload = run_mj(prompt, aspect, DEFAULT_TIMEOUT_MS)
        files = payload.get("images") or []
        if not files:
            errors.append(payload.get("error") or f"第 {index + 1} 张没有返回图片")
            continue
        images.extend({"b64_json": file_to_b64(file), "url": None} for file in files)

    if not images:
        raise HTTPException(status_code=502, detail="；".join(errors) or "MJ 没有返回任何图片")

    return {"created": int(time.time()), "data": images}


if __name__ == "__main__":
    port = int(os.environ.get("MJ_BRIDGE_PORT", "8765"))
    print(f"MJ bridge listening on http://127.0.0.1:{port}  (model={MODEL_NAME})", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")

# MJ 桥接服务（mxai-rpa-mcp → OpenAI 兼容接口）

把本机的 Midjourney 自动化能力包装成 OpenAI 格式的 `/v1/images/generations`，
这样画布只要把它当成一个普通渠道填写，就能用 MJ 出图，**画布侧不需要改任何代码**。

## 它解决什么问题

`mxai-rpa-mcp` 是 Playwright 浏览器自动化，必须跑在**有桌面环境、且已登录 mxai.cn** 的机器上，
浏览器里的画布没法直接调用它。这层 HTTP 服务就是中间那道桥：

```text
画布（浏览器） → https 地址 → cloudflared 隧道 → 本服务（127.0.0.1:8765） → node mj_run.js → mxai.cn
```

## 前置条件

1. 已安装 `mxai-rpa-mcp` 技能包（默认路径 `~/.workbuddy/skills/mxai-rpa-mcp/scripts/mxai_adapter.js`）。
   装在别处就用环境变量 `MXAI_ADAPTER_PATH` 指向 `mxai_adapter.js`。
2. 该技能包的 `scripts/` 下已装好 `node_modules`（自带，缺失就 `npm install`）。
3. 首次运行会弹出浏览器窗口，**需要手动登录一次 mxai.cn**，登录态存在技能包的 `.browser-profile` 里。
4. 本机有 Node 与 Python 3.10+。

> 生成是付费动作，调用即消耗你本机 MJ 账号的积分。

## 启动

```bash
cd tools/mj-bridge
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt   # 仅首次
.venv/Scripts/python server.py
```

默认监听 `127.0.0.1:8765`。自检：

```bash
curl http://127.0.0.1:8765/health
curl http://127.0.0.1:8765/v1/models
```

## 暴露成 https（画布在公网时必做）

画布部署在 `https://hb.cauai.fun`，浏览器不允许 https 页面请求 `http://127.0.0.1:8765`
（混合内容会被拦掉），所以本地服务必须套一层 https：

```bash
cloudflared tunnel --url http://127.0.0.1:8765 --protocol http2 --no-autoupdate
```

它会给一个 `https://xxxx.trycloudflare.com` 地址，把这个地址填进画布的渠道配置。
**临时地址在进程停掉后失效**，需要长期用就去 Cloudflare 后台建一个命名隧道。

## 在画布里配置

设置 → 渠道 → 从模板添加 → **Midjourney (本地桥接)**，然后：

- 接口地址：改成你的 https 隧道地址（本机调试可先留 `http://127.0.0.1:8765`）
- API Key：随便填一个非空值即可（本服务不校验，但画布要求非空）
- 模型：`midjourney`，能力选「生图」

## 行为说明

- `size` 会自动换算成 MJ 的 `--ar` 比例（1:1 / 9:16 / 16:9 / 2:3 / 3:2 / 3:4 / 4:3 / 4:5 / 5:4 里取最接近的一档）。
  想强制指定比例，请求体里直接传 `aspect`。
- MJ 一次出的是四宫格整图，所以 `n>1` 会**串行重复调用** n 次，耗时随之线性增加。
- `quality`、`output_format` 这类 MJ 不支持的参数会被忽略。
- 默认 MJ 版本 `v8.2`，超时 300 秒；可用 `MJ_BRIDGE_VERSION` / `MJ_BRIDGE_TIMEOUT_MS` 覆盖。

## 常见报错

| 现象 | 原因与处理 |
|---|---|
| `401 MXAI 未登录` | 弹出的浏览器里登录 mxai.cn，登录后重试 |
| `502 桥接没有返回结果` | 看服务终端的 stderr，通常是 Playwright 找不到浏览器或页面结构变了 |
| 找不到 MJ 适配器 | 装 mxai-rpa-mcp 技能包，或设 `MXAI_ADAPTER_PATH` |
| 公网页面请求失败 | 地址还是 `http://127.0.0.1`，需要 cloudflared 暴露成 https |
| `504 MJ 生成超时` | MJ 排队久，调大 `MJ_BRIDGE_TIMEOUT_MS` |

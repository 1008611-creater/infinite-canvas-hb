# 部署与MCP集成

> **归档副本** —— 来源：`E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas-deploy\README_部署与MCP集成.md`
> 复制日期：2026-09-11　|　归集到：`E:\codex\huabu\inventory\`
> 原件仍在原位，**本副本不是权威版本**；两者不一致时以原件为准。

---

# infinite-canvas × 天宫漫剧 视频工作流 —— 部署与 MCP 集成包

> 目标：把本地 `infinite-canvas` 画布变成天宫漫剧的生产看板 + 抽卡台。
> 视频生成统一走 **Agnes OpenAI 兼容视频代理**（已验证可用），未来 minimax H3 / Seedance 同构扩展。
> MCP 让 AI 编程 Agent（Codex / Claude Code）直接操作画布节点。

---

## 一、整体架构

```
[ 天宫漫剧 AI Agent (Codex / Claude Code) ]
        │  MCP (stdio)
        ▼
[ Canvas Agent  npx @basketikun/canvas-agent ]  本地 :17371 + token
        │  WebSocket
        ▼
[ infinite-canvas 画布网页 ]  localhost:3000(或 :5173)
        │  视频生成请求 /v1/videos
        ▼
[ Agnes 视频代理  node server.js ]  localhost:8787/v1
        │  翻译 OpenAI 兼容 <-> Agnes 真实端点
        ▼
[ Agnes AI  apihub.agnes-ai.com ]  (Flash 限时免费 / 720P / 4-12s)
```

要点：
- 画布只认一个 Base URL（`http://localhost:8787/v1`），Agnes / minimax / Seedance 的厂商差异被代理吞掉。
- 代理自带 `AGNES_API_KEY`（在 `.env`，不入库），所以画布 UI 里填的 API Key 只是占位，代理会用自己的 key。
- 代理默认拉满：竖屏 `9:16`、时长 `12s`（封顶）、`720P`。

---

## 二、视频代理（已完成并验证）

位置：`E:/codex/niannianai/zhuanhuiyuangong/agnes-video-proxy`

```bash
cd E:/codex/niannianai/zhuanhuiyuangong/agnes-video-proxy
node server.js            # 后台常驻；日志 proxy.log
```

验证过的能力：`/health`、`/v1/models`、真实 Flash 文生视频（提交→轮询→拿到 `video_url`）全部通过。

> 后续扩展 minimax / seedance：在 `server.js` 的 `providers` 段加分支，对外仍是同一套 `/v1/videos`，画布零改动。

---

## 三、部署 infinite-canvas（bun 开发态，按老大决策）

仓库已克隆到 `E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas`。

```bash
# 1) 装 bun（若未装）
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc   # 或重开终端

# 2) 安装并启动前端（画布本体）
cd E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas
bun install
bun run dev
# 启动后看终端输出的本地地址，默认 http://localhost:3000 或 http://localhost:5173
```

> 注：本机已确认有 Node v22；bun 需单独装。若不想装 bun，可用 `npm install` + `npm run dev`（README 主推 bun，但 npm 通常也可）。

---

## 四、把画布视频渠道指向代理

打开画布网页 → 右上角「配置 / 设置」→ 添加 AI 渠道（OpenAI 兼容）：

| 字段 | 值 |
|---|---|
| Base URL | `http://localhost:8787/v1` |
| API Key | 任意占位（如 `proxy`）；代理用自己的 `AGNES_API_KEY`，不读这个 |
| 视频模型 | `agnes-video-2.5-flash`（免费预演）/ `agnes-video-2.5`（正式 2K 成片）|

> 生成节点里选「视频生成」即会调用 `/v1/videos`，由代理翻译给 Agnes。
> 图片生成（参考图、MJ 出图）走画布其它渠道，与本代理无关，维持现状。

---

## 五、启动 Canvas Agent + 注册 MCP

### 5.1 启动本地 Agent（每次要用画布 MCP 前启动）
```bash
npx -y @basketikun/canvas-agent
# 输出 Local URL: http://127.0.0.1:17371 与 Connect token: xxxxxx
```
在画布网页右上角点「Agent」，填入上面的地址和 token 连接。

### 5.2 把画布注册成 Codex 的 MCP（一次性）
```bash
codex mcp add infinite-canvas -- npx -y @basketikun/canvas-agent mcp
```
Claude Code：
```bash
claude mcp add --scope user --transport stdio infinite-canvas -- npx -y @basketikun/canvas-agent mcp
```
本仓库开发态（用绝对路径，避坑）：
```bash
codex mcp add infinite-canvas -- node E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas/canvas-agent/dist/index.js mcp
```

### 5.3 可用 MCP 工具
- `canvas_get_state`：读取整张画布节点/连线
- `canvas_get_selection`：读取当前选中节点
- `canvas_export_snapshot`：导出画布快照
- `canvas_apply_ops`：批量增删改节点（核心，见 SOP 的 ops 示例）
- `canvas_create_text_node`：建文本节点
- `canvas_create_image_prompt_flow`：建图片/视频提示流节点（**触发代理生成视频**）

---

## 六、给小选 / CodeBuddy 自己用

本会话的 CodeBuddy 暂不能直接作为 MCP client 连 `:17371`，但小选可以：
1. **出视频**：直接调代理（已验证），例如：
   ```bash
   curl -s -X POST http://localhost:8787/v1/videos -H "Content-Type: application/json" \
     -d '{"prompt":"柳小念侧脸逆光，云海翻涌","mode":"text","seconds":5,"aspect_ratio":"9:16"}'
   ```
2. **操作画布**：通过 Canvas Agent 的本地 HTTP/SSE 接口（需现抓其 API）；或让用户在 Codex/Claude Code 里用 MCP。
   后续若要把「小选直接驱动画布」做成一键能力，可把 Canvas Agent 的 HTTP 协议包一层本地 CLI，再让 CodeBuddy 用 Bash 调。

---

## 七、常见问题

- **代理提交后画布轮询一直 queued**：Agnes 排队正常，Flash 一般 20-60s 出片；代理已验证能拿到 completed。
- **画布报 401**：代理不校验入站 key，多半是 Base URL 填错（要带 `/v1`）或代理没起来（`curl :8787/health`）。
- **参考图失败**：代理会自动把本地图传 catbox 并压缩；直接传 URL 需公网可访问。
- **API Key 安全**：`agnes-video-proxy/.env` 已 gitignore；密钥勿入库、勿回显到对外内容。聊天里贴过的 key 建议用完即轮换。

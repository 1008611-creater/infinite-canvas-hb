# agnes-video-proxy

把 Agnes AI 的非标准视频接口翻译成 OpenAI 风格的视频接口，供 `infinite-canvas` 作为视频渠道接入。

## 启动

```bash
cd agnes-video-proxy
cp .env.example .env   # 填入真实 AGNES_API_KEY
node server.js
```

默认监听：

```text
http://localhost:8787
```

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `AGNES_API_KEY` | Agnes API Key，必填 |
| `AGNES_BASE_URL` | Agnes 服务地址，默认 `https://apihub.agnes-ai.com` |
| `PROXY_PORT` | 代理端口，默认 `8787` |
| `AGENT_UPLOAD` | 本地参考图上传方式：`catbox` \| `uguu` \| `none` |
| `DEFAULT_AR` | 默认画幅，竖屏 `9:16` |
| `DEFAULT_SECONDS` | 默认时长，单位秒 |

`.env` 已在 `.gitignore` 中，禁止入库。

## 接口

```text
GET  /health           健康检查
GET  /v1/models        模型列表
POST /v1/videos        创建视频任务
GET  /v1/videos/:id    查询任务状态
GET  /agnesapi         Agnes 轮询适配
```

## 模型

当前只开放免费的：

```text
agnes-video-2.5-flash
```

付费标准版 `agnes-video-2.5` 会被代理拒绝，前端模型选择器也不会显示。扩展其他厂商时在此处登记模型表。

## 三种生成模式

| mode | 说明 | 允许字段 | 限制 |
| --- | --- | --- | --- |
| `text` | 文生视频 | 无 | 携带任何图片字段会报错 |
| `keyframe` | 首尾帧 | `first_frame`、`last_frame` | 至少一帧；不能混用 `images[]` |
| `reference` | 全能参考 | `images[]` | 1–5 张；不能混用首尾帧 |

模式与图片字段混用时，代理会直接拒绝请求，避免产生不可预期的计费。

## 参考图上传

本地图片需要先上传到公网图床，Agnes 才能下载。默认使用 catbox，通过 `curl` 子进程上传，以复用系统代理并规避 Node.js 直连时的 `socket hang up`。

## 限流

Agnes 免费额度存在频率限制，出现过：

```text
429 rate_limit_exceeded
```

遇到限流时等待冷却后重试即可。

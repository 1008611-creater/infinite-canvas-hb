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
| `AGENT_UPLOAD` | 本地参考图图床：`auto`（默认，多图床回退）\| `litterbox` \| `uguu` \| `tmpfiles` \| `catbox` \| `none` |
| `UPLOAD_ENDPOINT` | 自定义图床地址（选填，填了优先使用） |
| `UPLOAD_FILE_FIELD` | 自定义图床的文件字段名，默认 `fileToUpload` |
| `UPLOAD_FIELDS` | 自定义图床的额外表单字段，JSON 字符串，如 `{"reqtype":"fileupload"}` |
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

本地图片需要先上传到公网图床，Agnes 才能下载。所有上传都通过 `curl` 子进程完成，以复用系统代理并规避 Node.js 直连时的 `socket hang up`。

默认 `AGENT_UPLOAD=auto`，按顺序回退，前一个失败自动换下一个：

| 顺序 | 图床 | 有效期 | 备注 |
| --- | --- | --- | --- |
| 1 | `litterbox` | 72 小时 | 当前主用，返回 `litter.catbox.moe` 真直链 |
| 2 | `uguu` | 24 小时 | 备用 |
| 3 | `tmpfiles` | 1 小时 | 返回页面地址，代理自动转成 `/dl/` 直链 |
| 4 | `catbox` | 永久 | 匿名上传已被封（返回 `Invalid uploader`），仅作兜底 |

> 2026-08-28 实测：`catbox.moe` 匿名上传返回 `Invalid uploader`、`0x0.st` 已关闭上传，导致画布内直传本地参考图全部失败。默认顺序因此改为 litterbox 优先。

如果自建图床更稳（对象存储 / 七牛 / 自建 MinIO 等），配置 `UPLOAD_ENDPOINT` 即可插到队首，内置图床仍作兜底：

```bash
UPLOAD_ENDPOINT=https://your-image-host.example/api/upload
UPLOAD_FILE_FIELD=fileToUpload
UPLOAD_FIELDS={"reqtype":"fileupload"}
```

大于 1.5 MB 的图片会先用本机 `ffmpeg` 压到长边 1280 再上传，压缩失败则按原图上传。

## 画质预期

**Agnes 视频模型（尤其免费 flash）本身画质偏弱，成片质量的上限由输入图决定。** 生产链路应当是：

```text
MJ v8.2 / image2 出高质量首尾帧 → Agnes 做 keyframe 插值运镜 → 成片
```

`keyframe` 模式下首帧尾帧给什么质量，成片就封顶在什么质量；`text` 模式没有高质量底图，只能由弱视频模型凭空生成，画面最不可控。因此正式镜头不要用 `text` 直出。

## 限流

Agnes 免费额度存在频率限制，出现过：

```text
429 rate_limit_exceeded
```

遇到限流时等待冷却后重试即可。

# 画布架构 · 无限画布（hb.cauai.fun）

本文件描述**实际部署的那一套**。线上状态本会话未验证（无浏览器），以下内容来自源码与部署配置的静态阅读。

## 技术栈

| 层 | 实现 |
|---|---|
| 构建 | Vite 7 |
| 框架 | React Router 7 + TypeScript |
| UI | Ant Design v6 + Tailwind |
| 状态 | Zustand |
| 本地存储 | IndexedDB（通过 localforage） |
| 云同步 | WebDAV（自研 `canvas-webdav` 服务） |
| 服务端数据 | Postgres 16（自研 `canvas-api`） |
| 部署 | Docker Compose + nginx + Cloudflare Tunnel |

**本地优先是设计前提**：即使服务端全挂，本机画布数据仍在。WebDAV 和 API 都是增强项，不是运行前提。

## 三种视频模式

这是本 fork 相对上游最重要的能力扩展。三种模式**互斥**，模式和图片字段不能混用，代理侧会直接拒绝非法组合。

| 模式 | 用途 | 图片槽位 | 约束 |
|---|---|---|---|
| `text` | 文生视频 | 0 | 带图直接报错；不用于正式镜头 |
| `keyframe` | 首尾帧 | 2 | 字段为 `first_frame` / `last_frame`，至少给一帧 |
| `reference` | 全能参考 | 1–5 | 字段为 `images[]` |

入参构造统一走 `web/src/services/api/video.ts` 的 `buildVideoInput()`。

**画质上限由输入图决定。** 免费视频模型本身弱，正式镜头先用 MJ v8.2 或 image2 出高质量首尾帧，再进 `keyframe` 模式出片。

**当前只开放免费的 `agnes-video-2.5-flash`。** 付费模型 `agnes-video-2.5` 被代理拒绝，前端也隐藏了。这是收益能力的硬天花板，详见 `REVENUE_MODEL.md`。

**免费额度限流约 1 次/分钟**，超了返回 `429 rate_limit_exceeded`。

## 数据分层

| 层 | 存什么 | 在哪 |
|---|---|---|
| 画布本体 | 节点、连线、布局 | 浏览器 IndexedDB |
| 云同步 | 上述数据的副本 | WebDAV（`/dav`） |
| 账号与项目 | 用户、项目、素材索引、媒体元数据 | `canvas-api` + Postgres |
| 媒体文件 | 图片、视频实体 | `canvas-api-media` 目录 |

**节点只存引用，不存文件本体。** 画布节点里放的是 URL / 引用标识，真正的文件在媒体库或外部。这样画布数据体积可控，但也意味着**媒体文件丢了画布就残缺**。

## 部署拓扑

```text
浏览器
  → Cloudflare
  → cloudflared 隧道 (hb-canvas)
  → 127.0.0.1:18085  [nginx 容器 web]
       ├─ /login.html            免门禁，自包含登录页
       ├─ /agnes/auth            免门禁（此时还没有 cookie）
       ├─ /                      静态前端，无 cookie → 302 到登录页
       ├─ /assets/               无 cookie → 403
       ├─ /config.js             门禁 + no-store
       ├─ /agnes/…   cookie 门禁 → agnes 容器 :8787（视频代理）
       ├─ /dav/      Basic Auth   → 同容器 :8789（WebDAV）
       ├─ /api/…                  → api 容器 :8790
       └─ /show/…                免门禁静态目录（交付展示位，仅服务器上手工建）
```

四个容器：

| 容器 | 镜像 | 端口 | 职责 |
|---|---|---|---|
| `web` | nginx:1.27-alpine | `127.0.0.1:18085:80` | 门禁、路由、静态前端 |
| `agnes` | `canvas-agnes-proxy` | 内部 8787 / 8789 | 视频代理 + WebDAV（同一容器两个服务） |
| `api` | `canvas-api` | 内部 8790 | 账号、项目、素材、媒体 |
| `db` | postgres:16-alpine | 内部 | 数据；健康检查 `pg_isready` |

**源站不开 80/443 直连，只走隧道。隧道停 = 域名打不开。**

## 门禁设计

两道锁，缺一不可：

1. **nginx cookie 门禁**（`canvas_auth` cookie）—— 挡住浏览器里的普通访问
2. **代理侧令牌**（`PROXY_ACCESS_TOKEN`）—— 即使绕过 nginx 也进不来

**令牌由 nginx 注入，不由浏览器发送。** 浏览器不可能同时给同一个请求带两个 `Authorization` 头，所以视频代理的 Bearer 令牌是 nginx 加进去的。

三条路由**故意不吃 cookie 门禁**，各有原因：

- `/dav/` 走 Basic Auth —— WebDAV 客户端不认 cookie，只能用 HTTP 基础认证
- `/api/` 走自己的鉴权 —— 由 `canvas-api` 管理，前端带自己的 token
- `/agnes/auth` 必须免门禁 —— 此刻用户还没登录，正是来换 cookie 的

**`AUTH_COOKIE` 必须长期固定。** 每次发布更换 = 所有用户被强制重新登录。首次生成后写进服务器 `.env` 复用。

**改 `.env` 必须重建容器。** 环境变量在容器启动时注入，不重建就是"密码改了还是旧的"，而且日志全绿看不出来。

## 三个必须记住的坑

### 坑一：挂目录，不挂单个文件

docker bind mount 绑定的是 inode。`current` 软链切换和 `sed -i` 都会创建新 inode。如果挂的是单个文件，容器永远读启动时那一份——**发布日志全绿，线上跑旧版**。

### 坑二：`current` 必须是相对软链

必须指向 `releases/canvas-xxx` 这样的相对路径。写成绝对路径，容器内部解析不到，所有请求 500。

### 坑三：新增后端文件要改两处

`publish.sh` 的打包列表和 `deploy/Dockerfile.api` 的 COPY 指令。漏一处，新文件不会进镜像。

（`publish.sh` L250-251 上传两份：`deploy/Dockerfile.proxy` → agnes 代理容器，`deploy/Dockerfile.api` → canvas-api 容器。
画布后端的 COPY 在 **`Dockerfile.api`**。`Dockerfile.proxy` 是 agnes 代理 + webdav 的镜像，`FROM node:22-alpine`，与画布后端无关。）

## 大文件与上传

Cloudflare 给源站的上限约 **100 秒**，超时返回 **524**。实测 30MB 文件 105 秒能过、135 秒被掐。

对策是**分片上传**：4MB 一片，带 `Content-Range` 和 `X-Upload-Offset`，暂存到 `.parts/`，最后原子改名。

nginx 侧对应配置：`client_max_body_size 0`（不限体积）+ `proxy_request_buffering off`（不缓冲转发）。API 和 WebDAV 两条路径都是这个配置。

## 服务器目录

| 路径 | 内容 | 可恢复性 |
|---|---|---|
| `/opt/infinite-canvas/current` | 当前版本（相对软链） | 可重建 |
| `/opt/infinite-canvas/releases` | 历史版本 | 可重建 |
| `/opt/infinite-canvas/nginx` | nginx 配置 | 可重建 |
| `/opt/infinite-canvas/show` | 展示位（手工建） | 可重建 |
| `/opt/infinite-canvas/api` | API 源码 | 可重建 |
| `/opt/agnes-video-proxy` | **Agnes 密钥唯一存放处** | **不可再生** |
| `/opt/canvas-webdav` | **用户云同步数据** | **不可再生** |
| `/opt/canvas-api-media` | **媒体库** | **不可再生** |
| `/opt/canvas-api-sync` | API 同步数据 | 谨慎 |
| `/opt/canvas-postgres` | **账号与项目数据** | **不可再生** |

回滚方式：切 `current` 软链到目标 release，然后让 nginx 重新加载配置。

## 画布内部模型

- **节点只存引用**，不存文件本体。
- **边有类型**，不是随便连的线。连线语义见 `PRODUCT_CHARTER.md` 的天宫漫剧流程。
- **执行链**：节点按连线顺序执行，形成从剧本到成片的处理链。

> ⚠️ **审计局限（2026-09-13 订正）**：画布交互**已有部分真实浏览器证据**，不再是空白。权威源码树 `.probe/` 下留有 2026-09-01 的 Playwright 会话（真实 Chrome + `canvas_auth` cookie 打 `https://hb.cauai.fun`），**已覆盖**：节点渲染、拖拽连线（含反向起拖）、连线方向语义（`fromNodeId`/`toNodeId`）、1 张图→`videoMode` 自动变 `reference`、2 张图保持、秒数按模型钳位（4/6/8/10/12）。
>
> **仍未覆盖**：**缩放**、**节点链真实执行**（该会话全程用占位素材，未真调出片接口）、**插件安装**、Agent SSE。
>
> **证据强度如实评级**：脚本有两条中止路径会写失败截图并 `exit(1)`（`pr12-fail-load.png` / `pr12-fail-panel.png`），这两张**都不存在**，且**最后一步**的 `pr12-05-video-popover.png` **存在** → 可证"完整走完、未触发中止路径"。但中间 `check()` 断言失败**不中止、不写截图**，结果只 `console.log` 未落盘 → **"第 3/4/5/8/9 项断言全过"无法从现有产物证明**。
>
> 完整复核见 `docs/STATUS_20260913_L2_EVIDENCE.md`。

## WebDAV 客户端配置

| 项 | 值 |
|---|---|
| 地址 | `https://hb.cauai.fun/dav` |
| 用户名 | `canvas` |
| 密码 | 站点密码（见服务器 `.env` 的 `SITE_PASSWORD`） |

## 前端构建的两个陷阱

- **线上构建必须注入 `VITE_AGNES_BASE_URL=/agnes`**，否则页面照常打开但视频功能全废。发布脚本会检查产物里有没有这个值。
- **改 key 必须重启前端**。Vite 只在启动时注入 `VITE_` 开头的变量，热更新不会重新注入。

## 判断域名指向

线上主 JS 文件名可以判断域名还指着哪个版本：

- 新版：`index-C_v2fFr8.js`
- 旧版：`index-Bsl2orxv.js`（若看到这个，说明域名还指在旧站 `infinite-canvas-hb.pages.dev` 上）

## 已知的配置陷阱

**默认渠道指向 `api.openai.com`。** `web/src/stores/use-config-store.ts` 的默认值是 `OPENAI_BASE_URL="https://api.openai.com"` 且 key 为空，直接调用会 401。**这不是 bug，是配置没改。** 遇到 401 先查这里。

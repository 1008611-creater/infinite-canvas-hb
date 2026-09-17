# 本仓库规则（无限画布 · hb.cauai.fun）

> **分工（2026-09-17）**：本文件 = 无限画布的**领域铁律**，只适用于这个项目。
> 跨项目可复用的质量约束 → `CONSTRAINTS.md`
> 文档权威度与最小上下文包 → `docs/INDEX.md`
> 流程闸门与退出条件 → `docs/LIFECYCLE.md`
> 变更风险分级 → `docs/CHANGE-RISK.md`
> 冲突以本文件为准，并在 `docs/DECISIONS.md` 登记。

## 0. 范围

- 本文件夹（`E:\codex\huabu`）只负责一个产品：**无限画布 = https://hb.cauai.fun**。
- 权威源码在 `E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas`。本文件夹是规划与治理文件夹：不改源码、不搬源码、不在这里构建。

## 1. 绝不混淆两个画布

- `hb.cauai.fun` —— 本项目。MIT 开源项目 `basketikun/infinite-canvas` 的 fork，remote 为 `1008611-creater/infinite-canvas-hb`，部署为天宫漫剧视频工作台。
- `ai.cauai.fun/studio/` —— **另一个产品**。念念 Studio 画布（Nomi 派生），源码在另一棵目录树。
- 目前**没有发现**两者之间存在技术依赖关系，只有同一个所有者。任何"它们其实是一套系统"的说法，都必须先给出证据。
- 同一所有者名下的其他站点（例如 `dola.cauai.fun`）同样是独立产品，不折进画布的收益与路线图。
- 注意历史污染：本文件夹早期版本曾把 `ai.cauai.fun/studio` 当成无限画布来写，那些内容已全部作废重写。

## 2. 门禁与令牌

- 站点门禁是 nginx 的 `canvas_auth` cookie。
- 发布时 `AUTH_COOKIE` 必须**保持不变**：首次生成后写进服务器 `.env` 长期复用。每次更换 = 所有用户被迫重新登录。
- `CANVAS_LEGACY_TOKEN` 与 `AUTH_COOKIE` 同值。
- 有两道锁：cookie 门禁 + 代理侧 `PROXY_ACCESS_TOKEN`。改任一道都要同步另一道。
- 改 `.env` 之后必须**重建容器**，否则会出现"密码改了还是旧的"，而且日志里看不出来。
- 注册开关 `CANVAS_ALLOW_REGISTER` 默认开；账号建好后设成 `0` 再发布一次关掉。

## 3. 密钥纪律（最容易被破坏的一条）

- 永远不要把真实密钥、令牌、站点密码、`AUTH_COOKIE`、Agnes / OpenLux / MJ key 写进本文件夹的任何文件，也不要贴进聊天。
- 已知的明文泄露点，**不要复制原文、不要在文档里摘录**：
  - `zhuanhuiyuangong\infinite-canvas-deploy\预置_agnes视频通道_控制台脚本.js` —— 内含多个真实 API key
  - `zhuanhuiyuangong\画布验收清单.md` —— 含站点密码明文
  - `zhuanhuiyuangong\infinite-canvas\docs\deployment-server.md` —— 含站点密码明文
  - `zhuanhuiyuangong\infinite-canvas\scripts\deploy\publish.sh` —— 默认参数里带站点密码
  - 两份 `agnes-video-proxy\.env`（根级与仓库内）—— 含真实 key
- 需要提到密码时，只写"服务器 `/opt/agnes-video-proxy/.env` 里的 `SITE_PASSWORD`"。
- 权威密钥只存在于服务器：`/opt/agnes-video-proxy/.env`。

## 4. 发布与部署

- 发布脚本：权威源码目录下 `bash scripts/deploy/publish.sh`。
- **挂目录，不挂单个文件。** docker bind mount 按 inode 绑定，而 `current` 软链切换和 `sed -i` 都会换 inode。挂单个文件会让容器永远读启动时那一份，结果是发布日志全绿、线上跑旧版。
- **`current` 必须是相对软链**（指向 `releases/canvas-xxx`）。写成绝对路径容器解析不到，所有请求 500。
- 回滚 = `ln -sfn releases/<版本> current` + `docker compose exec -T web nginx -s reload`。
- 只有后端代码变了才重建镜像；**新增后端文件要同时改 `publish.sh` 的打包列表和 `deploy/Dockerfile.api` 的 COPY**。
  （`publish.sh` L250-251 上传的是 `deploy/Dockerfile.proxy` → agnes 代理容器、`deploy/Dockerfile.api` → canvas-api 容器。
  别把两个 Dockerfile 搞混：`Dockerfile.proxy` 的 `FROM node:22-alpine` 属于 agnes 代理，与画布后端无关。）
- 不要用 `cloudflared service install`（会与另一条隧道抢服务名）。
- 登录页必须保持自包含（内联样式与脚本，不依赖 `/assets`），否则门禁会把自己挡在外面。
- 视频走 4MB 分片上传。Cloudflare 给源站的上限约 100 秒，超时就是 524。

## 5. 服务器数据

- 以下目录**不可再生**，任何清理、迁移、重置前必须单独确认：
  - `/opt/canvas-webdav` —— 用户云同步数据
  - `/opt/canvas-api-media` —— 媒体库
  - `/opt/canvas-postgres` —— 账号与项目数据
  - `/opt/canvas-api-sync` —— 画布内云同步数据（`docker-compose.yml` L72 挂到 api 容器 `/data/sync`）
- `JWT_SECRET` / `PG_PASSWORD` 必须持久化：JWT 一换登录态全掉；PG 初始密码只在数据目录首次初始化时生效。
- ⚠️ **本清单以源码 `deploy/docker-compose.yml` 为准核对过（2026-09-13）**：四个数据卷 = `canvas-webdav`(L48)、
  `canvas-api-media`(L70)、`canvas-api-sync`(L72)、`canvas-postgres`(L86)。改 compose 后要回来同步这里。

## 6. 文档与验收

- 用证据说话：每条结论标注来源文件或验证方式；没验证的写明"未验证"。
- 不造假完成：没跑通就写缺口，不写"已实现"。
- 上线自检 10 项见 `inventory/画布验收清单.md`（该副本已脱敏）。
- **状态只在三处查，不复制到第四处**：`docs/ROADMAP.md`（做到哪）、`docs/DECISIONS.md`（怎么定的）、`implementation/deploy/ACCEPTANCE.md`（能不能发）。权威度总表见 `docs/INDEX.md`。
- **统一质量门**：`node E:/codex/huabu/scripts/verify.mjs`（链接 / 密钥 / 口径 / 残留 / 落地器干跑）。改完文档要跑。
- **改动权威源码树前**必须先过 `docs/LIFECYCLE.md` 的闸门 G3（显式批准），源码树当前**可写**，不缺权限只缺批准。

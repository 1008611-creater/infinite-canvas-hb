# 本仓库规则（无限画布 · hb.cauai.fun）

> **分工（2026-09-17）**：本文件 = 无限画布的**领域铁律**，只适用于这个项目。
> 跨项目可复用的质量约束 → `CONSTRAINTS.md`
> 文档权威度与最小上下文包 → `docs/INDEX.md`
> 流程闸门与退出条件 → `docs/LIFECYCLE.md`
> 变更风险分级 → `docs/CHANGE-RISK.md`
> 冲突以本文件为准，并在 `docs/DECISIONS.md` 登记。

## 0.1 面向项目负责人的汇报与决策接口（强制）

本项目的审计和执行结果必须先用普通中文说明，再给技术证据。不得把内部审计术语、闸门编号、源码路径或命令输出直接当成面向 owner 的结论。

每次汇报必须按以下顺序写：

1. **一句话结论**：现在到底能不能用、能不能发布，或当前最重要的问题是什么。
2. **对现在的影响**：说明是否影响线上网站、现有用户、数据或资金；如果没有影响，明确写“目前不影响线上”。
3. **状态分类**：明确区分“已在线上生效”“本地已改但未发布”“只有计划/规格”“未验证”。代码存在、测试通过或文档写完，都不能直接称为“已上线”。
4. **需要 owner 决定的事**：只列真正需要决定的事项；没有需要决定的事项时，必须写“当前不需要你决定”。每个需要决定的事项都要说明推荐选项和直接影响，最多列 3 个选项。
5. **下一步动作**：说明助手接下来会做什么，或明确指出唯一阻塞点。
6. **可直接回复的提示词选项（强制）**：汇报末尾必须提供 2–4 个可以直接复制回复的短句，并说明每个短句会触发什么动作。至少覆盖以下路径中的相关选项：
   - `继续执行`：按推荐方案继续推进。
   - `先解释`：先用普通中文解释当前问题，再暂停执行。
   - `只看风险`：只整理风险、影响和需要决定的事项，不修改文件。
   - `暂停`：停止当前推进，保留现状。
   如果存在真正需要 owner 选择的方案，必须把方案写成可直接回复的句子，例如：`采用方案 A，继续推进统一登录。` 不得只写“请确认”“你怎么看”或“下一步是什么”。
7. **技术证据（可选）**：最后再列文件、命令、提交号、日志和术语。除非 owner 主动要求，不得让技术证据成为主要叙述。

面向 owner 时，至少使用下列口径：

- “线上” = 当前用户正在访问的运行版本。
- “本地已改但未发布” = 文件已经改了，但用户还用不到。
- “计划/规格” = 只写了方案，还没有实现或验证。
- “未验证” = 没有完成真实测试，不能当成已完成。
- “阻塞” = 继续做下去会有明确风险，必须先解决或先取得决定。
- “已完成/已上线/可用”只能在真实文件、真实接口或真实用户路径验证后使用。

如果技术问题不会改变 owner 当前的决策，不要把它放在开头。先说结论和影响，避免要求 owner 先理解 SQL、Docker、Git、闸门编号或内部目录结构。

每次汇报的结尾应使用类似下面的格式：

> 你可以直接回复：
> - `继续执行`：按推荐方案继续。
> - `先解释`：先把刚才的内容讲明白，暂不操作。
> - `只看风险`：只列风险和影响，不改文件。
> - `暂停`：停在这里。

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
- **同一时刻只许一个会话发布**（`docs/DECISIONS.md` D44，2026-09-22 老大确认并行会话是他自己开的）。调用 `publish.sh` 前必须：①问 owner 当前没有别的会话在发，得到「你发」才继续；②读线上 `BUILD_INFO.txt` 的 commit 与本地 HEAD 对比——已是 HEAD 则不发，两边分叉则停并列给 owner，线上是祖先则先列出 `git log --oneline <线上>..HEAD` 再发。发完只报 `BUILD_INFO.txt` 里的新 commit。
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

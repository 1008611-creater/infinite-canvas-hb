# 决策记录 · 无限画布

## D22 · New API / `apic.cauai.fun` 独立网关准备 —— 🟡 只读盘点完成（2026-09-18）

### 结论

计划在 `apic.cauai.fun` 独立部署官方 `QuantumNous/new-api`，不与 `hb.cauai.fun` 的画布数据库、额度账本、媒体库合并。先验证 LLM API 的注册、Key、模型权限、用量、扣费、失败和对账，再逐步接入图片、视频，最后让无限画布作为 API 客户端接入。

### 已核实

- 官方仓库默认分支为 `main`；2026-09-18 只读 `git ls-remote` 命中 SHA `3524fe0b15794d8d19378827d36a7edc0b0e91ea`。
- 服务器 Docker `29.1.3`、Compose `2.40.3`，磁盘可用约 34G。
- `/opt/new-api`、`/opt/newapi`、`/opt/new2api` 均不存在。
- 80/443 已由 `deeptutor-public-caddy` 占用；现有 Cloudflare Tunnel 有通用隧道和独立 `cloudflared-canvas.service`。
- `apic.cauai.fun` 当前无 DNS 解析，Caddy 当前没有对应 host 路由。
- 只读盘点没有修改服务器、DNS、隧道、nginx、容器或画布数据。

### 闸门

真正安装前必须单独确认：按官方仓库部署；创建 `/opt/new-api` 独立目录和数据库；运行新 Compose；修改 Caddy / Cloudflare 入口；初始化管理员与上游渠道。详细准备报告见 `implementation/NEW-API-APIC-READINESS-20260918.md`。

### 执行订正（2026-09-19）

老大已批准部署。已完成独立 New API 栈与本机 Caddy 路由：New API、PostgreSQL、Redis 均运行，`/api/status` 返回 `success=true`、版本 `v1.0.0-rc.38`；Caddy validate 通过，内网代理链路通过。随后已成功创建 `apic.cauai.fun` 的 DNS CNAME；公网曾短暂 404，根因是 `hb-canvas` 隧道远端 Ingress 未包含新 hostname。已改为新建独立隧道 `apic-canvas`（`/etc/cloudflared-apic/config.yml`，ingress `apic.cauai.fun -> http://127.0.0.1:80`），并把 CNAME 覆盖到新隧道；同时把 Caddy 的 apic 站点改为 `http://apic.cauai.fun`，避免隧道回源时的 308 重定向循环。

当前公网已通：首页 200、`/api/status` 200（版本 `v1.0.0-rc.38`、`setup=true`、`server_address=https://apic.cauai.fun`）、无凭据调用 `/v1/models` 与 `/v1/chat/completions` 均 401；现有 `hb.cauai.fun` 仍 302 未受影响。已初始化 root 管理员，初始密码只存服务器 `/opt/new-api/backups/admin-initial-password.txt`（600）。上游渠道、API Key 售卖、额度限流尚未配置；公开注册当前仍开启，是否关闭待裁决。

记录已定与待定的关键决策。**已定的不要反复推翻，待定的要给出推荐方案和理由。**

> 2026-09-12 更新：用户已批准三批次计划（收得到钱 / 放得开 / 跑得顺）。本文件据此更新 D3–D6，新增 D8 记录审计结论、D9 记录批次 1 实施包状态。
>
> ★ **本仓是治理仓**：所有"实现"= `implementation/` 下的设计稿与落地说明。
> **没有改过权威源码树、没有构建、没有发布**（`AGENTS.md` §0）。落代码需用户单独授权。

---

## D1 · 两个画布的关系 —— ✅ 已定

**决策：`hb.cauai.fun` 和 `ai.cauai.fun/studio/` 是两个独立产品，互不隶属。**

| | 无限画布 | Studio 画布 |
|---|---|---|
| 域名 | `hb.cauai.fun` | `ai.cauai.fun/studio/` |
| 源码 | `zhuanhuiyuangong\infinite-canvas` | `niannianai\` 目录树 |
| 血统 | MIT `basketikun/infinite-canvas` 的 fork | Nomi 派生的 Niannian Studio |
| 定位 | 天宫漫剧视频工作台 | 念念主站的一部分 |

**已核实**：两者源码、remote、依赖、构建产物均不交叉。

**诚实边界**：结论是"**未发现**技术依赖关系"，不是"已验证不存在"。只有同一个所有者这一条是确定的。任何反向主张需要新证据。

**本项目所说的"无限画布"永远指 `hb.cauai.fun`。**

---

## D2 · `huabu` 是规划仓还是源码仓 —— ✅ 已定

**决策：规划与治理仓。** 不改源码、不构建、不发布。

理由：源码目录含 `node_modules`、`dist`、`.git`、构建产物，体量不适合作为治理仓；而且源码必须留在能直接跑发布脚本的位置。

**推论**：本文件夹放文档与索引（`PRODUCTS.md`、`inventory/`），权威副本留在原位。**落地代码要用户单独授权。**

---

## D3 · LLM 中转选哪个 —— 🟢 方向已定（批次 3），落地待做

**背景**：画布需要 LLM 做"反推提示词"。图片渠道已有 OpenLux，但 OpenLux 是图片分组，**不能当通用 LLM 用**。

**阶段 1（当前，自用）**：OmniRoute 方案 A —— 本机直连 `http://127.0.0.1:20128`，Key 留空。
理由：浏览器不把 `localhost` / `127.0.0.1` 当混合内容拦截，实测在 `https://hb.cauai.fun` 页面里 fetch 该地址返回 200。零配置、零成本、207 个模型可用。
代价：只能在跑网关的机器上用。

**阶段 2（批次 3，跨设备）**：方案 B —— `tools/omniroute-guard` 反代到 **20129**，经**具名隧道**暴露。**不用 Cloudflare Access**（交互式登录页，与前端 fetch 不兼容）。

**待办风险处置**：

- OmniRoute 监听 `0.0.0.0:20128` 且不鉴权 → 同 WiFi 可被蹭额度。需要加防火墙规则限制本机（**WSL 用户例外**）
- quick tunnel 开关保持关闭

**剩余未决点**：具体哪天切到方案 B。这不阻塞批次 1。

---

## D4 · 是否构建并交付 `canvas-agent` —— 🟢 方向已定（批次 3），落地待做

**事实订正（2026-09-12）**：旧文档写"未构建、需先装依赖再构建"是**错的**。实测 `canvas-agent/dist/` 存在，构建时间 2026-08-27。**已构建，未启用。**

**工具数订正**：实测 **34 个**（`src/canvas/schemas.ts` 与 `dist/canvas/schemas.js` 的 `toolNames` 完全一致）。旧文档写"六个"、计划原文写"25 个"，**都不对**。清单见 `PRODUCTS.md` 第二节。

**决策方向（批次 3）**：Agent 定位为**接入 + 对外能力**，对外暴露走**守卫反代 + 具名隧道**。

**剩余未决点（`D-agent-auth`，唯一硬阻塞）**：对外暴露的鉴权形态。三个选项与代价：

| 选项 | 做法 | 代价 |
|---|---|---|
| (a) 沿用现有 token | 改动最小 | ⚠️ `http.ts` L538-541 的 `validToken()` **接受 `?token=`** → token 会进 nginx 日志 / 浏览器历史 / Referer；**token 泄露 = 整机 agent 可被驱动**（五条危险路由含 `/agent/codex/turn`、`/agent/local-file/reveal`、`/agent/codex/approval`） |
| **(b) 另发凭据 + 守卫反代** ← **已建议** | 照 `tools/omniroute-guard` 模式新增 `canvas-agent-guard`，只绑本机 + 具名隧道 | 多一个进程要维护 |
| (c) 不对外暴露，只在本机用 | 风险最小 | 「对外能力」不算交付，批次 3 的 A-19 / B3-1 无法收口 |

> ★ **本项已问过用户两次（第 84 轮、第 90 轮），仍未答复。** 未裁决前 **A-19 不许开工**，`apply-batch3.mjs` 的 `B3-1` 恒为 BLOCK。

---

## D5 · 付费模型 / 产品化，还是保持免费自用 —— ✅ 已定（2026-09-13 用户确认）

**用户已批准的三批次计划本身就是这个决策的答案：走产品化收费。**

- 批次 1「收得到钱」= 解锁付费通道（紫域）+ 额度与卡密体系
- 批次 2「放得开」= 公开注册、撤门禁
- 定价口径：**1 点 = ¥0.10**；卡密 100/300/500/1000 点 = ¥10/30/50/100；出片扣费 = **紫域积分 × 1.5 向上取整**

**当前事实**：`agnes-video-proxy` 只放行免费的 `agnes-video-2.5-flash`；付费模型仍被代理拒绝。紫域是**另一条**通道，不依赖改这个代理。

**⚠️ 旧约束已失效**：旧版本写"这个决策没定之前，不写任何计费代码"。**该条不再适用**——计费设计稿已完成，落地是批次 1 的主体工作。

**✅ 已定（2026-09-13）**：用户明确答复「接入 ldxp，然后发卡密、兑换卡密」。D5 正式标记为「已定」。

---

## D6 · 若收费，走哪个支付通道 —— ✅ 已定（2026-09-13 用户确认）

**前置依赖**：D5（已由批准的计划确定方向）。

**方案（已批准）**：**紫域通道 + 卡密兑换码**。

- 渠道：紫域（`/ziyu/` 服务端反代，Key 只进服务器环境变量）
- 收款形态：**购买兑换码 → 粘贴兑换码到账**。前端文案**不出现固定积分人民币比例**。
- 兑换码格式：`NN-{点数}-{随机串}-{HMAC 签名}`，服务器只存 SHA256 哈希
- 发码两条路：本地脚本批量生成（默认，码不经服务器）+ 管理后台在线生成导出（临时补货）
- 对账：**一律以紫域返回的 `cost` 字段为准**，不假设失败必退

**✅ 已定（2026-09-13）**：用户答复「接入 ldxp，然后发卡密、兑换卡密」。
**紫域 Key**：用户已提供，**只进服务器 `/opt/infinite-canvas/api/api.env` 的 `ZIYU_API_KEY`，不进本仓任何文件**。
**`LDXP_REDEEM_SECRET`**：由本站自行生成（≥32 字符），只进同一 `.env`。

---

## D7 · `niannian-ai-canvas` skill 的范围冲突 —— ✅ 已定（选项 A）

**冲突事实**：`C:\Users\lsb\.codex\skills\niannian-ai-canvas\SKILL.md` 声明 `https://ai.cauai.fun/studio/` 是"唯一"生产画布面。**该 skill 不管辖 `hb.cauai.fun`。**

**决策：选项 A** —— 在本文件夹记录范围说明，`hb.cauai.fun` 是该 skill 范围之外的、MIT 授权的、独立部署的产品。**skill 文件不动。**

理由：那个 skill 文件在 `E:\codex\huabu` 之外，属于共享资产，改动影响面超出本项目范围。

**已执行**：选项 A 已在本文件与 `PRODUCT_CHARTER.md` 中记录。skill 文件保持原样。

**未决点**：若将来该 skill 需要引用无限画布，再考虑为它开例外。

---

## D8 · 本轮审计结论与批次 1 状态口径 —— ✅ 已核实（2026-09-12）

**决策：批次 1 的官方口径统一为「设计完成，实现未落地」。**

> ★ **2026-09-13（第 20 轮）口径细化**："实现未落地"指的是**权威源码树**里没有这批代码；
> 治理仓内的**代码交付件已经写完**（4 个后端模块 + 2 个 SQL/模板 + 落地器 + 手册），
> 并且落地器已在**假源树**跑通验证、2026-09-13 又对**真实权威树**做了零写入干跑（锚点全部命中）。所以当前准确口径是 **「代码已写完、落地器已就绪、权威树未落地」**，
> 而不是「还没写」。落地动作由用户在自己终端执行 `implementation/scripts/apply-batch1.mjs`。

**核实方式**：对权威源码 `E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas` 全文扫描 896 个文本文件（跳过 `node_modules`/`.git`/`dist`/`scratch`/`logs`），检索 `ziyu`/`ZIYU`/`LDXP`/`credit_ledger`/`user_credits`/`channel_usage`/`free_trial`/`redeem`/`Idempotency` → **零命中**。

**同时核实**：

| 项 | 实测 |
|---|---|
| `canvas-api/server.js` | **24 条**路由，无 credits / ziyu / admin |
| `channel-templates.ts` | **3 条**模板（openlux / omniroute / midjourney），**无紫域** |
| `createChannelFromTemplate()` | 确实硬编码 `apiKey: ""` |
| `nginx-docker.conf` | 四处门禁 `/`、`/assets/`、`/config.js`、`/agnes/`；**无 `/ziyu/`** |
| `canvas-api/db.js` `migrate()` | 只读 `schema.sql` 一个文件，不自动发现新 SQL |
| `canvas-agent` | `dist/` 存在（2026-08-27），**34** 个工具 |
| `registerMedia` | 是 `async`，`implementation/canvas-api/ziyu.js` **已正确 `await`** |

**后果**：本仓库 7 处"批次 1 已完成"的标注全部订正为「设计完成，实现未落地」。订正清单见 `docs/STATUS_20260912.md`。

**待用户裁决的未决点**：

1. 是否授权在权威源码树真正落代码
2. 紫域 `ZIYU_API_KEY` / `ZIYU_API_BASE` / `LDXP_REDEEM_SECRET` 是否已在服务器 `.env` 就绪
3. L2 真实浏览器验证怎么补（本审计环境无浏览器）
4. 域名 / 服务器操作授权（发布 = 动 `AUTH_COOKIE` 与三个不可再生数据卷）
5. 是否把 D5 / D6 正式标为「已定」
6. `canvas-agent` 工具数以**实测 34** 为准还是沿用计划原文的 25

---

## D9 · 批次 1 实施包状态 —— ✅ 设计稿完成，落地待授权（2026-09-12）

**本仓已完成的（全部在 `implementation/`，未进权威树）**：

| 产物 | 位置 | 状态 |
|---|---|---|
| 额度 / 卡密 / 结算核心 | `implementation/canvas-api/credits.js`（479 行） | 已 ESM 化；**已修两处真实资金漏洞** |
| 额度相关 17 条路由 | `implementation/canvas-api/routes-credits.js`（339 行） | 已 ESM 化；含 fail-fast 校验 |
| 兑换码签发与校验 | `implementation/canvas-api/ldxp-redeem.js`（150 行） | 已 ESM 化；只存 SHA256 |
| 紫域客户端 | `implementation/canvas-api/ziyu.js`（288 行） | 已 ESM 化 |
| 建表 SQL | `implementation/canvas-api/schema-credits.sql`（154 行，6 表 2 唯一索引） | 全 `IF NOT EXISTS` |
| 接线说明（第 0–12 项 + 证据 + 顺序 + 未验证） | `implementation/canvas-api/APPLY.md`（476 行） | 已写全 §0–§8 |
| 验收清单（30 项 + 4 个决策项） | `implementation/deploy/ACCEPTANCE.md`（569 行） | 已加 A-00、A-10A、A-10B |
| 回滚手册（R-00 ~ R-03） | `implementation/deploy/ROLLBACK.md`（248 行） | 未变 |
| 发码脚本 | `implementation/scripts/generate-ldxp-credit-codes.mjs` | 实测 25/25 |
| 渠道模板 | `implementation/web/ziyu-channel-template.json` | 11 个模型 |
| nginx 片段 | `implementation/deploy/ziyu-nginx.conf.snippet` | 含门禁与资金敞口说明 |

**★ 两个已修复的真实资金漏洞**（桩环境实测发现，非推测）：

1. **并发重复扣费**：`reserveTaskCredits` 先 `SELECT` 再 `UPDATE` 挡不住并发 → 加 `pg_advisory_xact_lock`（`credits.js` L142-144）。
2. **已结算任务可再退款**：实测退回 `{ok:true, refunded:true, amount:300}`，等于平台白送钱 → 加 `ALREADY_SETTLED` 前置检查（L294-300）+ 路由 409（`routes-credits.js` L208-219）。

**★ 顺序风险（2026-09-13 订正，不许省略）**：L2 画布交互**并非完全空白**——2026-09-01 有一次真实浏览器会话
（Playwright + 真实 Chrome 打 `hb.cauai.fun`），覆盖拖拽连线（含反向）、连线方向、模式自动适配、秒数按模型钳位，
留脚本与 5 张截图（`.probe/`，复核见 `docs/STATUS_20260913_L2_EVIDENCE.md`）。

**残留缺口（三项）**：缩放、节点链真实执行、插件安装 —— **从未验证**。
且该会话**逐条断言结果未落盘**（只存了截图）。

本计划仍是在 L2 **未完整验证**的前提下先建 L4 计费层，存在"能收钱但点不动"的可能。
批次 1 上线前必须补真实浏览器冒烟（`ACCEPTANCE.md` A-18 / `APPLY.md` U-01）。

**待用户裁决（本阶段最后一批）**：

| 编号 | 问题 | 影响 |
|---|---|---|
| **Q-1** | 是否授权在权威源码树 `E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas` 真正落代码？ | 不授权 = 批次 1 无法开始 |
| **Q-2** | 服务器 `.env` 里 `ZIYU_API_BASE` / `ZIYU_API_KEY` / `LDXP_REDEEM_SECRET`（≥32 字符）是否已就绪？ | 未就绪 = S6 步骤阻塞 |
| **Q-3** | L2 真实浏览器验证怎么办？（本环境无浏览器，硬阻塞） | 不补 = 存在"能收钱但点不动" |
| **Q-4** | 是否授权动服务器与发布？（发布涉及 `AUTH_COOKIE` 与三个不可再生数据卷） | 不授权 = 只能停在治理仓 |
| **Q-5** | 是否把 D5 / D6 正式标为「已定」？ | 影响后续文档口径 |
| **Q-6** | `canvas-agent` 工具数以**实测 34** 为准，还是沿用计划原文 25？ | 影响批次 3 对外能力清单 |
| **Q-7** | **D-web-1**：紫域渠道模板的 `apiKey` 选哪个方案？(a) 占位串 `ziyu-proxy`（推荐）/ (b) 改 `createChannelFromTemplate()` / (c) 改 `video.ts` 检查 | 选错 = 渠道加得进但一点生成就抛 `apiKeyRequired` |
| **Q-8** | **D-batch2-ziyu-gate**：是否同意 `/ziyu/` 在批次 2 **保留门禁**？是否接受"持旧站点 cookie 者仍可烧积分"的过渡期？ | 不接受 = 撤门禁后陌生人可烧服务器紫域额度 |
| **Q-9** | **D-pricing**：预扣按 `costPerSecond × 秒数` 估算、以紫域 `job.cost` 结算——是否认可？是否给用户展示"预计扣费 X 点"？ | 影响用户预期与投诉面 |
| **Q-10** | **D-agent-auth / `/dav/`**：网盘挂载管理员专用**具体实现尚未设计**（Basic Auth 带不了 cookie），是否本阶段先不做？ | 先不做 = 批次 2 少一项 |
| **Q-11** | 视频模型选择依赖 `config.model \|\| config.videoModel`，是否接受？ | 影响多模型切换 |
| **Q-12** | 并发锁用 `pg_advisory_xact_lock` 是否认可？（替代方案改动更大） | 影响 `credits.js` 核心 |

**Q-1 ~ Q-6 是阻塞项，Q-7 ~ Q-12 可以在落地过程中随时定。**

**★ 真实计费口径（已实测，写进对账逻辑）**：紫域 models 目录里的 `cost` **不是**真实单价。
实测 `zy_model_2db335ab16705b6ffb21` 提交 30 秒**实际扣 1500**，而 models 里 `cost=200`、`costPerSecond=50`。
→ 真实价 = `costPerSecond × 秒数`。估算用 `costPerSecond > 0 ? costPerSecond × 秒数 : cost`，
**最终一律以 job 返回的 `cost` 为准**（`APPLY.md` §4 E-13）。

---

## D10 · 第 4 轮（2026-09-13）用户答复落地口径 —— ✅ 已定

本轮用户对 Q-1 ~ Q-12 全部作答。**答复原文见 `docs/STATUS_20260913.md` 第 1 节。**
下面是把答复翻译成可执行口径的结果。

### 10.1 工具数与数量口径

**D-agent-tools：`canvas-agent` 工具数以实测 34 为准。**
用户答复 Q-6「我不知道，你确定吧，选一个最优」。
实测依据：`canvas-agent/src/schemas.ts` 与 `dist/canvas/schemas.js` 的 `toolNames` 完全一致，均为 34 个。
旧文档写「六个」、计划原文写「25 个」，**两个数字都作废**。

### 10.2 `/dav/` 网盘挂载 —— ❌ 本阶段不做

**用户答复 Q-10：「先不做，先抓住主要矛盾」。**
→ 批次 2 的「网盘挂载收敛为管理员专用」**从批次 2 移出**，不再列为批次 2 交付项。
→ 技术理由也支持这个决定：WebDAV 的 Basic Auth 带不了 cookie，实现形态与现有门禁不同源，成本高于收益。
→ 普通用户的跨设备同步继续走**画布内云同步**（已按账号分目录，换设备不丢），不受影响。
→ 若将来要做，作为独立排期，不占批次 2。

### 10.3 `/ziyu/` 在批次 2 是否保留门禁 —— ✅ 保留

**用户答复 Q-8：「你决定就行」，本人裁定：保留门禁。**

理由：`/ziyu/` 是**唯一能直接烧掉服务器紫域额度的路径**。撤门禁后，任何知道域名的人都能：

1. 拿旧站点 cookie（或猜）绕过前端，直接打 `/ziyu/`
2. 以服务器持有的紫域 Key 提交任务，消耗你的真金白银
3. 而额度体系是**按本站账号**扣点，绕过账号 = 平台白付成本

**接受的代价**：批次 2 撤掉 `/`、`/assets/`、`/config.js`、`/agnes/` 四处门禁后，
**持有旧站点 cookie 的人仍可在过渡期打 `/ziyu/` 烧积分**。这是已知的、被接受的过渡期风险，
处置方式是**尽快给 `/ziyu/` 补上基于账号的额度校验**（批次 1 的 `reserveTaskCredits` 就是干这个的），
而不是撤门禁。

### 10.4 并发锁 —— ✅ 认可 `pg_advisory_xact_lock`

**用户答复 Q-12：「可以」。**
`credits.js` L142-144 的实现获准。这是本轮修掉的两个真实资金漏洞之一：
原先「先 SELECT 再 UPDATE」挡不住并发，两个同时提交能各自读到同一余额、各自扣减，等于白送一次出片。

### 10.5 失败任务退款口径 —— ✅ 订正为「读字段，不假设」

**2026-09-13 实测样本扩大到 4/4：失败任务全部 `refunded=true` 且 `refundAmount == cost`。**

| job | status | cost | refunded | refundAmount |
|---|---|---|---|---|
| 35d84bd3 | failed | 5 | true | 5 |
| 61276c9b | failed | 450 | true | 450 |
| 30270f31 | failed | 200 | true | 200 |
| b9b7db38 | failed | 200 | true | 200 |

**但代码逻辑不变**：一律读 `refunded` / `refundAmount` 对账，
`refunded=false` 且 `cost>0` 时照常扣用户点数（成本已发生）。
理由：紫域官方文档原文是「**按现有规则**返还额度」——"按现有规则"就是不可依赖的意思。
4 个样本不足以支撑「必退」的假设，而假设错的代价是平台单方面承担成本。

### 10.6 渠道模板 `apiKey` 取什么值 —— ✅ 占位串 `ziyu-proxy`

**用户答复 Q-7 时又贴了一次 Key。本人裁定：模板里写占位串 `ziyu-proxy`。**

理由：`createChannelFromTemplate()` 硬编码 `apiKey: ""` 这条铁律不能动（改了就是全渠道模板的 Key 语义都变）。
但空 key 会在前端 `web/src/services/api/video.ts` **L84-85 / L193-194** 触发 `apiKeyRequired` 抛错，
表现为「渠道加得进、一点生成就报错」。
写占位串可以让前端校验通过，而**真正的 Key 由 nginx 在 `/ziyu/` 反代时服务端注入**，前端拿到的永远是假值。

**★ 铁律不变**：真实紫域 Key **绝不进仓库、绝不进前端、绝不进模板**，只进服务器 `/opt/infinite-canvas/api/api.env`。

### 10.7 视频模型取值顺序 —— ⚠️ 已发现不一致，**决定不改**

**用户答复 Q-11：「你决定最优」。本人裁定：不改，只记录。**

实测两处顺序相反：

| 位置 | 写法 | 优先级 |
|---|---|---|
| `web/src/services/api/video.ts` L64 | `(config.model \|\| config.videoModel)` | `model` 优先 |
| `web/src/lib/agent/agent-site-tools.ts` L191 | `(config.videoModel \|\| config.model)` | `videoModel` 优先 |

另外 `use-config-store.ts` 的 L48 / L186 / L265-266 / L335 / L469 都把 `videoModel` 当默认值与归一化主字段
（L335 `normalizeModelOptionValue`）。

**不改的理由**：`videoModel` 已经是 store 层归一化后的权威字段，强行统一顺序会牵动默认值链路，
收益（消掉一个理论上的不一致）小于风险（改坏模型切换）。
**记录的目的**是：将来若出现「切了模型但出片用的还是旧模型」的报障，这里是第一嫌疑点。

### 10.8 紫域 Key 的历史处置建议（已被 D20 覆盖）

**用户在聊天里明文提供了紫域 API Key。**

- 本轮用它做了**只读验证**（`GET /me`、`GET /models`、`GET /jobs`），**未写入本仓任何文件**。
- 落代码时**只写入服务器** `/opt/infinite-canvas/api/api.env` 的 `ZIYU_API_KEY`。
- **★ 接入完成后必须提醒用户去紫域后台轮换此 Key。** 聊天记录不是安全信道。
### 10.9 本轮未关闭的阻塞项

| 编号 | 阻塞项 | 状态 |
|---|---|---|
| **B-1** | **L2 画布交互真实浏览器验证** | 🟢 **大幅降级（2026-09-14 第 106 轮）**：真实浏览器已验证 **连线（创建/方向/去重/反向/撤销）、缩放、新建拖动节点、秒数钳位、官方插件列表、按 URL 装第三方插件**。**残留仅一项**：**节点链真实执行**（真跑会真出片/真花钱，需用户单独授权）。复核见 `docs/STATUS_20260913_L2_EVIDENCE.md` 第九、十节。
**2026-09-18 老大裁定：此项挂起、稍后决定，已单列进 `docs/BACKLOG.md` 待办；不阻塞批次 1 发布** |
| **B-2** | 落代码到权威源码树 | 🟡 **已降级**：工具层 EPERM（实测），用户已授权（Q-1/Q-4）。**交付件已就绪**：`implementation/scripts/apply-batch1.mjs`（幂等落地器，假源树 8 步全绿、产物逐行核对、幂等复跑已验证）+ `implementation/APPLY-RUNBOOK.md`（235 行使用手册）。**只差你在本地终端跑一次**；本会话从未对真实权威树**写盘**过（2026-09-13 已做零写入干跑，见 `docs/VERIFICATION_20260913_APPLY_DRYRUN.md`） |
| **B-3** | 服务器 `.env` 四个变量 | ❌ 用户答复 Q-2「没有」。需在 S6 前就位 |
| **B-4** | 紫域每积分实际采购价 | 🟡 官方口径 **¥0.01/积分**（`docs/STATUS_20260913.md` 2.9）→ 毛利率 93.3%；**实际到手价仍待用户确认** |
| **B-5** | 线上注册开关实际状态 | 🔴 **2026-09-13 实测为【开】**：`POST /api/auth/register` 合法邮箱 + 1 位密码 → 400 `password_too_short`（关闭时应为 403 `registration_closed`）。**未创建任何账号**。见 `docs/STATUS_20260913_LIVE_GATE.md` |
| **B-6** | **门禁 cookie 可自助获得（真实敞口）** | 🔴 **2026-09-13 实测**：注册接口不吃门禁（`nginx-docker.conf` L101-107 刻意如此），而注册成功下发 `canvas_auth`（`auth.js` `setSessionCookies()` → `setSitePassCookie()`）⇒ **`/ziyu/` 门禁不能当资金防线，额度体系是唯一那道锁**。**次生风险**：`promoteToAdminIfFirst()` 的 `count(*) <= 1` 判定意味着「库里若 0 用户，下一个注册者就是管理员」（**未验证**，需服务器侧查）。见 `docs/STATUS_20260913_LIVE_GATE.md` |

---
## D11 · 紫域任务产出字段口径 —— ✅ 已定（第 20 轮，2026-09-13）

**推翻 U-04 旧结论。** 旧文档写「已完成任务没有顶层 `resultUrl` / `previewUrl`，结果在 `job.assets`」——**写反了**。

### 11.1 正确口径

| 字段 | 含义 | 用法 |
|---|---|---|
| `job.resultUrl` | **真实产出**（成品） | 落盘 / 交付**只认这个**（`previewUrl` / `preview` 同值可作等价兜底） |
| `job.previewUrl` / `job.preview` | 与 `resultUrl` 同值的展示别名 | 仅在 `resultUrl` 缺失时兜底 |
| `job.assets.{image\|video\|audio}[]` | **输入参考素材**（用户上传/引用的东西） | 只作**输入留档**，**绝不作为产出交付** |

### 11.2 实证（2026-09-13，`GET /api/v1/jobs?limit=100` 全量 38 条）

| 任务 | 类型 | cost | 结果 |
|---|---|---|---|
| `7c03ade8` | video | 50 | ✅ `resultUrl` 命中 `hermes_video_1789273633_13f9499938.mp4`，`assets` 为空 |
| `802b8c52` | image | 10 | ✅ `resultUrl` 命中 `generated_image_1789273321_dd9db62c8b.png`，`assets` 为空 |
| `0046e0d8` | video | 350 | ❌ `RESULT_URL_MISSING`（结果 URL 已过 24h 清理）；`assets` 里是 **3 张输入图** |
| `195f4a3a` | video | 150 | ❌ `RESULT_URL_MISSING`；`assets` 里是 **5 张输入图 + 1 个输入视频**，`uploadedAt` 全部早于任务创建（08:36:04） |

### 11.3 为什么这条必须写死

`195f4a3a` 是决定性反例：结果 URL 过期后，`assets` 里只剩**用户自己上传的参考视频**。
若按旧结论「遍历 `assets` 当产出」，用户会拿到**自己上传的素材**当成出片成品——比报错更糟（用户以为出片成功，且已扣点）。

### 11.4 代码落地（已在治理仓 `implementation/canvas-api/ziyu.js` 完成，待用户终端执行落地器）

- 删除 `assets` 兜底分支；
- 改为 `var url = done.resultUrl || done.previewUrl || done.preview || null;`；
- 取不到 → `throw`（`RESULT_URL_MISSING`），**不返回成功**；
- `POST /api/ziyu/persist` 落盘前必须先走 `resolveResultUrls()`，`ok:false` **不许标成功**。

**旧结论的处置**：`APPLY.md` U-04 行、`STATUS_20260913.md` §2.4 已同步改写；旧文本一律作废。

### 11.5 目录档位（第 20 轮，2026-09-13 实测）

- `GET /api/v1/models` → **44 个模型**（39 video + 5 image）；`cost` 取值集合 **27 档**（新增 `600`）。
- `GET /api/v1/me` → `credits = 12000`。
- `GET /api/v1/jobs?limit=100` → 38 条：completed 19 / failed 19；failed **19/19 全退**（3430 / 3430，净支出 0）。

---

## D12 · 批次 1 已落地 —— ✅ 已执行（2026-09-17）

**决策：owner 于 2026-09-17 书面批准，批次 1 已写入权威源码树。**

D8 / D9 里「实现未落地」的口径**到此为止**。以下为执行记录：

| 项 | 结果 |
|---|---|
| 闸门 | G3 四条全过：a 零写入干跑 exit 0 / b 不涉及数据卷 / c 回滚方案（git + `ROLLBACK.md`）已确认 / d owner 书面批准 |
| 提交 | `ff6200a`（分支 `feat-server-deploy`，已推送远端） |
| 改动 | 新增 4 个后端模块（`credits.js` 549 / `ziyu.js` 464 / `routes-credits.js` 421 / `ldxp-redeem.js` 149），改 6 个文件，合计 +2332 行 |
| 语法 | `publish.sh` `bash -n` 通过；4 个新模块 `node --check` 通过 |
| 密钥 | nginx 用 `__ZIYU_KEY__` 占位符，发布时由脚本注入；仓库内无真 Key |
| 备份 | 6 个 `.bak-20260917`，已 gitignore |

**同批附带修复**：`publish.sh` 与 `docs/deployment-server.md` 里的站点密码明文已清除（提交 `4c7f48e`）。
⚠️ **历史提交中仍留有该密码字面量**，仓库当前为私有，风险可控；若要彻底清除需重写历史（`git filter-repo` + force push），**另行确认后再做**。

**落地 ≠ 可用。** 以下三件事没做，线上仍然不能收费：

1. 服务器 `/opt/infinite-canvas/api/api.env` 补 `LDXP_REDEEM_SECRET`（`openssl rand -hex 32`）
2. 执行发布（`CANVAS_ZIYU_API_KEY=...`）+ 服务器 `nginx -t && nginx -s reload`
3. 重建 api 容器，再走 `implementation/deploy/ACCEPTANCE.md` 的 A-00~A-27

**B-2 阻塞项由此关闭。**

---

## D13 · `D-agent-auth` 裁决 —— ✅ 已定（2026-09-18 老大裁定）

**决策：选项 (c) 的增强版 —— 平台不对外提供 agent，但支持「用户自带 agent（BYO）」。**

老大原话：「不对外，只本机用……然后允许别人自己配置属于自己的 agent 进去，就是我作为网站方不提供了就好。」

### 13.1 口径（四条，一起生效）

1. `canvas-agent` **不对外暴露** —— 不上守卫反代、不走具名隧道，只在跑它的那台机器上本地用。
2. 批次 3 的 **A-19「`canvas-agent` 对外能力」从交付范围移除**。不再追求"对外能力"这个交付项。
3. **保留并明确「用户自带 agent」配置入口**：用户填自己的 agent 地址 + 自己的凭据。
   **网站方不提供、不托管、不兜底。**
4. `apply-batch3.mjs` 的 `B3-1` **不再是 BLOCK**（原阻塞条件 `D-agent-auth` 已裁决）。

### 13.2 这个决定消灭了什么风险

- 整条最大的攻击面被拿掉：`/agent/codex/turn`、`/agent/claude/turn`、`/agent/local-file/reveal`、
  `/agent/codex/approval` **不再有公网入口**。拿到凭据 = 能遥控这台机器，这条风险链整个消失。
- `validToken()` 接受 `?token=` 的隐患（`CONSTRAINTS.md` C1.3）**不再构成对外风险**——
  因为没有对外入口了。本地用仍然建议改，但**降级为非阻塞**。

### 13.3 BYO agent 必须守住的两条（否则等于绕一圈把风险捡回来）

| # | 要求 | 为什么 |
|---|---|---|
| **BYO-1** | 用户填的 agent **凭据只存浏览器本地**（IndexedDB / localStorage），**不同步到服务端** | 平台一旦存了用户的 agent 凭据，就从「不托管」变成「托管了」，责任和安全模型全变 |
| **BYO-2** | 前端**直连**用户自己的 agent 地址，平台不做代理转发 | 做转发 = 平台成为中间人，既背流量又背责任 |

### 13.4 已知副作用（不是 bug，要接受）

- BYO 是浏览器直连第三方地址，**受混合内容策略限制**：`https` 页面连 `http://` 地址会被浏览器拦。
  用户填 http 地址需要自己放行，或填 https。这一点要在 UI 上提示，否则用户会以为"填了没反应"。

---

## D14 · 紫域接入凭据与文档的存放位置 —— ✅ 已定（2026-09-18）

**本仓只记位置，不记值。**（铁律：`AGENTS.md` §3、`CONSTRAINTS.md` C1.1）

| 项 | 位置 |
|---|---|
| 紫域 API 文档 | **https://ziyuai.vip/api.html**（公开文档，可记在本仓） |
| `ZIYU_API_KEY` 权威位置 | 服务器 `/opt/infinite-canvas/api/api.env` |
| `ZIYU_API_KEY` 临时暂存 | `C:\Users\lsb\.workbuddy-ai\secrets\ziyu-api.env`（**在治理仓之外**，上传到服务器后应删除） |
| `LDXP_REDEEM_SECRET` | 2026-09-18 本地随机生成，64 位十六进制，同上暂存文件 |
| `FREE_TRIAL_MONTHLY_LIMIT` | 同上暂存文件，暂定 `3` |

**历史建议已被 D20 覆盖（2026-09-18）**：紫域渠道只有这一把 Key，老大明确裁决不轮换、不替换。当前线上 `/opt/infinite-canvas/api/api.env` 保持现值；只有实际失效或老大再次明确要求时才重新评估。

**`LDXP_REDEEM_SECRET` 的严重性**：卡密格式 `NN-{点数}-{随机串}-{HMAC签名}`，
签名密钥 = **造卡密的能力**。谁拿到谁就能无限生成充值码。绝不进仓库，丢了必须全部作废重发。

---

## D15 · 线上真实状态校准：批次 1 已在生产跑通，但**源码落后于线上** —— ✅ 已实测（2026-09-18）

### 15.1 结论（推翻此前三条判断）

此前文档说「B-3 服务器 .env 未就绪」「H-1 真出片未验证」。**实测证明这两条都已不成立。**

| 之前说 | 实测 | 证据 |
|---|---|---|
| B-3 服务器 .env 四个变量未就绪 | ❌ 错，7 个变量全有值 | 容器内 `ZIYU_API_BASE` len=18、`ZIYU_API_KEY` len=48、`LDXP_REDEEM_SECRET` len=64、`FREE_TRIAL_MONTHLY_LIMIT`=3 |
| H-1 真出片没验过（真花钱） | ❌ 错，已跑过 3 次 | `channel_usage` 3 条：紫域积分合计 55、扣点合计 133 |
| 批次 1 未部署 | ❌ 错，镜像 2026-09-17 12:10 构建并运行 | 容器 `/app` 含 credits.js(553) / ziyu.js(464) / routes-credits.js(421) / ldxp-redeem.js(149) |

### 15.2 实测证据（只读 SSH，2026-09-18）

- **DB 6 张新表已建**：`user_credits` `credit_ledger` `credit_redemptions` `credit_adjustments` `channel_usage` `free_trial_usage`
- **接口全通**（容器内签 JWT + 直连 nginx `:18085`）：
  `/api/credits/me` 200、`/api/ziyu/models` 200、`/api/ziyu/me` 200、
  `/api/admin/credits/overview` 200、`/api/admin/credits/reconcile` 200（`{"diffs":[]}`）
- **资金链路真实闭环**：`credit_ledger` = 充值 3 笔(+300) / 预扣 3 笔(-208) / 结算 2 笔(+75)；
  `user_credits` 两个账户余额 100 与 67
- **定价公式验证通过**：`ziyuCost 5 → actualCost 8`（5 × 1.5 = 7.5，向上取整 = 8）✓
- **紫域账户**：`credits: 8370`，账号 `1453637677@qq.com`
- **门禁有效**：无 cookie 时 `/ziyu/api/v1/models` → 401、`/api/credits/me` → 401

### 15.3 ⚠️ 真正的风险：源码树落后于线上一个热修复

逐字节 diff（去除 CRLF 后）结果：

| 文件 | 状态 |
|---|---|
| `ziyu.js` / `routes-credits.js` / `ldxp-redeem.js` / `schema.sql` | 与线上**完全一致** |
| `credits.js` | ❌ **本地缺 `ziyu_cost * $2::numeric` 修复**（线上有，本地没有，差 4 行注释 + 1 行 cast） |
| `server.js` | ❌ 本地比线上**多 2 行** `CANVAS_LEGACY_TOKEN` 200 分支，少 1 行注释 |

**为什么这条是 P0**：`ziyu_cost` 是 integer，Postgres 会据此把 `$2` 推断成 integer，
`1.5` 传进去报 `22P02 invalid input syntax for type integer`，**对账接口整个 500**。
线上已修，**本地没修 → 下次按本地源码发布就回归**。

### 15.4 部署拓扑更正（此前记录有误）

- canvas-api 的代码**打进镜像**（`context: /opt/infinite-canvas/api`，`dockerfile: Dockerfile`），
  **不是**从 `current/api` 挂载的。`current/api` 里的旧文件（9/11）是残留，**不参与运行**。
- `canvas-api` 容器端口 8790 **未映射到宿主机**，只能经 `canvas-web`(nginx `:18085`) 访问。
  直接 curl `:3001` 会打到**别的服务**（ans-platform），这是排查时的一个坑。
- `LDXP_REDEEM_SECRET` 线上已存在（64 位，**非** 2026-09-18 本地生成的那个）→ **不替换**，
  替换会使已发出的卡密全部失效。

### 15.5 处置结果（2026-09-18，老大批准）

提交 **`24a28ae`** `fix(billing): 回写线上热修复，源码树与生产逐字节对齐`，已推送 `feat-server-deploy`。

| 项 | 处置 |
|---|---|
| H-2 `credits.js` 缺 `::numeric` | ✅ 已回写（1 行 cast + 4 行说明注释） |
| H-3 `server.js` legacy token 200 分支 | ✅ 老大裁决：**删除，与线上对齐**。旧站点 cookie 实际由 nginx `map` 层放行，不走 `/api/auth/verify` 端点 |

**对齐校验**：6 个后端模块与线上容器 `/app` **逐字节一致**（去 CRLF 后）——
`credits.js` 553 / `server.js` 749 / `ziyu.js` 464 / `routes-credits.js` 421 /
`ldxp-redeem.js` 149 / `schema.sql` 269；`node --check` 全过。

**⚠️ 遗留（未做，不影响正确性）**：本地工作区文件是 **CRLF**，线上是 LF。
Node 不在意，但会让「本地 vs 线上」的 diff 永远全文件变更。
**下次比对必须先归一化**：`diff <(sed 's/\r$//' 本地) 线上`。
根因是 `apply-batch1.mjs` 在 Windows 上生成文件。要不要统一转 LF，**待老大决定**。

**⚠️ 分支状态**：`feat-server-deploy` 领先 `origin/master` **22 个提交**，未合入、未建 PR。

---

## D16 · 三项裁决：紫域 Key 轮换 / 公开注册开关 / Git 历史清密码（2026-09-18）

### 16.1 紫域 Key —— ⚠️ 状态矛盾，待老大确认

老大已声明「key 我轮换了」。但 **2026-09-18 01:0x 实测**：

- 服务器 `/opt/infinite-canvas/api/api.env` 里的 `ZIYU_API_KEY` **仍是旧值**（长度 48）
- 且该旧 key **仍然有效**：`/api/ziyu/me` → 200、`{"ok":true,...,"credits":8370}`；`/api/ziyu/models` → 200

**推论**：要么后台尚未轮换，要么轮换的是另一把 key。**两者必居其一，需老大确认。**

**未做的后果**：一旦后台真的轮换，服务器仍拿旧 key 调紫域 → **出片全线失败**，
且失败点在外部服务，日志里只会看到上游 401。

**怎么改**：更新服务器 `/opt/infinite-canvas/api/api.env` 的 `ZIYU_API_KEY` → **重建 api 容器**
（改 `.env` 不重启 = 没改）。

### 16.2 公开注册开关 —— 老大提问，分析如下（**暂不改动**）

**风险（开着会怎样）**：
- 注册**零门槛**：`server.js:115-121`，填邮箱 + 密码即可，**无邀请码、无邮箱验证**
- 免费试拍按 `req.user.id` 限次，每月 3 次（`routes-credits.js:232/239`）
- → **注册一个新号 = 再来 3 次免费出片**，无限注册 = 无限刷
- 烧的是 **Agnes 渠道**（不是紫域）；另占 webdav 云同步与媒体库磁盘

**代价（关掉会怎样）**——⚠️ 与注释不符：
`server.js:15` 注释写「关掉后只能由管理员建号」，但**代码中不存在 admin 建号接口**
（`createUser` 只被 `/api/auth/register` 一处调用，该路由受 `ALLOW_REGISTER` 控制）。
→ **关掉 = 再无任何建号途径**，只能直接插库或临时重开开关。

**结论**：当前仅 2 个测试账号、无外部用户 → 关掉无损失；但**要拉人进来时得临时重开**。
**未做**，等老大决定。

### 16.3 Git 历史清密码 —— 老大提问，分析如下（**建议不做**）

**泄露的到底是什么**：`SITE_PASSWORD` = **agnes 代理的登录密码**
（`agnes-video-proxy/server.js:571` 比对，通过才下发 `canvas_auth` cookie）→ **进站的钥匙**。

**污染范围**（实测）：
- 引入：`58c296e`；修复：`4c7f48e`；当前工作区 `grep -c` = **0** ✓
- 仓库**私有**（未认证访问 GitHub API → HTTP 404）

**结论（核心）**：
> **重写 Git 历史 ≠ 撤销泄露。换凭证才是。**
> filter-repo 只是让仓库"看起来干净"；旧密码只要还在用就依然有效。
> 只清历史不换密码 = **虚假安全感**，是最坏结果。

**建议顺序**：
1. **先换 `SITE_PASSWORD`**（真正的安全动作）：改服务器 `/opt/agnes-video-proxy/.env` → **重建容器**；
   或 `CANVAS_SITE_PASSWORD=新密码 bash scripts/deploy/publish.sh`
2. **清历史可不做**：私有仓库 + 有权限者可信 → 收益≈0，代价（强推、全员重 clone、
   PR/链接错乱、不可逆）不为 0。**等哪天要开源再说。**

### 16.4 沉淀（老大要求固化为长期规则）

- 新建 skill：**`~/.workbuddy-ai/skills/secret-leak-response/SKILL.md`**
  （密钥泄露标准处置：先换凭证 → 再判断要不要清历史 → 防复发；含命令与决策表）
- 写入 `~/.workbuddy-ai/MEMORY.md`「固定规则」两节：密钥泄露处置、解释动作要讲清四件事

---

## D17 · 免费出片关停（已执行）+ 邮箱验证码注册（方案待 SMTP）—— 2026-09-18 02:0x

### 17.1 免费出片已关停 ✅ 已执行

老大决策：「不加免费出片就好了」（作为开放注册的配套：没免费额度 → 注册小号也刷不了东西）。

| 项 | 内容 |
|---|---|
| 做法 | 服务器 `/opt/infinite-canvas/api/api.env`：`FREE_TRIAL_MONTHLY_LIMIT` 3 → **0** → 重建 api 容器 |
| 为什么是 0 而不是"无限" | `credits.js:431` `if (monthlyLimit === 0)` → 返回 `FREE_TRIAL_DISABLED`；`routes-credits.js:92` 也把 0 当合法值。**0 = 关闭** |
| 验证 | 容器内值 `0`；`/api/credits/free-trial` → `{"limit":0,"remaining":0}`；`/free-trial/check` → **403**（nginx auth_request 拦截生效） |
| 回归检查 | `/api/health` 200、`/api/credits/me` 200、`/api/ziyu/models` 200、`/admin/credits/reconcile` 200、站点首页 200 |
| 回滚 | `api.env.bak-before-freetrial-off-20260918-0205` 存在；改回 3 + `docker compose up -d api` |
| 影响面 | 只关 Agnes flash 免费试拍；**紫域点数出片不受影响** |

### 17.2 邮箱验证码注册 —— 方案已定（已由 D19 上线记录覆盖）

老大决策：注册保持公开（不要邀请码），但**必须走邮箱验证码**。

**流程改造**
1. `POST /api/auth/register/code` `{ email }` → 生成 6 位码 → 存 hash → 发信
2. `POST /api/auth/register` `{ email, password, displayName, code }` → 校验码 → 建号
   （现有路由 `server.js:115` 保留入口，增加 code 校验）

**验证码存储**：新表 `email_verification_codes`
- 字段：`email` / `code_hash`（**SHA256，不明文**）/ `expires_at` / `attempts` / `consumed_at` / `ip`
- 有效期 10 分钟；最多试 5 次；用过即作废

**防刷**
- 同邮箱 60 秒 1 次；同 IP 每小时上限
- 只存 hash → 数据库泄露也拿不到可用验证码
- ⚠️ **SMTP 未配置时 fail-closed（拒绝注册）**，否则等于没验证

**🔴 唯一硬阻塞：用哪个 SMTP 发信**（需老大提供凭据，存服务器 `api.env`，**不进仓库**）

| 选项 | 优点 | 缺点 |
|---|---|---|
| QQ 邮箱 SMTP | 成本 0、已有账号 | 发信量小、易进垃圾箱 |
| 阿里云/腾讯云邮件推送 | 送达率高、有免费额度 | 需域名 SPF/DKIM 验证 |
| Resend / SendGrid | API 最简单 | 需注册、超出免费额度要付费 |
| 自有 cauai.fun 域名邮箱 | 品牌一致 | 同样要配 SPF/DKIM |

**待老大回答后才能开工。**

---

## D18 · 邮箱验证码注册（设计 + 实现）—— 2026-09-18

老大决策：**注册保持公开（不要邀请码），但必须走邮箱验证码**。发信渠道：**QQ 邮箱 SMTP**。

### 18.1 流程

1. `POST /api/auth/register/code` `{ email }` → 发 6 位码到邮箱
2. `POST /api/auth/register` `{ email, password, displayName, code }` → 验码 → 建号

`ALLOW_REGISTER` **保持 1 不变**（注册仍然公开）。

### 18.2 为什么拆成两个模块

| 模块 | 职责 |
|---|---|
| `canvas-api/email.js` | 只管发信（外部依赖：会超时、会挂） |
| `canvas-api/email-verify.js` | 只管验证码状态（纯本地） |

**拆开的理由**：发信是外部依赖，验证码是本地状态。混在一起会出现
「邮件发出去了但数据库没记下」这类对不上的问题——和 `CONSTRAINTS.md` 里
「扣了钱没记账 / 记了账没扣钱」是同一类错误。

### 18.3 安全要点（每条都有对应代码位置）

| 要点 | 做法 |
|---|---|
| **只存 HMAC，不存明文** | `email-verify.js:codeHash()` = HMAC-SHA256(key=JWT_SECRET, msg=`<email>:<code>`) |
| **必须用 HMAC 而不是裸 SHA256** | 6 位数字只有 100 万种组合，裸哈希可枚举反推（秒级）。带密钥后数据库泄露也拿不到可用码 |
| **fail-closed** | SMTP 未配置 → `/register/code` 直接 503，**绝不放行**。放行 = 验证码形同虚设，比报错危险 |
| **发信失败要撤码** | `revokeLatestCode()`：邮件没发出去，码却处于可校验状态，别留着 |
| **统一错误码** | 码错 / 过期 / 已用一律 `code_invalid`，避免被拿来探测 |
| **防刷** | 同邮箱 60 秒 1 次；同 IP 每小时 10 次；单码最多错 5 次；10 分钟过期 |
| **明文码只出现在邮件里** | 不进日志、不进响应体 |

⚠️ **副作用**：JWT_SECRET 更换会让所有未使用的验证码立即失效（可接受）。

### 18.4 改动清单

**后端**：`schema.sql`（+`email_verification_codes` 表）、`email.js`（新）、`email-verify.js`（新）、
`server.js`（+发码路由、注册路由加验码）、`package.json`（+nodemailer）、
`deploy/Dockerfile.api`（COPY 加新文件）、`scripts/deploy/publish.sh`（**打包/指纹/上传三处**都加）

**前端**：`services/backend-sync.ts`（+`sendRegisterCodeBackend`、`registerBackend` 加 code 参数）、
`components/layout/config-account.tsx`（+验证码输入框与发送按钮、60 秒倒计时）、
`i18n/locales/{zh-CN,en-US}.ts`（+7 个 key）

### 18.5 待办（**未做**）

- 🔴 **QQ 邮箱授权码**：老大去 QQ 邮箱设置开启 SMTP、拿授权码
- 服务器 `api.env` 加 `SMTP_HOST=smtp.qq.com` / `SMTP_PORT=465` / `SMTP_USER` / `SMTP_PASS`
  （**授权码不是 QQ 登录密码**；凭据只放服务器，不进仓库）
- 填好凭据后跑 `publish.sh` 发布，并重建 api 容器

### 18.6 质量门 FAIL 与修复（诚实记录）

`cd77d67` 的提交信息里写了"质量门 7 PASS / 0 WARN / 0 FAIL"，**这句是错的** —— 当时实际是
`6 PASS / 0 WARN / 1 FAIL`。原因：提交前用 `node scripts/verify.mjs 2>&1 | tail -4 && git commit`
这种管道写法，verify.mjs 的非零退出码被管道吞掉了，`&&` 照样往后走。**教训：质量门不要用管道接，
退出码会被吞。**

FAIL 内容：

```
[FAIL] ✗ C2.4 口径一致性（实测 vs 文档声称）
        ✗ 实测 25 条路由（不含 app.use），文档声称：24（docs/STATUS_20260912.md）
```

**根因是我自己造成的漂移**：`79615f4` 新增 `POST /api/auth/register/code`，实测 24 → 25，
而 `docs/STATUS_20260912.md` 仍写 24。这正是 C2.4 设计的目的 —— 它抓到了我的漂移，属于好事。

修复：`docs/STATUS_20260912.md` 标题 24 → 25，补上路由表那一行，并明确口径
（只计 `app.(get|post|put|patch|delete)(` 起始行、不含 `app.use`、不并计 `routes-credits.js` 17 条与前端 8 条）；
顺带修正已过期的"`canvas-api/` 只有 5 个源文件"（现状 11 个）。

**修复后**：`7 PASS / 0 WARN / 0 FAIL`（已复跑确认）。

---

## D19 · 邮箱验证码注册**已上线**（执行 + 验证证据）—— 2026-09-18

D18 设计 → 本次执行完毕并上线。**注册保持公开，但必须邮箱验证码**。

### 19.1 执行了什么

| # | 动作 | 结果 |
|---|---|---|
| 1 | 服务器 `/opt/infinite-canvas/api/api.env` 写入 5 个 SMTP 变量 | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`；**7 行 → 12 行** |
| 2 | 发布：`bash scripts/deploy/publish.sh` | release `canvas-20260918-112928-79615f4`（commit `79615f4`），耗时 3m41s |
| 3 | api 镜像重建 + 容器重建 | `canvas-api:latest` Built，容器 `Recreated` / `Started` |
| 4 | 端到端验证 | 见 19.2 |

**密钥纪律**：授权码（16 位）**只存在于服务器 `api.env`**，不进治理仓、不进源码仓、不进聊天记录之外的任何文件。
服务器侧临时中转文件已 `rm`；写入前已备份 `api.env.bak-before-smtp-20260918-1130`（7 行）。

**未受影响的既有配置（已逐项核对）**：
- `LDXP_REDEEM_SECRET` 仍在（替换 = 已发卡密全废）—— `publish.sh` 不碰它
- `ZIYU_API_KEY` 长度 48，**与线上原值一致 → 本次未改动**（H-5 保持原状）
- `AUTH_COOKIE` 未变（`publish.sh` 的 `remote_env_set` 是按键 upsert，值相同则不写）

### 19.2 验证证据（全部为本次实测）

| 验证项 | 方法 | 结果 |
|---|---|---|
| SMTP 凭据有效 | 容器内 `verifySmtp()`（只握手不发信） | `{"ok":true}` ✓ |
| `nodemailer` 已装 | 容器内读 `package.json` | `6.10.1` ✓ |
| 新代码进镜像 | `docker exec canvas-api ls /app` | `email.js` / `email-verify.js` 均在 ✓ |
| SMTP 变量进容器 | 容器内逐变量取长度（不打印值） | 5 个全有值（`PASS` len16 / `USER`、`FROM` len17）✓ |
| 新表已建 | `select count(*) from email_verification_codes` | 表存在，0 行 ✓ |
| **真实发信** | `POST /api/auth/register/code {"email":"1453637677@qq.com"}` | **HTTP 200** `{"ok":true,"ttlSeconds":600}`；表内新增 1 行 ✓ |
| **端到端建号** | 签发码 → `POST /api/auth/register` 带正确码 | **HTTP 201**，`role=user`（未被误提权）✓ |
| 错码被拒 | 同一路由带 `000000` | **400** `code_invalid` ✓ |
| 空码格式校验 | 带空码 | **400** `invalid_code` ✓ |
| **码不可重放** | `verifyCode` 连续两次 | 第一次 `ok=true`，第二次 `ok=false code_invalid` ✓ |
| 前端新 UI 已上线 | 构建产物搜「验证码」 | 主 JS `index-DJ-TIgVj.js`，命中 2 处 ✓ |
| 回归 | `/api/health` / `/api/credits/me` / `/api/ziyu/models` / `login.html` | `200` / `401` / `401` / `200` ✓ |
| 门禁自锁检查 | `GET /` | `302 → /login.html`（门禁正常，登录页自包含可访问）✓ |

**测试数据已清理**：`e2e-*@hb.cauai.fun` 账号与验证码行全部删除，`users` 总数回到 **7**（与执行前一致）。

### 19.3 未验证 / 残留

- ⚠️ **未由本人确认"邮件真的落进收件箱"**：发信返回 200 只证明 QQ SMTP **接受**了投递，
  不证明没有进垃圾箱。**需老大打开 `1453637677@qq.com` 收件箱确认**（顺带看垃圾箱）。
- 上述"端到端建号"用的是容器内直接 `issueCode()` 取码，**绕过了邮件环节**；
  邮件环节由"真实发信 200 + 表内落行 + `verifySmtp` 握手"三点分别覆盖。两者合并才是完整闭环。
- 未做：QQ SMTP 的**发信频率上限**（QQ 个人邮箱有日限额）未压测。

### 19.4 回滚

1. `cp -a /opt/infinite-canvas/api/api.env.bak-before-smtp-20260918-1130 /opt/infinite-canvas/api/api.env`
2. `cd /opt/infinite-canvas && docker compose up -d --force-recreate api`
3. 若需连前端一起回：`ln -sfn releases/<上一版本> current && docker compose exec -T web nginx -s reload`
   （上一版本在 `releases/` 内，保留最近 5 个）

---

## D20 · 紫域 Key 不轮换，优先解决根本矛盾—— 2026-09-18

老大明确裁决：**紫域渠道只有一把 Key，不换、不动 H-5**。

### 20.1 口径

- H-5 从“待老大提供新 Key”改为**不做**。
- 当前线上 `ZIYU_API_KEY` 保持不变；不能复制、猜测或替换现有 Key。
- 只有这把 Key 实际失效，或老大再次明确要求变更时，才重新评估。

### 20.2 优先级重排

不再把“Key 是否轮换”当成主矛盾。优先关注：

1. **资金边界**：公开注册后的账号，在无余额/无兑换码时是否始终无法触发紫域扣费链。
2. **暴露面**：是否存在绕过本站账号与额度校验、直接消耗服务器紫域额度的入口。
3. **可审计性**：紫域实际消耗、本站扣点、失败/结算是否持续一致。

本裁决的收益是避免对唯一凭据做错误替换；与继续追踪 H-5 的差异是：不再承担“误换 Key 导致全站紫域请求 401”的人为风险，把执行资源转到真实资金边界。

---

## D21 · 渠道配置必须可控，平台渠道与 BYO 渠道分离—— 2026-09-18

老大批准启动“渠道可控化”准备工作。当前先完成规格与边界，不直接改权威源码或线上配置。

### 21.1 当前主要矛盾

现有 `ModelChannel` 主要通过浏览器 `localStorage`（`infinite-canvas:ai_config_store`）持久化，前端允许新增、编辑、删除渠道，并修改地址、Key、模型和脚本。这适合用户自带渠道（BYO），不适合作为平台托管渠道的统一控制面。

### 21.2 目标边界

- **平台托管渠道**：网站持有服务端凭据或承担上游成本；必须服务端登记、管理员控制、模型白名单、启停 fail-closed、额度/成本绑定、审计和回滚。
- **用户自带渠道（BYO）**：凭据只存浏览器本地，平台不做代理、不计平台额度、不托管凭据；页面必须明确标注 BYO。
- 平台 Key 不得进入仓库、前端 bundle、localStorage、导出文件和普通日志。

### 21.3 第一阶段产物

- 渠道控制 SSOT：`docs/CHANNEL_CONTROL.md`。
- 当前实现审计、目标模型、权限矩阵、P0/P1/P2 准备项和验收标准均记录在该文件。
- 后续权威源码变更必须先按 `docs/LIFECYCLE.md` 通过规格、约束和 G3 落地闸门；本次只写治理仓文档，不改变线上行为。

---

## D23 · New API 的 Codex 渠道接入与凭据格式（2026-09-20）

### 23.1 事实订正

此前判断「New API 不支持 ChatGPT 账号 session 类型」**有误**。实测后台「添加渠道」存在 **ChatGPT Subscription (Codex)** 类型，要求填入 Codex OAuth JSON credential（`access_token` / `refresh_token` / `account_id`）。

页面自带声明：「仅限个人使用，请勿分发或共享任何凭证」。即：**技术门槛比原判断低，但授权范围比原判断更窄**。

### 23.2 报错根因

粘贴登录态 JSON 时报「Codex 凭据必须是包含 access_token 和 account_id 的 JSON 对象」。

根因是**字段命名形态不匹配**，不是凭据本身无效：

| 来源（chatgpt.com/api/auth/session 类端点） | New API 期望 |
|---|---|
| `accessToken`（驼峰） | `access_token`（顶层蛇形） |
| `account.id`（嵌套） | `account_id`（顶层） |

### 23.3 处理方案

新增 `implementation/scripts/convert-codex-credential.mjs`：

- 保留原始全部字段，最大化兼容 New API 可能读取的其他字段
- 剔除 `statsigContext` 等遥测噪音（含 IP、设备指纹、地区，非凭据但有扩散面）
- 补齐顶层 `access_token` / `account_id`，并在有 refresh token 时补 `refresh_token`
- **不打印任何字段值到 stdout**，只输出长度等元数据
- 输入与输出文件都必须在仓库外的 secrets 目录

已用仓库外假数据验证通过，临时文件已删除。

### 23.4 纪律

任何 Codex / OAuth 凭据只在老大本地处理：填进 New API 后台界面，不进聊天、不进仓库、不写入文档、不打印到日志。`statsigContext` 类遥测字段一律剔除。

### 23.5 合规口径不变

Codex 渠道本质仍是订阅账号转 API，适用于**个人自用**，不适合团队共用与对外售卖（作者明示「勿分发或共享」，且违反 OpenAI 订阅条款）。要对外售卖仍需走 Platform API 或国内合规上游。


---

## D24：接入 Cockpit 里的 mcgrox 上游渠道（2026-09-20 执行）

### 24.1 决策

老大指令：「接入我 cockpit 里的渠道就行 mcgrox」。

定位结果：**cockpit = Cockpit Tools（桌面端 CLI 账号/渠道管理器）**，配置目录 `C:/Users/lsb/.antigravity_cockpit`，
渠道清单是 Cockpit 配置目录（用户目录下的 .antigravity_cockpit）里的渠道清单 JSON，共 27 条渠道，
**该文件不在本治理仓内**。其中 **mcgrox 相关 3 条**：

| idx | baseUrl | 备注 |
|---|---|---|
| 5 | `https://mcgrox.top/v1` | 6 把 key |
| 11 | `https://www.mcgrox.top` | 3 把 key（其中 1 把属 api.asxs.top） |
| 18 | `https://mcgrox.top` | 3 把 key |

**实测结论（关键）**：

- `mcgrox.top` 裸域 **SSL 握手超时**，不可用；**`www.mcgrox.top` 可用**。
- 9 把去重 67 位 key 中，**只有 2 把真正属于 mcgrox**（其余 401，或路由到别的站只返回 `Kun`/`deepseek-v4.1-flash`）。
- 可用模型 9 个：`codex-auto-review`, `gpt-5.5`, `gpt-5.6`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`,
  `gpt-image-2.5`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`（含 3 个图像模型）。

### 24.2 落地结果（已验证）

apic 上建渠道 **id=2 / 名称 `mcgrox-top` / type=1（OpenAI 兼容）**，`base_url=https://www.mcgrox.top`，
2 把 key 轮询（multi_key_mode=polling）。

验收（2026-09-20，全部真实调用）：

- 内网 6 个文本模型全部 HTTP 200，返回内容正常
- 公网 `https://apic.cauai.fun/v1/chat/completions` HTTP 200
- 公网 `/v1/models` 返回 9 个模型
- 配额正常扣减（7 次调用扣 1730 quota）

### 24.3 踩过的坑（复用价值高）

1. **AddChannel 不是扁平结构**：`POST /api/channel/` 接收 `{"mode": "...", "channel": {...渠道字段...}}`。
   传扁平字段会命中 `validateChannel` 的 `channel == nil` 分支，报 **「channel cannot be empty」**（误导性极强，
   字面看像是 key 为空，实则是嵌套层缺失）。
2. **`mode` 必填**，取值 `single` / `batch` / `multi_to_single`，其他值报「不支持的添加模式」。
3. **多把 key 不能用 `mode=single`**：会把 `key1\nkey2` 整体塞进 `Authorization` 头 →
   `net/http: invalid header field value`。必须 `mode="multi_to_single"` + `multi_key_mode`（`random` 或 `polling`）。
4. **渠道字段是 `group`（字符串）不是 `groups`（数组）**；`base_url` 是 `*string`。
5. **模型没配价格 = 400 `model_price_error`**。私有模型名不在内置价格表，必须在
   `PATCH /api/option/model_pricing` 配置。该接口**需要 `expected_version`**，否则 409
   「model pricing changed; reload before saving」；版本号从 `GET /api/option/model_pricing` 取
   （新模型用 `empty_version`）。
   价格字段：`{"ModelRatio": <每1M输入价格>, "CompletionRatio": <输出相对输入的倍数>}`，参照 gpt-4o 为 1.25 / 4。
6. **新建渠道后要等数据库同步**（约 20 秒）才可用，期间调用一律 503
   「No available channel for model xxx under group default」。
7. **列表接口返回的 token key 是脱敏的**：`/api/token/` 返回 18 位，数据库里真实值是 48 位。
   用列表返回值调用必然 401「Invalid token」。
8. **Cloudflare 会拦 `python-urllib` 默认 UA**，返回 403 `error code: 1010`；探测时必须伪装浏览器 UA。

### 24.4 未完成 / 风险（必须处理）

1. **价格是占位价，不是定价决策。** 当前按 gpt-4o 档位填 `ModelRatio=2.5 / CompletionRatio=4`（图像模型 2.5/1）。
   mcgrox 的实际成本未知，**售价可能低于成本**——上线售卖前必须由老大按真实成本重设，并设置分组倍率。
2. **图像模型未验证**：`gpt-image-2.5` 系列未做真实出图调用，异步/计费/结果下载均待验证。
3. **公开注册仍开启**（`register_enabled=true`）。渠道已可用，意味着任何人注册即可消耗老大的 mcgrox 额度。
   建号后应立即关闭。
4. **上游性质**：mcgrox 是第三方公益中转站，稳定性、合规、数据流向由对方承担，无 SLA。
   模型名为其私有代号，非 OpenAI 官方命名。

### 24.5 纪律

- 上游 key 全程不进聊天、不进仓库：只在服务器 `/root` 临时落盘，用完即删（已执行清理）。
- 服务器 /root 下非本次会话创建的文件一律不碰（清理时逐个点名，不用通配符，避免误删既有脚本）。

---

## D25：画布接入 apic —— 技术验证已通过，落地待 G3 批准（2026-09-20）

### 25.1 验证结论（全部为真实调用，非推断）

| 验证项 | 结果 |
|---|---|
| mcgrox 图像模型出图 | 3/3 成功（`gpt-image-2.5` / `-flare` / `-sunburst`），b64 解码后文件头为 PNG 魔数 |
| 公网端到端 | `POST https://apic.cauai.fun/v1/images/generations` → 200，返回 b64 图像 |
| **CORS** | 预检 204 且实际 POST 均返回 `access-control-allow-origin: *`、`allow-headers: *`、`allow-credentials: true` |
| 画布 `size: "1:1"` | 不报错，正常出图 |
| `n=2` | 准确返回 2 张（不静默少给） |
| `response_format: b64_json` | 生效 |
| **图生图 `/v1/images/edits`（multipart）** | 200，`gpt-image-2.5` 与 `-flare` 均返回编辑后的 PNG（1254x1254） |

**因此：画布浏览器可以直连 apic，不需要 nginx 反代、不需要平台托管（platform ownership）。**

### 25.2 关键事实（决定方案选型）

1. **baseUrl 填 `https://apic.cauai.fun`（不带 `/v1`）**——画布 `model-plugin.ts` L203 会自己拼
   `` `${baseUrl}/v1/images/generations` ``。
2. **画布默认 `size` 是比例字符串**（`use-config-store.ts` L208 默认 `"1:1"`），不是 OpenAI 标准的
   `1024x1024`。
3. **⚠️ 上游忽略 size 参数**：传 `"1:1"` 与 `"1024x1024"` 实测都输出 **1254x1254**。
   即画布里选 16:9 / 4K 都不会生效，只能得到正方形。这是 mcgrox 的限制，不是配置问题。
4. 画布的 BYO 渠道配置存在浏览器 localStorage，无法由服务端预置——
   **要让所有用户开箱即用，必须改源码加模板。**

### 25.3 两条路径

**路径 A：用户手动新增渠道（零改动，立即可用）**
画布设置 → 渠道 → 新增：baseUrl `https://apic.cauai.fun`，apiFormat `openai`，Key 填用户自己的 apic 令牌，
模型填 `gpt-image-2.5` 等。缺点：每个用户都要手填，且要自己知道模型名。

**路径 B：加渠道模板（推荐，需 G3 批准）**
在 `web/src/stores/channel-templates.ts` 的 `channelTemplates` 数组末尾新增一项（BYO，不写 Key）：

```ts
{
    id: "apic",
    name: "CAUAI API",
    baseUrl: "https://apic.cauai.fun",
    apiFormat: "openai",
    models: [
        { name: "gpt-image-2.5", capability: "image" },
        { name: "gpt-image-2.5-flare", capability: "image" },
        { name: "gpt-image-2.5-sunburst", capability: "image" },
    ],
    hint: "生图（走 apic 网关）。填你在 apic.cauai.fun 的 API Key 即用，额度从 apic 账户扣。"
        + "上游忽略尺寸参数，实际固定输出 1254x1254。",
},
```

不设 `imageBatchLimit`（实测 n=2 给全 2 张，无需像 OpenLux 那样拆成 1 张/次）。
`ownership` 留空走默认 `byo`——**不碰平台托管，不碰 nginx，不碰画布计费**，账本最干净。

### 25.4 闸门

路径 B 属于改动权威源码树（`E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas`），
按 AGENTS.md 第 6 节需 **G3 显式批准**后才可落地，落地后还需按 `publish.sh` 发布才对线上生效。
截至本条记录：**未改动画布任何源码**。

### 25.5 未做

- 文本模型未纳入模板：`gpt-5.5` 等是 mcgrox 私有代号，画布文本链路（可能走 Responses API）未验证。
  （图生图已补验通过，见 25.1；画布线上 UI 冒烟已做，见 25.7。）

### 25.6 落地与发布记录（2026-09-21 00:22，已上线）

老大书面批准后执行。

**G3 四条通过记录**：

| 条件 | 证据 |
|---|---|
| G3-a 零写入干跑 | `node implementation/scripts/dry-run-all.mjs` 退出码 0，权威树零变化 |
| G3-b 数据卷 | 本次为前端 TS 改动，不涉及 AGENTS.md §5 的四个不可再生卷 |
| G3-c 回滚方案 | 已读 `implementation/deploy/ROLLBACK.md` R-00 §1.2（相对软链 + nginx reload） |
| G3-d owner 批准 | 对话记录：「批准」 |

**落地**：提交 `839b5c8 feat(web): 新增 apic 渠道模板（BYO 生图）`，只加 15 行，未改任何既有代码。

**发布**：`bash scripts/deploy/publish.sh`，版本 `canvas-20260921-002224-839b5c8`，commit=839b5c8。

**⚠️ 本次发布连带上线了两个此前从未上线的提交**，必须记录：

| 提交 | 内容 |
|---|---|
| `521c123` | feat(web): separate platform and BYO channel controls（渠道 UI 分离，5 文件 66 行） |
| `5b8bac6` | fix(web): enforce platform channel ownership（归属强制，2 文件 23 行） |

线上此前停在 `79615f4`，落后这两个提交。**不是可选带上——新模板依赖 `5b8bac6` 引入的
`normalizeChannelOwnership` / `sanitizeChannelForStorage` 才能正确处理 `ownership` 字段。**
已核对：`normalizeChannelOwnership` 只把 `agnes` 与 `ziyu` 强制为 platform，`apic` 落在 BYO 分支，
用户填的 Key 会被正常保留、不会被清空。

**发布前已排除的风险**：

- `publish.sh` 会 `remote_env_get` 复用服务器上的 `JWT_SECRET` / `PG_PASSWORD` / `AUTH_COOKIE`，
  读不到才新生成 → 不会踢用户下线、不会导致新容器连不上老库。
- 紫域 Key 缺失时脚本 `exit 1` 中止，不会静默把 nginx 的 `__ZIYU_KEY__` 替换成空串；
  本次已从 `/opt/infinite-canvas/api/api.env` 取回（48 位）随发布传入。
- `QuotaForNewUser = 0`：新注册用户额度为 0，公开注册虽开启但注册了也调不动，
  不存在"上线画布模板即被陌生人白嫖"的路径。

**线上验收（全部实测）**：

| 项 | 结果 |
|---|---|
| BUILD_INFO | `release=canvas-20260921-002224-839b5c8` / `commit=839b5c8` |
| `current` 软链 | 指向新版本（相对路径） |
| 产物含模板 | `apic.cauai.fun` 命中，三个模型名均命中 |
| 首页（带 cookie） | 200 |
| 公网 | `hb.cauai.fun` 302（门禁跳登录，正常）、`apic.cauai.fun` 200 |
| 容器 | canvas-api 已重建；canvas-postgres **未重启**（Up 9 days，数据安全） |
| 回滚窗口 | 上一版 `canvas-20260918-112928-79615f4` 仍在，可直接切回 |

**回滚命令**（如需）：
`cd /opt/infinite-canvas && ln -sfn releases/canvas-20260918-112928-79615f4 current`
再执行 `docker compose ... exec -T web nginx -s reload`。

### 25.7 线上 UI 冒烟（2026-09-21 00:50，通过）

用 CDP 驱动无头 Chrome（注入 `canvas_auth` cookie）访问真实线上环境，非本地预览：

1. `https://hb.cauai.fun/` 打开成功，标题「无限画布」（登录态有效，非登录页）
2. 点「配置」→「渠道」tab 正常渲染
3. 渠道列表显示两条既有渠道，其中「Agnes 视频代理」带 **平台渠道** 标记
   —— 这同时证明连带上线的 `5b8bac6`（platform ownership）UI 在线上工作正常
4. 展开「从模板添加（预填接口地址与模型）」下拉，**第 5 项为 `CAUAI API`**
   （前四项为 OpenLux / OmniRoute / Midjourney(本地桥接) / 紫域）

**结论：模板已在线上真实环境可见可用。**

仍未做：在画布界面里点「生成」跑通一次完整出图——这一步需要填入 apic 令牌并在 UI 上完成多步交互，
留待老大实际使用时确认（服务端的等价请求已实测通过，见 25.1）。

## D26 · 架构重置后垂直切片 001：递归解析上游资源链（2026-09-21）

### 决策

Owner 已明确批准 G3（对话证据：`批准`），允许修改权威源码以修复垂直切片 001 的真实链路缺口。第一处改动限定为输入资源解析：将视频节点的上游资源查找从一跳改为确定性、去重、遇环终止的递归遍历，并在资源节点处停止，避免把无关祖先带入生成输入。

### 落地与验证

| 项 | 证据 |
|---|---|
| 权威源码改动 | `canvas-chain.ts` / `canvas-resource-references.ts` 接入递归解析；`project.tsx` 阻止无提示词/无参考的视频提交、同一目标请求去重并为主流程/重试生成业务请求 ID；`services/api/video.ts` 透传 `Idempotency-Key` 且拒绝不可持久化的临时 URL；`file-storage.ts` 为媒体元数据读取增加超时兜底 |
| 契约测试 | `canvas-chain.test.ts` 覆盖 `image → config → video`、汇聚分支去重、环路终止；`canvas-generation-status.test.ts` 覆盖刷新中断恢复；`video-request-headers.test.ts` 覆盖 `Idempotency-Key`；原生 Node 测试：6/6 通过 |
| 类型与构建 | `web` 的 `npm run typecheck` 通过；`npm run build` 通过。仅有既有动态导入与大 chunk 警告；Prettier 对历史大文件已有格式提示，本次未做全文件重排 |
| 治理质量门 | `node E:/codex/huabu/scripts/verify.mjs`：7 PASS / 0 WARN / 0 FAIL |
| 本地浏览器证据 | `docs/STATUS_20260921_SLICE001_BROWSER.md`：创建画布、上传图片、连接视频参考、刷新后连接仍在；S1/S2/S7 通过，未触发真实生成 |
| 本地模拟执行证据 | `output/playwright/mock-video-evidence.json`：成功/失败各一次，成功结果刷新后可读，失败显示错误且无永久 loading；不计入真实上游 S3–S6 |

### 未完成与边界

- 未执行真实浏览器出片、未调用付费上游、未部署线上版本。
- 状态恢复、结果落盘、重复提交和错误路径仍需 T3/G4 证据；独立审查与发布仍需 G5/G6。
- 本记录不包含任何密钥、令牌、站点密码或不可再生数据操作。

---

## D26：上游 mcgrox 供给变化与渠道同步（2026-09-21 02:10）

### 26.1 现象

老大要求「文本也走 apic，不要用 OmniRoute」。动手前先验证画布的文本链路，
发现**apic 上所有文本模型调用全部失败**（503）。

### 26.2 根因：上游供给变了，不是配置问题

逐层验证：

| 检查项 | 结果 |
|---|---|
| 上游 `/v1/models`（连续 3 次、间隔 5s） | 稳定返回 **3 个模型**，全是图像模型 |
| 上游直连文本模型 | `gpt-5.6` / `gpt-5.5` 均 **503 `Service temporarily unavailable`**（上游自己返回的） |
| 上游直连图像模型 | `gpt-image-2.5` **200，正常出图** |
| New API 侧渠道状态 | status=1 正常，未被自动禁用 |

**关键对比**：一小时前（D25 执行时）上游还有 **9 个模型**（6 文 + 3 图），
现在只剩 **3 个图像模型**。文本模型是**上游单方面下线**，与本仓配置无关。

### 26.3 处理：同步渠道模型列表

渠道 `id=2` 的 `models` 字段原本含 6 个已失效的文本模型，用户调用会踩 503/404。
已同步为真实可用的 3 个：

```
改前: codex-auto-review,gpt-5.5,gpt-5.6,gpt-5.6-sol,gpt-5.6-terra,gpt-6-astra,gpt-image-2.5,gpt-image-2.5-flare,gpt-image-2.5-sunburst
改后: gpt-image-2.5,gpt-image-2.5-flare,gpt-image-2.5-sunburst
```

**操作纪律**（这次做对了的地方）：

1. 先用 `PUT /api/channel/` 之前**把渠道完整记录（含 key）备份到服务器 600 权限文件**，
   因为不确定该接口是全量覆盖还是部分更新——全量覆盖会把 Key 清空。
2. 实测确认是**部分更新语义**：只传 `id` + `models` + `multi_key_mode` 后，
   `key`（135 字符 = 2 把 key）、`name`、`base_url`、`group`、`status`、`channel_info` **全部无损**。
3. 验证通过后才删除备份。

**注意**：该接口**禁止传 `status` 字段**（传了直接报参数错误）；`PatchChannel` 是扁平结构，
与新增渠道的嵌套 `{"mode":...,"channel":{...}}` 完全不同。

### 26.4 影响

- **画布的图片功能不受影响**：模板里写的正好就是这 3 个图像模型，与上游现况天然一致，无需改动。
- **「用 apic 替代 OmniRoute」暂时无法实施**：apic 当前没有任何文本模型供给。
  这不是配置问题，是上游没货——**OmniRoute 暂时不能撤**。
- 公网 `/v1/models` 现在干净返回 3 个模型，不再暴露失效项。

### 26.5 教训

**第三方公益中转站没有 SLA，模型供给随时可能变。** 本例中一小时内从 9 个模型缩到 3 个，
且**上游没有任何通知**，表现为调用端突然全 503。

推论：若要基于上游做对外售卖，必须

1. 定期探测上游 `/v1/models` 与渠道 `models` 是否一致，不一致就同步（否则用户看到的是假模型）；
2. 不要把业务建立在单一免费中转站上——**要么接有 SLA 的官方/付费上游，要么自建**；
3. 对用户承诺的模型清单，必须以「实测可用」为准，不能以上游文档为准。
### D27 · 2026-09-21 · 让生成状态在节点上可见

- 决定：视频节点的 `queued/running/completed/failed` 状态必须在画布节点上直接显示；loading 态区分“排队中”和“处理中”，完成态保留“已完成”标签，失败态保留“生成失败”标签。
- 原因：仅持久化 metadata 不足以满足 S4 的用户可观察性要求，且容易把真实失败误认为永久 loading。
- 落地：`web/src/components/canvas/canvas-node.tsx`、`web/src/i18n/locales/zh-CN.ts`、`web/src/i18n/locales/en-US.ts`。
- 验证：类型检查、6 项契约测试、生产构建和治理仓 7 项质量门通过；真实上游状态时间线、独立审查和发布仍未通过。
-
### D28 · 2026-09-21 · 统一源码验证入口

- 决定：源码项目新增 `npm run test:contracts` 与 `npm run verify`；`verify` 依次执行类型检查、契约测试和生产构建。
- 原因：架构生命周期要求 VERIFY 阶段可重复执行，不能依赖人工拼接命令。
- 边界：真实浏览器、治理仓密钥/文档门禁、独立审查和生产发布仍是单独闸门，不由该命令伪造通过。
- 验证：`npm run verify` 成功，6 项契约测试通过，生产构建成功；既有构建警告保持记录。
### D29 · 2026-09-21 · 幂等约束必须落在视频代理边界

- 决定：视频提交的幂等不能只依赖 React 前端的重复点击保护；代理必须放行 `Idempotency-Key` 的 CORS 预检，并按请求摘要合并相同 key 的并发/重试请求。
- 落地：`agnes-video-proxy/idempotency-store.js`、`agnes-video-proxy/server.js`，同 key 不同摘要返回 409，失败操作不污染后续重试。
- 验证：代理契约测试 3/3、源码 `npm run verify` 9/9 契约测试通过；真实 Agnes 上游和计费对账仍未执行。
### D30 · 2026-09-21 · multipart 幂等摘要必须忽略传输边界

- 决定：代理不对 multipart 原始 boundary 做幂等摘要；改为对字段、文件名、文件类型、文件大小和文件内容摘要做规范化，保留参考文件顺序。
- 原因：浏览器每次 FormData 编码可能生成不同 boundary；原始字节摘要会把同一业务重试错误判为 409。
- 验证：代理语法检查和 5 项幂等/摘要契约测试通过；完整 `npm run verify` 通过（11 项契约测试）。
- 预检实测：本地临时端口的 `OPTIONS /v1/videos` 返回 204，并包含 `Access-Control-Allow-Headers: ... Idempotency-Key`；未触发 Agnes 上游。
### D31：代理幂等契约扩展后的验证口径（2026-09-21）
- 决定：以代理提交边界的语义请求摘要、并发合并、冲突 409、失败可重试和 CORS 预检为统一幂等验收口径；不把客户端 `Idempotency-Key` 当作唯一防线。
- 验证：代理契约测试 5/5；源码 `npm run verify` 共 11/11 契约测试通过，类型检查和生产构建通过；真实 Agnes 上游、计费对账、独立审查和发布仍未执行。
### D32：临时视频 URL 不得伪装成成功资产（2026-09-21）
- 决定：将远程结果 URL 写入本地媒体前，必须验证 HTTP 2xx、视频/通用二进制响应类型并检查 API 错误体；失败直接进入 `failed`，不写入媒体记录。
- 验证：视频结果校验契约 4/4；源码 `npm run verify` 共 15/15 契约测试通过，类型检查和生产构建通过。

### D33：代理协议与端口必须按配置真实连接（2026-09-21）
- 决定：代理上游请求按 AGNES_BASE_URL 的协议选择 HTTP/HTTPS，并显式传递非默认端口；本地模拟上游不得依赖“请求看似发出”的间接证据。
- 验证：本地 HTTP stub 集成测试覆盖 JSON 与 multipart 两条提交路径，各自并发请求只触发 1 次上游创建；另覆盖冲突键 409、非法 JSON 400 和 CORS 204；源码 `npm run verify` 共 16/16 契约测试通过；证据见 output/proxy-idempotency-integration.json。

### D34：生成状态必须可被辅助技术读取（2026-09-21）
- 决定：queued/running/completed/failed 状态徽标和 loading 文案使用统一状态键，并通过 `role=status` 与 `aria-live=polite` 暴露状态变化。
- 验证：状态标签契约测试通过；源码 `npm run verify` 共 17/17 契约测试通过，类型检查和生产构建通过。

### D35：主动取消也必须结束视频状态（2026-09-21）
- 决定：用户主动停止 queued/running 视频任务时，节点立即从 loading 退出并落成 failed，保留任务 ID、结束时间和取消原因；不能继续显示旧的 running 徽标。
- 验证：取消状态契约测试通过；源码 `npm run verify` 共 18/18 契约测试通过，类型检查和生产构建通过。

### D36：输入校验提示不得承诺未实现的素材类型（2026-09-21）
- 决定：当前垂直切片的视频提交前置校验只接受提示词或图片参考；在视频/音频引用真正接入前，界面提示不得声称这两类素材已经可用。
- 原因：提示文案是产品契约的一部分，不能用未来范围掩盖当前实现边界。
- 落地：中英文 `videoPromptRequired` 均改为只描述当前已支持的图片参考；视频/音频专用错误键仍保留给后续能力接入。
- 验证：源码类型检查、18/18 契约测试和生产构建通过。

### D37：切片格式检查纳入统一验证入口（2026-09-21）
- 决定：全仓格式检查受历史生成目录和既有文件噪声影响，不作为本切片的虚假通过条件；本切片新增契约、状态和代理文件使用 `format:check:slice` 纳入 `npm run verify`。
- 原因：质量门必须可重复且范围诚实，既不能漏掉新增文件，也不能把无法归因的历史噪声算到本次切片。
- 验证：`npm run verify` 依次通过类型检查、切片格式检查、18/18 契约测试和生产构建。

### D38：机器状态文件必须由治理质量门校验（2026-09-21）
- 决定：`output/slice-001-gate-status.json` 纳入 `scripts/verify.mjs`，必须包含 S1–S7、G4–G6 以及“不得把本地证据升级为真实验收”的边界声明。
- 原因：交接状态不能只靠人工阅读；缺字段或 JSON 损坏时应直接阻断质量门。
- 验证：治理质量门新增“垂直切片机器状态完整性”检查，当前为 **8 PASS / 0 WARN / 0 FAIL**。

### D39：发布模式必须显式阻断未关闭的外部闸门（2026-09-21）
- 决定：`node scripts/verify.mjs --release` 只有在机器状态文件的 G4、G5、G6 全部为 `passed` 时才允许退出 0；普通 `verify` / `--strict` 只验证本地质量与状态文件完整性。
- 原因：本地契约测试通过不等于真实上游、独立审查和生产回滚通过，发布入口必须把两者硬隔离。
- 验证：当前 `--strict` 退出 0；`--release` 正确以 1 退出并列出 G4、G5、G6 未通过。

### D40：新增代理模块必须进入发布包与运行时复制步骤（2026-09-21）
- 决定：`idempotency-store.js` 与 `request-fingerprint.js` 同时纳入 `Dockerfile.proxy`、`publish.sh` 的暂存/指纹、`deploy.sh` 的服务器复制；缺任一文件时发布中止。
- 原因：只改源码而漏掉发布清单会造成“构建日志正常、线上 MODULE_NOT_FOUND”，直接破坏幂等防线。
- 验证：治理质量门新增发布包覆盖检查，`--strict` 当前为 **9 PASS / 0 WARN / 0 FAIL**；未执行真实服务器发布。

### D41：运行时必需代理文件缺失时强制同步（2026-09-21）
- 决定：`deploy.sh` 在比较指纹前检查代理主程序、WebDAV 运行文件、两个幂等模块和 `package.json` 是否都存在；缺任一文件即使指纹相同也强制复制并重建。
- 原因：人工清理或恢复可能造成“指纹文件在、运行文件缺”的漂移，单看指纹不足以证明容器构建上下文完整。
- 验证：部署脚本静态覆盖检查和治理 `--strict` 质量门通过；未执行真实服务器恢复演练。

### D42：发布模式同时校验验收项与闸门状态（2026-09-21）
- 决定：`verify.mjs --release` 除了要求 G4/G5/G6 为 `passed`，还要求 S3–S6 的状态为 `pass` 或 `verified`；只改闸门字段而保留 `unverified` 不得放行。
- 原因：机器状态文件必须防止“闸门先改绿、证据后补齐”的口径倒置。
- 验证：当前 `--release` 同时列出未通过的 G4/G5/G6 与 S3/S4/S5/S6，并以 1 退出；本地严格模式仍为 9 PASS / 0 WARN / 0 FAIL。

---

## D27：文本上游替换 —— 扫描 cockpit 全部渠道，只有 DeepSeek 官方可用（2026-09-21 03:05）

### 27.1 背景

老大要求「文本也走 apic，不要用 OmniRoute」。但 D26 已查明 mcgrox 的文本模型被上游下线，
apic 当时没有任何文本供给。因此需要从老大 cockpit 里的其他渠道找替代上游。

### 27.2 扫描结果：27 个渠道里只有 1 个真能用

对已归档的模型渠道清单全部 27 条渠道逐个探测 `/v1/models`（带浏览器 UA，
否则会被 Cloudflare 拦成 403），筛出**声称**有文本模型的 12 条，再逐个做**真实调用**验证：

| 渠道 | 声称模型数 | 真实调用结果 |
|---|---|---|
| api.krill-ai.com | 30 | **403** 拒绝 |
| APIKEY.FUN (tokenrhythm.studio) | 16 | **402 余额不足** |
| new.sharedchat.cc | 11 | chat 200 但**内容为空**；responses 403「请使用最新版 codex」 |
| api.lsb0713.online | 8 | **503** 上游故障 |
| api.cauai.fun | 8 | （与 lsb0713 同一模型列表，疑同一上游） |
| api.oynhq.sbs | 5 | **403 余额和订阅额度均不足** |
| zzzzz.dpdns.org | 5 | 返回非 JSON |
| api.freemodel.dev | 3 | chat 404 / responses 401 余额不足 |
| **api.deepseek.com** | **2** | **✅ chat 200 + responses 200，均返回真实内容** |
| ooc.pw / bizdecipher.com | 1 / 1 | 未通过 |
| mcgrox.top（裸域那条） | 1 | 仅 deepseek-v4.1-flash |

**结论：只有 DeepSeek 官方 API 真正可用。** 其余免费/公益中转站基本已因余额耗尽或被封而失效——
这从侧面印证了 D26 的判断：**不能把业务建立在免费中转站上**。

### 27.3 已接入 apic

渠道 `id=3`，名称 `deepseek-official`，type=1，`base_url=https://api.deepseek.com`，
模型 `deepseek-v4-pro` / `deepseek-flash`。

**验证（真实调用）**：

| 端点 | 结果 |
|---|---|
| `/v1/chat/completions` | 200，返回 `OK` |
| **`/v1/responses`** | **200，返回真实内容** |
| 计费日志 | `record consume log: channel_id=3` 正常记录 |

**注意**：新建渠道后约 1 分钟才完成同步，同步期间调用一律 503
（`No available channel for model ...`）——**别急着判定失败**。

### 27.4 重要推论：画布文本可零改动接入

**DeepSeek 渠道支持 `/v1/responses` 端点**（mcgrox 渠道不支持，见 D26 的 503）。

而画布的原生文本模板（`model-plugin.ts` L331）正是走 `` `${baseUrl}/v1/responses` ``。
**因此画布接 apic 文本不需要写插件脚本，只需在现有 apic 模板里加 2 个 `capability: "text"` 的模型。**

这比原先设想的方案（自带 chat/completions 脚本）更干净。

### 27.5 待批准

在 `channel-templates.ts` 的 apic 模板中追加：

```ts
{ name: "deepseek-v4-pro", capability: "text" },
{ name: "deepseek-flash", capability: "text" },
```

属改动权威源码树，需 **G3 批准**。截至本条记录：**未改动**。

### 27.6 成本提示

DeepSeek 官方是**按量付费**，不是免费额度。当前价格为占位值
（`ModelRatio=0.14` / `CompletionRatio=4`，约合 $0.28/1M 输入），
**必须由老大按 DeepSeek 实际报价核对后重设**，否则对外售卖会亏。

---

## D28：文本模型落地 + 发现一个未上线的并行提交（2026-09-21 13:10）

### 28.1 已完成的落地（老大批准方案 A）

提交 `1071a51 feat(web): apic 渠道模板增加 DeepSeek 文本模型`，
在 apic 模板中追加 2 个文本模型（`deepseek-v4-pro` / `deepseek-flash`，capability: text），
共 +4 行、改 1 行 hint。`tsc --noEmit` 退出 0。

**关键设计**：因为 DeepSeek 渠道支持 `/v1/responses`（见 D27），
与画布文本模板（`model-plugin.ts` L331）走同一端点，**无需插件脚本**。

### 28.2 ⚠️ 发布前发现：`910181f` 是一个从未上线的并行提交

`git log` 显示 HEAD 的父提交是 `910181f fix(canvas): 视频生成链路幂等与状态恢复（切片 001）`，
**不是** 上次发布的 `839b5c8`。

| 项 | 事实 |
|---|---|
| 提交时间 | 2026-09-21 **13:06:36**（老大说「批准」是 13:04:28 —— **批准时该提交尚不存在**） |
| 作者 | `codex`（另一个会话/进程，非本会话产出） |
| 改动规模 | 8 个新文件 + 改 7 个文件（agnes-video-proxy 幂等改造、canvas-node.tsx、i18n） |
| **改了发布脚本** | `scripts/deploy/publish.sh`、`scripts/deploy/deploy.sh`、`deploy/Dockerfile.proxy` |
| 线上状态 | **从未上线**。线上仍是 `839b5c8`；服务器 /opt/agnes-video-proxy/ 目录下只有代理主程序与云端同步模块两个 js，**缺** 该提交新增的 idempotency-store.js 与 request-fingerprint.js |
| 测试 | 自带 `npm run verify`（typecheck + format + 8 个契约测试 + build）；**实测 18 个测试全部通过** |

**该提交对发布脚本的改动是「必要配套」而非可选**：
它新增了 2 个代理运行时文件，所以 `publish.sh` 的打包列表与指纹计算必须同步纳入，
`deploy.sh` 还新增了硬检查「包里缺 `idempotency-store.js` 就直接中止发布」。

### 28.3 因此产生的决策点

发布 HEAD 会**必然连带 `910181f`**（cherry-pick 只发本会话改动会造成分支分叉，后续发布会混乱）。

三条路：

1. **一起发**（推荐）：`910181f` 测试全过，且其发布脚本改动与新增代理文件是配套的，
   分开发反而要维护分叉。风险是它改了 `canvas-node.tsx`（画布核心组件）且标注「切片 001」，
   暗示后续还有切片，**未经真实环境验证**。
2. **只发本会话改动**（cherry-pick 到 `839b5c8`）：可行，但制造分叉。
3. **先不发**：等 `910181f` 的后续切片完成后再一起发。

**截至本条记录：未执行发布，等待老大确认走哪条路。**

### 28.4 决策：一起发（2026-09-21 13:14 执行，已上线）

老大直接指示「不应该直接找我授权，应该让我先去测试一次，然后你去看结果」+「为啥不直接上线啊，我不希望在本地去测试」。
即：**不在本地再做一轮浏览器验证，直接发布，由老大在线上点一次真实生成，我负责核对结果。**

选方案 1（`910181f` 一起发）。发布前补齐两项前置：

| 前置 | 结果 |
|---|---|
| 源码树 `npm run verify` | 通过：类型检查 + 切片格式 + **18/18 契约与代理集成测试** + 生产构建 |
| 治理仓 `node scripts/verify.mjs --strict` | **9 PASS / 0 WARN / 0 FAIL** |

发布时额外修掉一个会误伤线上的脚本缺陷（提交 `ce730f5`）：
未显式传 `CANVAS_SITE_PASSWORD` 时，原脚本会把 `WEBDAV_PASSWORD` 写成**空值**，
把已配好的云同步悄悄改坏，而日志只显示成功。现在改为沿用服务器现值。

**发布结果**：`canvas-20260921-131453-ce730f5`，commit `ce730f5`，代理代码指纹 `4d906c4769c3`。

上线后核对（服务器实测，非本地）：

| 核对项 | 结果 |
|---|---|
| `current` 软链 | `releases/canvas-20260921-131453-ce730f5` |
| 线上 `/BUILD_INFO.txt`（带 cookie 回环请求） | `release=canvas-20260921-131453-ce730f5`，与包内一致 |
| 版本自愈校验 | deploy.sh 输出「版本校验通过」，未触发 web 容器重建 |
| 代理运行时文件 | 服务器目录与容器 `/app` 内均出现 `idempotency-store.js`、`request-fingerprint.js`（发布前缺失，deploy.sh 按新硬检查强制同步） |
| 代理容器 | `canvas-agnes-proxy` 已重建，`Up`，`RestartCount=0`，日志显示「Agnes OpenAI 兼容视频代理已启动」+「云端同步已启动」 |
| 代理指纹戳 | `PROXY_FINGERPRINT` = `4d906c4769c3...`，与包内一致 |
| nginx | `nginx -t` 通过，`reload` 成功；回环 `index=200`，`/api/health=200` |
| 站点门禁 | 公网 `/` = 302 → `/login.html` = 200，门禁仍生效 |
| 紫域 Key | 从服务器 `api.env` 读取后回写，长度 48；**未打印、未入库** |
| 云同步密码 | 未被改动（本次修复的直接受益点） |

**回滚目标**：`releases/canvas-20260921-002224-839b5c8`（上一版）。
注意 api 源码是直接覆盖不是软链，回滚 api 需重新发布旧 commit 并 `up -d --force-recreate api`。

**仍未取得证据的项（不许当成通过）**：S3 真实上游单次提交、S5 结果落盘与刷新、S6 失败与扣费对账 —— 需要老大在线上点一次生成后，由服务端日志与媒体记录核对。
---

## D43 · 三站聚合：一个入口 + 一套账号 + 一套额度，数据各留各家（2026-09-21）

### 结论

老大 2026-09-21 明确拍板方向：**`hb.cauai.fun`（无限画布）、`sd2.cauai.fun`（念念 AI 视频工作台）、`apic.cauai.fun`（New API 网关）三个产品聚合成一个权威产品矩阵，形态是「一个入口 + 一套账号 + 一套额度，三个产品各留各的数据」。**

规格已落盘：`docs/SLICE-002-PROBLEM-BRIEF.md` → `docs/SLICE-002-SPEC.md` → `docs/SLICE-002-PLAN.md`。**尚未进入实现，权威源码树未改动。**

### 授权依据（不是我新开的野心，是既有路线挂账的一步）

`implementation/NEW-API-APIC-READINESS-20260918.md` §4 P4 原文：

> 先让画布作为 New API 客户端使用，不合并两个账本。**统一账号和统一余额另立规格**，经过并发扣费与退款测试后再决定。

本决策就是那句「另立规格」的产物。P4 同时给出了统一余额的前置条件：**并发扣费与退款测试**，本决策沿用该条件，不放松。

### 与 D22 的关系：不冲突，不推翻

D22 禁的是**合并数据库、额度账本、媒体库**。老大要的是**统一身份层**，并把业务数据留在各家。两者不矛盾，因此：

- **D22 继续有效，原文不改。**
- 本决策只新增「统一身份层 + 统一额度视图」这一层，不授权合并任何业务数据表。
- `AGENTS.md` §5 的四个不可再生数据卷继续各自独立，本切片**不迁移、不清空、不重置**其中任何一个。

### 本轮只读核实的关键事实（2026-09-21，全部有证据）

三站同机、同 Caddy、同 Cloudflare 账号，因此这是**集成**而不是**搬迁**。

| 事实 | 证据 |
|---|---|
| 统一入口域名是全新的 | `auth.cauai.fun` / `login.cauai.fun` / `one.cauai.fun` 均 NXDOMAIN |
| 顶级域名已被占用，不碰 | `cauai.fun` 与 `www` 解析到 Vercel，承载个人作品集站点 |
| 三套密码哈希互不兼容 | hb 用 bcryptjs（`canvas-api/auth.js` L8/L19）；sd2 用 scrypt + 独立 `password_salt` 列（`lib/auth.ts` L1/L711）；apic 用 Go 自有实现 |
| **New API 是 OIDC 客户端，不是身份提供方** | 官方仓库 `setting/system_setting/oidc.go` 的 `OIDCSettings` 只有 ClientId / ClientSecret / WellKnown / AuthorizationEndpoint / TokenEndpoint / UserInfoEndpoint；`oauth/` 包全是被它消费的 provider；全树检索 `.well-known` / `jwks` / `introspect` / `userinfo` 零命中 |
| New API 自身身份能力完整 | `router/api-router.go` 实测有 `/api/user/login`、`/register`、`/login/2fa`、`/login/passkey/*`、`/auth/logout`、`/oauth/:provider`、`/user/token`；`model/user.go` 的 `User` 含 `OidcId` / `WeChatId` / `TelegramId` / `GitHubId` / `DiscordId` / `LinuxDOId` |
| New API 自带额度与计价 | `model/user.go` 的 `Quota` / `UsedQuota` / `RequestCount`；`common/constants.go` 的 `QuotaPerUnit = 500 * 1000.0`；`controller/redemption.go` 兑换码 |
| 三个 cookie 是三个不同的东西 | hb 门禁 = `canvas_auth`（`deploy/nginx-docker.conf` L12/L14）；hb 应用会话 = `SESSION_COOKIE`；sd2 会话 = `niannian_session`（`lib/auth.ts` L1074） |

**由此产生的硬约束**：统一账号**不可能**通过拷贝密码哈希实现；「让 New API 当 SSO 服务端」这个方案**不成立**。技术形态必须在 §4.2 的三个候选里显式选一个。

### 红线（本决策不放松任何一条）

1. `AUTH_COOKIE` 与 `CANVAS_LEGACY_TOKEN` **必须保持不变**；统一账号只能**新增并行校验路径**，不能替换现有门禁（`AGENTS.md` §2）。
2. 四个不可再生数据卷不迁移、不清空、不重置（`AGENTS.md` §5）。
3. 真实密钥、令牌、站点密码绝不进本仓任何文件，也不贴进聊天（`AGENTS.md` §3）。
4. 统一额度必须先过**并发扣费与退款测试**（沿用 P4 原文条件，不放松）。
5. 统一身份服务不可用时，三个产品必须**仍各自可用**——不能因为身份服务宕机导致全员停摆。

### 待裁决（需要 owner 明确回答，不由 AI 推定）

| 编号 | 问题 | 影响 |
|---|---|---|
| Q43-1 | 统一账号走哪个方案？A 引入独立 OIDC 提供方 / B 以 New API 为账号权威 + 桥接 / C 仅按邮箱关联（弱） | 决定要不要新增一个常驻身份服务 |
| Q43-2 | 是否做统一额度？若做，是否确认以 New API 的 `quota` 为唯一权威？ | 决定 S7–S11 是否适用；若不做，本切片降级为「统一入口 + 统一账号 + 额度可见但独立」 |
| Q43-3 | 邮箱重复 / 账号冲突的合并规则？（推荐：保留最早账号为权威，其余进人工队列，不自动静默合并） | 决定迁移脚本能不能写成确定性的 |
| Q43-4 | `apic.cauai.fun` 的公开注册开关是否关闭？它成为账号权威后，这个开关就是三站共同的注册开关 | 决定陌生人能不能自助进入整个矩阵 |
| Q43-5 | 是否批准 G3 进入实现阶段？可分批：T1 统一入口（L2）先做，T2/T3 单独批准 | 决定能不能动权威源码树 |

### 风险与流程

本切片按 `docs/CHANGE-RISK.md` 判定为 **L3**（改鉴权 + 改资金路径 + 改部署路由）。按 `docs/LIFECYCLE.md`，L3 需要：Problem Brief + 可测验收标准 + C 编号约束清单 + 失败测试先行 + 单测 + 契约测试 + 错误路径 + 安全过 C1 + 文档同步 + **2 名 reviewer** + 回滚方案 + 零写入干跑 + **G3 书面批准** + 发布后冒烟 + `verify.mjs` 全绿。

三项子任务风险不同，可分批：统一入口 = L2（风险最低，可先做）；统一账号 = L3；统一额度 = L3 且额外需要并发与退款测试。

### 当前状态

**2026-09-21 更新（T1 落地记录）**：owner 以「开工」批准后，**T1 统一入口已上线**（L2）。

- 承载域名 `one.cauai.fun`；交付件 `implementation/entry/`；部署与回滚手册 `implementation/entry/README.md`。
- 形态：静态入口页 + nginx 容器（仅 `127.0.0.1:18090`）+ 独立隧道 `cauai-entry`。**刻意不接 `deeptutor-public-caddy`**，因为该 Caddyfile 是只读挂载且承载三站路由；这是本轮风险最低路径。
- 已验收：公网 200 / `/healthz` 200 / 容器 healthy / 隧道 active；真实浏览器确认三卡片、移动端单列、控制台零报错；三站复测 `hb` 302 / `sd2` 307 / `apic` 200，与上线前一致。
- 回滚已实测：停隧道 + `compose down` → 入口 530、本地端口拒绝连接、三站全部正常；两条命令复原。
- **未越界**：`hb` / `sd2` / `apic` 的配置、容器、`.env`、DNS 全部零改动；权威源码树零改动；`AGENTS.md` §5 的四个不可再生数据卷未碰。

**T2（统一账号）与 T3（统一额度）仍未批准，仍只有规格。** Q43-1 ~ Q43-4 四项待裁决继续有效（见上表），本决策不构成它们的批准。

截至本条记录：**T1 已上线；T2/T3 未进入实现。** G3-d（owner 明确书面批准）不可由 AI 代为推定。

---

## D29：文本模型改动已上线（由并行会话发布带出）——发布协作教训（2026-09-21 16:10）

### 29.1 事件经过

老大批准「一起发」后，本会话执行 `publish.sh`，**发布失败**：

```
==> 打包 canvas-20260921-143835-ce730f5
==> 上传并部署到 haika-kidswear-1757:/opt/infinite-canvas
ssh: Could not resolve hostname haika-kidswear-1757: Name or service not known
[sandbox] 命令被沙箱拦截：C:/Users/lsb/.ssh/config (读 · 拒绝)
```

**根因**：后台任务未获得沙箱放行，`ssh` 读不到 `~/.ssh/config`，
因此解析不出 `haika-1757` 这个 Host 别名。**构建与打包均已成功，卡在上传前一步。**

### 29.2 但线上其实已经有了

排查线上时发现：**线上已经是 `canvas-20260921-131453-ce730f5`**（构建于 13:15），
且 `/opt/agnes-video-proxy/` 下**已经存在** `idempotency-store.js` 与 `request-fingerprint.js`。

**即并行会话（codex）在 13:15 已自行完成过一次发布**，而 `ce730f5` 在提交链上位于
`1071a51`（本会话的文本模型改动）**之后**——所以**本会话的改动已随之上线**。

**线上产物实测**（`/opt/infinite-canvas/current/dist/assets/index-*.js`）：

| 关键词 | 命中 |
|---|---|
| `deepseek-v4-pro` | ✓ |
| `deepseek-flash` | ✓ |
| `apic.cauai.fun` | ✓ |
| `gpt-image-2.5` | ✓ |
| `CAUAI` | ✓ |

**线上 UI 实测**（CDP 注入 cookie 访问 hb.cauai.fun → 配置 → 渠道）：
「从模板添加」下拉中**第 5 项为 `CAUAI API`**（前四：OpenLux / OmniRoute / Midjourney / 紫域）。

**结论：本次发布不需要重试，目标状态已达成。**

### 29.3 教训：同一分支上存在活跃的并行发布者

本次连续踩到三次同一类问题：

1. 准备发布时发现 `910181f`（13:06 提交，晚于老大 13:04 的批准）
2. 再次准备时 HEAD 已变成 `ce730f5`
3. 本会话发布失败后，发现线上已被并行会话更新到 `ce730f5`

**因此，本仓库的发布流程必须增加两条前置动作**：

1. **发布前先比 `git rev-list --count <线上commit>..HEAD`**，
   确认待发提交清单与预期一致——不能默认"只有自己的改动"。
2. **发布前确认线上 `BUILD_INFO.txt` 的 commit 与本地 HEAD 的关系**：
   若线上 commit 已经是 HEAD 或其祖先，则可能已有人发过，**先别重复发**。

**另注**：`publish.sh` 的 `TMP_DIR=".deploy-tmp"` 位于仓库内，且**未被 `.gitignore` 忽略**。
本次失败后该目录未残留（脚本自行清理），但若中途异常退出可能残留大量构建产物并污染 `git status`。
建议后续把 `.deploy-tmp` 加入忽略列表。

### 29.4 遗留

- 沙箱限制导致**本会话无法独立完成发布**（需要沙箱放行才能读 `~/.ssh/config`）。
  后续若需本会话发布，应在获得提权批准后执行，或改用直连 HostName 的方式。
- 画布内点选模板后的「5 个模型」计数未做 UI 级验证（产物级已验证模型名存在）。
- 「并行会话是谁开的」已由老大于 2026-09-22 确认：是他自己开的。发布窗口规矩见 **D44**。

---

## D44：并行发布会话是老大本人开的 —— 发布窗口规矩（2026-09-22）

### 44.1 已关闭的问题

老大确认：2026-09-21 那个并行 codex 会话是**他自己开的**，不是未知第三方。
D29.3 里「谁在动仓库」这一问到此关闭。线上被盖到 `ce730f5` 的原因是两个自己的会话同时在发，不是外部入侵。

### 44.2 规矩（从现在起执行）

**同一时刻只允许一个会话执行 `publish.sh`。**

调用发布脚本之前，必须做完下面三步，缺一步就不发：

1. **先问老大**：现在有没有别的会话正在发、或准备发。得到「没有，你发」才继续。批准过一次不等于这次也批。
2. **读线上 `BUILD_INFO.txt` 的 commit，跟本地 HEAD 比**：
   - 线上 commit **等于** 本地 HEAD → 这份已经在线上，**不发**。
   - 线上 commit **不是** 本地 HEAD 的祖先（两边分叉）→ **停**。把两个 commit 列给老大，不自行选边。
   - 线上 commit **是** 本地 HEAD 的祖先 → 先跑 `git log --oneline <线上commit>..HEAD`，把这份清单给老大看。确认「就是这些」之后再发。不能默认清单里只有自己的改动。
3. **发完立刻报新的线上 commit**（来自新的 `BUILD_INFO.txt`，不报自己以为发出去的那个）。别的会话以这个为准。

**做完得到什么**：每次发布前，待发提交清单和「现在谁在发」都有一句明确答复，后发不会在不知情时盖掉先发。

**不做的差异**：两个会话可以同时打包、同时上传。后完成的那次覆盖先完成的那次，两边都会以为自己发成功了。2026-09-21 已经发生过一次。

### 44.3 本条故意不做的

- **不改 `publish.sh` 加文件锁。** 锁解决不了「两个会话都以为该自己发」；改源码树还要另过 G3。人确认比锁优先。
- **`.deploy-tmp` 进 `.gitignore`** 仍是 D29 的建议，本条不代批。

## D45：三站融合裁决（2026-09-26）

owner 要求“尽快三合一，并由助手决定”。本条作出 T2/T3 的架构裁决：

- **统一账号：选择 B**。以 New API 作为账号权威，通过桥接层让 hb、sd2、apic 使用统一身份映射。New API 继续作为客户端/账号数据中心，不把它误当作 OIDC 提供方；真正的会话签发与撤销由桥接层负责。
- **统一额度：执行**。New API `quota` 是唯一余额权威；hb 与 sd2 的本地余额只能作为只读镜像或预授权状态，任何扣费、退款、失败结算都必须经过唯一账本路径。
- **重复邮箱：最早账号保留为主**，其他账号进入人工合并队列，禁止静默自动合并。
- **公开注册：统一账号上线后关闭 `apic.cauai.fun` 公开注册**，注册入口只保留在统一入口并受控开放。
- **G3 批准：批准 T2/T3 进入实现，但必须按 T2-a → T2-b → T2-c… 与 T3-a → T3-b… 的独立验收顺序推进；不得跳过干跑、会话撤销、并发扣费和退款测试。**

选择理由：这条路径复用现有 New API 账号和额度，避免新增常驻 OIDC 服务，实施面最小、上线最快；代价是桥接层必须明确会话与失败回滚边界，不能把“同邮箱”冒充成单点登录。


---

## D46: APIC mcgrox and pro20x live configuration (2026-09-26)

- mcgrox is routed through `https://www.mcgrox.top` in the APIC New API instance.
- Live groups are `pro`, `grok`, `plus`, `kimi`, and `kun`; the active model set contains 19 unique models.
- Quota ratios are input `2.5`, output `4`, and image `1`; existing DeepSeek official ratios were preserved.
- The `pro20x` primary channel is live as channel `id=4`, remark `pro20x`, status `1`, weight `1`. Same-credential rows `id=5` and `id=6` remain at weight `0`.
- Public registration remains enabled by owner instruction.
- Verification evidence and limitations are recorded in `docs/STATUS_20260926_APIC_MCGROX_PRO20X.md`; `grok-4.5` and `grok-4.6` currently return upstream 429.

## D47：APIC 旧站支付、真实分组与渠道检测复核（2026-09-26）

### 结论

本次只读复核发现：D46 所称的 `pro/grok/plus/kimi/kun` 是频道名称分类，不是 New API 的用户权限分组。线上 `channels.group`、`abilities.group`、现有用户组和 Token 组仍以 `default` 为主。McGrox 模型与倍率已经生效，但渠道自动检测没有找到已运行证据；旧站链动小铺是外部买卡密后回站手动兑换，不是已接入 APIC 的自动支付。

### 已验证事实

- `api.cauai.fun` 公开配置：`payment_enabled=false`、`purchase_subscription_enabled=false`；购买页外链为链动小铺，前端流程为购买卡密后回站 `/api/v1/redeem` 兑换。
- `apic.cauai.fun` 当前 New API 版本为 `v1.0.0-rc.38`；`subscription_plans`、`subscription_orders`、`top_ups`、`user_subscriptions`、`redemptions` 均为 0。
- McGrox 相关渠道仍在线，文本输入/输出倍率为 `2.5/4`，图像倍率为 `1`；这些是计量倍率，不是已核定的真实成本或最终售价。
- 所有渠道 `test_time=0`、`response_time=0`，`system_tasks` 只有 `model_update`，没有回读到渠道自动检测任务。
- `grok-4.5` 与 `grok-4.6` 的真实调用在本次复核中失败；`grok-4.7` 与 `grok-composer-2.5-fast` 成功。

### 需要 owner 决定

1. 是否保留 `default` 兼容组并新增套餐权限组（推荐），还是直接把现有用户迁到新组。
2. 是否开启定时渠道检测；推荐先“检测并记录、不自动禁用”，10 分钟、并发 2，观察后再开熔断。
3. 链动小铺走“外部买卡密 + APIC 手动兑换”（推荐，立即可落地），还是提供 LDXP 回调/签名协议后做自动到账。

### 证据

完整审计见 `docs/STATUS_20260926_APIC_OLD_SITE_LDXP_AUDIT.md`。本条不改变线上配置。

## D48：McGrox 真实采购成本与对外售价草案（2026-09-27）

owner 已明确授权：“按 mcgrox 真实成本核算一版对外售价，但先不要修改线上价格。”本条只记录核算口径和治理边界，不构成线上价格变更授权。

### 已验证事实

- McGrox 公开购买页/链动小铺商品接口显示 10/20/50/100 余额分别售价 ¥10/¥20/¥50/¥100；本轮把它记录为 ¥1/余额单位的可核验采购成本。
- 公开页展示的分组倍率为 `pro=0.325`、`plus=0.1625`、`grok=0.065`、`kimi=0.195`、`kun=0.065`。
- APIC 当前线上计量倍率仍是文本输入 `2.5`、文本输出 `4`、图像 `1`；本轮没有修改。
- `pro/grok/plus/kimi/kun` 仍是渠道/模型分类，不是 New API 用户权限组；公开注册仍按 owner 之前指令保持开启。

### 核算结论

按 New API `QuotaPerUnit=500000` 的计量口径、输出倍率 4 和 1.5 倍成本覆盖系数，核算草案见 [`docs/PRICING_20260927_MCGROX_DRAFT.md`](PRICING_20260927_MCGROX_DRAFT.md)。试算结果：

| 分组 | 输入成本 / 1M | 输出成本 / 1M | 1.5 倍建议输入价 / 1M | 1.5 倍建议输出价 / 1M |
|---|---:|---:|---:|---:|
| `pro` | ¥0.65 | ¥2.60 | ¥0.975 | ¥3.90 |
| `plus` | ¥0.325 | ¥1.30 | ¥0.4875 | ¥1.95 |
| `grok` | ¥0.13 | ¥0.52 | ¥0.195 | ¥0.78 |
| `kimi` | ¥0.39 | ¥1.56 | ¥0.585 | ¥2.34 |
| `kun` | ¥0.13 | ¥0.52 | ¥0.195 | ¥0.78 |

### 边界与待核验

- 图像模型单次余额消耗、长上下文附加计费、失败/重试扣费、APIC 最小计费单位、舍入和退款规则仍待核验。
- 1.5 倍只是试算覆盖系数，不是最终利润率；owner 还需决定是否采用 1.5x、2.0x 或分组差异化价格。
- 本条及核算草案均不代表线上价格、套餐、充值、兑换或用户余额已经修改。

### 状态

- **本地已写但未发布**：核算草案与治理记录。
- **线上无变化**：没有调用 APIC 写接口，没有修改线上数据库或配置。
- **未验证**：图像真实成本和完整结算链路。

## D49：APIC 链动小铺支付与 McGrox 订阅接入核查（2026-09-27，已纠错）
### Conclusion

[已失效] 早期把 `api.liandianpu.cn` 的“联点/联店铺易支付”API 误认成 LDXP 正式支付 API；没有证据证明两者属于同一服务。其 PID、MD5 签名和回调协议不能用于 LDXP。
### Verified
- Shop `B59CCLX7` is readable; 9 of its 28 products are the API day/week subscription products.
- The 9 products match the McGrox historical tiers: day cards 10/20/45/60/90 dollars and week cards 45/90/135/180 dollars per day.
- The public shop currently exposes WeChat QR payment.
- [已失效] 曾把上述易支付站点的 `/openapi/pay/*` 文档误记为 LDXP 官方资料。
- APIC New API `v1.0.0-rc.38` has `/api/subscription/epay/pay`, `/api/subscription/epay/notify`, and `/api/subscription/epay/return`, but online EPay configuration and subscription/payment records are still empty.
- `/opt/new-api/.env` has no Liandianpu merchant credentials; this round did not modify the database, payment config, plans, prices, containers, or public registration.
### Owner decisions required

1. [已失效] 不要向 `api.liandianpu.cn` 提供 LDXP 账号或密钥；先从 `www.ldxp.cn` 官方后台/客服核实服务端支付接口。
2. Reply `APPROVE DEPLOYMENT` to authorize creation of the payment bridge, payment configuration, and one test order.
3. Keep subscriptions only, no balance top-ups; use the McGrox daily-reset day/week mechanism and set the corresponding quota price at `?1 = $1`.
### Boundary

本轮没有验证 LDXP 官方支付 API；所查文档来自未证实相关的易支付网站。APIC 数据、支付配置、套餐、价格、容器与注册设置均未变。详见 `docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`。


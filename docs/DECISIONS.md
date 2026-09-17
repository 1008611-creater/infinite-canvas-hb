# 决策记录 · 无限画布

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

### 10.8 紫域 Key 的处置 —— ⚠️ 已暴露，必须轮换

**用户在聊天里明文提供了紫域 API Key。**

- 本轮用它做了**只读验证**（`GET /me`、`GET /models`、`GET /jobs`），**未写入本仓任何文件**。
- 落代码时**只写入服务器** `/opt/infinite-canvas/api/api.env` 的 `ZIYU_API_KEY`。
- **★ 接入完成后必须提醒用户去紫域后台轮换此 Key。** 聊天记录不是安全信道。
### 10.9 本轮未关闭的阻塞项

| 编号 | 阻塞项 | 状态 |
|---|---|---|
| **B-1** | **L2 画布交互真实浏览器验证** | 🟢 **大幅降级（2026-09-14 第 106 轮）**：真实浏览器已验证 **连线（创建/方向/去重/反向/撤销）、缩放、新建拖动节点、秒数钳位、官方插件列表、按 URL 装第三方插件**。**残留仅一项**：**节点链真实执行**（真跑会真出片/真花钱，需用户单独授权）。复核见 `docs/STATUS_20260913_L2_EVIDENCE.md` 第九、十节 |
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

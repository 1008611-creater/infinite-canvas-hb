# 路线图 · 无限画布

## 2026-09-27 · HB 任务结果回填修复发布

- **[已在线上生效]** 权威源码 `ca2395f` 已部署到 `hb.cauai.fun`，线上 `BUILD_INFO.txt` 为 `canvas-20260928-025558-ca2395f`。
- **[已验证]** 发布构建、API 镜像重建、nginx 检查、本机回环检查通过；公网首页 `302`、健康检查 `200`、匿名任务/模型 API `401`、旧 `/ziyu/` 入口 `403`。
- **[未验证]** 登录后任务中心回填历史结果以及真实生成、落盘、扣费、退款、双账号隔离。该发布不关闭垂直切片 001 的其他未通过验收项。
- **证据**：[`docs/STATUS_20260927_HB_AUDIT.md`](STATUS_20260927_HB_AUDIT.md)；当前源码分支 `codex/unified-workbench-auth`，提交 `ca2395f`。

## 2026-09-21 · 架构重置后的垂直切片 001
G3 已获 owner 批准。第一处最小实现已落地到权威源码：上游资源解析从一跳查找改为可去重、可终止的递归链路，覆盖 `image → config → video`；本地浏览器已验证节点布局、参考连接和刷新恢复。真实浏览器提交、结果持久化和发布仍未通过 G4/G5/G6，不得标记为上线完成。详见 `docs/SLICE-001-PLAN.md`、`docs/STATUS_20260921_SLICE001_BROWSER.md` 与 `docs/DECISIONS.md` 最新记录。

## 2026-09-21 · 垂直切片 002：三站聚合（2026-09-21 当日快照）

老大定下方向：`hb.cauai.fun`、`sd2.cauai.fun`、`apic.cauai.fun` 聚合成一个产品矩阵，形态是「一个入口 + 一套账号 + 一套额度，三个产品各留各的数据」。

- 规格三件套：`docs/SLICE-002-PROBLEM-BRIEF.md` → `docs/SLICE-002-SPEC.md` → `docs/SLICE-002-PLAN.md`。
- 决策与待裁决：`docs/DECISIONS.md` **D43**（含 Q43-1 ~ Q43-5）。
- 授权依据：`implementation/NEW-API-APIC-READINESS-20260918.md` §4 P4「统一账号和统一余额另立规格」。

**截至 2026-09-21 当日：规格已就位；T1 统一入口已上线并通过公网与真实浏览器验收，T2/T3 未进入实现；权威源码树零改动。** 当时的分批审批口径为：统一入口 = L2；统一账号 = L3；统一额度 = L3 且额外需要并发扣费与退款测试。后续状态以 D45 及本路线图较新的记录为准。

### T1 统一入口 —— 已上线（2026-09-21，L2）

承载域名 **`one.cauai.fun`**，交付件在 `implementation/entry/`，部署手册与回滚方案见 `implementation/entry/README.md`。

- **做法**：自包含静态页（只列三个产品 + 跳转），nginx 容器只绑 `127.0.0.1:18090`，另起独立隧道 `cauai-entry` 直达该端口。**刻意不接 `deeptutor-public-caddy`**（其 Caddyfile 为只读挂载，且承载三站路由），因此 `hb` / `sd2` / `apic` 的配置、容器、`.env`、DNS **全部零改动**。
- **已验收**：`one.cauai.fun` 公网 200、`/healthz` 200、容器 healthy、隧道 active；真实浏览器确认三张卡片与目标链接正确、移动端单列、控制台零报错（脚本 `scratch/entry-verify.mjs`，截图 `output/entry-verify/`）。三站复测 `hb` 302 / `sd2` 307 / `apic` 200，与上线前一致。
- **回滚已实测**（非纸面方案）：停隧道 + `docker compose down` 后，本地端口拒绝连接，公网入口 530，**三站 200/307/200 全部正常**；两条命令即可复原。证据见 `implementation/entry/README.md` §6。
- **当日边界**：T1 只解决「一个入口」。截至 2026-09-21，T2/T3 尚未批准；本段保留为历史快照，不代表 D45 之后的当前状态。

原则：**先修真实缺口，再谈增值**。

**路线图已于 2026-09-12 重构**：由用户批准的三批次计划取代旧的"阶段一/二/三"。旧版本把批次 1 标注为「已完成」，那是错误标注，已订正。证据见 `docs/STATUS_20260912.md`。

> ★ **2026-09-13（第 4 轮）更新**：用户对 Q-1 ~ Q-12 全部作答，设计口径锁定（见 `docs/DECISIONS.md` **D10** 与 `docs/STATUS_20260913.md`）。
> 定价方案书：`docs/PRICING_20260913.md`。
> **2026-09-17 批次 1 已落地**（提交 `ff6200a`）。写权限已恢复，`EPERM` 不再成立。批次 2 / 3 仍未落地。
> **L2 订正（2026-09-14 第 106 轮）**：已在真实浏览器验证 **连线（创建/方向/去重/反向/撤销）、缩放、新建拖动节点、秒数钳位、官方插件、按 URL 装第三方插件**；**残留缺口仅一项 = 节点链真实执行**。见 `docs/STATUS_20260913_L2_EVIDENCE.md` 第九、十节。

---

## 现状快照（2026-09-18 线上复核；历史日期仅保留为来源时间）

| 能力 | 状态 | 证据 |
|---|---|---|
| 视频出片 | ✅ 已走通（本地代理 → Agnes） | `inventory/画布验收清单.md`（2026-09-01） |
| 图片生成 | ✅ 已配 OpenLux（`gpt-image-2-c`） | `channel-templates.ts` 实测 |
| 静态资源 / 路由 | ✅ 8/8 路由加载，依赖错误 0 | `inventory/审计报告_..._20260827.md` |
| 画布交互 | 🟡 **部分验证**：拖拽 / 连线（含反向）/ 模式适配 / 秒数钳位有真实浏览器证据；**缩放、节点链执行、插件安装未覆盖** | `.probe/pr12-ui-verify.mjs` + 5 张截图（2026-09-01），复核见 `docs/STATUS_20260913_L2_EVIDENCE.md` |
| LLM 中转 | ⏸ **待定**（D3） | `docs/DECISIONS.md` |
| MCP / Agent | ⏸ **已构建、未启用**（34 个工具） | `canvas-agent/dist/`（2026-08-27） |
| 账号 / 计费 | ✅ **已落地并已发布**（2026-09-18，线上 release `canvas-20260918-112928-79615f4`）；注册邮箱验证码已上线，免费试拍已关闭 | 线上只读核查、SMTP 与端到端注册证据见 `docs/DECISIONS.md` D19；完整收费验收仍有独立未验证项 |
| 网盘挂载 | ⏸ **本阶段不动**（Q-10 已移出批次 2） | `nginx-docker.conf` 现状 `/dav/` 凭 Basic Auth |

### 已知的具体缺口（已订正）

1. **默认渠道指向 `api.openai.com`**，key 为空 → 新环境必然 401。配置问题，**仍未修**；但不影响已配置紫域/Agnes渠道。
2. **`canvas-agent` 已构建**（`dist/` 存在，2026-08-27），但**未启用**。实测 **34** 个工具（旧文档写「六个」、计划写「25」均不对）。
3. **LLM 中转未定**（D3）。图片走 OpenLux，但 OpenLux 是图片分组，不能当通用 LLM 用。
4. **视频通道只有免费的 `agnes-video-2.5-flash`**，限流约 1 次/分钟；免费试拍线上已通过 `FREE_TRIAL_MONTHLY_LIMIT=0` 关闭。
5. ~~**计费能力为零**~~ → **代码已落地并于 2026-09-18 发布**（线上 release `canvas-20260918-112928-79615f4`）。邮箱验证码注册已上线；紫域入口、额度接口和数据库表已在服务器存在，但完整收费验收仍保留真实浏览器出片、真库并发幂等和结果长期落盘等未验证边界。

---

## 批次 1 · 收得到钱（交付件已就绪，待落地执行）

> 历史状态说明：这段是批次 1 落地前的旧口径，现已被 D12 / D15 / D19 覆盖。批次 1 已写入权威源码树并发布；当前线上状态以 D19 和线上复核为准。
> 落地方式：你在自己有写权限的终端跑一次 `node E:/codex/huabu/implementation/scripts/apply-batch1.mjs`，
> 说明见 `implementation/APPLY-RUNBOOK.md`。落地器已在**假源树**8 步全绿、产物逐行核对、幂等复跑已验证；2026-09-13 又对**真实权威树**做了**零写入干跑**（锚点全部命中、权威树字节数跑前跑后一致），但**从未真正写盘过**。证据：`docs/VERIFICATION_20260913_APPLY_DRYRUN.md`。
> **复验入口**：`node E:/codex/huabu/implementation/scripts/dry-run-all.mjs`（三批次一次跑完 + 权威树零变化核对）。

- [ ] 紫域接入：nginx `/ziyu/` 反代 + 服务端注入 `Authorization`（Key 只进服务器环境变量）
- [ ] 渠道模板新增「紫域」一条，`baseUrl` 指向 `/ziyu/`；`apiKey` 填**非密钥占位串** `ziyu-proxy`
      —— ✅ **已定（D10.6 / Q-7）**：原写「留空」**与代码事实冲突**：`video.ts` L84-85 / L193-194 与 `use-config-store.ts` L282-285
      都在 `apiKey` 为空时直接抛 `apiKeyRequired`，空 key 任务根本发不出去。**改为非密钥占位串，真 Key 由 nginx 在 `/ziyu/` 服务端注入。**
- [ ] 用渠道自带 `script` 字段表达"提交 + 轮询"（`model-plugin.ts` 的 `new Function` 沙箱），提交带 `Idempotency-Key`
- [ ] 新增 6 张表：余额、额度流水、兑换记录（哈希）、渠道用量、免费试拍用量、管理员调整
- [ ] 结果 URL 24 小时后清理 → 完成即落盘：**复用现成路由 `POST /api/media/import-url`**（`server.js` L485-519），它内部已调 `registerMedia` 并写 `source_url`（U-03 已关闭）
- [ ] 兑换码：`NN-{点数}-{随机串}-{HMAC 签名}`，只存 SHA256，定长时间安全比较，`ON CONFLICT DO NOTHING` 抢占
- [ ] 扣费：提交前预扣，**以紫域 `cost` 字段对账**（不假设失败必退）
- [ ] 前端：余额显示、兑换入口、模型按用途分组
- [ ] 发码：本地脚本批量生成（默认）+ 管理后台在线生成导出（补货）

**前置**：批次 1 上线前必须补一次真实浏览器冒烟验证（L2）。**已补：连线（创建/方向/去重/反向/撤销）、缩放、新建拖动节点、秒数钳位、官方插件、按 URL 装第三方插件**（2026-09-14 实测，见 `docs/STATUS_20260913_L2_EVIDENCE.md` 第九、十节）；**仍需补的只有一项：节点链真实执行**（真跑会真出片/真花钱，需用户单独授权）。`pr12-ui-verify.mjs` 因本环境无 shell 无法原样重跑，其等价断言已用浏览器直接执行。

**★ 当前双阻塞**：**B-1** L2 残留**仅一项 = 节点链真实执行**（真跑会真出片/真花钱，需用户单独授权；另有插件卸载还原待补）；**B-2** 落代码 —— 交付件（落地器 + 手册）**已就绪**，只差你在本地终端跑一次。
**★ 唯一悬空的经济变量**：**B-4** 紫域每积分实际采购价（充值页对外 404）。
**★ 资金防线订正（2026-09-13 线上实测，B-6）**：`/ziyu/` 的门禁**不能**当资金防线 —— 注册接口不吃门禁（`nginx-docker.conf` L101-107 刻意如此），而**注册成功会下发 `canvas_auth` 门禁 cookie**（`auth.js` `setSessionCookies()` → `setSitePassCookie()`），所以任何知道注册接口的人都能自助拿到门禁 cookie。**真正的、也是唯一的资金防线是额度体系**（`requireAuth` + 余额预扣）。证据见 `docs/STATUS_20260913_LIVE_GATE.md`。

**落地材料**（全部在 `implementation/`，未进权威树）：
接线步骤 `implementation/canvas-api/APPLY.md`（第 0–12 项逐条改法）；
验收 `implementation/deploy/ACCEPTANCE.md`（A-00 ~ A-12，含 A-10A/A-10B 并发幂等）；
回滚 `implementation/deploy/ROLLBACK.md`（R-01）；
决策与待裁决 `docs/DECISIONS.md` **D9**（Q-1 ~ Q-12）。

## 批次 2 · 放得开（交付件已就绪，待落地执行）

> 状态口径与批次 1 一致：**设计完成、落地器就绪、验收与回滚手册已写完**；
> 这是批次 2 的交付件旧状态说明；批次 2 尚未落地，且必须先完成非收费前置核查。
> 落地方式：你在自己有写权限的终端跑一次 `node E:/codex/huabu/implementation/scripts/apply-batch2.mjs`。
> **前置**：必须先跑完批次 1（`apply-batch2.mjs` 有硬校验，缺 `canvas-api/routes-credits.js` 会直接 `exit 2`）。
> 落地器已在**假源树**上跑通、幂等复跑已验证；2026-09-13 又对**真实权威树**做了**零写入干跑**（锚点全部命中），但**从未真正写盘过**。证据：`docs/VERIFICATION_20260913_APPLY_DRYRUN.md`。
> **复验入口**：`node E:/codex/huabu/implementation/scripts/dry-run-all.mjs`（三批次一次跑完 + 权威树零变化核对）。

- [ ] 打开公开注册（确认第一个注册者已是管理员后再放开）
       —— 🔴 **2026-09-13 线上实测：注册已经是【开】的**（`POST /api/auth/register` 合法邮箱 + 短密码 → 400 `password_too_short`，而不是 403 `registration_closed`）。**这一项不需要「打开」，需要的是「先关掉、再按顺序打开」**：先确认你本人是 `admin`、库里没有陌生人账号，再走正常放开流程。**批次 2 的顺序因此要改（订正后为 5 步）**：① 服务器 `.env` 加 `CANVAS_ALLOW_REGISTER=0` → **重建 api 容器**（最高优先）→② 查 `users` 表确认你本人是 `admin`、库里没有陌生人账号 →③ 批次 1 落地，额度体系对所有 `/ziyu/` 调用生效 →④ 收紧 `/api/auth/verify` 的 legacy 分支 →⑤ 最后才放开公开注册 / 撤四处门禁。见 `docs/STATUS_20260913_LIVE_GATE.md`。
- [ ] nginx 撤掉 `/`、`/assets/`、`/config.js`、`/agnes/` 四处 cookie 门禁（`/api/` 本就不吃门禁）
      —— 落地器 **B1~B4**，四处**逐块精确文本匹配删除**，**绝不全局替换**（全局替换会把 `/ziyu/` 那道门一起拆掉）
- [x] ~~`/dav/` 收敛为管理员专用~~ **已移出批次 2**（用户裁定 Q-10「先不做，先抓住主要矛盾」，见 D10.2）。普通用户跨设备同步走画布内云同步
- [x] 免费试拍（Agnes flash）：必须登录；线上 `FREE_TRIAL_MONTHLY_LIMIT=0`，已关闭免费试拍（2026-09-18 线上核查）
      —— 落地器 **B5**：`location = /agnes/v1/videos` + `auth_request` 指向 `/api/credits/free-trial/check`
- [ ] **`/ziyu/` 保留门禁**（D10.3 裁定）：它是唯一能直接烧服务器紫域额度的路径；撤门禁的代价是持旧 cookie 者过渡期仍可烧积分
      —— ⚠️ 但**这道门禁不是资金防线**（B-6）：注册/登录成功会**自动下发** `canvas_auth`，注册接口敞开期间可自助绕过。**真正的锁是额度体系**（`requireAuth` + 余额预扣）
- [ ] 修默认渠道 401 —— 落地器 **B6**：清空 `OPENAI_BASE_URL`（只影响新用户 / 清 localStorage 后的默认值）
- [ ] **补 L2 非收费收尾**：拖拽 ✅ / 连线 ✅（含反向）/ 缩放 ✅ / 秒数钳位 ✅ / 官方插件 ✅ / URL 安装第三方插件 ✅；仍未完成：插件卸载还原。节点链真实执行会触发真实出片与额度消耗，单列为需老大明确授权的收费验收，不在本轮执行。

**★ 顺序风险（不许跳过）**：批次 2 让陌生人第一次能真正打开画布点东西，因此 **A-06 之前必须先补 L2 真机冒烟**；
否则「放得开」放开的可能是一台坏机器。插件卸载还原需真人补做；节点链真实执行另行走收费闸门，不能用“先烧一次额度”代替前置安全核查。

**★ 唯一资金风险点**：撤掉 `/agnes/` 门禁后，`/agnes/v1/videos` 是整站唯一会用真钱调上游的端点。
撤门禁与免费试拍限次**必须同一次发布落地**，不能分两次。

**落地材料**（全部在 `implementation/`，未进权威树）：
落地器 `implementation/scripts/apply-batch2.mjs`（B1~B7）；
nginx 片段 `implementation/deploy/batch2-nginx.conf.snippet`（含 R1~R5 风险 / U1~U4 未验证）；
验收 `implementation/deploy/batch2-acceptance.md`（**B2-1 ~ B2-7**，与落地器 B1~B7 一一对应）；
回滚 `implementation/deploy/batch2-rollback.md`（R-02 展开，含「回滚会把在用用户挡在门外」的方向性风险）。

## 批次 3 · 跑得顺（交付件已就绪，待落地执行）

> 批次 3 仍处于设计/操作手册阶段；其改动不应与当前线上计费状态混淆。
> **性质差异（重要）**：批次 1 改源码 + 发布，批次 2 改 nginx + 前端常量，**批次 3 几乎全是服务器侧 / 本机侧操作**。
> 因此 `apply-batch3.mjs` 的形态也不同：**只做前置校验 + 打印待执行清单**，
> **不代做任何 SSH / docker / netsh / 隧道操作，也不写源码树**（沿批次 2 脚本 L23-25 的「有意不做」写法）。
> **前置**：批次 1 已落地（对账接口由批次 1 提供）；批次 2 的 L2 真机冒烟已补做。
> ✅ **`D-agent-auth` 已于 2026-09-18 裁决（D13）**：不对外、只本机用 + 支持用户自带 agent（BYO）。
> 原「A-19 不许开始」的阻塞**解除**；A-19 的范围同时**改为 BYO 配置入口**（见下）。

- [ ] ~~`canvas-agent` 对外能力走守卫反代 + 具名隧道~~ → **改为：用户自带 agent（BYO）配置入口**
      —— ✅ **D13 已裁决**：平台不对外提供、不托管、不兜底；用户填自己的地址与凭据
      —— BYO 两条硬要求：**凭据只存浏览器本地，不同步服务端**；**前端直连，平台不做代理转发**
      —— 已知副作用：https 页面直连 http 地址会被浏览器混合内容策略拦截，UI 需提示
      —— 34 工具清单**仅作本机能力参考**：`canvas-agent/src/canvas/schemas.ts` 的 `toolNames`；`src/server/mcp.ts` L15 全量注册
- [ ] LLM 中转跨设备：`tools/omniroute-guard`（20129）+ 具名隧道，**不用 Cloudflare Access**
      —— 守卫反代已写完（`server.js` 136 行、零依赖）；`GUARD_TOKEN` 必填，缺则拒绝启动；默认只绑 `127.0.0.1`
- [ ] 同时处置两个风险：20128 加防火墙限本机（**WSL 用户不要加这条规则**）、quick tunnel 保持关闭
- [ ] 天宫漫剧上/中/下三集**跑通流程**（真出片单独授权）
      —— ★ **不许把「节点连起来了」写成「三集已产出」**
- [ ] 事实分层（`source_fact` / `adaptation` / `影视化补强` / `unverified`）落成节点规范
- [ ] 对账与监控：每日对账紫域 `cost` 与本地扣减、余额异常告警、兑换失败日志
      —— 接口由批次 1 提供：`GET /api/admin/credits/reconcile?days=1`

**★ 顺序风险（批次 3 版）**：批次 3 的对外暴露会**扩大攻击面** —— `canvas-agent` 拿到 token 等于
**能在这台机器上执行 agent 任务、弹本地文件管理器、批准工具调用**（`src/server/http.ts` 的
`/agent/codex/turn`、`/agent/claude/turn`、`/agent/local-file/reveal`、`/api/tools`、`/agent/codex/approval`）。
现有 token 校验**接受 `?token=` 查询参数**（`validToken()` L538-541），会进日志与浏览器历史。
所以 **`D-agent-auth` 未裁决前不许开工**；**quick tunnel 任何情况下不许为了图快临时打开**。

**落地材料**（全部在 `implementation/`，未进权威树）：
操作手册 `implementation/deploy/batch3-ops.md`（服务器侧 / 本机侧命令逐条）；
验收 `implementation/deploy/batch3-acceptance.md`（**B3-1 ~ B3-7**，与主清单 **A-19 ~ A-24** 对照）；
回滚 `implementation/deploy/batch3-rollback.md`（R-03 展开）；
清单器 `implementation/scripts/apply-batch3.mjs`（**只校验 + 打印，不改源码树、不代做服务器操作**）。

---

## LLM 中转方案（对应决策 D3）

画布需要一个 LLM 做"反推提示词"。当前最强候选是 **OmniRoute 网关**。

### 关键发现

**浏览器不把 `127.0.0.1` / `localhost` 当混合内容拦截。** 在 `https://hb.cauai.fun` 页面里直接 fetch `http://127.0.0.1:20128` 实测返回 200 —— **只要在跑 OmniRoute 的那台电脑上打开画布，什么都不用配。**

网关不鉴权，空 Bearer 也放行；实测 207 个模型可用；首字延迟 0.5–1.4 秒；偶发到 90 秒。

### 方案 A（本机直连）

- 地址：`http://127.0.0.1:20128`，Key 留空
- 模型：`auto/best-chat`、`auto/best-fast`、`auto/best-vision`、`auto/best-coding`
- 代价：**只能在跑网关的那台机器上用**

### 方案 B（跨设备，批次 3 采用）

`tools/omniroute-guard/server.js` 反代到 **20129**，通过**具名隧道**暴露。
**不要用 Cloudflare Access** —— 它是交互式登录页，跟前端 fetch 不兼容。

### ⚠️ 两个必须处置的风险

1. **OmniRoute 监听 `0.0.0.0:20128` 且不鉴权** → 同 WiFi 任何人都能烧额度。加固：防火墙规则限本机（**WSL 用户不要加**）。
2. **网关自带的 quick tunnel 当前关闭，保持关闭。**

---

## 明确不做

- 不做通用白板功能（自由图形、流程图、思维导图）
- 不把 `ai.cauai.fun` 的账本体系移植过来
- 不改 `niannian-ai-canvas` skill（决策 D7）

> 旧版本这里写的是"不在收益决策落地前写计费代码"。**该条已失效**：用户已批准的三批次计划本身确定了方向（解锁付费模型做产品化、走额度 + 卡密收款），D5/D6 的方向随之确定，批次 1 的计费实现即为落地。**正式标记为"已定"需用户确认**（见 `docs/DECISIONS.md` 的 D5 / D6）。

## 2026-09-26 · 三站融合裁决（D45）

owner 已授权由助手作出最快可行方案：采用 New API 账号中心桥接 + New API quota 唯一额度权威；重复邮箱按最早账号保留、其余人工合并；统一账号上线后关闭 apic 公开注册。T2/T3 已获 G3 批准，按 `docs/SLICE-002-PLAN.md` 的子任务顺序实施，先做零写入可行性与对账，再接入站点。

- **当前状态（2026-09-27 只读复核）**：公网统一认证中转可达（`/healthz` 与 HB 登录页均 200），但统一入口的 `target=apic` 返回 400，当前无法从统一入口进入 APIC。治理仓留存的中转代码仍以画布登录接口校验账号、签发独立 14 天会话，未按 D45 管理 New API 登录/刷新/撤销；线上实际运行代码是否与这份本地代码完全一致尚未做指纹核对。统一登录未完成。未提交凭据、未调用会话写接口、未发布。
- **下一步**：在正确的统一入口权威源码工作区内，按 T2-a → T2-b → T2-c 的顺序重做身份与会话桥接；本治理仓不作为产品源码仓，不在此处改认证服务代码。开始代码实现前，需明确该权威源码目录/项目边界，并复核账号映射干跑和撤销路径。
- 只读证据：[`docs/STATUS_20260927_AUTH_CONTRACT.md`](STATUS_20260927_AUTH_CONTRACT.md)；裁决：[`docs/DECISIONS.md`](DECISIONS.md) D45。
## 2026-09-27 · 统一额度运行复核

- **当前状态（只读核查）**：统一额度尚未启用。hb 线上版本已包含统一额度代码，但 hb 与 sd2 的运行环境都没有 `NEW_API_QUOTA_WRITE_URL` / `NEW_API_QUOTA_TOKEN`；New API 还不是两个产品的统一扣费账本。
- 本轮没有调用额度写入、生成、退款接口，也没有修改线上配置。
- 证据：[`docs/STATUS_20260927_UNIFIED_QUOTA_RUNTIME.md`](STATUS_20260927_UNIFIED_QUOTA_RUNTIME.md)。

## 2026-09-26 - APIC mcgrox and pro20x production review

- **Live:** mcgrox channel categories `pro`, `grok`, `plus`, `kimi`, and `kun`, with text input/output ratios `2.5` / `4` and image ratio `1`; the New API user-group field remains `default`.
- **Live:** the `pro20x` primary channel has weight `1`; duplicate same-credential rows remain at weight `0`.
- **Owner instruction:** public registration remains enabled.
- **Verified:** New API, PostgreSQL, and Redis are running; public `https://apic.cauai.fun/api/status`, `/register`, and `/v1/models` probes behave as expected; representative real calls succeeded.
- **Limitation:** `grok-4.5` and `grok-4.6` currently return upstream 429; this does not show a local routing failure.
- **Evidence:** [`docs/STATUS_20260926_APIC_MCGROX_PRO20X.md`](STATUS_20260926_APIC_MCGROX_PRO20X.md).

## 2026-09-26 · APIC 旧站支付、真实分组与渠道检测复核（D47）

- **已验证**：McGrox 模型与倍率在 APIC 生效；现有频道名称有 `pro/grok/plus/kimi/kun` 分类。
- **已订正**：这些名称不是 New API 的用户权限分组；`channels.group`、`abilities.group`、现有用户和 Token 仍主要是 `default`。
- **未验证**：渠道自动检测没有运行证据；所有渠道 `test_time=0`、`response_time=0`，系统任务只有 `model_update`。
- **已验证**：旧站链动小铺购买页使用外部卡密，用户购买后复制卡密回站 `/api/v1/redeem`；旧站内建 payment 关闭。
- **未验证**：链动小铺自动回调、订单签名和订单到 APIC 用户的绑定协议。
- **当前阻塞**：要做正式支付适配，需先确认 LDXP 协议；要做真实权限分组，需先决定是否迁移现有 `default` 用户和 Token。
- **证据**：[`docs/STATUS_20260926_APIC_OLD_SITE_LDXP_AUDIT.md`](STATUS_20260926_APIC_OLD_SITE_LDXP_AUDIT.md)。


## 2026-09-27 · McGrox 真实采购成本与对外售价草案（D48）

- **已验证**：McGrox 公开购买页/链动小铺商品接口显示 10/20/50/100 余额分别售价 ¥10/¥20/¥50/¥100，因此当前可核验的余额采购成本为 ¥1/余额单位。
- **已验证**：公开页分组倍率为 `pro=0.325`、`plus=0.1625`、`grok=0.065`、`kimi=0.195`、`kun=0.065`。
- **主控推断**：按 New API `QuotaPerUnit=500000`、输出倍率 4 和 1.5 倍成本覆盖系数，形成了文本输入/输出的对外售价试算表。
- **本轮边界**：只新增治理仓核算草案 [`docs/PRICING_20260927_MCGROX_DRAFT.md`](PRICING_20260927_MCGROX_DRAFT.md)，不修改 APIC 线上倍率、模型、套餐、充值、兑换、用户余额或公开注册。
- **未验证**：图像模型单次真实扣费、失败/重试扣费、长上下文附加费、APIC 最小计费单位/舍入/退款，以及最终毛利目标。
- **下一步**：完成逐模型扣费与结算规则核验后，再由 owner 决定覆盖系数、展示方式和是否另行授权上线价格。

## 2026-09-27 · APIC 链动小铺支付与订阅接入核查

- [User confirmed] Goal: connect Liandianpu merchant payment, sell subscriptions only, keep public registration enabled, and follow the McGrox day/week card mechanism.
- [Verified] Shop `B59CCLX7` is readable; it exposes 9 API day/week subscription products matching the McGrox tiers, with WeChat QR as the current public payment method.
- [已失效] 曾把 `api.liandianpu.cn` 的易支付文档认作 LDXP 官方接口；没有第一方证据支持该关联。见下方 2026-09-27 纠错记录。
- [Verified] APIC native subscription payment uses an EPay-compatible interface, but `PayAddress`, `EpayId`, `EpayKey`, and `PayMethods` are empty online.
- [Verified] The APIC server has no Liandianpu merchant `pid`, signing secret, or equivalent payment configuration; this round did not change production.
- [User confirmed] Subscriptions only; no balance top-ups. Use the McGrox day/week daily-reset mechanism and price the corresponding quota at `?1 = $1`.
- [已失效] 此前要求为错误站点提供 PID/密钥和重复要求部署口令；当前应先核实 LDXP 自己的正式支付接口。
- Evidence: [`docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`](STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md).

## 2026-09-27 · APIC / LDXP 支付接入纠错

- [已失效] 前一条接入核查把 `api.liandianpu.cn` 的“联点/联店铺易支付”接口误认成 LDXP 官方接口；该关联未获证实。
- [已验证源码] 本地候选只按上述网站的 `/openapi/pay/create` 和 MD5 文档编写；内部测试不代表 LDXP 实测。候选禁止部署。
- [已验证线上] 候选未发布，APIC 未配置商户参数，没有真实支付请求，线上无变化。
- [待核验] 应先从 `www.ldxp.cn` 商户后台或 LDXP 官方客服确认是否有外部服务端支付 API、正式文档、回调签名与测试环境。
- 详见 `docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`。
## 2026-09-27 · APIC 公网只读安全与可用性审计

- **[已验证]** HTTPS 首页、登录、注册、模型广场和排行榜可达；未登录访问控制台会跳转到登录页。
- **[高风险]** HTTP 入口没有跳转到 HTTPS，`http://apic.cauai.fun/` 与 `/api/status` 均直接返回 200；HTTPS 响应未见 HSTS。
- **[已验证]** 公开注册仍开启，邮箱验证和 Turnstile 均关闭；公开性能接口暴露模型级成功率、延迟和吞吐量。
- **[已验证]** 19 个模型中，`grok-4.5` 与 `grok-4.6` 最近 24 小时成功率为 0%，但仍在默认模型目录中；`grok-4.7` 与 `grok-composer-2.5-fast` 为 100%。
- **[已验证]** 线上版本为 `v1.0.0-rc.38`；2026-09-27 查询官方 releases 的最新正式版本为 `v1.0.0-rc.40`，需要先做 staging/回滚评估，不能直接替换生产。
- **[本轮边界]** 只做公网只读核查，没有真实 Token 调用、注册、扣费、充值、退款或线上修改。
- **证据**：[`docs/STATUS_20260927_APIC_LIVE_AUDIT.md`](STATUS_20260927_APIC_LIVE_AUDIT.md)。

## 2026-09-27 · APIC 根本矛盾修复：HTTPS 与 Grok 模型目录

- **[已在线上生效]** Caddy 已将 `http://apic.cauai.fun/` 及其 API 路径改为 `308` 跳转到 HTTPS；HTTPS 响应已加入 `Strict-Transport-Security: max-age=31536000; includeSubDomains`。
- **[已在线上生效]** PostgreSQL `abilities` 中仅禁用 `grok-4.5`、`grok-4.6`；Grok 渠道仍保留 `grok-4.7` 与 `grok-composer-2.5-fast`，没有关闭整个渠道。
- **[已验证]** New API 重启后 `/api/status` 返回 `200`，`/api/pricing` 不再返回 `grok-4.5` 或 `grok-4.6`，未授权 `/v1/models` 仍返回 `401`。
- **[已验证]** Caddy 配置通过校验；宿主机配置与容器内配置哈希一致；备份位于服务器 `/srv/kidswear-data/backups/apic/`。
- **[待核验]** 本轮直接修复了线上当前配置；后续发布流程是否会把该规则纳入权威部署源，需在下一次发布前补做核对。
- **证据**：[`docs/STATUS_20260927_APIC_REPAIR.md`](STATUS_20260927_APIC_REPAIR.md)。

## 2026-09-27 · D45 三站统一账号本地实现与零写入验收

- **[已验证]** 本地入口 broker 已改为调用 New API 登录/注册；targets 已覆盖 `hb`、`sd2`、`apic`；登出覆盖三个站点和 New API。
- **[已验证]** HB 与 SD2 统一登录支持按 New API 身份创建本地 shadow account；APIC 源码新增 `/api/user/auth/unified` 与 `/api/user/auth/unified/logout`。
- **[已验证]** mock contract、SD2 typecheck、入口/HB JavaScript 语法检查通过；本轮没有真实写接口、数据库写入或发布。
- **[已验证]** 线上仍是旧入口行为：`GET /auth/start?target=apic` 返回 400，`GET /auth/apic.html` 与统一注册页返回 404；本地实现尚未发布。
- **[未验证]** APIC 全量 Go 编译尚未得到业务编译结果：当前 sparse checkout 缺少 New API 多个依赖目录，且本机 Go 报告 `internal/bisect` 标准库路径异常；新增文件仅完成 `gofmt` 与静态路由核对。
- **证据**：[`docs/STATUS_20260927_UNIFIED_AUTH_IMPLEMENTATION.md`](STATUS_20260927_UNIFIED_AUTH_IMPLEMENTATION.md)。

## 2026-09-27 · sd2.cauai.fun 公网与部署复核

- **[已验证]** `sd2.cauai.fun` 当前可达；主要未登录业务接口仍返回 `401`，CSRF 校验和登录限流生效。
- **[已验证]** 线上运行 `niannian-sd2:billing-20260918-r2`，Postgres 公共表 27 张，`users=5`、`user_credits=5`、`video_tasks=0`；每日备份已持续到 2026-09-27。
- **[已验证]** 统一账号/统一额度尚未发布：线上无 `NEW_API_*` / `UNIFIED_*` 运行变量，`/api/auth/unified` 返回 `404`；本地统一认证/额度改动仍未发布。
- **[高风险待核验]** `/api/ziyu/jobs` 认证后直接用单一服务端 Key 拉上游列表，代码未按 `user_id` 过滤；必须完成双账号隔离验收后再扩大外部使用。
- **[已验证]** `/api/editor/sso` 未登录回跳到 `https://localhost:3026/login`，且线上没有 `NIANNIAN_EDITOR_SSO_*` 配置；编辑器 SSO 当前不可用。
- **[低风险]** `/api/health` 公开泄露旧的 2026-07-28 release identity，和当前 2026-09-18 镜像标签不一致；HTTPS 未见 HSTS。
- **证据**：[`docs/STATUS_20260927_SD2_AUDIT.md`](STATUS_20260927_SD2_AUDIT.md)。

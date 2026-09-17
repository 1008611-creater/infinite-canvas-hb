# 路线图 · 无限画布

原则：**先修真实缺口，再谈增值**。

**路线图已于 2026-09-12 重构**：由用户批准的三批次计划取代旧的"阶段一/二/三"。旧版本把批次 1 标注为「已完成」，那是错误标注，已订正。证据见 `docs/STATUS_20260912.md`。

> ★ **2026-09-13（第 4 轮）更新**：用户对 Q-1 ~ Q-12 全部作答，设计口径锁定（见 `docs/DECISIONS.md` **D10** 与 `docs/STATUS_20260913.md`）。
> 定价方案书：`docs/PRICING_20260913.md`。
> **2026-09-17 批次 1 已落地**（提交 `ff6200a`）。写权限已恢复，`EPERM` 不再成立。批次 2 / 3 仍未落地。
> **L2 订正（2026-09-14 第 106 轮）**：已在真实浏览器验证 **连线（创建/方向/去重/反向/撤销）、缩放、新建拖动节点、秒数钳位、官方插件、按 URL 装第三方插件**；**残留缺口仅一项 = 节点链真实执行**。见 `docs/STATUS_20260913_L2_EVIDENCE.md` 第九、十节。

---

## 现状快照（2026-09-12 核实）

| 能力 | 状态 | 证据 |
|---|---|---|
| 视频出片 | ✅ 已走通（本地代理 → Agnes） | `inventory/画布验收清单.md`（2026-09-01） |
| 图片生成 | ✅ 已配 OpenLux（`gpt-image-2-c`） | `channel-templates.ts` 实测 |
| 静态资源 / 路由 | ✅ 8/8 路由加载，依赖错误 0 | `inventory/审计报告_..._20260827.md` |
| 画布交互 | 🟡 **部分验证**：拖拽 / 连线（含反向）/ 模式适配 / 秒数钳位有真实浏览器证据；**缩放、节点链执行、插件安装未覆盖** | `.probe/pr12-ui-verify.mjs` + 5 张截图（2026-09-01），复核见 `docs/STATUS_20260913_L2_EVIDENCE.md` |
| LLM 中转 | ⏸ **待定**（D3） | `docs/DECISIONS.md` |
| MCP / Agent | ⏸ **已构建、未启用**（34 个工具） | `canvas-agent/dist/`（2026-08-27） |
| 账号 / 计费 | ✅ **已落地**（2026-09-17，提交 `ff6200a`）；交付件已就绪（`implementation/` 设计与代码 + `apply-batch1.mjs` 落地器） | 落地前扫描零命中；2026-09-17 已写进权威树（旧"896 文件"为 2026-09-12 事实，已过期） |
| 网盘挂载 | ⏸ **本阶段不动**（Q-10 已移出批次 2） | `nginx-docker.conf` 现状 `/dav/` 凭 Basic Auth |

### 已知的具体缺口（已订正）

1. **默认渠道指向 `api.openai.com`**，key 为空 → 新环境必然 401。配置问题，**未修**。
2. **`canvas-agent` 已构建**（`dist/` 存在，2026-08-27），但**未启用**。实测 **34** 个工具（旧文档写「六个」、计划写「25」均不对）。
3. **LLM 中转未定**（D3）。图片走 OpenLux，但 OpenLux 是图片分组，不能当通用 LLM 用。
4. **视频通道只有免费的 `agnes-video-2.5-flash`**，限流约 1 次/分钟。
5. ~~**计费能力为零**~~ → **代码已于 2026-09-17 落地**（`ff6200a`）。但**未发布、未配服务器 `.env`、未验收**，线上仍不能收费。

---

## 批次 1 · 收得到钱（交付件已就绪，待落地执行）

> 状态口径：**设计完成、代码写完、落地器就绪**；权威源码树本身**仍未改动**（2026-09-17 实测：写权限已恢复）。
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
> 权威源码树本身**仍未改动**（2026-09-17 实测：写权限已恢复）。
> 落地方式：你在自己有写权限的终端跑一次 `node E:/codex/huabu/implementation/scripts/apply-batch2.mjs`。
> **前置**：必须先跑完批次 1（`apply-batch2.mjs` 有硬校验，缺 `canvas-api/routes-credits.js` 会直接 `exit 2`）。
> 落地器已在**假源树**上跑通、幂等复跑已验证；2026-09-13 又对**真实权威树**做了**零写入干跑**（锚点全部命中），但**从未真正写盘过**。证据：`docs/VERIFICATION_20260913_APPLY_DRYRUN.md`。
> **复验入口**：`node E:/codex/huabu/implementation/scripts/dry-run-all.mjs`（三批次一次跑完 + 权威树零变化核对）。

- [ ] 打开公开注册（确认第一个注册者已是管理员后再放开）
       —— 🔴 **2026-09-13 线上实测：注册已经是【开】的**（`POST /api/auth/register` 合法邮箱 + 短密码 → 400 `password_too_short`，而不是 403 `registration_closed`）。**这一项不需要「打开」，需要的是「先关掉、再按顺序打开」**：先确认你本人是 `admin`、库里没有陌生人账号，再走正常放开流程。**批次 2 的顺序因此要改（订正后为 5 步）**：① 服务器 `.env` 加 `CANVAS_ALLOW_REGISTER=0` → **重建 api 容器**（最高优先）→② 查 `users` 表确认你本人是 `admin`、库里没有陌生人账号 →③ 批次 1 落地，额度体系对所有 `/ziyu/` 调用生效 →④ 收紧 `/api/auth/verify` 的 legacy 分支 →⑤ 最后才放开公开注册 / 撤四处门禁。见 `docs/STATUS_20260913_LIVE_GATE.md`。
- [ ] nginx 撤掉 `/`、`/assets/`、`/config.js`、`/agnes/` 四处 cookie 门禁（`/api/` 本就不吃门禁）
      —— 落地器 **B1~B4**，四处**逐块精确文本匹配删除**，**绝不全局替换**（全局替换会把 `/ziyu/` 那道门一起拆掉）
- [x] ~~`/dav/` 收敛为管理员专用~~ **已移出批次 2**（用户裁定 Q-10「先不做，先抓住主要矛盾」，见 D10.2）。普通用户跨设备同步走画布内云同步
- [ ] 免费试拍（Agnes flash）：必须登录，每账号每月重置 3 次（可配置）
      —— 落地器 **B5**：`location = /agnes/v1/videos` + `auth_request` 指向 `/api/credits/free-trial/check`
- [ ] **`/ziyu/` 保留门禁**（D10.3 裁定）：它是唯一能直接烧服务器紫域额度的路径；撤门禁的代价是持旧 cookie 者过渡期仍可烧积分
      —— ⚠️ 但**这道门禁不是资金防线**（B-6）：注册/登录成功会**自动下发** `canvas_auth`，注册接口敞开期间可自助绕过。**真正的锁是额度体系**（`requireAuth` + 余额预扣）
- [ ] 修默认渠道 401 —— 落地器 **B6**：清空 `OPENAI_BASE_URL`（只影响新用户 / 清 localStorage 后的默认值）
- [ ] **补 L2 真实浏览器验证**：拖拽 ✅ / 连线 ✅（含反向）/ 缩放 ❌ / 节点链执行 ❌ / 插件安装 ❌ —— 前两项已有 2026-09-01 证据（`.probe/`），**只需补后三项 + 复跑脚本存断言输出**

**★ 顺序风险（不许跳过）**：批次 2 让陌生人第一次能真正打开画布点东西，因此 **A-06 之前必须先补 L2 真机冒烟**；
否则「放得开」放开的可能是一台坏机器。残留三项 + 复跑留档**必须由真人补做**（本环境无浏览器 / 无 shell / 无 SSH）。

**★ 唯一资金风险点**：撤掉 `/agnes/` 门禁后，`/agnes/v1/videos` 是整站唯一会用真钱调上游的端点。
撤门禁与免费试拍限次**必须同一次发布落地**，不能分两次。

**落地材料**（全部在 `implementation/`，未进权威树）：
落地器 `implementation/scripts/apply-batch2.mjs`（B1~B7）；
nginx 片段 `implementation/deploy/batch2-nginx.conf.snippet`（含 R1~R5 风险 / U1~U4 未验证）；
验收 `implementation/deploy/batch2-acceptance.md`（**B2-1 ~ B2-7**，与落地器 B1~B7 一一对应）；
回滚 `implementation/deploy/batch2-rollback.md`（R-02 展开，含「回滚会把在用用户挡在门外」的方向性风险）。

## 批次 3 · 跑得顺（交付件已就绪，待落地执行）

> 状态口径与批次 1 / 批次 2 一致：**设计完成、操作手册与清单器就绪**；权威源码树本身**仍未改动**（2026-09-17 实测：写权限已恢复）。
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

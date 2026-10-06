# 主控状态

## 2026-09-27 - APIC subscription voucher implementation

- [LOCAL CHANGES] Implemented on branch `codex/apic-subscription-redeem` in `E:\codex\apic-ldxp-redeem`, based on the matching official `v1.0.0-rc.38` source revision.
- [VERIFIED] One-time APIC subscription codes are generated in batches; only SHA-256 digests are stored, and plaintext is returned only in the creation response. Authenticated redemption atomically consumes a code and creates the mapped subscription, without adding wallet balance.
- [VERIFIED] Admin generate/list/revoke endpoints, shop URL/price fields, subscription shop links, and the wallet redemption form are implemented. Balance top-up UI is hidden. No payment API, callback, or automatic crediting was added.
- [VERIFIED] Docker builder stage completed with production web build and Go build; focused model redemption tests (valid, expired/unknown, duplicate, concurrent use, unchanged balance) passed; controller/router compile checks passed; targeted frontend lint and format checks passed.
- [VERIFIED] HTTPS shop-link validation tests passed. Manual review confirmed authenticated user/admin routes, digest-only code storage, transactional redemption, wallet balance unchanged, and no automatic payment callback.
- [GOVERNANCE CHECK] `node E:\codex\huabu\scripts\verify.mjs` reported 7 PASS / 2 WARN / 1 FAIL; the failure is the existing broken-link scan under `scratch/new-api-upstream-20260927`, unrelated to these APIC changes.
- [PARTIAL] Frontend typecheck still reports two errors in unchanged billing-expression test files: a missing `pkg/billingexpr/testdata/frontend_simulation.json` fixture and a Vitest callback type mismatch. The initial wallet refresh-state error was fixed and no longer appears.
- [PUBLIC PAGE VERIFIED 2026-09-27] Shop `B59CCLX7` showed 5 day cards (CNY 1 / 1.9 / 4 / 5.2 / 7.5) and 4 week cards (CNY 25 / 48 / 70 / 90); descriptions say codes are delivered automatically, public stock showed 17?20 each, and the purchase limit was 1 per buyer. A fresh recheck timed out, so current values are unconfirmed.
- [UNVERIFIED] Whether the old redemption host is an authorized alias of APIC, and whether existing card contents can activate APIC subscriptions, remain unverified. Do not reuse or alter existing stock. No product edit was saved, inventory changed, order submitted, or payment made. A clean-container rerun of focused Go tests did not finish within about seven minutes; an earlier implementation run recorded them passing. APIC links/prices remain unconfigured and nothing was deployed.
- [NEXT] Resolve the redemption-host mismatch. If the existing cards belong to the other API site, keep them untouched, deploy the APIC redemption feature, and create separate APIC-coded shop products at the verified tier prices. Confirm any real test payment amount before checkout.
- Authority: [`docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`](../docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md).

## 2026-09-27 · HB 公开售卖扣费止血修复已发布

- [已在线上生效] 版本 `canvas-20260928-000356-5cea6ce` 已发布到 `hb.cauai.fun`；注册保持开放。
- [已验证] 公网入口 302、`/api/health` 200、未登录新代理 API 401、旧 `/ziyu/` 与 `/agnes/` 直连 403；四个相关容器运行中。
- [未验证] 真实登录出片、真实扣费/退款、双账号隔离和首个注册用户角色；本次没有提交付费生成任务。
- 权威记录：[`docs/STATUS_20260927_HB_AUDIT.md`](../docs/STATUS_20260927_HB_AUDIT.md)。

## 2026-09-27 - Media persistence follow-up

- [VERIFIED] Generated MP4 is stored in HB media storage and authenticated GET returns HTTP 200 video/mp4.
- [UNVERIFIED] Task index still has null resultUrl/mediaUrl; task center association is missing. JSON persist body returns 400, form encoded import works.
- Authority: docs/STATUS_20260927_HB_AUDIT.md.


## 2026-09-27 - HB live acceptance after Ziyu API key repair

- [VERIFIED] Server credential hotfix and canvas-api rebuild completed; upstream auth probe HTTP 200; no publish script run.
- [VERIFIED] Test login succeeded; one real 5-second 9:16 text-to-video task completed with provider cost 50.
- [VERIFIED] Balance moved from 100 to 25; ledger shows reservation 75 and completed settlement.
- [UNVERIFIED] Task list resultUrl/mediaUrl remain null; manual persistence endpoint returned 400.
- [UNVERIFIED] Refund was not tested; no second paid task was submitted.
- Authority: docs/STATUS_20260927_HB_AUDIT.md.


## 2026-09-27 · APIC 链动小铺订阅支付接入

- [本地候选，已降级] scratch 中虽有订阅支付界面和回调代码，但协议来自未证实与 LDXP 有关的“联点/联店铺易支付”网站；不得称为 LDXP 集成或部署。
- [已验证范围有限] 既有检查只证明候选代码能编译、内部签名逻辑与该易支付文档样例相符；没有验证 LDXP 兼容性。
- [已验证] 治理质量门结果为 7 PASS / 2 WARN / 1 FAIL；唯一失败是对导入 scratch 源码文档的链接检查，与本轮支付代码无关。
- [未验证] 该 scratch 副本不是已确认的 APIC 权威部署源码；未配置商户凭据、套餐、线上环境，也未做真实支付/回调验收。
- [已验证线上] 当前 APIC 运行镜像为 `calciumion/new-api@sha256:0a4d62b1b2b796a43a5e0ef92d49f12e0f229ab206b8f5a3a4cd42990121bfe1`；`/opt/new-api` 没有 Git 源码，LDXP 五项配置均不存在。
- [已验证线上] 服务器 `/tmp` 下有三份干净的官方 New API 临时副本（HEAD `c2b7a9a9e0b5`），但 Compose 指向 `/opt/new-api`，线上镜像是 `v1.0.0-rc.38` / revision `2906e4f779b7`；没有证据表明这些临时副本是线上部署源，不能直接拿来发布。
- [已验证线上] 扫描到的 `LDXP_REDEEM_SECRET` 属于 `/opt/infinite-canvas` 卡密兑换；`LDXP_API_KEY` 只出现在 DeepTutor 模板。两者均非 APIC 商户凭据；未读取其值，也未改动这些产品。
- [阻塞] 没有权威部署源码与 LDXP API 凭据，且 LDXP 收款签约此前未完成；发布空配置镜像不能接通真实支付。本次只读预检未改线上。
- [待用户决定] 获取有效 API PID 和签名密钥并安全写入服务器；支付账户签约完成后，再单独授权部署和真实小额订单。
- 权威进度：[`docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`](../docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md)。

## 2026-09-27 · HB 测试账号小额验收

- [已验证] 测试账号 `probe-card@hb.cauai.fun` 已登录；`/api/auth/me` 正常返回用户信息。
- [已验证] `/api/credits/me` 返回 100 点；`/api/ziyu/tasks` 为空；线上版本为 `canvas-20260927-194652-9ae06cf`。
- [已验证] 紫域上游返回 401（API 日志为 `ZIYU_HTTP_401`）；Agnes 提交返回 `FREE_TRIAL_DISABLED`，线上免费额度为 0。
- [已验证] 没有真实视频任务、扣费或退款；`channel_usage` 无测试任务，`credit_ledger` 仍只有原始兑换流水，余额未变化。
- [已验证] 测试账号原密码哈希已恢复并完成数据库比对，结果为 `RESTORED`。
- [未验证] 出片、扣费、退款尚未完成；当前阻塞是紫域凭据和 Agnes 受控测试额度。
- 权威记录：[`docs/STATUS_20260927_HB_AUDIT.md`](../docs/STATUS_20260927_HB_AUDIT.md)。


## 2026-09-27 · aigc.cauai.fun 发布

- [已在线上生效] LAOBA 第一条统一工作台切片已发布，版本 `canvas-20260927-193140-5cea6ce`。
- [已在线上生效] 新域名使用独立 `aigc-canvas` Cloudflare Tunnel，旧 `hb.cauai.fun` 保持原隧道和入口。
- [已验证] 新域名门禁、统一认证跳转、版本指纹、`/tasks`、未登录 API 401、旧域名回归均通过。
- [未验证] 真实账号视频出片、真实扣费/退款、双账号隔离和完整浏览器跨站登录仍未验收。
- 权威发布记录：`docs/STATUS_20260927_LAOBA_RELEASE.md`。

## 2026-09-27 · SD2 + HB 统一为 LAOBA 形态 · 第一条可运行切片

- [已在线上生效] HB 默认入口 LAOBA 快捷创作、统一导航、任务中心、作品、积分和个人中心路由已随 `5cea6ce` 发布。
- [已在线上生效] 服务端快捷创作与任务列表通过 `ca2395f` 更新；部署版本 `canvas-20260928-025558-ca2395f`，公网基础冒烟通过。
- [已验证] HB typecheck、生产 build、contracts 19/19、canvas-api Node 语法检查通过；本次部署另通过 nginx 检查、回环检查与匿名权限冒烟。
- [未验证] 登录账号的任务中心实际显示历史成片、真实紫域小额生成与扣费、双账号隔离和回滚演练。

权威记录：[`docs/STATUS_20260927_LAOBA_SLICE.md`](../docs/STATUS_20260927_LAOBA_SLICE.md)。

## 2026-09-27 · D45 APIC 完整依赖与镜像构建验收

- [本地已改但未发布] APIC scratch checkout 已恢复完整源码依赖，包含 `go.mod` / `go.sum`、完整 Go 依赖目录、`Dockerfile` 与 `relaykit` 本地模块。
- [已验证] `docker build --pull=false --tag new-api-unified-auth:local-20260927 .` 最终运行时镜像构建通过；镜像 ID 为 `sha256:55043e4c9f8edbdb89681c71be876ffc2d79c34b6ee93e0f64f44a5196d36ab2`。
- [已验证] 运行时镜像 `/new-api` 可执行、许可证文件齐全、未内置统一认证或数据库密钥环境变量；builder2 中 `go test ./controller ./router -run '^$' -count=0` 编译通过。
- [已验证] 统一认证 mock contract test 通过；治理仓质量门仍为 7 PASS / 2 WARN / 1 FAIL，唯一 FAIL 是 scratch New API 预存文档链接，不是本轮认证代码引入。
- [未验证] 全量 controller/router 测试未完成（无输出等待后中止）；真实数据库写入、真实注册/登录/登出、发布后浏览器验收仍未做。
- [已确认] 本轮仅本地构建与零写入验收，不运行发布脚本，不改线上配置，不触碰不可再生数据卷。

权威记录：[`docs/STATUS_20260927_UNIFIED_AUTH_IMPLEMENTATION.md`](../docs/STATUS_20260927_UNIFIED_AUTH_IMPLEMENTATION.md)。

## 2026-09-27 · APIC 线上根本矛盾修复

- [已在线上生效] `http://apic.cauai.fun/` 与 `/api/status` 已返回 `308` 到 HTTPS；HTTPS 已返回 HSTS。
- [已在线上生效] `grok-4.5`、`grok-4.6` 已从 Grok 渠道模型列表移除并在 `abilities` 中禁用；`grok-4.7` 与 `grok-composer-2.5-fast` 保留。
- [已验证] New API、PostgreSQL、Caddy 运行正常；`/api/status` 200、`/api/pricing` 仅返回保留模型、未授权 `/v1/models` 401。
- [已验证] 事后复核已修正第一次写入造成的 Caddyfile 编码/注释污染，最终配置差异只包含 APIC 路由规则。
- [待核验] 服务器当前配置尚未回写到下一次发布流程的权威部署源，后续发布前需要核对不会被覆盖。

权威记录：[`docs/STATUS_20260927_APIC_REPAIR.md`](../docs/STATUS_20260927_APIC_REPAIR.md)。

## 2026-09-27 · sd2.cauai.fun 线上审计

- [已验证] 线上入口、认证门禁、Postgres 与每日备份正常；当前镜像为 `niannian-sd2:billing-20260918-r2`。
- [高风险待核验] `/api/ziyu/jobs` 使用单一服务端 Key 拉取任务列表，代码未按 `user_id` 过滤；双账号隔离验收是下一最高优先动作。
- [已验证] 统一账号/额度未发布；编辑器 SSO 未配置且未登录回跳到 `https://localhost:3026/login`。

权威记录：[`docs/STATUS_20260927_SD2_AUDIT.md`](../docs/STATUS_20260927_SD2_AUDIT.md)。

## 2026-09-27 · D45 三站统一账号桥接

- [已验证] 本地已补统一入口的 New API 登录/注册转发、`hb` / `sd2` / `apic` 三目标、一次性 ticket、三站登出桥接和 New API 登出调用。
- [已验证] 已新增 HB shadow account、SD2 shadow account、APIC `/api/user/auth/unified` 与 `/api/user/auth/unified/logout` 契约代码。
- [已验证] 入口 mock contract test 通过；SD2 TypeScript typecheck 通过；入口与 HB JavaScript 语法检查通过；APIC Go 文件已 `gofmt`。
- [已验证] 治理仓 `node scripts/verify.mjs` 的 C1.1 密钥扫描通过；总门因 scratch New API 预存 Markdown 链接失败，未发现本轮认证代码引入的新质量门失败。
- [已验证] 线上只读复核仍显示旧行为：`/auth/start?target=apic` 返回 400，`/auth/apic.html` 与统一注册页返回 404；本地实现尚未发布。
- [已验证] APIC 完整源码依赖已恢复；最终运行时镜像本地构建通过，builder2 中 controller/router 编译测试通过；全量测试执行未完成。
- [已验证] 线上 APIC 邮箱验证关闭；本地 broker/APIC 已补 `username=email` 回退，避免注册后 email 字段为空导致统一登录/登出找不到用户。
- [已确认] 本轮零写入验收，不发布，不改线上配置，不触碰不可再生数据卷。

权威记录：[`docs/STATUS_20260927_UNIFIED_AUTH_IMPLEMENTATION.md`](../docs/STATUS_20260927_UNIFIED_AUTH_IMPLEMENTATION.md)。


## 2026-09-27 · HB 公开售卖定位订正

- [用户确认] HB 是面向外部用户公开售卖的工具，不是私有工具。
- [已订正] 不再把“关闭公开注册”作为目标；应保留注册，重点核验新用户默认权限、邮箱验证码、限流、额度预扣和管理员初始化。
- [未验证] 真实节点链出片、结果落盘、真库并发扣费/退款、统一登录完整浏览器流程。
- 权威记录：[`docs/STATUS_20260927_HB_AUDIT.md`](../docs/STATUS_20260927_HB_AUDIT.md)。


## 2026-09-27 · HB 公开售卖注册、额度与扣费链路审计

- [已验证] 公开注册路径仍开放；匿名额度/扣费 API 受 401 保护；匿名 `/ziyu/` 入口受 403 门禁。
- [已验证源码] 注册/登录成功会下发站点级 `canvas_auth`；`/ziyu/`、`/agnes/` nginx 代理按站点级 cookie 放行并注入平台 Key，未强制经过 `/api/credits/reserve`，存在绕过用户额度的高风险断点。
- [已验证源码] 第一个注册用户会自动提升为 `admin`，不适合公开售卖；reserve/settle 的金额由前端传入，补扣失败仍返回 `ok:true` 并记录 pending。
- [已验证线上] CORS 预检回显任意 Origin 并允许 credentials；当前权威 nginx 配置未见免费试拍 `auth_request` 门禁，登录后限次未验证。
- [未验证] 真实登录态直连紫域/Agnes、首个账号线上角色、免费试拍按账号限次、真实扣费/退款/并发幂等。

权威记录：[`docs/STATUS_20260927_HB_AUDIT.md`](../docs/STATUS_20260927_HB_AUDIT.md)。

## 2026-09-27 - APIC LDXP payment audit — superseded

- [User confirmed] Subscriptions only; no balance top-ups; follow the McGrox day/week daily-reset mechanism; map CNY 1 to USD 1 of the corresponding displayed quota; keep public registration enabled.
- [已失效] 把 `api.liandianpu.cn` 文档认作 LDXP 官方支付协议，来源归属错误；不得按其 PID、MD5 或回调字段配置 APIC。
- [Verified] APIC production still has no Liandianpu merchant `pid`, signing secret, payment config, or subscription plans; this round did not change production.
- [已失效] 曾要求用户为错误站点提供 PID/密钥；不要向该站提供 LDXP 凭据。
- [Next] Implement and test the EPay-compatible bridge in a non-production workspace, then run one real test order before considering production.

## 2026-09-27 · sd2.cauai.fun 根本链路修复

- [已在线上生效] 紫域任务已改为本地 `video_tasks` 按 `user_id` 隔离；任务详情、媒体预览和下载增加归属校验。
- [已在线上生效] 时长选择、后端计费、余额预检、失败历史、模式与时长复用已经统一；本地模拟端到端链路跑通。
- [已验证] `npm run typecheck`、`npm run test:video-task-public-state`（2/2）、`npm run build`、`git diff --check` 通过；临时 mock/seed 文件已删除，本地服务已停止。
- [已失效] 发布前基线曾是旧 release 且 `/api/auth/unified` 返回 404；现已由新镜像替换。
- [待用户决定] 仍需提供可清理测试账号与真实验收费用上限；在此之前不执行真实扣费。

权威记录：[`docs/STATUS_20260927_SD2_RUNNABLE.md`](../docs/STATUS_20260927_SD2_RUNNABLE.md)。

## 2026-09-27 · sd2.cauai.fun 发布后状态

- [已验证] 已按 owner 明确授权 `你发` 发布；生产容器当前镜像为 `niannian-sd2:codex-20260927-4d12e46`，旧容器保留回滚。
- [已验证] 公网 `/`、`/login`、`/api/health` 返回 200；统一认证、模板、管理员模板、紫域任务和 providers 路由已命中新版本并返回预期鉴权状态。
- [未验证] 真实账号登录、真实紫域下单/扣费/退款/下载和双账号隔离尚未执行。
- [待用户决定] 提供可清理测试账号与真实验收费用上限后，再执行真实小额链路。

权威记录：[`docs/STATUS_20260927_SD2_RELEASE.md`](../docs/STATUS_20260927_SD2_RELEASE.md)。

## 2026-09-27 - APIC credential discovery — prior provider attribution invalidated

- [已验证] 用户已登录的 `www.ldxp.cn/merchant` 商户会话有效，页面显示商户 `cau_ai` / 店铺 `商家0752`。
- [已验证] LDXP 商户后台可查看支付渠道和店铺设置，但没有显示链动小铺 API 商户 `pid` 或签名密钥。
- [已失效] `api.liandianpu.cn/merchant/login` 并非已验证的 LDXP 商户入口；用户不应按此前指引访问。
- [已验证] 本轮未输入密码、未修改外部账户、未写入 APIC 服务器、未改变线上配置。
- [待核验] LDXP 自身是否提供服务端支付接口与凭据管理入口，尚无一手资料。

## 2026-09-27 路 LDXP 商家后台复查
- [用户确认] 正确后台是 `https://www.ldxp.cn/merchant/dashboard/workplace`，账号设置入口是 `https://www.ldxp.cn/merchant/user/setting`；此前的 `api.liandianpu.cn` 不仅是登录绕路，而且其与 LDXP 支付系统的关系也未证实。
- [已验证] LDXP 支付设置显示平台聚合支付已开通，微信扫码与微信 JSPAY 启用中，服务费率各为 3%。
- [已验证] 钱包页的微信聚合收款账户显示“未签约完成”；“前往查看”未打开可见详情。
- [已验证] LDXP 账号设置页只有账号与安全设置，没有显示 API PID 或签名密钥；没有复制或传输商户凭据。
- [已验证] 本次检查未改支付设置、签约状态、商户账号、APIC、价格或线上配置。
- [待核验] 已查看的 LDXP 页面没有暴露给外部 API 调用的商户 PID 或签名密钥。APIC 接入仍等待在真实 API 商户界面找到凭据或由用户安全写入服务器。

## 2026-09-27 · HB 收费入口止血修复发布

- [已在线上生效] 权威源码提交 `5cea6ce` 已发布；线上 `BUILD_INFO.txt` 为 `canvas-20260927-181205-5cea6ce`，前端构建注入 `/api/agnes`。
- [已在线上生效] 旧 `/agnes/`、`/ziyu/` 直连入口返回 403；新的 `/api/agnes/v1/*`、`/api/ziyu/v1/*` 未登录返回 401；首页仍 302 到 `/login.html`，登录页仍跳转 `one.cauai.fun/auth/hb.html`。
- [已验证] API、Agnes、Postgres、nginx 容器运行正常；API 启动日志显示数据库迁移完成。
- [已验证] `npm run typecheck`、`npm run test:contracts`（19/19）、统一额度测试（3/3）、`npm run build`、Node/Bash 语法检查、`git diff --check` 通过。
- [已验证] 发布前事后审查修复了无幂等键时相同提示词被错误合并的问题；现在只有调用方明确提供 `Idempotency-Key` 才会复用任务。
- [未验证] 真实账号登录、真实紫域/Agnes 出片、结果落盘、真实扣费/退款、双账号隔离和浏览器全链路尚未执行。
- [未验证] 治理仓 `node scripts/verify.mjs --release` 仍因 scratch New API 预存文档链接及闸门状态未更新而失败；这些不是本次 HB 提交引入的源码错误。
- [已确认] 发布前临时保存的老巴工作台未提交改动已原样恢复，未混入本次提交。

## 2026-09-27 · APIC LDXP 误接入来源审计
- [已验证] `api.liandianpu.cn` 页面标识为“联点/联店铺易支付 API”，不是用户指定的 `www.ldxp.cn` 链动小铺商家后台；7 次错误登录指引来自同一未核实的站点关联假设。
- [已验证源码] scratch 接入代码按该站 `/openapi/pay/create` 与 MD5 规则实现；测试没有访问真实 LDXP。它是未证实供应方的原型，禁止部署。
- [已验证线上] 代码未部署、APIC 未配置 LDXP、未发送支付请求；无已知线上影响。正确 LDXP API 资料仍待从 LDXP 一手渠道核实。
- 权威记录：`docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`。

## 2026-09-27 · LDXP 支付与应用页复查
- [已验证] 用户指定的 `https://www.ldxp.cn/merchant/user/setting` 仍只有账号与安全字段，没有支付 API 凭据。
- [已验证] `https://www.ldxp.cn/merchant/shop/payment` 显示平台聚合支付已开通、微信支付未开通；微信扫码和微信 JSPAY 各为 3% 服务费、次日解冻。页面没有 PID、签名密钥、回调地址或服务端 API 说明。
- [已验证] `https://www.ldxp.cn/merchant/shop/plugin` 只有店铺插件，没有商户 API 接入入口。
- [已验证] 本轮仅查看，未改支付、签约、店铺、APIC 或线上数据。
- [阻塞] 当前 LDXP 后台只提供平台收款渠道，无法据此完成 APIC 服务端订阅支付接入；需要 LDXP 一手提供服务端接口说明和商户凭据。

## 2026-09-27 - Task result persistence repair (published)

- [已在线上生效] 提交 `ca2395f` 已发布，线上 `BUILD_INFO.txt` 为 `canvas-20260928-025558-ca2395f`。
- [已验证] 发布脚本构建前端、部署静态包、重建并启动 `api` 容器；nginx 配置检查与本机回环检查通过。
- [已验证] 公网冒烟：首页 `302`、`/api/health` `200`、未登录任务列表和紫域模型 API `401`、旧 `/ziyu/` 代理入口 `403`。
- [已验证] 权威源码工作区干净；线上 Web、API、Agnes 代理、Postgres 容器均在运行。
- [未验证] 未用登录账号访问任务中心，也未发起真实生成、扣费或退款；本次只确认匿名边界和发布版本。此前记录的上游凭据/额度问题仍未由这次发布解决。
- [待处理] `node scripts/verify.mjs --release` 仍为 `6 PASS / 2 WARN / 2 FAIL`：FAIL 指向 scratch 文档链接和未更新的 slice-001 G4/G5/G6 状态；不是本次 HB 运行时代码测试结果。

## 2026-09-27 - GitHub upstream latest fetched

- [???] ?? `https://github.com/basketikun/infinite-canvas.git` ?? `upstream/main`?
- [???] ????? `dab19adc0847e32e39b7fc8ff90cb392561fb826`?????? 2026-09-23 15:13:29 +08:00?
- [???] ??????????? `E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas-upstream-latest`???? detached HEAD?
- [???] ?????? `E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas` ???????????????????
- [???] ??????????????????????????????

## 2026-09-27 - APIC / LDXP follow-up

- [已验证] 用户完成登录后，已在用户指定的链动小铺商家后台只读核对 5 个日卡和 4 个周卡商品、价格、库存、说明及代表商品发卡设置；未读取卡密明文，未更改商品、库存、订单、收款或 APIC 线上配置。
- [已验证] 复核本地订阅卡密实现的关键文件、登录权限路由、哈希存储、原子兑换、余额不变及前端购买/兑换路径；`git diff --check` 无输出。未发现会阻断当前卡密方案的源码问题。
- [未验证] 本机 Go 安装目录不完整，本轮定向测试无法启动（标准库缺少 `internal/bisect`）；之前记录的 Docker 定向测试通过仍保留为历史记录，本轮未复现。前端完整类型检查既有问题按前条记录。
- [已验证] 治理质量门仍为 7 PASS / 2 WARN / 1 FAIL，失败来自 `scratch/new-api-upstream-20260927` 导入文档的链接扫描，不是 APIC 实现文件。
- [下一步] 现有 9 个商品的说明都指向 `api.lsb0713.online/dashboard/redeem`，归属与 APIC 未确认；现库存不复用。待 APIC 兑换功能部署并通过真实兑换验收后，再创建独立 APIC 卡密批次和店铺商品。
## 2026-09-27 - LDXP merchant product verification

- [已验证] 登录账号显示为“商家0752”；商家商品列表包含 5 个矿泉水 API 日卡（10/20/45/60/90 刀，售价 ¥1/1.9/4/5.2/7.5）和 4 个周卡（45/90/135/180 刀每日，售价 ¥25/48/70/90）。页面库存分别为日卡 20/17/19/18/17、周卡 19/19/20/18。
- [已验证] 日卡 10 刀与周卡 45 刀商品编辑页均写明购买后自动发兑换码，使用入口为 `https://api.lsb0713.online/dashboard/redeem`；周卡说明为有效 7 天、每日刷新对应额度，不是一次性总额。
- [已验证] 代表日卡的编辑设置显示“卡密”商品、支付完成后减库存、顺序发卡；未保存任何编辑。店铺公告禁止商品标题/图片写 GPT/ChatGPT 字样；尚未新建 APIC 商品。
- [当前结论] 旧卡密目标站点不是 APIC 主机名，不能当作 APIC 兑换库存。待 APIC 线上部署与真实兑换验收后另建独立库存。

## 2026-09-27 · LDXP 自配支付官方说明复查

- [已验证] 从链动小铺已登录商家页面打开官方《链动小铺平台商家开店指引（新版）》：平台确有“自配支付渠道”，支持自有 API/自主支付网关，但注明需联系客服手动开通，随后在“店铺 > 支付方式 > 自配支付渠道”配置参数。
- [已验证] 当前商家支付页面没有自配支付入口；显示平台聚合支付已开通、微信支付未开通，微信扫码与微信 JSPAY 启用中。页面仍未提供服务器 API 协议、回调验签资料或商户 API 凭据。
- [用户确认] 用户要求从登录后的网站自行查看，不联系客户服务；本轮未联系、未输入凭据、未改设置、未下单或付款。
- [阻塞] 已确认存在自配支付功能，但官方说明要求人工开通。用户当前不希望联系客户服务，后台又没有配置入口，因此 APIC 真实支付接入不能继续；不得再根据“联点易支付”材料推测 LDXP 协议。
- 权威记录：[`docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`](../docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md)。


## 2026-09-27 - APIC voucher feature deployed and source published

- [USER CONFIRMED] The user authorized deployment of the already-built APIC subscription-code implementation and upload of APIC source to their GitHub.
- [VERIFIED ONLINE] APIC now runs image `apic-subscription-redeem:20260927` (image ID `sha256:3b4255454411a8ef691bd5bb3b708930c93576c1e29ac487ce5842ef82157593`). The app container is healthy; public `/api/status` returns HTTP 200 with `success=true`; unauthenticated admin-code and redeem requests both return HTTP 401.
- [VERIFIED ONLINE] PostgreSQL migration created `subscription_redeem_codes` and the three external-purchase plan fields. Existing plans, voucher codes, subscription orders, and user subscriptions each remain at 0. Public registration and payment settings were not changed.
- [VERIFIED BACKUP] Before rollout, the PostgreSQL custom-format dump was written to `/opt/new-api/backups/apic-before-subscription-redeem.dump` and passed `pg_restore -l`; the previous Compose file and built image archive are also retained under `/opt/new-api/backups/` for rollback/recovery.
- [VERIFIED] Source is in private repository `https://github.com/1008611-creater/apic`, branch `codex/apic-subscription-redeem`, commit `f7aae613810640f0ab4bdd55eab9fe8c105313e2`. The working tree is clean.
- [VERIFIED] Production image build completed. Focused redemption and migration tests passed on SQLite, PostgreSQL 15, and MySQL 8.0.46. Manual post-coding review checked authentication boundaries, digest-only storage, transactional single-use redemption, unchanged wallet balance, shop-link handling, and the deploy/rollback path. The `post-coding-review` skill is not installed in the available skill folders.
- [NOT VERIFIED] No APIC subscription plans or redeem codes have been configured; no separate LDXP products or stock were created. A logged-in user redemption and paid purchase have not been tested. No real payment, payment callback, or automatic wallet crediting was added.
- [NEXT] Configure APIC day/week plans and shop links, issue a separate APIC code batch, then create separate LDXP products and test redemption. Any real checkout amount needs separate agreement before payment.
- Authority: `docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`.

## 2026-09-27 · APIC 订阅兑换接续

- [已验证线上] `https://apic.cauai.fun/api/status` 返回 HTTP 200，`success=true`，注册仍开启。
- [已验证] LDXP 商家0752登录态正常，商品列表包含旧订阅卡与余额卡；本次未修改商品/库存，未下单或付款。
- [待用户操作] APIC 管理员登录态尚未建立。已在浏览器打开 APIC 登录页；用户登录后继续配置套餐和测试卡，再建独立 LDXP 商品。
- [未验证] APIC 登录后的套餐配置、真实用户兑换、独立商品发卡及购买全链路。
- 权威记录：[`docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md`](../docs/STATUS_20260927_APIC_LDXP_SUBSCRIPTION.md)。

## 2026-09-28 - One release-readiness audit

- [VERIFIED ONLINE] `one.cauai.fun/` and `/healthz` return 200. `/auth/hb.html` and `/auth/sd2.html` return 200. `/auth/apic.html` returns 404. `/auth/start?target=hb|sd2` redirect to the login pages; `/auth/start?target=apic` returns 400.
- [VERIFIED ONLINE] The One homepage links the three cards to `hb.one.cauai.fun`, `sd2.one.cauai.fun`, and `apic.one.cauai.fun`. HB redirects to its login page, SD2 redirects to `/home`, and APIC responds with the New API page. This is not a complete shared-login flow.
- [VERIFIED] The local auth-broker source contains an APIC target, but the live One route does not expose `/auth/apic.html`; local source and online behavior are not yet proven to be the same release.
- [VERIFIED] HB has one historical real-generation/settlement acceptance, but task-to-media linking and refund remain unverified. The HB audit still records a server-side billing-bypass risk on direct upstream paths.
- [VERIFIED] APIC service health is online, but no APIC plans/codes or separate shop stock are configured; paid purchase, delivery, and live redemption remain unverified. Unified quota is not enabled in the current runtime records.
- [CURRENT DECISION] Freeze AIGC development. Treat One as the priority entry product. Do not advertise “three products, one account” or public paid generation until APIC login, server-side billing controls, and a complete paid acceptance path are verified.

## 2026-09-28 - One auth broker first repair slice

- [???] ???? `implementation/entry/origin/auth-broker/server.js`??? HB/SD2/APIC ?????????? `/api/session`?
- [???] ????? One ???? JTI?????????????APIC ?????????????????????
- [???] `node --check` ? `node --test implementation/entry/origin/auth-broker/contract.test.mjs` ?????????? mock???????
- [???] ??????? `/auth/apic.html` ?????????? 404??????HB/SD2 ?????? APIC ?????????
- [???] ???????????? G3 ?? owner ?????????????????????? One ???????
- ?????`docs/STATUS_20260928_ONE_AUTH_BROKER_SLICE.md`?


## 2026-09-28 - One implementation slice after owner approval

- [USER CONFIRMED] Owner approved implementation with ??????; G3 permission to modify authoritative HB, SD2, and APIC source is satisfied.
- [LOCAL CHANGES] HB settlement now blocks successful settlement when top-up balance is insufficient; task list/query preserve `billing_blocked`. Agnes submission is blocked unless `AGNES_BILLING_MODE=quota`.
- [LOCAL CHANGES] APIC now has signed One assertion login/logout routes at `/api/user/auth/unified` and `/api/user/auth/unified/logout`; new shadow accounts are ordinary users with zero APIC-local quota.
- [VERIFIED] HB syntax checks, unified quota client tests (3/3), and HB diff check pass. APIC source is gofmt-clean.
- [NOT VERIFIED] No publish performed. APIC Go tests are blocked by the local Go installation missing `C:\Go\src\internal\bisect` source. No online APIC route, unified quota write ledger, real generation, payment, redemption, or promotion has been verified.
- Authority: `docs/STATUS_20260928_ONE_IMPLEMENTATION_SLICE.md`.


## 2026-09-28 - SD2 unified quota billing boundary repair

- [????????] SD2 ???????????????????????????????????????????????????????
- [????????] ????????????SD2 ?????????? 402 / `CREDITS_INSUFFICIENT`???????????
- [????????] ????????????????????????????????????????????????
- [???] SD2 `npm run typecheck` ???`node --test --experimental-strip-types scripts/unified-quota.test.mts` ?? 1/1?`npm run build` ??????????????????????
- [???] SD2 ??? `git diff --check` ???????? CRLF ?????
- [???] ????????????? `NEW_API_QUOTA_URL` / `NEW_API_QUOTA_WRITE_URL` / `NEW_API_QUOTA_TOKEN`??????????????????????????????
- [???] `npm run verify` ?????? WSL `/bin/bash` ?????`npm run verify:win` ???????/???????????????
- Authority: `docs/STATUS_20260928_ONE_IMPLEMENTATION_SLICE.md`.

## 2026-09-28 - One auth broker test stability repair

- [LOCAL CHANGES] `implementation/entry/origin/auth-broker/contract.test.mjs` now allocates an independent free TCP port for the broker instead of using `mockPort + 1`.
- [VERIFIED] `node --check server.js` passed; the unified-auth contract test passed three consecutive runs; Docker Compose configuration passed.
- [VERIFIED] Governance check remains 7 PASS / 2 WARN / 1 FAIL; the only FAIL is the existing broken-link scan under `scratch/new-api-upstream-20260927`, unrelated to this change.
- [NOT VERIFIED] No One deployment, online APIC route, production login, generation, billing, refund, purchase, or promotion was performed.
- Authority: `docs/STATUS_20260928_ONE_AUTH_BROKER_TEST_FIX.md`.
- [VERIFIED] Local auth-broker image build passed (`cauai-auth-broker:review-20260928`); no image was pushed or deployed.

## 2026-09-28 - One auth broker local release package

- [LOCAL ARTIFACT] Prepared `output/one-auth-broker-release-20260928-v1/` with the One origin Caddy config, Compose file, and auth-broker runtime files.
- [VERIFIED] Staged Compose config and auth-broker image build passed; manifest hash check passed; no env/secret/token/password file was included.
- [NOT VERIFIED] Package was not uploaded or deployed. Online APIC entry, production login, billing, generation, payment, redemption, and promotion remain unverified.
- Authority: `docs/STATUS_20260928_ONE_AUTH_BROKER_TEST_FIX.md`.
- [ONLINE VERIFIED] Read-only probes on 2026-09-28: One home/health and HB/SD2 auth pages return 200; APIC auth page returns 404; APIC target start returns 400; APIC health returns 200.
- [DEPLOYMENT PREFLIGHT] Local `implementation/entry/origin/auth.env` is absent and excluded from the package. Production secret presence is unknown and must be checked without reading its value before any release.
- Authority: `docs/STATUS_20260928_ONE_AUTH_BROKER_TEST_FIX.md`.
- [VERIFIED] Staged release image ID: `sha256:85670e760847398948bceda3f3d7651ad3658fbefb70694d479c881646d27a08`; local build only.
- [ONLINE VERIFIED] Read-only production check: One auth.env and HB api.env contain the unified secret key; secret values were not read. The running SD2 container lacks `UNIFIED_AUTH_SECRET` and `UNIFIED_AUTH_ORIGIN`.
- [BLOCKED BEFORE DEPLOY] One cannot be released alone for complete shared login; SD2 server configuration must be included in the same controlled release. No container or production configuration was changed.

## 2026-09-28 - One + SD2 联合发布预检

- [已验证] SD2 `npm run typecheck`、Compose 配置检查、统一额度样例测试、`npm run build` 均通过；构建产物包含统一认证入口和统一额度相关路由。
- [已验证] SD2 统一认证最小配置改动为 4 行：`.env.docker.example` 增加 `UNIFIED_AUTH_SECRET` / `UNIFIED_AUTH_ORIGIN`，`docker-compose.yml` 将两项传入 app。
- [已验证] One auth-broker 语法检查与 mock-only 契约测试通过；本轮没有连接真实服务、没有产生上游费用。
- [阻塞] SD2 工作树当前有 29 个修改或新增路径，尚未冻结成可回滚的正式候选包；不能直接发布。
- [未验证] 尚未上传、重建或重启线上 SD2；尚未做线上统一登录、跨站退出、真实扣费、退款、兑换码或生成验收。
- Authority: `docs/STATUS_20260928_ONE_SD2_PREFLIGHT.md`。
## 2026-09-28 - SD2 One / 统一认证 / 统一额度候选包冻结

- [已验证] 本地候选包已生成：`output/sd2-one-auth-quota-candidate-20260928-v1/`。
- [已验证] 包含 17 个范围内源文件、基线提交、差异补丁、工作树清单、范围说明和校验清单；SHA-256 校验 0 个不匹配。
- [已验证] 范围覆盖统一登录/退出、SD2 统一认证变量、统一额度读取/预扣/退款和相关任务扣费接口；没有包含真实密钥或数据库。
- [阻塞] SD2 工作树仍有 29 个修改或新增路径；候选包是范围冻结结果，不是完整可发布构建包。
- [未验证] 尚未上传、重建、重启或写入生产配置；尚未做线上统一登录、跨站退出、真实扣费、退款、兑换码或生成验收。
- Authority: `docs/STATUS_20260928_SD2_ONE_AUTH_QUOTA_CANDIDATE.md`。
## 2026-09-28 - 候选包 v2 与额度对账修复

- [已验证] SD2 本地修改已重新检查：类型检查、统一额度样例测试、生产构建、Compose 配置检查和差异空白检查均通过。
- [已验证] 修复了统一额度预扣成功后本地账本写入失败的补偿退款路径；补偿失败会明确标记需要对账，并阻止任务继续提交。
- [已验证] 修复了紫域任务创建失败时静默吞掉退款错误的问题；退款失败会把任务标记为 `REFUND_RECONCILIATION_REQUIRED` 并返回服务错误。
- [已验证] 新候选包：`output/sd2-one-auth-quota-candidate-20260928-v2/`，包含 17 个范围内源文件、候选说明、差异补丁和工作树清单。
- [已验证] 候选包清单包含 21 个文件；SHA-256 校验 0 个不匹配；敏感文件名扫描 0 个命中；工作树仍有 29 个修改或新增路径。
- [未验证] 没有上传、部署、重启线上 SD2，没有写入生产统一认证变量，没有执行真实登录、扣费、退款、兑换码或生成验收。
- [阻塞] v2 仍是本地范围冻结候选，不是最终发布包；发布前还需完整构建包、线上备份点、生产配置和逐产品真实费用批准。

## 事后复核

- [已验证] 候选包内 17 个源文件与 SD2 当前工作树逐一比对，0 个不一致。
- [已验证] 差异补丁包含“预扣后账本失败补偿退款”和“退款失败需要对账”两条修复路径。
- [已验证] 统一额度真实调用链为：接口取得当前用户邮箱 → 服务端预扣 → 写本地任务账本 → 提交紫域；提交失败先退款，退款失败明确阻断并记录任务状态。
- [已验证] 候选包哈希 0 个不匹配，敏感文件名扫描 0 个命中。
- [已验证] 治理检查仍为 7 项通过、2 项提醒、1 项失败；唯一失败是既有 `scratch/new-api-upstream-20260927` 文档断链，与本轮 One/SD2 修复无关。
- [未验证] 没有连接生产服务，因此真实线上返回、生产账本对账和真实费用链路仍未确认。

## 2026-09-28 - 紫域媒体归属链修复

- [已验证] 两个紫域媒体接口现在先按当前用户查找任务，再使用任务记录中的上游任务编号读取预览；不会再把内部任务编号直接发给上游。
- [已验证] 没有上游访问的静态检查确认任务列表、任务详情和媒体读取都带当前用户归属条件。
- [已验证] 修复后重新通过类型检查、统一额度样例测试、生产构建、Compose 配置检查和差异空白检查。
- [已验证] 候选包 v2 已刷新；哈希 0 个不匹配，候选源文件与当前工作树 0 个不一致。
- [未验证] 仍未连接真实紫域服务，所以上游真实媒体返回和线上用户隔离尚未做浏览器验收。



## 2026-09-28 - One 统一退出失败处理

- [已改动] One 的退出请求现在会分别调用 HB、SD2、APIC 和 New API，任一个失败都不再返回成功。
- [已改动] 本地 One 会话仍会清除，同时返回明确的退出失败页，并记录失败产品。
- [已验证] `node --check implementation/entry/origin/auth-broker/server.js` 通过；`node --test implementation/entry/origin/auth-broker/contract.test.mjs` 通过。
- [已验证] 契约测试覆盖：三站全部成功、单个产品失败、New API 失败。
- [待核验] 本次没有连接线上站点，没有发布、重启或真实登录。
- [阻塞] 线上仍未完成统一登录、跨站退出和统一额度验收。
- Authority: `docs/STATUS_20260928_ONE_LOGOUT_FAILURE.md`; `implementation/entry/origin/auth-broker/server.js`; `implementation/entry/origin/auth-broker/contract.test.mjs`.
- [已验证] 新的本地候选包：`output/one-auth-broker-release-20260928-v2/`，6 个文件哈希全部一致。
- [已验证] 重新校验 SD2 候选包 v2：21 个文件清单、哈希和源文件与当前工作树均一致，不一致数 0个。

## 2026-09-28 - SD2 完整构建预检阻塞

- [已验证] 按候选包 v2 内已审查的 17 个文件，在基线 `4d12e46ffaa4a0da6196a529f10f1efc4244a662` 上构建干净候选源码。
- [已验证] 候选源码中的 17 个叠加文件与已冻结候选包一致，不一致数 0个；未包含非示例 `.env` 文件。
- [阻塞] Dockerfile 要求的 `public/media/generated/workbench-luxury-nocturne-c-rh/workbench-mineral-flow-v2.mp4` 在当前工作树和 Git 历史都不存在；构建在终端存在性检查失败，未生成镜像。
- [待核验] npm 提示 7 个现有依赖安全问题（1 中危、5 高危、1 中等），需独立复核。
- [待用户决定] 继续前需获得该公开视频素材：提供原文件，或明确允许仅从生产 app 镜像只读取这个文件。
- [未验证] 没有发布、重启、联网生成或计费测试。
- Authority: `docs/STATUS_20260928_SD2_FULL_BUILD_PREFLIGHT.md`; `output/sd2-one-auth-quota-release-20260928-v1/`.

## 2026-09-28 - SD2 快照备份与清理受阻

- [已验证] 已创建 SD2 展开候选源码压缩包；1906 个文件逐一 SHA-256 一致，展开目录仍保留。
- [用户确认] Owner 已允许删除已备份的展开源码目录；执行时自动审批策略返回 `blocked by policy`，未删除任何文件，具体策略原因未提供。
- [未通过] 展开目录仍使治理质量门命中源码测试内容与断链；命中项未复核，不称为误报。
- [阻塞] 清理操作被工具策略拒绝；SD2 Docker 构建还缺少 `workbench-mineral-flow-v2.mp4`。无线上变更。
- Authority: `docs/STATUS_20260928_SD2_FULL_BUILD_PREFLIGHT.md`。

## 2026-09-28 - SD2 本地完整镜像构建通过

- [已验证] 按用户在明确说明单文件只读提取后回复“继续”，仅从线上 SD2 app 容器取回 Dockerfile 缺失的公开 MP4；本地副本 2,311,662 字节，SHA-256 与线上一致。
- [已验证] 本地 Docker 镜像构建成功：`niannian-sd2:one-auth-quota-preflight-20260928`，ID `sha256:1fd8d94c0d0c1bcccde34458330c4dd6d0b5e3976eee1b1b95aa7a9a6b9d763b`。
- [已验证] Next.js 生产构建、Dockerfile 素材检查、最终镜像导出通过；只读无网络检查确认镜像内 MP4 哈希与线上一致。
- [已验证] 完整候选源码压缩包 1907 文件逐一校验一致。
- [未验证] 没有启动候选应用做真实数据库/浏览器验收；7 项依赖安全告警待复核。无发布、重启、生成或收费。
- [阻塞] 治理仓质量门仍因展开候选源码目录失败；目录删除已获用户授权，但工具策略拦截，目录仍在。此前检查 6 PASS / 2 WARN / 2 FAIL。
- Authority: `docs/STATUS_20260928_SD2_FULL_BUILD_PREFLIGHT.md`; `output/sd2-one-auth-quota-release-20260928-v1/`。

## 2026-09-28 - SD2 候选依赖加固与全量本地验收

- [已验证] 候选 Next.js 升至 `15.5.26`、PostCSS 覆盖升至 `8.5.28`；候选 `npm audit` 为 0 项漏洞。
- [已验证] 新候选镜像构建成功：`niannian-sd2:one-auth-quota-preflight-20260928-v2`；容器内 `npm run verify` 全通过，统一额度契约测试 1/1 通过。
- [已验证] 隔离容器健康页和首页返回 200，未登录 providers 返回 401；镜像内素材哈希与线上只读取回值一致。
- [已验证] 源码归档 v2：1907 个文件逐一哈希一致。构建 manifest：`output/sd2-one-auth-quota-release-20260928-v1/BUILD_MANIFEST_20260928.md`。
- [未验证] 未连接真实数据库做统一登录、额度、退款、兑换验收；无发布、重启或真实生成收费。
- [阻塞] 治理仓质量门仍 6 PASS / 2 WARN / 2 FAIL；用户授权清理的展开源码目录仍因工具策略被拦截而保留，需用户在文件管理器手动删除后重跑。
- Authority: `docs/STATUS_20260928_SD2_FULL_BUILD_PREFLIGHT.md`。

## 2026-09-28 - SD2 展开快照清理后复查

- [用户确认] 用户确认已在本机删除展开的候选源码目录；完整压缩归档仍保留。
- [已验证] 重新运行治理检查：7 项通过、2 项提醒、1 项失败。展开目录相关敏感串命中已消失。
- [阻塞] 唯一失败及两项提醒都来自导入的 `scratch/new-api-upstream-20260927` 文档链接、路径引用和索引检查。
- [未验证] One/SD2 线上统一登录、统一额度写入、退款、兑换与真实生成未验收；无发布、重启或费用操作。
- Authority: `docs/STATUS_20260928_SD2_FULL_BUILD_PREFLIGHT.md`。

## 2026-09-28 - SD2 隔离数据库、版本标识复核与会话边界检查

- [已验证] 断外网的临时容器和一次性 PostgreSQL 17 检查：健康 200、未登录 providers 401、无效账号登录 401；数据库表已建立。
- [已验证] 健康响应实际显示 `niannian-sd2-one-auth-quota-20260928-rc1` 与 `2026.09.28-sd2-one-auth-quota-rc1`；先前“仍是旧版本标识”的判断有误，版本标识不再列为阻塞。
- [已验证] 隔离运行时：无 Cookie 会话读取返回 `user: null`；畸形统一登录断言返回 401 `UNIFIED_INVALID`。One 中转站契约测试通过（mock，不访问真实站点）。
- [未验证] One 到 SD2 的成功统一登录、账号映射、跨站退出和双会话撤销尚未通过有效断言验收；受控成功路径脚本被执行策略拒绝，未运行。
- [已清理] `codex-sd2-final-app`、`codex-sd2-final-db`、隔离网络及两张诊断镜像已删除；候选归档和 `niannian-sd2:one-auth-quota-preflight-20260928-v2` 保留。
- [清理受阻] 临时构建源码目录和指针仍保留；删除命令被执行策略拦截，未说明具体原因。
- [未发生] 未连接生产数据库、One 或生成上游；未部署、重启线上、兑换、扣费或真实生成。
- Authority: `docs/STATUS_20260928_SD2_FULL_BUILD_PREFLIGHT.md`。
## 2026-09-28 - APIC 统一退出校验阻塞

- [已验证] 静态检查 APIC `controller/auth_unified.go`：`UnifiedLogout` 忽略统一断言校验错误，任何断言最终都返回 HTTP 200；One 因此可能误判 APIC 退出成功。
- [未验证] 未连接 APIC 真实运行时；结论来自候选源码静态检查。
- [阻塞] 需在 APIC 权威源码中拒绝无效、重复、过期退出断言，并补充运行时测试；当前未改源码、未发布。
- [线上影响] 目前不影响线上，线上仍是旧版本。
- Authority: `E:\codex\apic-ldxp-redeem\controller\auth_unified.go`; `docs/STATUS_20260928_ONE_IMPLEMENTATION_SLICE.md`.

## 2026-09-28 - APIC 统一退出断言校验修复

- [本地已改但未发布] 已获 owner 明确批准，修改 APIC 权威源码 `E:\codex\apic-ldxp-redeem\controller\auth_unified.go`：统一退出现在先验证断言；无效/过期返回 401，重放返回 409，统一认证未配置返回 503；只有有效断言才撤销 APIC 会话并清理 Cookie。
- [本地已改但未发布] 新增 `controller/auth_unified_test.go`，覆盖无效、过期、有效、重复断言，以及无效断言不清理 Cookie、有效断言清理 Cookie。
- [已验证] 两个 Go 文件已 `gofmt`，文件无 BOM；已运行 `git diff --check`，现有已跟踪改动未发现空白错误。定向测试 `go test ./controller -run 'TestUnifiedLogout|TestConsumeUnifiedAssertion' -count=1` 通过。
- [未通过] 完整 `go test ./controller -count=1` 仍有既有 SQLite 审计数据库清理/锁定失败（如 `TestAuditDatabaseMatrix`、`TestSecurityLogin*`、`TestTelegramOAuth*`、`TestAPITokenAuditDatabaseMatrix`）；本次新增统一退出定向测试通过，未发现本次改动引入的失败。
- [未发生] 未发布、未重启、未连接真实 APIC、未进行真实登录/退出或费用操作。线上目前不受影响，仍运行旧版本。
- Authority: `E:\codex\apic-ldxp-redeem\controller\auth_unified.go`; `E:\codex\apic-ldxp-redeem\controller\auth_unified_test.go`; `docs/STATUS_20260928_ONE_IMPLEMENTATION_SLICE.md`。


## 2026-09-29 - APIC ??????????????? controller ??

- [????????] APIC `UnifiedLogout` ????????/?? 401??? 409???????? 503????????????? Cookie?
- [???] ???????????SQLite ??/????????? `go test ./controller -count=1` ???70.880 ???
- [????] ??????????????? APIC????????????????
- [???] ??????????? APIC ??????? One ???????????
- Authority: `docs/STATUS_20260928_ONE_IMPLEMENTATION_SLICE.md`; `E:\codex\apic-ldxp-redeem\controller\auth_unified.go`.
- [????] `go test ./router -count=1` ??????????? 7 PASS / 2 WARN / 1 FAIL??? FAIL ? scratch ?????????? APIC ?????

- [???] One/APIC mock ???????? `scratch/new-api-upstream-20260927` ?????????????????? `E:\codex\apic-ldxp-redeem`?????? APIC ?????logout purpose?????? Cookie ???`node --check` ? mock-only ???????

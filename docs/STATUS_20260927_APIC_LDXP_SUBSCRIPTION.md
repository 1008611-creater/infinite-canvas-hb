# APIC 链动小铺支付与 McGrox 订阅接入核查

- Audit date: 2026-09-27
- Targets: `https://apic.cauai.fun`, `https://wzyp.cn/shop/B59CCLX7`
- Goal: connect Liandianpu merchant payment, sell subscriptions only, and follow McGrox day/week cards


## Latest status - 2026-09-27

This section supersedes the older automatic-payment integration notes below for the selected manual-code flow.

- [USER CONFIRMED] The intended flow is APIC plan selection, external shop purchase, then manual code redemption in APIC. This is manual voucher redemption; no payment callback, automatic payment crediting, or balance top-up is in scope.
- [LOCAL VERIFIED] Implementation is on `codex/apic-subscription-redeem` in `E:\codex\apic-ldxp-redeem`, based on the matching official New API `v1.0.0-rc.38` commit `2906e4f779b715f282ae11203211dca77051d5af`. The earlier unverified EPay candidate was not reused.
- [LOCAL VERIFIED] Codes are one-time and stored as SHA-256 digests. Authenticated redemption checks expiry/status and consumes the code while creating the mapped subscription in one transaction. Focused tests cover concurrent reuse, repeat/expired/unknown codes, and unchanged wallet quota. Admin issue/list/revoke operations require admin authentication.
- [LOCAL VERIFIED] APIC plans support HTTPS shop URLs and a displayed shop price/currency. The wallet has a subscription-code redemption form; the balance top-up panel is hidden. No LDXP API call or callback code was added.
- [LOCAL VERIFIED] Docker Go builder build, production frontend build, focused Go tests, controller/router compile checks, shop URL validation, and targeted frontend lint/format checks passed.
- [PARTIAL] Full frontend typecheck still reports two errors in unchanged billing-expression tests: a missing `pkg/billingexpr/testdata/frontend_simulation.json` fixture and a Vitest callback type mismatch. No typecheck errors were reported in changed files.
- [LIVE VERIFIED IN MERCHANT UI 2026-09-27] The logged-in LDXP merchant page is `??0752`; its store-link page identifies the exact public shop `B59CCLX7`. The public shop has a `???API??` category with 9 day/week products. Current merchant product rows show 17?20 cards in stock per subscription SKU; all 9 prices match the table below. No inventory-code contents were opened or read.
- [LIVE VERIFIED IN MERCHANT UI 2026-09-27] Representative day-card and week-card checkout details say the buyer receives a code automatically, to redeem in the ????API? backend; the day card grants 1 day and refreshes the listed daily quota, while the week card grants 7 days and refreshes quota daily. The day-card edit page use instructions point to `api.lsb0713.online/dashboard/redeem`; the requested production APIC page is `apic.cauai.fun` and opens New API on that distinct host. This is a domain mismatch. Do not reuse the existing codes or redirect their instructions to APIC until the owner confirms the domains are intentionally the same service and the stock is APIC-compatible. No raw codes were viewed.
- [UNVERIFIED] Whether `api.lsb0713.online` is an authorized alias for `apic.cauai.fun`, and whether any existing card stock can be redeemed by APIC, remain unverified. APIC plan shop links/prices remain unconfigured. No product edit was saved, no inventory was changed, and no order or payment was submitted. No production deployment or live APIC redemption was performed.
- [GOVERNANCE CHECK] On 2026-09-27, `node E:\codex\huabu\scripts\verify.mjs` reported 7 PASS / 2 WARN / 1 FAIL. The failure is the existing broken-link scan in imported `scratch/new-api-upstream-20260927` documentation; the two warnings are also within that imported source tree. No APIC production files or configuration were changed.
- [PARTIAL] A fresh rerun of focused Go tests in a clean Go 1.26.1 container did not finish within about seven minutes and was interrupted; an earlier implementation run recorded these focused tests passing. The rerun result is inconclusive, not a failure result. The repository Go toolchain on this machine is too old for the declared Go 1.25.1 module and cannot run the test directly.
- [REVIEW] The `post-coding-review` skill was not present in the available skill directories. A manual review checked the changed status records against the code paths, auth-protected routes, transaction, digest-only persistence, wallet balance behavior, and available test/build results.
- [NEXT] Keep the existing nine subscription products and their stock untouched. First resolve the mismatch between the LDXP product instructions and the requested APIC hostname. If the old redemption host is not an authorized alias for APIC, deploy the APIC voucher feature, issue a separate APIC code batch, and create separately identified LDXP products using the verified tier prices. Do not submit a real payment until the test amount is explicitly agreed.

## Conclusion

尚未核实链动小铺（LDXP）是否向该商户账号提供可供 APIC 调用的正式支付 API。此前把 `api.liandianpu.cn` 当作 LDXP 接口来源是错误归属；本地适配代码依照该站的易支付文档编写，不能视为已接入 LDXP，也不得部署。线上 APIC 未改。

## Current impact

- [Verified] Shop `B59CCLX7` is readable. Its product API returns 28 products, including 9 API subscription products.
- [Verified] The 9 subscription products match the McGrox-style tiers: day cards 10/20/45/60/90 dollars and week cards 45/90/135/180 dollars per day.
- [Verified] The public shop currently exposes WeChat QR payment.
- [Verified] APIC native subscription payment uses an EPay-compatible interface. `PayAddress`, `EpayId`, `EpayKey`, and `PayMethods` are empty online.
- [Verified] APIC subscription plans, orders, top-ups, user subscriptions, and redemptions are all 0.
- [已失效] 曾把 `api.liandianpu.cn` 的 `/openapi/pay/*` 文档当成 LDXP 官方接口；该站页面显示“联点科技/联店铺-易支付-API接口”，没有证据证明它属于用户的链动小铺商户。
- [Verified] `/opt/new-api/.env` currently has no Liandianpu merchant credentials or equivalent payment configuration.
- [Verified] This round did not modify the APIC database, payment configuration, plans, prices, containers, or public registration setting.

## Existing shop products (verified in the merchant UI; not yet applied to APIC)

| Product | Product ID | Price (CNY) | Stock shown in merchant UI | Mechanism |
|---|---|---:|---|
| Day card 10 dollars | `qxi4h0` | 1 | 20 | 1 day, 10 dollars refreshed daily |
| Day card 20 dollars | `sproll` | 1.9 | 17 | 1 day, 20 dollars refreshed daily |
| Day card 45 dollars | `68emvp` | 4 | 19 | 1 day, 45 dollars refreshed daily |
| Day card 60 dollars | `wpph7b` | 5.2 | 18 | 1 day, 60 dollars refreshed daily |
| Day card 90 dollars | `4s48wm` | 7.5 | 17 | 1 day, 90 dollars refreshed daily |
| Week card 45 dollars/day | `jsbzxl` | 25 | 19 | 7 days, 45 dollars refreshed daily |
| Week card 90 dollars/day | `7v6uz4` | 48 | 19 | 7 days, 90 dollars refreshed daily |
| Week card 135 dollars/day | `j8f7kn` | 70 | 20 | 7 days, 135 dollars refreshed daily |
| Week card 180 dollars/day | `oepxni` | 90 | 18 | 7 days, 180 dollars refreshed daily |

Stock counts were observed in the merchant product list, but card plaintext was not inspected. The purchase dialog for representative day and week tiers showed CNY prices plus platform fees; the table records listed product prices only.

## Owner decisions required

1. Provide the Liandianpu merchant `pid`.
2. Do not paste the signing secret in chat. Write it securely to the server file `/opt/new-api/.env`.
3. Explicitly authorize deployment with the phrase `APPROVE DEPLOYMENT` (the Chinese approval phrase is acceptable too), including one real test order.
4. Pricing scope is now fixed by the user instruction: subscriptions only, no balance top-ups, McGrox day/week daily-reset mechanism, and CNY 1 mapped to USD 1 of the corresponding displayed quota. This means the current old shop prices cannot be reused as-is.

## Next actions after credentials and approval

1. Implement an EPay-compatible bridge in a non-production workspace.
2. Convert APIC subscription orders into Liandianpu merchant API orders.
3. Verify callback signatures, amount, product, status, timestamp, and idempotency before activating an APIC subscription.
4. Configure APIC to expose subscriptions only, with no balance top-up route.
5. Run one test order covering payment, callback, activation, daily reset, duplicate notifications, and failed-order non-crediting.

## Unverified

- Merchant credentials and available payment method code have not been configured.
- No real Liandianpu order or APIC subscription activation has been run.
- No production payment or price change has been made.

## 2026-09-27 follow-up: merchant credential discovery

- [Verified] The user's logged-in `www.ldxp.cn/merchant` session is active as merchant `cau_ai` / shop `商家0752`.
- [已验证] 用户实际使用的链动小铺商家后台在 `www.ldxp.cn`；用户指定的账号设置入口是 `/merchant/user/setting`。已查看页面没有显示外部支付 API 凭据。
- [已失效] `api.liandianpu.cn/merchant/login` 不是已验证的链动小铺商户入口；此前称其为“官方 API 商户中心”没有依据。
- [Verified] No credential was entered, no external account was changed, and no APIC server or production configuration was modified in this browser step.
- [已失效] 曾要求用户登录上述错误站点。用户无需再访问该站；正确后台地址已由用户指出。

## 2026-09-27 follow-up: owner-directed LDXP dashboard check

- [用户确认] 正确商家后台在 `https://www.ldxp.cn/merchant/dashboard/workplace`；用户还明确指出账号设置入口是 `https://www.ldxp.cn/merchant/user/setting`。`api.liandianpu.cn` 不应再作为 LDXP 入口或接口来源。
- [已验证] In the LDXP dashboard, payment settings show platform aggregation payment enabled; WeChat QR and WeChat JSPAY are active with a 3% service fee each.
- [已验证] The wallet page labels the WeChat aggregate collection account as “未签约完成”; the “前往查看” control did not open a visible detail page.
- [已验证] The LDXP account settings page shows account/security fields only; no API PID or signing key is displayed there. No merchant credentials were copied or transmitted.
- [已验证] This inspection made no payment-setting, contract, account, price, APIC, or production change.
- [待核验] The LDXP dashboard surfaces inspected do not expose an external API merchant `pid` or signing secret. APIC integration remains blocked until the actual API merchant credentials are found through an authorized account interface or supplied securely to the server.

## 2026-09-27 follow-up: payment and application pages rechecked

- [已验证] The user-specified account page `https://www.ldxp.cn/merchant/user/setting` shows only account and security fields; it has no payment API credentials.
- [已验证] The directly reachable LDXP payment page `https://www.ldxp.cn/merchant/shop/payment` shows platform aggregation payment as enabled, WeChat payment as not enabled, and WeChat QR/JSPAY as enabled with a 3% service fee and next-day release. It does not show a server-side API PID, signing key, callback address, or external API documentation.
- [已验证] The LDXP application-management page `https://www.ldxp.cn/merchant/shop/plugin` lists shop plugins only; no merchant API credential or payment API integration entry is exposed there.
- [已验证] This check was read-only. No payment channel, contract, shop setting, account, APIC configuration, or production data was changed.
- [阻塞] The current LDXP merchant portal provides platform payment channels, not the server credentials needed to let APIC create and verify subscription orders. We still need an LDXP-provided server API specification and credentials through an authorized channel before implementing or deploying a real integration.

## 2026-09-27 · APIC 本地接入实现与复核

- [已验证] 在非生产副本 `scratch/new-api-upstream-20260927` 中加入 LDXP 签名下单、仅供订阅使用的支付接口、回调 PID/签名/支付状态/方式/金额校验，以及调用现有订阅完成逻辑；浏览器返回页只显示状态。
- [已验证] 购买界面可显示 LDXP 支付方式；没有新增余额充值入口。只有启用开关、凭据、API 地址和允许的支付方式都配置完整后，才会对用户显示。
- [已验证] 如果创建订单请求结果不确定，订单保持待支付，避免请求超时但 LDXP 已建单时，迟到的有效回调无法完成订阅。没有有效成功签名回调时不会激活订阅。
- [已验证] LDXP 服务测试、controller/router 编译检查、前端类型检查、定向 lint、LDXP 接口测试和 Dockerfile 生产镜像本地构建均通过。
- [已验证] 治理仓质量门为 7 PASS / 2 WARN / 1 FAIL；唯一失败是导入 scratch 文档内原有的断链，代码扫描和敏感串扫描通过。
- [已验证] 本机 Go 工具链不完整，因此 Go 测试使用项目指定的 Docker Go 镜像执行；本轮未向 LDXP 发起真实 API 请求。
- [未验证] 该 scratch 副本尚未确认为 APIC 权威部署源码；尚未配置商户 PID/签名密钥、完成收款签约、配置 APIC 套餐或进行真实订单/回调验收。
- [待用户决定] 部署前仍需确认权威源码位置、通过服务器安全途径配置商户凭据并确认收款签约状态；发布和真实小额付款仍须另行明确授权。
- [已完成事后复核] 已检查改动文件及从订阅界面、下单、签名回调、订阅入账到浏览器返回的完整路径。环境未安装 `post-coding-review` 技能，因此按实际文件和运行路径完成了人工复核。
## 2026-09-27 · 线上接入预检

- [已验证线上] `apic.cauai.fun/api/status` 有响应；当前运行镜像为 `calciumion/new-api@sha256:0a4d62b1b2b796a43a5e0ef92d49f12e0f229ab206b8f5a3a4cd42990121bfe1`，持久化数据挂载在 `/opt/new-api/data` 与 `/opt/new-api/logs`。
- [已验证线上] `/opt/new-api` 只有部署目录，不是 Git 源码仓；该目录 `.env` 中没有 `LDXP_ENABLED`、`LDXP_PID`、`LDXP_KEY`、`LDXP_API_BASE_URL`、`LDXP_PAYTYPES` 配置。本次只核查字段是否存在，未读取密钥值。
- [已验证线上] 服务器 `/tmp` 下发现 3 份干净的 New API 临时源码副本，均来自官方仓、HEAD 为 `c2b7a9a9e0b5`；它们不是 `/opt/new-api/docker-compose.yml` 引用的部署目录，也没有证据证明是当前镜像的构建源。当前镜像标记源码版本为 `v1.0.0-rc.38`、revision `2906e4f779b7`，因此不能把这些临时副本直接当作线上权威源码部署。
- [已验证线上] `/srv/ans-platform` 是 ANS 产品，不是 APIC，不能混用。服务器扫描中出现的 `/opt/infinite-canvas/api/api.env` 里的 `LDXP_REDEEM_SECRET` 属于无限画布卡密兑换；`LDXP_API_KEY` 只出现在 DeepTutor 的 `secrets.template.env` 模板。这些都不是 APIC 的链动小铺商户 PID/签名密钥；没有读取或复制任何密钥值。
- [已确认] 本次线上预检没有改 compose、环境变量、镜像、容器或数据库。
- [阻塞] 没有 APIC 权威源码和 LDXP API 凭据，且此前 LDXP 钱包页显示收款签约未完成；现在无法让真实支付入口在 APIC 上工作。发布空配置镜像也不会接通支付。

## 2026-09-27 follow-up: APIC server source and credential search

- [已验证线上] `/opt/new-api` remains deployment-only. Docker Compose points to `/opt/new-api/docker-compose.yml`; the running application image is official New API `v1.0.0-rc.38` with revision `2906e4f779b7`. No Git checkout or LDXP merchant configuration is present there.
- [已验证线上] Three clean official New API checkouts exist under temporary `/tmp/tmp.*` directories at `c2b7a9a9e0b5`. They are not referenced by the running Compose project and their revision does not match the running image; no evidence makes them the production source of truth.
- [已验证线上] The only server-side LDXP-like settings found belong to unrelated products: an infinite-canvas card-redemption secret and DeepTutor template placeholders. Their values were not read. They cannot be reused as APIC merchant credentials.
- [已验证] No server file, active APIC container configuration, or deployment checkout yielded the LDXP API merchant PID/signing key. No server or APIC files were changed, and no real payment request was sent.
- [阻塞] Actual LDXP payment activation still requires the merchant API PID/signing key and completed receiving-account contract. The server does not contain these items; using the unrelated canvas secret or DeepTutor template would be incorrect.
## 2026-09-27 · 严查纠错：LDXP 与联点易支付被混为一谈

- [用户确认] 用户实际要接入的是链动小铺（LDXP），并已明确纠正正确后台为 `https://www.ldxp.cn/merchant/user/setting`。此前反复让用户打开 `api.liandianpu.cn/merchant/login` 是错误指引；粘贴的会话记录中该登录地址出现 7 次。
- [已验证] 粘贴记录中 `api.liandianpu.cn` 登录页标题为“联点科技-易支付-API接口”，页面正文称“联店铺-易支付-API接口”。没有第一方证据证明它与用户的链动小铺商家账号、支付渠道或订单系统有关；之前称其为“LDXP 官方 API 商户中心”属于未经核实的错误结论。
- [已验证源码] 本地候选 `service/ldxp_payment.go` 固定调用 `/openapi/pay/create`，按上述易支付文档生成 MD5 签名；`.env.example` 中 API 地址为空、启用开关为 false。测试只验证本地签名逻辑和配置检查，没有连真实 LDXP，也没有真实订单/回调测试。
- [已验证线上] 该候选代码没有部署；APIC 线上没有 LDXP 环境配置。本轮服务器检查未改任何文件或容器，也未向任何支付服务发请求，所以目前没有线上付款或凭据外传影响。
- [当前结论] 把这份本地候选称为“LDXP 已接入”是错误的。暂停部署，先从用户指定的 LDXP 商家后台或 LDXP 官方客服取得其真实的服务端下单、订单查询、回调验签说明；拿到可核对的一手资料后再重做适配。
- [未验证] LDXP 是否提供外部服务器支付 API、其实际域名、签名规则、商户参数和收款签约要求；之前从其他网站推导出的这些字段一律不再作为依据。


## 2026-09-27 - Local APIC subscription voucher implementation

- [USER CONFIRMED] The selected customer flow is: choose an APIC day/week subscription, purchase a shop card, then redeem it in APIC. This is manual voucher redemption; it does not include payment callbacks or wallet top-ups.
- [LOCAL VERIFIED] Changes are in `E:\codex\apic-ldxp-redeem`, branch `codex/apic-subscription-redeem`, based on official New API `v1.0.0-rc.38` / commit `2906e4f779b715f282ae11203211dca77051d5af`. The old scratch payment implementation was not used.
- [LOCAL VERIFIED] Batch-issued one-time codes store only SHA-256 digests. Plaintext is returned only once at issuance. Authenticated redemption checks expiry and status, marks the code redeemed and creates the mapped subscription in one transaction; concurrent use is limited to one success. The subscription uses the existing plan mechanism and does not increase wallet quota.
- [LOCAL VERIFIED] Added admin generate/list/revoke endpoints and UI, per-plan HTTPS shop URL/price/currency fields, shop purchase links, and a wallet subscription-code redemption form. Balance top-up UI is hidden. No LDXP API protocol, payment callback, or automatic payment processing was added.
- [LOCAL VERIFIED] Docker builder stage completed, including production web build and Go build. Focused redemption tests passed for valid redemption, expiry/unknown codes, reuse rejection, concurrent redemption, and unchanged wallet balance. Controller/router compile checks and targeted frontend lint/format checks passed.
- [PARTIAL] Full frontend typecheck still reports pre-existing issues in unrelated test files. The rerun no longer reports the wallet refresh-state error introduced during implementation.
- [UNVERIFIED] This turn did not recheck current shop product prices, descriptions, or fulfillment settings. Shop links/prices remain unconfigured. No real purchase, card delivery, live APIC redemption, or production deployment was performed. Production is unchanged.
- [NEXT] Recheck the actual day/week shop products and fulfillment, configure the corresponding APIC plan links/prices, and test a generated card through the purchase-to-redemption path. Keep deployment separate until that review and test are complete.

## 2026-09-27 follow-up: visible merchant login and post-coding review

- [已验证] 用户完成登录后，在指定的 `www.ldxp.cn` 商家后台只读检查商品和设置；未读取或保存登录信息。
- [已验证] 本轮复核卡密数据模型、兑换事务、管理员及用户路由权限、订阅创建调用、购买链接与兑换界面；卡密只存摘要，兑换码消费和订阅创建在同一事务，成功兑换不增加钱包余额。`git diff --check` 通过。
- [未验证] 本轮 Go 定向测试因本机 Go 标准库安装不完整而未能启动（缺少 `internal/bisect`）；先前记录的 Docker 测试通过没有在本轮重跑成功。APIC 仍未部署，真实购买/发卡/兑换路径仍未验收。
- [已验证] 治理质量门为 7 PASS / 2 WARN / 1 FAIL；失败与两项警告来自 `scratch/new-api-upstream-20260927` 导入源码文档链接及索引扫描。
- [下一步] 已确认现有商品兑换说明指向 `api.lsb0713.online`，与 APIC 关联未确认；现有库存不复用。待 APIC 部署并完成真实兑换验收后，再建立 APIC 独立卡密库存与商品。
## 2026-09-27 follow-up: logged-in shop product verification

- [已验证] 商家账号名称为“商家0752”。商品列表当前显示 5 个日卡（10/20/45/60/90 刀，售价 ¥1/1.9/4/5.2/7.5，库存 20/17/19/18/17）和 4 个周卡（45/90/135/180 刀每日，售价 ¥25/48/70/90，库存 19/19/20/18）。
- [已验证] 10 刀日卡编辑页说明：购买后自动发放兑换码，日卡 1 天、每天 10 刀额度；使用说明把兑换入口写为 `https://api.lsb0713.online/dashboard/redeem`。
- [已验证] 45 刀/日周卡编辑页说明：购买后自动发放兑换码，有效 7 天、每天刷新 45 刀额度而非一次性总额；使用入口同样是 `api.lsb0713.online/dashboard/redeem`。
- [已验证] 代表日卡设置为卡密商品、支付完成后扣库存、顺序发卡。仅查看编辑页与展开选项，没有保存修改、查看卡密明文、加减库存、创建订单或付款。
- [已验证] 店铺公告要求商品标题和图片不得含“GPT”或“ChatGPT”；公告允许使用“AI 工具”等不含这些字样的表达。本次没有新建商品。
- [结论] 现有商品对应的兑换站点与 APIC 未确认关联，现有库存不得复用。价格可供 APIC 新卡密商品定价参考，但须等 APIC 部署和真实卡密兑换验证后再创建独立商品。

## 2026-09-27 ? ?????????????

- [????????] ????????????????/??????????????????????????????????? `codex/apic-subscription-redeem`???????? New API `v1.0.0-rc.38`?
- [???] `docker build -t apic-subscription-redeem:review .` ???Docker Go ???? `go test ./model -run 'SubscriptionRedeem' -count=1` ?????????????? 2/2 ????? 8 ??????? oxlint 0 warning / 0 error??? 11 ??????????????? JSON ????? UI ??????`git diff --check` ???
- [???/????] `bun run typecheck` ?????????????????????? `pkg/billingexpr/testdata/frontend_simulation.json`??? Vitest ???????????? lint ? 188 ???????????????? lint ????????????????????????????????
- [???] ??????????? `wzyp.cn/shop/B59CCLX7`???0752????? 5 ?????1/1.9/4/5.2/7.5?? 4 ?????25/48/70/90????????????????????????????????????????????????????
- [???] ?? APIC ???????? APIC ?????????????????????????????????????? `api.lsb0713.online/dashboard/redeem`?????? APIC?????????
- [??] ??? `/opt/new-api` ????????????????? `origin` ?? New API ?????? APIC ?????????????????????? APIC ?????????????
- [????] ???????????????????????????????/??????????????????????????????????????????????????`post-coding-review` ???????????????????????
- [??????] ?????? `node E:\codex\huabu\scripts\verify.mjs`?7 PASS / 2 WARN / 1 FAIL??? FAIL ? `scratch/new-api-upstream-20260927` ????????????????? WARN ???????/??????? APIC ????????????????????

## 2026-09-27 follow-up: official LDXP merchant guide checked

- [已验证] 从已登录的 `www.ldxp.cn` 商家页面打开其“开店教学”入口，进入《链动小铺平台商家开店指引（新版）》飞书文档。文档说明存在“自配支付渠道”，可配置自有 API 或自主支付网关，但须先由客服手动开通；开通后按商家后台“店铺 > 支付方式 > 自配支付渠道”配置参数。
- [已验证] 再读当前商家后台 `店铺 > 支付方式` 页面，只显示“平台聚合支付”已开通、微信支付未开通，以及聚合支付下的微信扫码和微信 JSPAY；页面没有“自配支付渠道”配置入口，也未显示服务端下单 API、订单查询、回调验签文档或商户 API 凭据。
- [用户确认] 用户要求直接从已登录网站查资料，不找客服询问；本轮没有联系客服、没有输入或传出任何凭据。
- [当前结论] LDXP 官方材料证实有自配支付能力，但开通需要客服手动处理。因用户当前不希望联系客服，且商家页面里尚无对应入口和协议说明，不能据此接通 APIC 支付；继续浏览现有商品页也无法取得缺失的服务端协议或开通状态。
- [已确认] 本轮仅查看官方说明和支付页面；未改支付渠道、签约、店铺、商品、APIC 或线上配置，未下单、未付款。
- [阻塞] 需要该商家账号已获得“自配支付渠道”开通，并在该配置页/官方资料中提供实际协议参数说明，才能按真实协议实现。若保持“不找客服”的约束，目前没有可继续完成的线上接入步骤；手动卡密订阅方案仍可独立推进，但 APIC 代码尚未部署。


## 2026-09-27 - APIC voucher feature deployed; source published

- [USER CONFIRMED] The user authorized deploying the current APIC subscription-code build and uploading APIC source to their GitHub.
- [ONLINE VERIFIED] `/opt/new-api` now runs `apic-subscription-redeem:20260927`, image ID `sha256:3b4255454411a8ef691bd5bb3b708930c93576c1e29ac487ce5842ef82157593`. The app container is healthy. Public `https://apic.cauai.fun/api/status` returns HTTP 200 and `success=true`; anonymous access to subscription admin-code and redeem endpoints returns HTTP 401.
- [ONLINE VERIFIED] The database migration added `subscription_redeem_codes` and `external_purchase_url`, `external_purchase_price`, and `external_purchase_currency`. Plan, redeem-code, order, and user-subscription counts are each 0. Existing public registration/payment settings were not changed.
- [BACKUP VERIFIED] `/opt/new-api/backups/apic-before-subscription-redeem.dump` is a 162 KB PostgreSQL custom-format dump; `pg_restore -l` succeeded. The prior Compose file is backed up as `docker-compose-before-subscription-redeem.bak`; the 76.7 MB built image archive is `apic-subscription-redeem-20260927.tar`. Both can be used to restore the prior release.
- [SOURCE VERIFIED] Private GitHub repository: `https://github.com/1008611-creater/apic`; default branch `codex/apic-subscription-redeem`; commit `f7aae613810640f0ab4bdd55eab9fe8c105313e2`.
- [TESTS VERIFIED] Production Docker image build passed. Focused redemption, concurrency, no-wallet-credit, and migration tests passed on SQLite, PostgreSQL 15, and MySQL 8.0.46. Manual post-coding review checked the modified code and the end-to-end route from issuing a digest-only code through authenticated redemption, subscription creation, and UI refresh. The `post-coding-review` skill was not present, so the manual review was used.
- [NOT VERIFIED] No plan or redeem code is configured in production. No separate LDXP product/code stock was created. Authenticated live redemption, card delivery, and purchase remain untested; no real payment was made.
- [NEXT] Add APIC day/week plans with the verified shop links/prices, issue a dedicated code batch, create separate LDXP products, and verify a code redemption. Confirm a test amount separately before any real checkout.

## 2026-09-27 follow-up: APIC configuration handoff

- [已验证] `https://apic.cauai.fun/api/status` 当前返回 HTTP 200，`success=true`，注册仍开启。
- [已验证] 已登录的链动小铺商家页面仍为商家0752；列表里有旧的订阅卡和余额卡商品。没有编辑/新建商品、添加库存、下单或付款。
- [已验证] APIC 当前打开的是登录页，尚未登录管理员账号；未改套餐、卡密或线上数据库。该操作需要 APIC 管理员登录态。
- [待用户操作] 请在已打开的 APIC 登录标签页自行登录管理员账号，然后回复“APIC 已登录”。无需把密码发给我。登录后继续配置订阅套餐、生成独立测试卡，并在链动小铺建立独立商品与库存。

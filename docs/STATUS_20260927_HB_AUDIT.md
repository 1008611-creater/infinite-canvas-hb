# hb.cauai.fun 只读审计（2026-09-27）

## 2026-09-27 - Media persistence follow-up

- [VERIFIED] The generated MP4 was imported into HB media storage through the existing form encoded media import path. Storage key: video:PQj8zBEFGIID; size: 1,360,436 bytes; MIME type video/mp4.
- [VERIFIED] Authenticated GET of the stored media returned HTTP 200 with Content-Type video/mp4 and the same 1,360,436 byte length.
- [VERIFIED] The media table contains the stored object and its source URL.
- [UNVERIFIED] The task index still has resultUrl and mediaUrl as null, so the task center and works page are not linked to this stored object. The JSON form of /api/ziyu/persist still returns HTTP 400 when a url field is supplied; form encoded import works.


## 2026-09-27 - HB live acceptance after Ziyu API key repair


- [VERIFIED] The server Ziyu credential was repaired and the canvas-api container was force rebuilt. The upstream auth probe returned HTTP 200. Secrets were not written to this repository or chat.
- [VERIFIED] Test account login succeeded.
- [VERIFIED] One real 5-second 9:16 text-to-video task completed. Local task: ziyu:567db98f054de00e9eaeea1d528240ca5f7336eb. Provider task: 8273bcfc. Provider cost: 50 credits. The provider returned a video result URL.
- [VERIFIED] Balance changed from 100 to 25 credits. Ledger shows a -75 reservation and a completed settlement with actual cost 75.
- [UNVERIFIED] /api/ziyu/tasks reports completed but resultUrl and mediaUrl are null. POST /api/ziyu/persist returned HTTP 400, so local media storage and works-page playback are not proven.
- [UNVERIFIED] Refund was not tested. No second paid task was submitted in this round.

Current acceptance result: login, provider generation, and charge settlement passed; local media persistence is blocked by the 400 response, and refund remains unverified.


## 2026-09-27 · HB 测试账号小额验收（登录、出片、扣费、退款）

- **[已验证] 登录**：线上测试账号 `probe-card@hb.cauai.fun` 已完成登录；`/api/auth/me` 返回当前用户信息。
- **[已验证] 余额**：`/api/credits/me` 返回 **100 点**；账号任务列表接口 `/api/ziyu/tasks` 返回空列表。
- **[已验证] 线上版本**：本轮请求命中 `canvas-20260927-194652-9ae06cf`。
- **[已验证] 紫域阻塞**：紫域模型接口返回 `502`，API 日志记录上游 `ZIYU_HTTP_401`，说明上游凭据被拒绝。
- **[已验证] Agnes 阻塞**：Agnes 模型列表可用，但提交视频返回 `FREE_TRIAL_DISABLED`；线上免费试拍额度为 0。
- **[已验证] 账务无损**：本轮没有创建真实视频任务；`channel_usage` 没有测试任务记录，`credit_ledger` 仍只有原始 100 点兑换流水，余额没有变化。
- **[已验证] 测试账号恢复**：测试账号原密码哈希已从本机临时保存文件恢复，并完成数据库比对，结果为 `RESTORED`。
- **[未验证] 出片、扣费、退款**：由于紫域上游 401 和 Agnes 免费额度为 0，未能进入真实出片、扣费或退款路径，因此不能把本轮标记为完整收费验收。
- **[待用户决定] 继续条件**：先补充或修复紫域 API Key，或配置受控的 Agnes 测试额度；满足其一后再继续一次小额真实链路，并保持金额上限和测试账号不变。


## 一句话结论

**[已验证] hb.cauai.fun 的公开注册入口仍可达，未登录门禁和 API 拒绝正常；但当前不能按“可放量收费”验收，因为站点级门禁、紫域直连代理和本地额度没有形成服务端绑定的扣费闭环。**

> **[用户确认，2026-09-27] HB 是面向外部用户公开售卖的工具，不是私有工具。** 因此本报告此前关于“关闭公开注册”的建议已作废；正确目标是保留注册，同时补强账号、额度、限流和权限控制。

## 对现在的影响

- **线上当前可用范围**：公开注册入口可访问；未登录访问会从 `https://hb.cauai.fun/` 跳到 `/login.html`，再进入 `https://one.cauai.fun/auth/hb.html`。未登录请求 `/api/auth/me`、`/api/auth/verify` 返回 401；`/config.js`、`/assets/`、`/ziyu/v1/models`、`/agnes/v1/videos` 返回 403。[已验证]
- **对现在的影响**：本轮已登录并做账务只读核对，没有创建真实视频任务、扣费、退款、写数据库或修改线上配置，因此目前不影响线上账务。
- **主要线上风险**：注册入口保持开放符合公开售卖定位，但对语法正确而验证码错误的注册请求，线上返回 400 而不是 `registration_closed` 的 403；这说明请求已经进入注册校验路径。公开注册下，不能把 `/ziyu/` 的 cookie 门禁当作资金防线，必须依赖服务端额度预扣、限流和权限校验。[已验证]
- **高风险扣费断点**：源码中注册/登录成功会同时下发站点级 `canvas_auth` cookie；nginx 的 `/ziyu/` 与 `/agnes/` 只按这个站点级 cookie 放行，再注入平台 Key，没有调用 `/api/credits/reserve`。因此，公开注册用户理论上可绕过前端插件里的 reserve/settle 包装，直接请求上游代理；这是源码已验证、线上已登录路径尚未复现的资金风险。[已验证源码；线上复现待核验]
- **高风险权限断点**：注册后调用 `promoteToAdminIfFirst`，第一个进入数据库的注册账号会被提升为 `admin`；在公开售卖产品里，这个账号可访问额度总览、手工调账、批量生成兑换码和紫域人工对账接口。并发首注时初始化结果也未做数据库级唯一管理员闸门。[已验证源码；线上首个账号角色待服务器侧核验]
- **扣费结算断点**：`/api/credits/reserve` 接受前端传入的 `credits`，未在服务端按模型/时长复算；结算按前端传入的 `ziyuCost`，补扣余额不足时写入 `pending` 但仍返回 `ok:true`，任务结果可能先交付再人工追债。[已验证源码]
- **免费额度断点**：API 中存在 `/api/credits/free-trial/check`，但当前权威 nginx 配置没有 `auth_request`/`free-trial` 门禁片段；线上登录后免费试拍是否真正按账号限次，当前未验证。[已验证源码；线上登录路径待核验]
- **跨域硬化缺口**：线上 `OPTIONS /api/credits/me` 会把任意 Origin 原样回显并同时允许 credentials；匿名预检返回 204。Cookie 的 SameSite 约束会影响实际利用，但该策略不应作为公开收费接口的唯一 CSRF 防线。[已验证线上]
- **产品边界**：真实多节点链执行、结果长期落盘、真库并发幂等/退款仍没有本轮真实证据；因此“能收钱”“稳定出片”都只能算部分验证。[已验证/待核验]
- **统一方案状态**：`one.cauai.fun/auth/start?target=hb` 可进入 HB 登录页，但 `target=apic` 返回 400；统一认证尚未覆盖 APIC。统一额度写入环境变量未配置，HB 仍走本地额度账本。[已验证]

## 状态分类

| 分类 | 当前判断 | 证据 |
|---|---|---|
| 已在线上生效 | HB 入口门禁、cookie 门禁、未登录 API 拒绝；统一入口首页与 `/healthz` | 2026-09-27 公网只读探测 |
| 已在线上生效 | 公开注册路径仍开放；匿名额度/扣费 API 受 401 保护；任意 Origin 的 CORS 预检被接受 | 2026-09-27 公网只读探测 |
| 本地已改但未发布 | 统一认证桥接、统一额度写入客户端等代码已在权威源码分支出现，但运行环境未配置对应开关 | `docs/STATUS_20260927_AUTH_CONTRACT.md`、`docs/STATUS_20260927_UNIFIED_QUOTA_RUNTIME.md` |
| 只有计划/规格 | APIC 统一登录、New API 统一额度正式写入契约 | `docs/ROADMAP.md` D45 之后记录 |
| 未验证 | 节点链真实执行、结果长期落盘、真实并发扣费/结算/退款、已登录直连 `/ziyu/`/`/agnes/`、免费试拍按账号限次、插件卸载还原、HB 统一登录完整浏览器流程 | `implementation/deploy/ACCEPTANCE.md`、`docs/STATUS_20260913_L2_EVIDENCE.md` |

## 需要 owner 决定的事

1. **是否继续保持公开注册。** 推荐：保持；这是公开售卖定位的必要条件，但必须先修复“首个注册用户自动 admin”和“站点级 cookie 可直连付费上游”两个断点。
2. **是否授权先做收费入口止血修复，再做真实出片验收。** 推荐：先把 `/ziyu/`、`/agnes/` 的上游调用收回服务端额度闸门，再用受控测试账号完成 A-06～A-10、结果落盘及扣费对账；在此之前不要放量售卖。
3. **统一认证/额度是否继续按 D45 推进。** 推荐：先补齐 APIC 认证契约和 New API 按业务单号扣费/退款接口，再配置线上开关；在此之前不要把三站宣传成统一账号/统一余额。

## 技术证据

### 公网只读探测

- `GET https://hb.cauai.fun/` → `302 /login.html`。
- `GET https://hb.cauai.fun/login.html` → `302 https://one.cauai.fun/auth/hb.html`。
- `GET https://one.cauai.fun/auth/hb.html` → `200`；`GET https://one.cauai.fun/healthz` → `200 ok`。
- `GET https://one.cauai.fun/auth/start?target=hb` → `302 /auth/hb.html`；`GET ...?target=apic` → `400`。
- 未登录：`/api/auth/me`、`/api/auth/verify` → `401`；`/config.js`、`/assets/`、`/ziyu/v1/models`、`/agnes/v1/videos` → `403`。
- `POST /api/auth/register`，使用 `audit@example.invalid`、8 位以上密码和无效验证码 `000000` → `400`，不是 `403 registration_closed`；未创建账号、未发邮件。
- `GET /api/credits/me`、`/api/credits/quote`、`/api/credits/free-trial`、`/api/ziyu/models` 未登录 → `401`；`GET /ziyu/api/v1/models` 未登录 → `403`。
- `OPTIONS /api/credits/me` 携带 `Origin: https://evil.example` → `204`，响应回显该 Origin，并带 `Access-Control-Allow-Credentials: true`。

### 本地静态核查

- 权威源码当前分支 HEAD 为 `ffdb13d`；`web/src/stores/use-config-store.ts` 的默认 `OPENAI_BASE_URL` 仍为 `https://api.openai.com`，清空本地配置的新用户可能遇到 401。[已验证]
- `canvas-api/unified-quota.js` / `credits.js` 只有在 `NEW_API_QUOTA_URL`、`NEW_API_QUOTA_WRITE_URL` 和 `NEW_API_QUOTA_TOKEN` 等变量存在时才启用 New API 路径；当前运行环境未配置，统一额度未生效。[已验证]
- `canvas-api/server.js`：注册后调用 `promoteToAdminIfFirst`；`canvas-api/auth.js`：`setSessionCookies` 同时下发站点级 `canvas_auth`；`deploy/nginx-docker.conf`：`/ziyu/`、`/agnes/` 只检查 `$canvas_authed` 后注入平台 Key。[已验证源码]
- `web/src/stores/channel-templates.ts`：reserve/settle/refund 只包在前端紫域脚本里；`canvas-api/routes-credits.js` 的服务端扣费路由没有被 nginx 的 `/ziyu/` 代理强制调用。[已验证源码]
- `canvas-api/credits.js`：本地结算在余额不足时写 `metadata.pending=true` 并仍返回 `ok:true`；统一额度未启用时实际走本地账本。[已验证源码]
- `deploy/nginx-docker.conf` 当前没有 `auth_request` 或 `free-trial` 片段；API 中的 `/api/credits/free-trial/check` 未能从源码配置证明已接到 `/agnes/v1/videos`。[已验证源码]
- 权威源码工作树存在未提交 `.playwright-cli/` 与 `scratch/`，发布前需要归属确认，避免把并行产物带入发布包。[已验证]
- `node scripts/verify.mjs`：**7 PASS / 2 WARN / 1 FAIL**。FAIL 是治理仓 `scratch/new-api-upstream-20260927` 内一条断开的 Markdown 锚点；WARN 是 1 条源码树相对路径无法解析及 7 个孤儿文档。它不等同于 HB 线上故障，但当前治理质量门未全绿。[已验证]

## 未验证与剩余风险

## 2026-09-27 发布记录

- [已在线上生效] 发布版本 `canvas-20260928-000356-5cea6ce`，线上 `BUILD_INFO.txt` 与本地提交一致；公开注册保持开启。
- [已验证] 发布脚本完成 nginx 配置检查、回环检查；`canvas-api`、`canvas-web`、`canvas-agnes-proxy`、`canvas-postgres` 均处于运行状态。
- [已验证] 公网冒烟：`/` 返回 302 到 `/login.html`；`/api/health` 返回 200；未登录 `/api/ziyu/v1/models` 与 `/api/agnes/v1/models` 返回 401；旧直连 `/ziyu/...` 与 `/agnes/...` 返回 403；无效验证码注册返回 400，未关闭公开注册。
- [未验证] 真实登录后的紫域/Agnes 出片、真实扣费结算、退款、双账号隔离、首个注册账号角色，需要 owner 使用受控测试账号验收；本次没有主动提交付费任务。

## 未验证与剩余风险

- 未登录探测没有证明已登录后的真实浏览器 UI、节点链、视频结果、媒体库刷新恢复和扣费对账。
- 未做真实账号注册、登录、刷新、登出、统一会话撤销或跨域 cookie 流程。
- 未在授权测试账号下复现“直连 `/ziyu/` 绕过额度”“首个注册账号是否线上为 admin”“免费试拍是否按账号限次”；这些需要真实登录态或服务器数据库/配置读取。
- 未调用生成接口、未验证真实上游失败/重试/退款和并发幂等。
- 未核对线上容器与本地权威源码的完整镜像/代码指纹，只能采用现有文档记录作为背景，不能把它当成新的线上指纹证据。
## 2026-09-27 · HB 收费入口止血修复发布

- [已在线上生效] 权威源码提交 `5cea6ce` 已发布；线上 `BUILD_INFO.txt` 为 `canvas-20260927-181205-5cea6ce`，前端构建注入 `/api/agnes`。
- [已在线上生效] 旧 `/agnes/`、`/ziyu/` 直连入口返回 403；新的 `/api/agnes/v1/*`、`/api/ziyu/v1/*` 未登录返回 401；首页仍 302 到 `/login.html`，登录页仍跳转 `one.cauai.fun/auth/hb.html`。
- [已验证] API、Agnes、Postgres、nginx 容器运行正常；API 启动日志显示数据库迁移完成。
- [已验证] `npm run typecheck`、`npm run test:contracts`（19/19）、统一额度测试（3/3）、`npm run build`、Node/Bash 语法检查、`git diff --check` 通过。
- [已验证] 发布前事后审查修复了无幂等键时相同提示词被错误合并的问题；现在只有调用方明确提供 `Idempotency-Key` 才会复用任务。
- [未验证] 真实账号登录、真实紫域/Agnes 出片、结果落盘、真实扣费/退款、双账号隔离和浏览器全链路尚未执行。
- [未验证] 治理仓 `node scripts/verify.mjs --release` 仍因 scratch New API 预存文档链接及闸门状态未更新而失败；这些不是本次 HB 提交引入的源码错误。
- [已确认] 发布前临时保存的老巴工作台未提交改动已原样恢复，未混入本次提交。

## 2026-09-27 · 任务结果回填修复发布

- [已在线上生效] 权威源码提交 `ca2395f` 已发布；线上 `BUILD_INFO.txt` 为 `canvas-20260928-025558-ca2395f`，基线 `5cea6ce` 已更新到该提交。
- [已验证] 发布脚本前端构建通过，API 镜像构建并重启通过；nginx 配置检查、本机回环检查通过。
- [已验证] 公网冒烟：首页 `302`、`/api/health` `200`、未登录 `/api/ziyu/v1/models` 与 `/api/ziyu/tasks` 为 `401`、旧 `/ziyu/api/v1/models` 为 `403`。
- [已验证] Web、API、Agnes 代理、Postgres 容器均运行；发布只读核对未触发任务或扣费。
- [未验证] 登录后任务中心能否回填历史成片，以及真实上游生成、落盘、扣费、退款和跨账号隔离；本次没有调用真实生成。
- [待核验] `node scripts/verify.mjs --release` 返回 `6 PASS / 2 WARN / 2 FAIL`。失败分别涉及 scratch 导入文档链接和 slice-001 的 G4/G5/G6 状态；这些检查不是本次 HB API 的线上冒烟测试。

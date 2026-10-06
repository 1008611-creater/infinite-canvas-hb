# T2-a / T3-a 只读核查记录（2026-09-26）

## 结论

统一方案可按 D45 实施，但当前不能直接写入权威源码：`infinite-canvas` 工作树存在未提交目录 `.playwright-cli/` 与 `scratch/`，必须先由 owner 识别并归属这些改动，避免接入工作覆盖并行成果。

## 已核实事实

- 画布已有独立会话 cookie `canvas_session`，不能直接改名替换；统一账号应增加桥接校验路径。
- 画布已有 `credit_ledger`、幂等唯一索引和并发扣费/退款相关实现，可作为接入 New API quota 前的本地对账基线。
- New API 源码目录未出现在约定工作区路径，当前未做其数据库或 API 的写入操作。
- 当前核查没有登录线上服务、没有调用生成接口、没有消耗额度。

## 下一闸门

1. owner 确认 `.playwright-cli/` 与 `scratch/` 的归属并清理或保留。
2. 补齐 New API 与 sd2 的实际源码路径后，完成零写入账号/额度对账报告。
3. 只有对账报告通过，才实现桥接层；实现前保留现有 `AUTH_COOKIE`、`CANVAS_LEGACY_TOKEN` 与站点会话兼容。

## 实施进度（2026-09-26）

- T2-c 画布侧桥接端点已加入：`canvas-api/unified-auth.js` + `POST /api/auth/unified`。
- 端点默认关闭（未配置 `UNIFIED_AUTH_SECRET` 即拒绝），仅验证 HS256 断言并匹配既有邮箱账号；不存在账号返回 `account_link_required`，不会自动建号或合并。
- 现有 `canvas_session`、刷新令牌、`AUTH_COOKIE` / `CANVAS_LEGACY_TOKEN` 均保持不变。
- 尚未发布；sd2/apic 接入、额度对账、并发扣费与退款测试仍未完成。

## 第三步实施记录（2026-09-26）

- sd2 的 `/api/credits` 已增加统一额度只读闸门：配置 `NEW_API_QUOTA_URL` 与 `NEW_API_QUOTA_TOKEN` 后，余额读取来自 New API，兑换码和充值申请写入口返回 `UNIFIED_QUOTA_READ_ONLY`（HTTP 409），不再写本地账本。
- `sd2` `npm run typecheck` 通过；治理仓 `node scripts/verify.mjs` 通过（9 PASS / 0 FAIL）。
- 统一额度的真实扣费、退款和 New API 写入接口仍未完成，当前不能宣称 T3 已上线。

## 第二步实施记录（2026-09-26）

- sd2 新增 `POST /api/auth/unified`，复用 `niannian_session`，断言验证与画布保持同一 `UNIFIED_AUTH_SECRET`。
- sd2 新增 `NEW_API_QUOTA_URL` / `NEW_API_QUOTA_TOKEN` 只读额度适配器；配置后 `/api/credits` 只展示 New API 返回的余额，未配置时保留本地账本读取。
- sd2 类型检查已通过：`npm run typecheck`。
- apic 的源码目录尚未在本地工作区发现，暂未修改或发布；需通过服务器部署目录或正式源码仓接入同一断言端点。
- 画布与 sd2 的改动均仍在各自工作树，未提交、未发布。

## 第三站核查（2026-09-26）

- `apic.cauai.fun` 运行的是 `/opt/new-api` 的官方容器镜像 `calciumion/new-api:latest`，本地没有可修改的 apic 源码树。
- 只读探测确认 `/api/status` 返回 200，`/api/user/self` 返回 401，当前未发现可直接复用的 OIDC 授权端点（`/api/oauth` 返回 404）。
- 因此本轮不对线上容器做热改；统一入口先指向现有 apic 登录，账号桥接由画布与 sd2 的新增端点承接，待 New API 提供正式 OAuth/OIDC 能力后再把 apic 登录页改为统一回调。

## 认证中转实施记录（2026-09-26）

- 已创建独立分支：`codex/unified-workbench-auth`（infinite-canvas、sd2）。现有未提交改动保留。
- 已新增入口认证中转：`implementation/entry/origin/auth-broker/`。
- 认证中转通过 `http://canvas-api:8790/api/auth/login` 校验账号，不保存密码；票据 60 秒有效且单次使用。
- `one.cauai.fun/auth/*` 已接入 Caddy；画布与 sd2 都支持 POST/GET 统一回调。
- `one.cauai.fun` 的画布与 sd2 卡片改为统一登录入口，apic 仍保持独立登录。
- 两站 `/api/credits` 读取支持 New API 只读余额；配置不完整或上游失败时不会静默回退（启用配置后返回错误）。
- 部署包已补齐 `unified-auth.js`、`unified-quota.js` 的 COPY、上传和代码指纹清单。

### 已通过检查

- 认证中转 Docker 镜像构建成功。
- 认证中转 `/healthz` 返回 200，登录页返回 200。
- Caddy 配置验证通过。
- sd2 `npm run typecheck` 通过。
- 治理仓 `node scripts/verify.mjs`：9 PASS / 0 WARN / 0 FAIL。

### 尚未完成

- 服务器尚未创建 `/opt/cauai-one-origin/auth.env`，因此认证中转尚未上线。
- 尚未取得 New API 真实额度接口的正式写入契约；当前只读适配未启用线上配置。
- 尚未执行真实账号对账、并发扣费、结算和退款测试。

## 第四步实施记录（2026-09-26）

- 已新增统一额度写入客户端：画布 `canvas-api/unified-quota-client.mjs`，sd2 `lib/unified-quota.ts`。
- 配置 `NEW_API_QUOTA_WRITE_URL` 与 `NEW_API_QUOTA_TOKEN` 后，画布的预扣、结算、退款，以及 sd2 的预扣、编辑扣费、退款，都改为调用 New API；本地余额不再增减。
- 同一账号与同一业务单号只发送一次上游写入。重复请求返回已有结果，不会再次扣费或退款。
- 上游拒绝或返回无效余额时，本地不记录成功扣费。
- 未配置写入地址时，现有本地账本路径保持不变，因此本次改动不会在未启用时影响线上。

### 已通过检查

- 画布额度客户端测试：3 项通过，覆盖重复请求、并发请求和上游拒绝。
- sd2 额度写入测试：1 项通过，覆盖重复扣费与退款。
- sd2 项目类型检查：通过。
- 画布改动文件语法检查：通过。

### 仍未完成

- New API 当前没有公开的按业务单号扣费/退款接口。线上写入地址尚未配置，因此统一额度仍未启用。
- 尚未用真实账号执行三站余额对账、并发扣费和生产环境退款验证。
- 本次没有发布 hb 或 sd2。

## APIC 只读审计补充（2026-09-26）

### 已确认事实

- 公网入口可达：`https://apic.cauai.fun/`、`/login`、`/register` 返回 HTTP 200；无凭据访问 `/v1/models` 返回 HTTP 401。
- 线上版本头与 `/api/status` 均显示 `v1.0.0-rc.38`；当前容器为 `calciumion/new-api:latest`，应用、PostgreSQL、Redis 均 healthy，三者均为 `restart: always`。
- New API 仅绑定宿主机 `127.0.0.1:13020`，公网流量经 Cloudflare → Caddy → `new-api:3000`；`cloudflared-apic.service` 已启用且 active。
- 当前只有一个用户 `root`；有两个有效 token。数据库日志 49 行，累计 quota 87142，时间范围为 2026-09-20 至 2026-09-26。
- 当前配置公开报告 `register_enabled=true`、`password_register_enabled=true`、`turnstile_check=false`、`oidc_enabled=false`。这意味着配置层仍允许自助注册且没有 Turnstile 防护；本轮对 `/api/user/register` 的无凭据探测返回 401，不能把该单点结果当作“已关闭注册”的证据；统一登录尚不能直接接入 APIC。
- 已配置两个渠道：`deepseek-official`（`deepseek-flash`、`deepseek-v4-pro`）和 `mcgrox-top`（三个 `gpt-image-2.5` 变体）。
- 过去应用日志中存在上游 503，以及模型未配置导致的 404；本次未发现容器崩溃或 healthcheck 失败。
- `/opt/new-api/backups/` 目前只有 PostgreSQL 初始化目录和 `admin-initial-password.txt`，未发现可用于恢复的定期 SQL / dump 备份。Redis 有 RDB 持久化，但这不替代 PostgreSQL 备份。
- `/opt/new-api/.env` 权限为 `640 root:root`；初始管理员密码文件权限为 `600 root:root`，但该文件仍留在服务器上。
- 公网响应未看到 HSTS、CSP、`X-Content-Type-Options` 等常见安全响应头；Caddy 的 APIC 站点块当前只有压缩和反代配置。

### 风险分级

1. **阻断项：注册开关仍处于开启配置。** 这是当前最直接的额度滥用入口。若 APIC 继续承载可用上游渠道，应先关闭 `register_enabled` 与 `password_register_enabled`，再验证注册页面和注册接口均拒绝新用户。
2. **阻断项：没有 PostgreSQL 可恢复备份。** 当前初始化目录不是运行中的周期备份；账号、token、渠道、额度和日志丢失后无法按现有证据恢复。
3. **高风险：渠道和定价未形成可审计的生产基线。** `mcgrox-top` 的真实成本与三个图像模型尚未完成真实调用、异步任务、失败退款和下载验收；日志已经出现 503 / 404，不能把文本链路通过等同于图像链路可售卖。
4. **高风险：运行镜像使用 `latest`，线上仍是 `v1.0.0-rc.38`。** 未锁定不可变镜像 digest，后续重建可能在无代码变更的情况下漂移版本。官方仓库截至 2026-09-21 已发布 `v1.0.0-rc.40`，应先做兼容性评估再决定升级，不应直接拉取 latest。
5. **中风险：初始管理员密码文件仍在服务器。** 即使权限收紧，也应在确认管理员密码已轮换后安全移除，并保留轮换证据而不记录明文。
6. **中风险：缺少基础安全响应头。** 目前未观察到 HSTS、CSP、`X-Content-Type-Options`；需要在不影响 Cloudflare / Caddy / SPA 登录的前提下补齐并回归登录和 API。

### 本轮未做的事

- 没有改线上配置、没有关闭注册、没有重启或重建容器。
- 没有创建用户、没有生成新 token、没有调用图像模型、没有执行扣费或退款写入。
- 没有验证 PostgreSQL 恢复演练、图像异步任务、真实成本对账、注册关闭后的完整回归。

### 执行后的下一步

手工备份与恢复演练、图像单次调用和镜像 digest 锁定已经完成。后续只剩自动化备份、图像失败退款/下载交付验收，以及统一账号和额度写入评估；公开注册继续保持开启。

## APIC 运维执行记录（2026-09-26）

- 按 owner 指示保留公开注册，未修改 `register_enabled`、`password_register_enabled` 或 Turnstile 配置。
- 已创建 PostgreSQL 备份：`/opt/new-api/backups/new-api-20260926-221656.dump.gz`，权限为 `600`，压缩完整性检查通过。
- 已将该备份恢复到临时数据库，核对结果为 users=1、tokens=2、channels=2、logs=49，恢复后已删除临时数据库；生产数据库未被覆盖。
- 已对 `gpt-image-2.5` 执行一次真实图像生成：HTTP 200，返回 1 个 `b64_json` 图像项，响应约 974 KB；New API 日志记录 quota=4155，说明计费记录已落库。
- 已将 `/opt/new-api/docker-compose.yml` 的 New API 镜像从 `latest` 锁定到当前已验证 digest `sha256:0a4d62b1b2b796a43a5e0ef92d49f12e0f229ab206b8f5a3a4cd42990121bfe1`，并保留变更前副本 `docker-compose-before-digest-20260926-2221.yml`。
- 仅重建 `new-api` 容器；重建后 healthcheck 为 healthy，公网 `/api/status` 返回 200，锁定后的 `deepseek-flash` 文本冒烟调用返回 200。
- 已安装每日 03:17（服务器时区）执行的 PostgreSQL 备份任务：`/opt/new-api/scripts/postgres-backup.sh` + `/etc/cron.d/new-api-postgres-backup`；保留最近 14 天备份，使用锁文件避免并发执行。手动按 cron 输出路径执行验证成功，最新备份约 49 KB。

### 本次仍未完成

- 没有关闭公开注册（按 owner 要求）。
- 图像链路已完成单次成功调用，但异步任务、失败退款、下载交付和成本定价仍需单独验收。

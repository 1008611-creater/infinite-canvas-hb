# sd2.cauai.fun 线上审计（2026-09-27）

## 一句话结论

**[已验证] `sd2.cauai.fun` 当前可访问，Postgres、积分表和每日备份已经在线；但统一账号/统一额度没有发布，编辑器 SSO 入口当前回跳到内部 `localhost:3026`，紫域任务列表存在跨用户隔离风险，暂不应把它判定为“统一产品矩阵已完成”或“可放心对外扩量”。**

## 对现在的影响

- **[已验证] 目前不影响线上入口的基本可达性。** `GET /` 返回 `307 -> /home`；连续 8 次 `GET /api/health` 均为 `200`，耗时约 0.91–3.10 秒。
- **[已验证] 未登录的主要业务接口有门禁。** `/api/credits`、`/api/providers`、`/api/projects`、`/api/video-tasks`、`/api/ziyu/jobs`、`/api/ziyu/media`、`/library/assets` 均返回 `401`；恶意 `Origin` 调登录返回 `403 CSRF_INVALID`；同一邮箱连续错误登录第 11 次起返回 `429 LOGIN_RATE_LIMITED`。
- **[已验证] 数据层已切到 Postgres。** 线上容器为 `niannian-sd2:billing-20260918-r2`；Postgres 公共表 27 张，`users=5`、`user_credits=5`、`video_tasks=0`；每日 `pg_dump` 已生成到 2026-09-27。
- **[未验证] 本轮没有执行真实账号登录、真实下单、真实扣费、失败退款或视频下载。** 因此不能把“主链路可达”和“真实出片/结算已验收”混为一谈；`video_tasks=0` 也不能证明真实下单链路当前正常。
- **[已验证] 统一账号/额度尚未在线。** 线上应用环境没有 `NEW_API_*` / `UNIFIED_*` 运行变量；`/api/auth/unified` 返回 `404`。本地 `codex/unified-workbench-auth` 分支存在未发布的统一认证/额度改动，不能当作线上能力。
- **[已验证] `/api/health` 的公开版本信息与当前镜像不一致。** 当前镜像是 `billing-20260918-r2`，但公开接口仍报告 `niannian-mimo-efficiency-20260728-rc1`、数据库迁移名和 Worker 版本；这会降低排障、回滚和发布核对的可信度。
- **[已验证] 编辑器 SSO 当前不可用。** 未登录访问 `/api/editor/sso` 返回 `307 Location: https://localhost:3026/login?...`；线上容器也没有 `NIANNIAN_EDITOR_SSO_*` 配置。该问题不影响当前视频入口，但会阻断编辑器跨站登录。
- **[已验证代码事实 / 待线上双账号核验] 紫域任务列表没有按当前用户过滤。** `app/api/ziyu/jobs/route.ts:11-15` 只校验登录后直接调用 `listZiyuJobs()`；`lib/ziyu-api.ts:202-205` 使用单个服务端 `ZIYU_API_KEY` 拉取上游任务列表，没有 `userId`/账号范围参数。若紫域返回的是账号级列表，用户之间可能看到别人的任务状态、提示词或预览地址；在完成双账号隔离测试前，应按高风险处理。

## 状态分类

- **已在线上生效**：`billing-20260918-r2` 容器、Postgres 27 表、每日备份、基本认证门禁、CSRF 校验、登录限流。
- **本地已改但未发布**：统一认证/额度相关本地改动（线上 `/api/auth/unified`、`/api/templates` 等路由仍为 `404`）。
- **只有计划/规格**：三站统一账号、统一额度，以及编辑器 SSO 修复/回跳治理。
- **未验证**：真实账号下单出片、扣费与退款、双账号任务隔离、视频下载、跨站统一登录/注销。

## 需要 owner 决定的事

1. **推荐：先把紫域任务隔离作为对外扩量前的阻塞项。** 需要一个最小双账号验收：账号 A 创建任务后，账号 B 的 `/api/ziyu/jobs` 不得看到 A 的任务；若上游无法按用户隔离，则必须改为本地任务表按 `user_id` 查询。
2. **推荐：暂不宣称统一账号/统一额度已完成。** 只有线上发布统一入口、运行变量、桥接会话和扣费/退款对账后，才解除该口径限制。
3. **推荐：编辑器 SSO 先修代理 Host/回跳并补配置，或明确下线该入口。** 当前 `localhost:3026` 回跳对公网用户不可用。

## 下一步动作

在 owner 选择前不修改线上。若选择继续，优先做“双账号任务隔离 + 真实账号登录/下单/失败退款”的只读/受控验收，再单独处理统一认证与 SSO 发布。

## 技术证据

- 公网 HTTP：`/ -> 307 /home`；`/api/health -> 200`；受保护接口未登录 `401`；`/api/auth/unified -> 404`；`/api/editor/sso -> 307` 且 `Location` 为 `https://localhost:3026/login?...`。
- 安全头：CSP、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Permissions-Policy` 已有；未看到 `Strict-Transport-Security`。
- 服务器只读核验：`niannian-sd2-app|niannian-sd2:billing-20260918-r2|Up 9 days`；`niannian-sd2-postgres|postgres:16-alpine|healthy`；环境键含 `DATABASE_URL`、`POSTGRES_DB`、`POSTGRES_USER`、`AUTH_COOKIE_SECURE=true`、`ZIYU_API_KEY`，不含 `NEW_API_*` / `UNIFIED_*`；`pg_tables=27`、`users=5`、`user_credits=5`、`video_tasks=0`。
- 备份：`/srv/kidswear-data/staging/niannian-sd2-4998bd8/backups/niannian-20260927-031001.dump` 存在；crontab 每日 `03:10` 执行备份。
- 本地源码：`E:/codex/niannianai/zhuanhuiyuangong/sd2` 当前工作树有未提交改动；本审计未修改该源码树。

## 推荐下一条提示词

`继续执行：先做 sd2 双账号任务隔离和真实扣费/失败退款验收，只读或使用可清理测试账号，不发布统一账号与统一额度。`


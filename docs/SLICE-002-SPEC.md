# 垂直切片 002 · 可执行规格

> 对应 Problem Brief：`docs/SLICE-002-PROBLEM-BRIEF.md`。
> 本规格只定义验收与技术形态，**不代表已经实现**。所有「已核实」条目均为 2026-09-21 只读实测，来源逐条标注。

## 0. 现状基线（2026-09-21 实测，只读）

三个站点同机、同 Caddy、同 Cloudflare 账号，因此这是**集成**而不是**搬迁**。

| 站点 | 根路径响应 | 备注 |
|---|---|---|
| `hb.cauai.fun` | 302 → `/login.html`（200） | Caddy 站点声明为 `http://`，TLS 由隧道终止 |
| `sd2.cauai.fun` | 307 → `/home` | Caddy 自己终止 TLS |
| `apic.cauai.fun` | 200 | `/api/status` 200，版本 `v1.0.0-rc.38` |

统一入口域名是**全新的**：`auth.cauai.fun` / `login.cauai.fun` / `one.cauai.fun` 均 **NXDOMAIN**（2026-09-21 实测），不存在需要迁就的既有资产。

## 1. 三套账号现状（决定统一账号的技术形态）

| 维度 | `hb` 画布 | `sd2` | `apic` |
|---|---|---|---|
| 密码哈希 | bcryptjs，rounds 默认 10（`canvas-api/auth.js` L8/L19） | scrypt（`node:crypto`，64 字节）+ 独立 `password_salt` 列（`lib/auth.ts` L1/L711） | Go 自有实现 |
| users 主键 | `id UUID PRIMARY KEY` | `id TEXT PRIMARY KEY` | New API 自有（`User.Id` 为 int） |
| 邮箱唯一 | `email CITEXT UNIQUE` | `email TEXT NOT NULL UNIQUE` | 有（`gorm:index`） |
| 角色 | `role CHECK (user/admin)` | 无角色列 | RBAC 角色 / 权限（`service/authz/`） |
| 会话 | `refresh_tokens` 表，只存 `token_hash`，可轮换与撤销 | `app/api/auth/*` + `niannian_session` cookie | `user_sessions` 服务端会话控制面，可撤销、设备列表、`auth_version` 版本栅栏 |
| 会话凭据名 | `SESSION_COOKIE`（与站点门禁 `canvas_auth` 是两回事） | `niannian_session`（`lib/auth.ts` L1074） | 15 分钟 JWT Access Token + HttpOnly Refresh Cookie（30 天） |
| 验证码 | `email_verification_codes`（HMAC-SHA256，key 为 `JWT_SECRET`） | `otp_codes` | 自带 |

**关键结论（决定技术选型，不可绕过）**：

1. **三套密码哈希互不兼容**，统一账号不可能直接拷贝哈希值。必须显式选择迁移方式（见 §4）。
2. **New API 的 OIDC 是客户端不是身份提供方**。证据：官方仓库 `setting/system_setting/oidc.go` 的 `OIDCSettings` 只有 `ClientId` / `ClientSecret` / `WellKnown` / `AuthorizationEndpoint` / `TokenEndpoint` / `UserInfoEndpoint` 六个字段，`oauth/` 包全是它**消费**的 provider；全树检索 `.well-known` / `jwks` / `introspect` / `userinfo` 零命中。因此「让 New API 当 SSO 服务端」这个方案**不成立**，除非另外引入一个身份提供方。
3. **New API 已有的身份能力是完整的**：`router/api-router.go` 实测存在 `/api/user/login`、`/api/user/register`、`/api/user/login/2fa`、`/api/user/login/passkey/begin|finish`、`/api/user/auth/logout`、`/api/oauth/:provider`（GitHub / Discord / OIDC / LinuxDO / Telegram / WeChat）、`/api/user/token`（生成系统管理 Access Token）。`model/user.go` 的 `User` 结构含 `OidcId` / `WeChatId` / `TelegramId` / `GitHubId` / `DiscordId` / `LinuxDOId`，即它可以**消费**任意 OAuth/OIDC。

## 2. 两套账本现状（决定统一额度的技术形态）

| | `hb` 画布 | `sd2` |
|---|---|---|
| 余额 | `user_credits`（`canvas-api/credits.js` L87/L112/L222） | `user_credits(user_id PK, balance INTEGER)` |
| 流水 | `credit_ledger` | `credit_ledger(id, user_id, amount, balance_after, reason, task_id, recharge_request_id, created_at)`，带 `(task_id, reason)` 与 `recharge_request_id` 两个唯一索引 |
| 兑换 | `credit_redemptions`（只存 SHA256，定长时间比较） | `credit_recharge_requests` |
| 用量 | `channel_usage` / `free_trial_usage` / `credit_adjustments` | 记在 `credit_ledger` 的 `task_id` 上 |
| 并发保护 | `pg_advisory_xact_lock`（设计稿已实现） | 事务内条件更新 |

**关键结论**：两套账本表结构不兼容，且 `sd2` 有独立铁律（`sd2/AGENTS.md`）：下单即预扣、终态结算、失败按 `docs/adr/ADR-0003-计费与退款.md` 退款；每次流水必须写 `credit_ledger` 且可追溯到渠道 `job_id`；Postgres 为唯一业务库；`npm run verify` 是唯一验收入口。**统一额度不能以「合并两张表」的方式实现。**

## 3. 主流程

1. 用户访问统一入口，看到三个产品的选择项与统一登录表单。
2. 用户用一套凭据登录一次；登录成功后进入所选产品。
3. 用户在任一产品内切换时，不再被要求重新输密码。
4. 用户在任一产品里看到同一个「可用额度」数值。
5. 用户在任一产品里发起一次消耗额度的任务，额度立即减少，且减少量与该任务的结算规则一致。
6. 用户能查到这次消耗的明细，明细可追到具体任务标识。
7. 用户登出后，三个产品的会话同时失效。

## 4. 技术形态（必须由 owner 裁决，这是本切片的核心决策）

### 4.1 统一入口（风险最低，可先做）

**推荐形态**：新增一个入口页，放在已有域名下（`cauai.fun` 顶级域名当前解析到 Vercel 上的个人作品集站点，2026-09-21 实测 200，不能直接占用），建议使用一个**新的子域名**承载入口与身份服务。它只做两件事：选产品、发起登录。

不推荐把三个站点之一直接当入口：`hb` 的根路径被门禁 302 到 `/login.html`，`sd2` 的根路径 307 到 `/home`，两者都把「站点自己的第一屏」当作产品入口，语义冲突。

### 4.2 统一账号（L3，三个候选）

| 方案 | 做法 | 代价 | 适用条件 |
|---|---|---|---|
| **A. 引入独立 OIDC 提供方**（推荐） | 新部署一个小型 OIDC Provider（如 Keycloak / Authentik / Logto / Ory Kratos 一类）作为唯一身份源；三站都改成它的客户端 | 新增一个常驻服务与一份数据；三站各要改登录入口 | 愿意长期维护一个身份服务 |
| **B. 以 New API 为账号权威 + 桥接** | 账号主数据放 New API（它有完整的注册 / 2FA / passkey / 会话撤销 / RBAC）；`hb` 与 `sd2` 新增桥接端点，用 New API 的会话换取本地会话 | 三站都要改；`hb` 只能**新增并行校验路径**，不能改 `AUTH_COOKIE`；sd2 的 `niannian_session` 同理 | 想尽量少引入新组件，且接受 New API 成为单点 |
| **C. 仅按邮箱关联（最弱，不推荐）** | 三站各自保留登录，只按邮箱做「同一个人」的弱关联 | 用户仍需多次登录；邮箱相同即视为同一人，存在冒用风险 | 只做额度汇总展示，不做真统一 |

**无论选哪个方案，密码迁移只有两条合法路径**：

1. **强制改密迁移**：首次在新身份源登录时要求用户设置新密码，旧密码仅用于一次性验证。
2. **过渡期双验桥接**：身份源在首次登录时把凭据转发给原站点验证一次，验证通过后写入新的哈希。

**不允许**：把三套哈希直接复制或转换（算法不兼容）；把某个站点的密码列改成明文或可逆加密。

**`hb` 侧的硬约束**：`AUTH_COOKIE` 与 `CANVAS_LEGACY_TOKEN` 必须保持不变（`AGENTS.md` §2）。统一账号只能**新增一条并行校验路径**，不能替换现有门禁。这意味着方案 A 与 B 在 `hb` 上的落地形态是「多一种登录方式」，而不是「换掉登录方式」。

### 4.3 统一额度（L3，必须先决定谁是权威）

**推荐形态**：**New API 作为额度权威**。理由是它自带 `Quota` / `UsedQuota` / `RequestCount`（`model/user.go` 实测字段）、兑换码（`controller/redemption.go`）、`QuotaPerUnit` 计价常量（`common/constants.go`，实测 `500 * 1000.0`），以及 RBAC。三站中只有它天生就是「按量计费的网关」。

**但必须明确写下的三条**：

1. **谁是账本权威**：New API 的 `quota` 是唯一余额来源；`hb` 与 `sd2` 的 `user_credits` 降级为**只读镜像或本地预授权额度**，不再独立发放。
2. **谁是只读**：不允许出现「两处都能改余额」。任何写入必须经过唯一路径。
3. **并发扣费与退款如何对账**：按 P4 原文，统一余额必须先过**并发扣费测试与退款测试**才允许上线。`sd2` 的「下单即预扣、终态结算、失败退款」必须在新模型下仍然成立，且 `credit_ledger` 的唯一索引语义不能被破坏。

**如果 owner 选择「不做统一额度」**，本切片退化为「统一入口 + 统一账号 + 各站额度可见但独立」，此时 S7–S10 相应作废并在 `docs/DECISIONS.md` 记录。这是一个合法的降级选项，但必须显式选择，不能默认。

## 5. 错误流程

- **额度不足**：阻止提交，明确显示当前可用额度与本次所需额度；不产生上游调用，不写假流水。
- **上游失败**：按各产品既有规则结算；`sd2` 遵循 ADR-0003，`hb` 以紫域 `cost` 字段对账（不假设失败必退）。
- **账号冲突 / 邮箱重复**：必须给出确定性规则。推荐「保留最早创建的账号为权威，其余账号标记为待合并并进入人工队列」，不做自动静默合并；合并前后额度总和必须可核对。
- **统一身份服务不可用**：三个产品必须**继续可用**（各自本地会话仍有效），不能因为身份服务宕机导致全员无法使用。这是 L3 的可用性底线。
- **登出**：三站会话同时失效；`hb` 的站点门禁 `canvas_auth` 不在本次统一范围内。
- **回滚**：统一入口与统一账号的回滚是「关闭新入口，三站回到各自登录」；统一额度的回滚必须能把余额从权威账本还原到各站，且还原前后总额一致。**回滚方案必须在 G3 之前写好并被读过**。

## 6. 验收标准

| 编号 | 标准 | 证据 |
|---|---|---|
| S1 | 统一入口页可从公网访问，且列出三个产品 | HTTP 状态码 + 页面截图 |
| S2 | 一套凭据可登录一次并进入任一产品 | 浏览器操作记录 + 三站会话 cookie 存在性 |
| S3 | 在同一浏览器内跨产品切换不需要再次输密码 | 逐步截图或录屏 |
| S4 | 登出后三个产品的会话同时失效 | 登出后逐个访问三个受保护路径的响应 |
| S5 | 三个产品各自的业务数据仍在自己库里，未被合并 | 三库表清单对比 + 数据卷清单未变 |
| S6 | `AUTH_COOKIE` 与 `CANVAS_LEGACY_TOKEN` 的值未改变 | 服务器 `.env` 值比对（只比对，不打印） |
| S7 | 三站显示同一个可用额度数值 | 同一账号在三站的额度接口返回值一致 |
| S8 | 在任一产品消耗额度后，其余产品的额度同步减少 | 消耗前/后的三站额度读数 |
| S9 | 并发扣费不产生超额或重复扣费 | 并发用例结果 + 账本对账 |
| S10 | 失败任务的退款按各产品既有规则执行且可对账 | 失败用例 + 流水记录 |
| S11 | 消耗明细可追溯到具体任务标识 | 明细接口返回 + 与任务记录的对应关系 |
| S12 | 统一身份服务不可用时，三个产品仍各自可用 | 停服演练结果 |
| S13 | 治理仓质量门仍为 0，且源码专项验证全部通过 | `node scripts/verify.mjs` + 各产品验证命令 |

**未验证项不得写成通过。** S7–S11 只有在 owner 明确选择「做统一额度」后才适用；否则必须在 `docs/DECISIONS.md` 记录降级决定，并把相应条目标记为不适用而非通过。

## 7. 数据与安全边界

- 真实密钥、令牌、站点密码、`AUTH_COOKIE` 绝不进本仓任何文件，也不贴进聊天（`AGENTS.md` §3）。
- 浏览器只保存用户侧配置，不保存服务器密钥；凭据一律服务端注入（`CONSTRAINTS.md` C1.2）。
- 不接受通过 URL 查询参数传递凭据（C1.3）。
- 涉及扣费/余额的写操作必须防并发，不能先 SELECT 再 UPDATE（C1.5）。
- 四个不可再生数据卷按 `AGENTS.md` §5 处理；本切片**不迁移、不清空、不重置**其中任何一个。
- 跨站点的会话传递必须走服务端，不允许把某个站点的会话令牌写进 URL 或前端可读存储。
- 统一身份服务本身成为新的高价值目标：必须启用其自身的会话撤销与版本栅栏能力，不能只依赖密码强度。

## 8. 范围澄清（2026-09-21）

- 本切片**不做**三站 UI 统一。三个产品保留各自的界面与交互，只统一「谁在用」和「还剩多少」。
- 本切片**不做**「三站变成一个域名下的三个路径」。用户仍通过三个域名访问各自产品，统一入口只是多了一个起点。
- `cauai.fun` 顶级域名当前解析到 Vercel 承载的个人作品集站点，**不在本切片范围内**，不改动。
- 本切片的三个子项（统一入口 / 统一账号 / 统一额度）风险等级不同：统一入口是 L2，统一账号与统一额度都是 L3，可以分批批准、分批落地。

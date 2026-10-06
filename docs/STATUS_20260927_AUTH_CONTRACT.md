# New API 统一认证契约复核（2026-09-27）

## 一句话结论

本地统一认证中转仍使用画布账号做密码校验并签发自己的 14 天会话；它没有按 D45 使用 New API 作为账号权威，也没有完整的 New API 会话刷新/撤销链路，因此统一登录尚未完成、未上线。

## 对当前的影响

- [已验证] 本地治理仓中的认证中转实现与 D45 不一致。
- [已验证] 本轮没有更改认证服务代码、线上配置或站点会话。公网统一入口的 HB 登录页可达，但 APIC 目标路径返回 400，因此该路径当前确实阻断从统一入口进入 APIC。
- [待核验] 未用 New API 账号凭据做真实登录或会话操作，无法报告真实浏览器的完整统一登录行为。

## 需要 owner 决定

需要 owner 提供统一入口服务的权威源码目录，或明确授权本线程突破 `E:\codex\huabu`“治理仓、不改源码”的项目边界。D45 的架构方向与 G3 批准已存在，不需要重复决定。

## 只读验证证据

- [已验证] 仅调用公网只读端点 `GET /api/status` 与登录加密状态端点；New API 当前回报版本 `v1.0.0-rc.38`，`password_login_enabled=true`、`password_login_encryption_enabled=false`、`turnstile_check=false`、`oidc_enabled=false`。公开配置显示自助注册开关仍为开启；本轮没有尝试注册。
- [已验证] 未带账号 Cookie 的公网只读 GET：`https://one.cauai.fun/healthz` 返回 200，`/auth/hb.html` 返回 200，`/auth/start?target=apic` 返回 400；New API `/api/status` 可读取。由此确认统一入口服务可达，但 APIC 目标目前不可从入口启动；没有测试 APIC 的直接交互式登录。
- [已验证] 官方 `QuantumNous/new-api` 固定标签 `v1.0.0-rc.38` 的源码含登录、refresh、logout、会话列表及按会话 ID 撤销路由。refresh token 由 HttpOnly Cookie 承载并轮换；logout 会撤销关联的服务端会话。核对文件：`router/api-router.go`、`controller/auth_session.go`、`service/auth_session.go`。线上版本号与标签一致，但没有对线上镜像做源码 digest 对照。
- [已验证] [`auth-broker/server.js`](../implementation/entry/origin/auth-broker/server.js) 默认调用画布 `/api/auth/login` 并发送 `{email,password}`；用画布响应签发 14 天 `one_session` JWT；仅配置 `hb`、`sd2` 两个目标；登出只清理 `one_session` Cookie。
- [主控推断] 因认证来源与会话生命周期都没有绑定 New API，不能据此认定使用者是 D45 的统一账号，也不能认定 New API 撤销会同步使 hb/sd2 的本地会话失效。

## 未验证与执行边界

- [待核验] 未使用凭据执行线上登录、刷新、登出或撤销；未核实 New API 当前账号是否有可关联既有 hb/sd2 账号的邮箱；未验证 2FA/passkey challenge 与跨域 Cookie 浏览器流程；未对线上中转容器做代码/镜像指纹核对，因此本地代码差异不能直接外推为线上认证源的完整事实。
- [已验证] 未调用会写入账户或会话状态的 API；未发布；未更改 apic 或其他站点配置。
- [已验证] 本轮只修改治理文档与续接索引，没有修改产品源码。`E:\codex\huabu\AGENTS.md` 明确本仓为规划与治理仓，不能在此改源码。按 `E:\codex\niannianai\zhuanhuiyuangong` 中路径关键词检索，没有发现统一入口认证服务的另一份权威源码副本；这不是对整台机器或服务器目录的穷尽证明。

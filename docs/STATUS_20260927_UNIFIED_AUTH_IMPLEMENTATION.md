# D45 三站统一账号桥接实现状态（2026-09-27）

## 一句话结论

本地已补齐统一注册、APIC 入口和 hb/sd2/apic 会话桥接，并恢复完整 APIC 源码依赖；最终运行时镜像构建与零写入验收通过，线上仍未生效、未发布。

## 对现在的影响

- [已验证] 统一入口的账号校验改为调用 New API 登录接口，不再把 HB 数据库当统一账号源。
- [已验证] 入口 targets 已包含 `hb`、`sd2`、`apic`；APIC 不再因缺少 target 而返回 `invalid_target`（仅对本地代码/测试成立）。
- [已验证] 注册页将注册请求转发到 New API；密码不写入 assertion，也不写入入口日志。
- [已验证] 登出契约覆盖三个站点和 New API；下游各站撤销自己的业务会话。
- [已验证] 线上仍是旧行为：只读请求 `GET /auth/apic.html` 返回 404，`GET /auth/start?target=apic` 返回 400，`GET /auth/register.html?target=apic` 返回 404；本地新增路由尚未构建部署。
- [已验证] 线上 APIC 当前邮箱验证关闭；统一注册因此把邮箱同时作为 New API `username` 发送，本地 broker 登录支持从 `user.username` 回退取得邮箱，APIC 桥接也支持按 `username` 回查，保证登录和登出都能找到同一账号。

## 状态分类

- 已在线上生效：无，本轮明确不发布。
- 本地已改但未发布：入口 broker、HB、SD2、APIC 源码契约。
- 只有计划/规格：服务器环境变量注入、三站浏览器端到端验收，以及发布流程中的回滚/并发发布确认。
- 未验证：真实数据库写入、真实注册/登录/登出、线上发布后 cookie 与 Origin 行为。

## 需要 owner 决定的事

当前不需要你决定。下一阶段若要上线，只需在单独发布轮次确认同一 `UNIFIED_AUTH_SECRET` / `UNIFIED_AUTH_ORIGIN` 配置已就位，并按项目发布闸门取得明确发布授权。

## 技术证据

- 入口：`implementation/entry/origin/auth-broker/server.js`、`contract.test.mjs`。
- HB：`canvas-api/server.js`、`canvas-api/auth.js`、`canvas-api/unified-auth.js`。
- SD2：`lib/auth.ts`、`app/api/auth/unified/route.ts`、`app/api/auth/unified/logout/route.ts`。
- APIC：`scratch/new-api-upstream-20260927/controller/auth_unified.go`、`router/api-router.go`。
- [已验证] `node contract.test.mjs`：PASS；只启动本地 mock New API/三站桥接，不连接真实站点。
- [已验证] `npm run typecheck -- --pretty false`（SD2）：PASS。
- [已验证] `node --check`（入口/HB）：PASS。
- [已验证] `node scripts/verify.mjs`：7 PASS / 2 WARN / 1 FAIL；唯一 FAIL 是 scratch New API 文档中预存的 `docs/plugin-api/README.md → ./v1.md` 链接，非本轮认证代码引入；C1.1 密钥扫描 PASS。
- [已验证] APIC 完整源码依赖已恢复：`go.mod`、`go.sum`、`Dockerfile`、`constant`、`middleware`、`oauth`、`pkg`、`relay`、`relaykit` 等目录均在构建上下文中；`docker build --pull=false --tag new-api-unified-auth:local-20260927 .` 最终运行时镜像构建通过。
- [已验证] 构建镜像静态验收通过：运行时 `/new-api` 可执行、三份许可证文件存在、镜像未内置 `UNIFIED_AUTH_*` / `JWT_SECRET` / `PG_PASSWORD`；`go test ./controller ./router -run '^$' -count=0` 在 builder2 中通过（仅编译，不执行数据库测试）。
- [未验证] 全量 `go test ./controller ./router` 未完成：测试进程在无输出等待后主动中止，未将其记为通过。
- [已确认] 未运行发布脚本，未调用真实写接口，未修改线上 `.env` 或数据库。

## 事后审查（人工等价 post-coding review）

- [blocking] 0：入口不再调用 HB 登录接口；APIC target/路由存在；assertion 仅在 POST body；ticket 单次消费；密码不进入 assertion/日志；New API 邮箱验证关闭时的 username 回退路径已纳入本地契约。
- [important] 1：APIC 完整编译与最终运行时镜像打包已验证；仍未做真实数据库启动、真实注册/登录/登出与线上发布后浏览器验收。
- [important] 2：shadow account 的首次登录会在各站本地库创建最小账号；本轮仅在契约代码中实现，未对真实数据库执行。
- [nit] 0：入口页面历史文本存在乱码，未在本轮扩大范围修复。

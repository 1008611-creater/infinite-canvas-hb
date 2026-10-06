# One 认证中转站测试修复（2026-09-28）

## 一句话结论

本地认证中转站的契约测试已修复并连续 3 次通过；线上没有改动，One 仍未发布统一登录。

## 本轮实际改动

- 文件：`implementation/entry/origin/auth-broker/contract.test.mjs`
- 原因：测试把中转站端口写成模拟服务端口加 1，容易与本机其他进程冲突，造成“服务未启动”的假失败。
- 改法：测试启动前临时申请一个空闲 TCP 端口，再启动中转站。

## 已验证

- `node --check server.js`：通过。
- `node --test contract.test.mjs`：通过。
- 同一测试连续运行 3 次：3/3 通过。
- 通过内容：HB、SD2、APIC 三个入口；统一注册；登录；一次性票据；会话查询；统一退出；错误密码拒绝；密码不进入票据或日志。
- `docker compose config`：通过。
- `node E:\codex\huabu\scripts\verify.mjs`：7 PASS / 2 WARN / 1 FAIL。唯一 FAIL 仍是 `scratch/new-api-upstream-20260927` 既有文档断链，与本轮文件无关。

## 未验证

- 未发布 One。
- 未验证线上 `/auth/apic.html`、`/auth/start?target=apic`。
- 未连接生产 New API、HB、SD2 或 APIC 做真实登录。
- 未做真实生成、扣费、退款、购买或宣传。

## 下一步

准备 One origin 的发布包和回滚检查；发布动作仍需单独明确授权后才执行。
- `docker build --pull=false -t cauai-auth-broker:review-20260928 .`：通过。
- 本地审查镜像摘要：`sha256:9658d244bb13abc47c3f0497780548fcd9fc7615075985ce2bb9cfe48deb6ae5`。


## 发布包准备（2026-09-28）

- [LOCAL ARTIFACT] `output/one-auth-broker-release-20260928-v1/` 已生成。
- [VERIFIED] 发布包包含 6 个文件：Caddyfile、docker-compose.yml、认证中转站 Dockerfile、package.json、package-lock.json、server.js。
- [VERIFIED] 发布包 `docker compose config` 通过；认证镜像构建通过。
- [VERIFIED] MANIFEST 哈希校验通过；未发现 `.env`、secret、token、password 命名文件。
- [NOT VERIFIED] 未上传、未部署、未进行线上登录或真实业务验收。

## 线上只读复核与部署条件（2026-09-28）

- [ONLINE VERIFIED] `one.cauai.fun/`、`/healthz`、`/auth/hb.html`、`/auth/sd2.html` 返回 200。
- [ONLINE VERIFIED] `/auth/apic.html` 返回 404；`/auth/start?target=apic` 返回 400；这是当前 One 统一登录的明确线上阻塞。
- [ONLINE VERIFIED] `apic.one.cauai.fun/api/status` 返回 200。
- [LOCAL VERIFIED] 发布包内 6 个运行文件的 SHA-256 与治理仓对应文件全部一致。
- [LOCAL VERIFIED] 本地没有 `implementation/entry/origin/auth.env`；发布包也不含该文件。生产机上的认证密钥是否已配置，尚未查看，不能推断为已配置或缺失。
- [BLOCKED BEFORE DEPLOY] 发布前需要只读确认生产 `/opt/cauai-one-origin/auth.env` 是否存在且含有效 `UNIFIED_AUTH_SECRET`，只核对存在性/长度，不读取或复制密钥；同时确认三个产品服务端共享匹配密钥的部署条件。缺失时先安全配置，再做发布。
- [NOT DONE] 没有上传或部署；没有做真实登录、生成、扣费、退款、购买或宣传。

- [VERIFIED] Staged release image ID: `sha256:85670e760847398948bceda3f3d7651ad3658fbefb70694d479c881646d27a08`; local build only, not pushed or deployed.

## 生产配置只读检查（2026-09-28）

- [ONLINE VERIFIED] 服务器 `/opt/cauai-one-origin/auth.env` 存在 `UNIFIED_AUTH_SECRET` 配置项；本次只输出存在性，没有读取值。
- [ONLINE VERIFIED] HB 的 `/opt/infinite-canvas/api/api.env` 存在 `UNIFIED_AUTH_SECRET` 配置项；本次只输出存在性，没有读取值。
- [ONLINE VERIFIED] 当前 `niannian-sd2-app` 容器没有 `UNIFIED_AUTH_SECRET` 或 `UNIFIED_AUTH_ORIGIN` 配置项；统一登录不能只发布 One，需要把 SD2 配置一起纳入发布。
- [BLOCKED BEFORE DEPLOY] SD2 需要在服务端配置与 One/HB 匹配的统一认证变量，并完成重建、回滚点和浏览器验收；本次没有改容器、没有读取密钥值。

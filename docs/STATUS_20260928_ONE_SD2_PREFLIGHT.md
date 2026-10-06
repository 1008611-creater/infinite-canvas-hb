# One + SD2 联合发布预检（2026-09-28）

## 一句话结论

One 与 SD2 的统一认证配置已完成本地预检，但还不能发布；SD2 当前工作树包含 29 个未整理改动，必须先冻结并审查正式候选包。

## 已验证

- [已验证] SD2 `npm run typecheck` 通过。
- [已验证] SD2 `docker compose --env-file .env.docker.example config --quiet` 通过。
- [已验证] SD2 `node --test --experimental-strip-types scripts/unified-quota.test.mts` 通过（1/1）；只检查本地样例，不连接真实服务。
- [已验证] SD2 `npm run build` 通过；构建产物包含 `/api/auth/unified`、`/api/auth/unified/logout` 和统一额度相关路由。
- [已验证] SD2 `git diff --check -- docker-compose.yml .env.docker.example` 通过。
- [已验证] SD2 代码读取 `UNIFIED_AUTH_SECRET` 和 `UNIFIED_AUTH_ORIGIN`；Compose 已把两项传入 app 容器。
- [已验证] One 认证中转 `node --check server.js` 通过；契约测试通过（mock-only，不写真实站点）。

## 本轮实际改动范围

SD2 统一认证配置的最小改动仍是 4 行：

- `.env.docker.example` 增加 `UNIFIED_AUTH_SECRET`、`UNIFIED_AUTH_ORIGIN`。
- `docker-compose.yml` 将两项传入 app 容器。

## 发布前阻塞

- [待核验] SD2 工作树当前有 29 个修改或新增路径，其中包含统一认证、统一额度和其他产品改动；尚未冻结成可回滚的正式候选包。
- [未验证] 尚未上传、重建或重启线上 SD2 容器。
- [未验证] 尚未把统一认证变量写入线上 SD2 容器。
- [未验证] 尚未做线上浏览器登录、跨站退出、真实扣费、退款、兑换码或生成验收。

## 当前线上影响

本轮没有改线上。One 仍是旧版本；SD2 线上容器仍缺少统一认证变量。因此 One 不能单独发布来宣称“三站统一登录”。

## 下一步

冻结 SD2 正式候选包：只纳入已经审查的 One/统一认证/统一额度改动，生成文件清单、哈希、备份点和回滚命令；完成后再单独决定是否发布。
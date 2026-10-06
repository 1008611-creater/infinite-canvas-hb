# 2026-09-27 · LAOBA 第一条切片发布记录

## 一句话结论

`aigc.cauai.fun` 已在线上运行 LAOBA 第一条统一工作台切片，公网基础验收通过。

## 已在线上生效

- 发布版本：`canvas-20260927-193140-5cea6ce`。
- `aigc.cauai.fun` 使用独立 Cloudflare Tunnel `aigc-canvas`，回源到现有 HB 画布服务器。
- 原 `hb.cauai.fun` 隧道、入口和数据卷未改动。

## 已验证

- 新域名未登录访问 `/` 返回 `302` 到 `/login.html`。
- `/login.html` 跳转统一认证入口。
- 带现有站点会话可读取 `BUILD_INFO.txt`，`/tasks` 返回 `200`。
- 未登录 `GET /api/auth/me` 返回 `401`。
- `hb.cauai.fun` 与 `aigc.cauai.fun` 读取到同一发布版本。
- nginx 配置检查通过，占位符已清零，API 容器已重建。
- `cloudflared-canvas` 与 `cloudflared-aigc` 均为 active。

## 未验证

- 真实账号视频出片、真实扣费/退款、双账号隔离和完整浏览器跨站登录尚未验收。
- 本次没有主动发起付费生成。

## 质量门

治理质量门仍为 `7 PASS / 2 WARN / 1 FAIL`；唯一 FAIL 来自既有 `scratch/new-api-upstream-20260927` 文档链接，不是本轮改动引入。

## 回滚

旧版本仍保留在服务器 `/opt/infinite-canvas/releases/`，回滚只需把 `/opt/infinite-canvas/current` 切回上一版并重载 nginx；`aigc-canvas` 隧道可单独停止，不影响 `hb.cauai.fun`。

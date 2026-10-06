# APIC `apic.cauai.fun` 线上修复与回归

- 修复日期：2026-09-27（北京时间）
- 对象：`https://apic.cauai.fun`
- 范围：HTTP 明文入口、HSTS、`grok-4.5` / `grok-4.6` 下线、New API 健康回归
- 操作边界：只修改 APIC Caddy 路由与 Grok 模型目录配置；未读取或记录任何密钥、Cookie、Authorization 或 `.env` 内容

## 一句话结论

**本轮两个根本问题已在线上生效：HTTP 已强制 308 跳转到 HTTPS，HTTPS 已下发 HSTS；`grok-4.5` 和 `grok-4.6` 已从可用模型目录移除，`grok-4.7` 与 `grok-composer-2.5-fast` 保留，网站主入口与 API 健康检查已跑通。**

## 对现在的影响

- [已在线上生效] `http://apic.cauai.fun/` 与 `http://apic.cauai.fun/api/status` 返回 `308`，`Location` 指向对应 HTTPS 地址。
- [已在线上生效] HTTPS 首页和 `/api/status` 返回 `200`，响应包含 `Strict-Transport-Security: max-age=31536000; includeSubDomains`。
- [已在线上生效] `/api/status` 返回 New API `v1.0.0-rc.38`；New API、PostgreSQL、Caddy 容器均为运行状态。
- [已在线上生效] `/api/pricing` 只保留 `grok-4.7` 与 `grok-composer-2.5-fast`，不再返回 `grok-4.5` 或 `grok-4.6`。
- [已在线上生效] 未带凭据访问 `/v1/models` 仍返回 `401`，未因本轮修复扩大匿名访问范围。
- [目前不影响线上] 本轮没有调用真实 API Key、没有提交模型生成、没有触碰充值/订单/余额/用户数据。

## 实际变更

1. Caddy 的 APIC 路由增加了基于 Cloudflare `CF-Visitor` / `X-Forwarded-Proto` 的 HTTP→HTTPS `308` 跳转，并增加 HSTS。
2. PostgreSQL `abilities` 表中仅将 `grok-4.5`、`grok-4.6` 的 `enabled` 设为 `false`。
3. Grok 渠道 `id=8` 的 `models` 列表从四个模型收敛为 `grok-4.7,grok-composer-2.5-fast`；未关闭整个 Grok 渠道。
4. 修改前已生成服务器备份：
   - `/srv/kidswear-data/backups/apic/Caddyfile.20260927T070816Z.bak`
   - `/srv/kidswear-data/backups/apic/new-api-20260927T070816Z.dump`

## 验证结果

- [已验证] Caddy 配置通过 `caddy validate`；容器内 `/etc/caddy/Caddyfile` 与宿主机配置 SHA-256 一致。
- [已验证] Caddy 重启后仍使用修复后的配置；New API 重启后 `/api/status` 返回 `200`。
- [已验证] 公网 HTTP/HTTPS、首页、`/api/status`、`/api/pricing`、`/v1/models` 均完成回归。
- [已验证] 事后复核发现并修正了第一次写入造成的 Caddyfile 编码/注释污染；最终差异只包含 APIC 路由规则，原有中文注释和其他站点路由已恢复。
- [已验证] 治理仓质量门复跑结果为 7 PASS / 2 WARN / 1 FAIL；唯一 FAIL 仍来自 `scratch/new-api-upstream-20260927/` 既有 Markdown 断链，不是本轮新增报告或 APIC 修复引入。

## 未验证与剩余风险

- [未验证] 未使用真实 API Key，因此没有验证真实文本/图像生成、扣费、失败退款和并发幂等。
- [未验证] 未验证 Cloudflare 缓存刷新、浏览器 HSTS 首次写入后的完整用户路径；当前公网响应已直接证实跳转和 HSTS。
- [待核验] 本次改动落在服务器当前 Caddyfile 与 New API 数据库；下一次 compose 重建或发布流程是否会覆盖该配置，需要在后续部署前把规则纳入权威部署源。

## 当前不需要你决定

本轮修复已按用户指令直接完成并回归，不需要额外批准。后续若要处理公开注册、CSP/安全响应头、New API rc.40 升级或真实模型调用，需要另行决定和授权。

## 证据入口

- `http://apic.cauai.fun/`
- `https://apic.cauai.fun/`
- `https://apic.cauai.fun/api/status`
- `https://apic.cauai.fun/api/pricing`
- `https://apic.cauai.fun/v1/models`

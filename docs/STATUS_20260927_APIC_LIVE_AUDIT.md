# APIC `apic.cauai.fun` 公网只读审计

> **历史快照**：本报告记录修复前状态。A1（HTTP 明文入口/HSTS）与 A4（Grok 4.5/4.6 目录展示）已于 2026-09-27 在线上修复；当前结果见 [`docs/STATUS_20260927_APIC_REPAIR.md`](STATUS_20260927_APIC_REPAIR.md)。

- 核查日期：2026-09-27（北京时间）
- 对象：`https://apic.cauai.fun`
- 范围：公网 HTTP/HTTPS、公开配置、登录/注册入口、模型目录与公开性能指标、主要页面可用性、响应头与 CORS
- 操作边界：只读；未提交真实注册、未使用真实账号或 API Key、未调用模型生成、未修改线上配置或数据
- 证据方式：`curl.exe`、真实 Chromium 页面快照、Playwright 网络/控制台记录、公开 API 响应

## 一句话结论

**APIC 的 HTTPS 首页、公开配置和模型目录可访问，但当前不能按“安全可公开使用”验收：HTTP 明文入口没有跳转到 HTTPS，响应未下发 HSTS；同时仍公开展示两个近 24 小时成功率为 0% 的 Grok 模型。**

## 对现在的影响

- [已在线上生效] `https://apic.cauai.fun/` 返回 200，登录页、注册页、模型广场和排行榜可以打开；未登录访问 `/dashboard` 会被送到 `/sign-in?redirect=%2Fdashboard`。
- [已在线上生效] `/api/status` 表明当前为 New API `v1.0.0-rc.38`，公开注册开启，邮箱验证关闭，Turnstile 关闭，密码注册开启。
- [高风险] `http://apic.cauai.fun/` 和 `http://apic.cauai.fun/api/status` 都直接返回 200，没有 `Location: https://...`。用户若通过 HTTP 访问，登录密码、Cookie 或 API Key 存在被明文窃听或篡改的风险；本轮没有证据表明已经发生泄露。
- [业务影响] `/api/perf-metrics/summary?hours=24` 公开返回成功率、延迟和吞吐量；其中 `grok-4.5`、`grok-4.6` 为 0% 成功率，但仍在模型广场和定价接口中作为可用模型展示。
- [目前不影响线上] 本轮没有调用真实模型、没有注册新账号、没有写入余额/订单/渠道配置；因此不能把计费、扣费、图像生成和退款链路标记为已验收。

## 状态分类

| 项目 | 状态 | 说明 |
|---|---|---|
| 首页、登录、注册、模型广场、排行榜 | 已在线上生效 | 真实 Chromium 页面可打开 |
| HTTPS 公网入口 | 已在线上生效 | 200，Cloudflare/Caddy 可达 |
| HTTP 强制跳转与 HSTS | 未通过 | HTTP 200，无 `Location`；响应未见 `Strict-Transport-Security` |
| 公开注册策略 | 已在线上生效 | `register_enabled=true`；邮箱验证和 Turnstile 均关闭 |
| 19 个模型目录与价格 | 已在线上生效 | `/api/pricing` 返回 19 个模型 |
| Grok 4.5 / 4.6 可用性 | 未通过 | 近 24 小时公开指标为 0% 成功率，但仍在目录中 |
| 真实 API 调用、扣费、充值、退款 | 未验证 | 本轮没有真实 Token，未做写入或付费调用 |

## 需要 owner 决定的事

1. **是否先修复传输安全再继续公开使用？（推荐：立即强制 HTTPS + HSTS）**
   - 影响：HTTP 访问会改为 301/308 到 HTTPS；不会改变账号或余额数据，但旧的 HTTP 书签会发生跳转。

2. **是否把 `grok-4.5` / `grok-4.6` 暂时下线或隐藏？（推荐：先禁用/隐藏，待连续成功探测后再恢复）**
   - 影响：用户暂时看不到两个当前不可用模型，避免把 0% 成功率模型当作可售卖能力；其他模型不受影响。

3. **公开注册是否继续保持开启？（推荐：在统一账号上线前关闭，或至少补 anti-abuse 与邮箱验证）**
   - 影响：关闭后新用户不能自助注册；已有账号和现有 API Token 不受影响。若保持开启，需接受无邮箱验证、无 Turnstile 的批量注册/撞库/资源滥用风险。

## 发现项

### A1 · P1：HTTP 明文入口未强制 HTTPS，且未见 HSTS

- [已验证] `curl.exe -i http://apic.cauai.fun/` 返回 `HTTP/1.1 200 OK`，无 `Location`。
- [已验证] `curl.exe -i http://apic.cauai.fun/api/status` 同样返回 200 JSON。
- [已验证] HTTPS 首页响应未见 `Strict-Transport-Security`。
- 影响：首访、旧链接、误输入协议或中间人降级场景下，用户凭据和 API Key 可能走明文；这是当前最优先的阻断项。
- 建议：在最外层代理把 80 端口只做 301/308 到 HTTPS；确认所有子路径和 POST 行为；再启用合适的 HSTS（先短 max-age 观察，再逐步延长）。

### A2 · P2：安全响应头基线缺失

- [已验证] 首页响应未见 `Content-Security-Policy`、`X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`。
- 影响：降低 XSS、点击劫持、MIME 嗅探和 referrer 泄露的防护纵深。
- 建议：先在报告模式验证 CSP，再按实际外部资源收紧；至少补 `X-Content-Type-Options: nosniff`、`frame-ancestors`/`X-Frame-Options`、`Referrer-Policy`。

### A3 · P2：公开注册没有邮箱验证或人机校验

- [已验证] `/api/status`：`register_enabled=true`、`email_verification=false`、`turnstile_check=false`、`password_register_enabled=true`。
- [已验证] `/sign-up` 只显示用户名、密码、确认密码，没有邮箱验证步骤。
- 影响：批量注册、撞库尝试、日志/数据库膨胀和上游资源滥用的成本较低。它不是本轮发现的越权漏洞，但不适合在统一账号和额度边界未完成时长期开放。
- 建议：按 D45/D47 的既有方向，在统一账号上线前关闭 APIC 公开注册；若必须保持开放，补邮箱验证、IP/账号速率限制和 Turnstile，并监控异常注册。

### A4 · P2：目录仍展示两个 0% 成功率模型

- [已验证] `/api/perf-metrics/summary?hours=24`：`grok-4.5` 与 `grok-4.6` 的 `success_rate=0`；`grok-4.7` 与 `grok-composer-2.5-fast` 为 100%。
- [已验证] `/api/pricing` 仍返回 19 个模型，并把上述两个模型放入 `enable_groups:["default"]`；模型广场也显示它们可用。
- 影响：用户会把不可用模型理解为可售卖能力，增加失败请求、退款/扣费争议和支持成本。
- 建议：先将 0% 模型移出默认可用组或在前端明确标记不可用；恢复前用连续探测证明成功率稳定。

### A5 · P2：性能明细接口未登录即可读

- [已验证] 未带 Cookie/Token 访问 `/api/perf-metrics/summary?hours=24` 返回 200，并暴露模型级成功率、平均延迟、吞吐量和时间窗口。
- 影响：泄露上游健康度、流量热点和性能基线，便于外部推断运营状态；若该页面不是刻意做公开状态页，属于过度暴露。
- 建议：对外只保留聚合/粗粒度状态；模型级明细改为登录后或管理员可见，或至少降采样和延迟发布。

### A6 · P2：CORS 允许任意来源且带 credentials

- [已验证] `OPTIONS /v1/models` 返回 `access-control-allow-origin: *`、`access-control-allow-credentials: true`；实际未授权 `/v1/models` 响应也带同样组合。
- 影响：通配符和 credentials 在浏览器规范下不能与任意来源凭据正常组合，但该策略过宽，未来若把 Cookie 会话或敏感接口接入同一 CORS 范围，容易形成跨站风险。
- 建议：按实际客户端白名单收紧来源；若 `/v1/*` 只使用 Bearer Token，移除 credentials；不要把 Web 会话 Cookie 纳入通配 CORS。

### A7 · P2：线上版本落后于上游最新正式 release

- [已验证] APIC 响应头和 `/api/status` 为 `v1.0.0-rc.38`。
- [已验证] 2026-09-27 查询 QuantumNous/new-api 官方 releases，最新正式 release 为 `v1.0.0-rc.40`（2026-09-21 发布），比线上多两个候选版本；rc.40 包含任务插件 2xx 提交状态、工具结果图片和定价配置等修复/改进。
- 影响：当前未证明 rc.38 存在直接安全漏洞，但线上持续落后会错过已发布修复，并增加后续升级跨度。
- 建议：先做备份、兼容性检查和 staging 冒烟，再安排单会话升级；不要在没有回滚点时直接替换生产容器。

### A8 · P3：公开页面与静态路由存在明显体验/运维瑕疵

- [已验证] `/about` 页面只有导航，主内容为空；`/api/about` 返回空字符串。
- [已验证] `/robots.txt` 与 `/.well-known/security.txt` 返回 SPA HTML，而不是各自应有的文本格式。
- [已验证] 首页统计文案显示 `0+`，而模型广场和 `/api/pricing` 已显示 19 个模型。
- [已验证] 无效登录请求返回 HTTP 200 + `{"success":false}`；前端能正确提示，但外部监控和标准客户端可能把它误判为 HTTP 成功。
- 影响：不直接阻断 API，但会损害 SEO、公开信任、监控准确性和用户对当前能力的判断。
- 建议：补齐或隐藏空页面；为 `robots.txt`/`security.txt` 配置真实静态内容；首页数字改为真实数据或删掉占位统计；认证失败改用 401/403 并保持客户端兼容。

## 未验证与边界

- [未验证] 未使用真实 API Key，因此本轮不能确认真实文本、图像、Responses/Claude/Gemini 路由、余额扣减、失败退款和并发幂等。
- [未验证] 未访问服务器容器、数据库、Caddy/Cloudflare Tunnel 或渠道监控任务；本轮只以公网证据为准。
- [未验证] 未提交注册表单；不存在本轮新建账号的证据。
- [未验证] 未判断 rc.40 与当前自定义渠道/数据库迁移是否兼容；升级只能在备份和 staging 验证后进行。

## 推荐下一步

1. 先修 A1：HTTP→HTTPS、HSTS、代理层回归测试。
2. 再处理 A4：把 `grok-4.5` / `grok-4.6` 从默认可用目录隔离，并安排连续健康探测。
3. owner 决定 A3 的注册策略后，再做 anti-abuse 或关闭注册。
4. 为 rc.40 建立 staging 升级与回滚验收，不直接在线上替换。

## 证据入口

- `https://apic.cauai.fun/`
- `https://apic.cauai.fun/api/status`
- `https://apic.cauai.fun/api/pricing`
- `https://apic.cauai.fun/api/perf-metrics/summary?hours=24`
- `https://apic.cauai.fun/v1/models`（无凭据应返回 401）
- `https://github.com/QuantumNous/new-api/releases`

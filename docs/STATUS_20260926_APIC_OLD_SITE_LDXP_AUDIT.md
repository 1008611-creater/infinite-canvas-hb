# APIC / 旧站 api.cauai.fun / LDXP 审计记录

- 核查时间：2026-09-26（服务器 UTC）
- 对象：`https://api.cauai.fun`、`https://apic.cauai.fun`
- 范围：旧站购买与兑换流程、APIC 当前模型/倍率/渠道/分组/检测/支付状态
- 原则：不记录密钥、密码、Cookie、Authorization 或数据库敏感字段

## 一句话结论

**APIC 已经能通过 McGrox 和其他现有渠道提供模型调用，倍率也在生效；但当前所有路由仍属于 `default` 用户组，渠道自动检测没有留下已运行证据，支付也没有接入 New API 的自动订单链路。旧站的链动小铺是外部购买卡密后回站手动兑换。**

## 对现在的影响

- [已验证] APIC 当前用户可以使用已启用的模型渠道；2026-09-26 的真实调用日志包含 `gpt-5.6`、`gpt-6-sol`、`kimi-k3`、`deepseek-v4.1-flash`、`grok-4.7`、`grok-composer-2.5-fast`。
- [已验证] `grok-4.5` 和 `grok-4.6` 在本次审计的真实调用中失败，日志类型为失败记录，不能把它们当成稳定可售卖模型。
- [已验证] McGrox 相关渠道仍以 `https://www.mcgrox.top` 为上游；DeepSeek 官方渠道和 `pro20x` 渠道也仍处于启用状态，所以“主要上游”当前是 McGrox 优先，而不是 McGrox 独占。
- [已验证] APIC 的计量展示为 USD，`quota_per_unit=500000`；当前倍率配置中，文本输入主要为 `2.5`、文本输出主要为 `4`，图像模型 `gpt-image-2.5*` 为 `1`。这些是 New API 计量倍率，不等于 McGrox 的真实采购成本，也不等于最终充值售价。
- [已验证] 旧站购买页不会自动给 APIC 充值：页面打开链动小铺后，提示用户复制订单详情中的卡密，再回旧站 `/redeem` 手动兑换。
- [未验证] 未找到链动小铺向 APIC 自动回调、订单签名协议、订单到用户账号的绑定规则。因此不能把旧站购买链接直接宣称为 APIC 自动支付。
- [待核验] 渠道监控配置的后台开关没有通过管理员接口读取；但所有渠道 `test_time=0`、`response_time=0`，数据库任务中没有渠道测试任务，应用日志也没有渠道监控运行记录，当前不能称为“自动检测已启用”。

## 旧站 `api.cauai.fun`

### 公网配置

- [已验证] 页面标题为“矿泉水API - AI API Gateway”。
- [已验证] 公开配置：站点名“矿泉水API”、注册开启、`payment_enabled=false`、`purchase_subscription_enabled=false`、`channel_monitor_enabled=true`、默认检测间隔 60 秒。
- [已验证] 购买入口是：`https://pay.ldxp.cn/shop/B59CCLX7`。
- [已验证] 购买页展示六个余额卡密档位：
  - ¥1.5 → 18.8 美金额度
  - ¥3 → 38.8 美金额度
  - ¥7 → 88.8 美金额度
  - ¥15 → 188.8 美金额度
  - ¥88 → 1088.8 美金额度
  - ¥648 → 8888 美金额度
- [已验证] 前端购买流程是“打开链动小铺 → 购买余额商品 → 复制订单详情卡密 → 回站兑换”。兑换接口为登录后的 `/api/v1/redeem`；未登录 POST 返回 401。

### 旧站支付的真实性质

- [已验证] 旧站不是 New API 内建支付套餐：公开配置把内建 payment 关闭，前端购买页是自定义外链 + 卡密兑换。
- [未验证] 链动小铺是否提供可调用的服务器回调或发卡 API。旧站公开页面本身没有提供这份协议证据。

## 当前 APIC `apic.cauai.fun`

### 服务和计量

- [已验证] `/api/status`：New API `v1.0.0-rc.38`，站点名“矿泉水api”，注册地址开启，服务地址为 `https://apic.cauai.fun`。
- [已验证] PostgreSQL、Redis、New API 容器均为 healthy/running。
- [已验证] `subscription_plans=0`、`subscription_orders=0`、`top_ups=0`、`user_subscriptions=0`、`redemptions=0`。
- [已验证] APIC 当前没有可回读的内建套餐、充值订单或兑换记录。

### McGrox 与模型

当前启用的 McGrox 相关渠道和模型：

| 渠道 | 状态 | 用户组字段 | 模型 |
|---|---:|---|---|
| `mcgrox-top` | 1 | `default` | `gpt-image-2.5`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst` |
| `pro` | 1 | `default` | `codex-auto-review`, `gpt-5.5`, `gpt-5.6`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-sol`, `gpt-image-2.5`, `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst` |
| `grok` | 1 | `default` | `grok-4.5`, `grok-4.6`, `grok-4.7`, `grok-composer-2.5-fast` |
| `plus` | 1 | `default` | 与 `pro` 相同 |
| `kimi` | 1 | `default` | `kimi-k2.6`, `kimi-k3` |
| `kun` | 1 | `default` | `deepseek-v4.1-flash` |

补充渠道：`deepseek-official`（`deepseek-v4-pro`、`deepseek-flash`）启用；`pro20x` 主渠道启用，重复行保持权重 0；本次没有改动这些渠道。

### “分组”审计

- [已验证] 频道名称有 `pro/grok/plus/kimi/kun` 这几类，但 New API 的真正用户组字段不是频道名称；当前 `channels.group` 和 `abilities.group` 全部为 `default`。
- [已验证] 当前两个用户都在 `default` 组；有效 Token 也只看到 `default` 或空组。
- [主控推断] 如果目标是让用户在不同套餐/权限下看到不同模型，当前仍未完成真正的用户分组；如果只是按上游渠道给模型分类，现有频道命名可以作为内部分类，但不能当作权限分组。

### 渠道检测审计

- [已验证] 所有当前渠道的 `test_time=0`、`response_time=0`。
- [已验证] `system_tasks` 只有 `model_update` 类型任务，没有渠道检测任务。
- [已验证] 最近应用日志没有渠道检测/自动测试运行记录。
- [待核验] New API 的管理员 `request_policy` 只能在登录后读取；未取得管理员会话，因此没有直接改写监控开关。

## 用户需要决定的事

1. **分组目标**：
   - 推荐：保留 `default` 作为当前兼容组，再新增面向用户的套餐组；已有用户和 Token 不迁移，避免突然失效。
   - 影响：需要定义每个组能用哪些模型、倍率和 Token 默认组。

2. **渠道检测策略**：
   - 推荐：开启定时检测，但先只检测并记录，不自动禁用；建议 10 分钟、并发 2，观察 24 小时后再决定是否自动熔断。
   - 影响：会产生少量上游探测请求；若启用自动禁用，则可能因短时 429 暂时下线模型。

3. **链动小铺支付落地方式**：
   - 推荐的最快方案：沿用旧站的“外部购买卡密 + APIC 手动兑换”，需要在 APIC 增加购买入口和兑换入口，但不宣称自动到账。
   - 自动到账方案：必须先提供/确认链动小铺的回调地址、签名规则、订单字段和卡密/账号绑定方式，然后再做适配器和幂等验收。

## 推荐下一条提示词

`采用保守方案：保留 default 兼容组，开启渠道定时检测但先不自动禁用；支付先沿用链动小铺外部买卡密、站内手动兑换。先给我列出需要改动的文件、数据库项和回滚步骤，不要立即上线。`

## 证据来源

- 旧站 `https://api.cauai.fun/`、`/purchase`、`/redeem` 的公开配置与前端资源。
- 旧站前端脚本：`https://api.cauai.fun/assets/index-BHLx6GB2.js`、`https://api.cauai.fun/assets/BalancePurchaseView-BVJmCLhj.js`、`https://api.cauai.fun/assets/redeem-DPJVbXiF.js`。
- APIC `https://apic.cauai.fun/api/status`。
- 服务器 `/opt/new-api` PostgreSQL 实时只读查询：`channels`、`abilities`、`users`、`tokens`、`options`、`system_tasks`、`logs`、`subscription_plans`、`subscription_orders`、`top_ups`、`redemptions`。
- 本记录不保存任何密钥、密码、Cookie、Authorization 或渠道 `key` 字段。


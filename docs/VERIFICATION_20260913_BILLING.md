# 计费模块验证报告 · 无限画布（批次 1 · 收得到钱）

> 日期：2026-09-13 ｜ 状态：**静态与算法层验证通过；运行层未验证**
> 2026-09-13 订正：映射表档位改为实时目录 26 档（删除 2700/4500/5700 估算档）；密钥扫描文件数 39 → **40**。
> 验证对象：`implementation/canvas-api/` 下 6 个文件 + `implementation/scripts/generate-ldxp-credit-codes.mjs` + `implementation/web/ziyu-channel-template.json`
> 验证手段：把模块内的算法**逐行照抄进独立沙箱实际执行**（发码端 vs 验码端对撞、攻击用例、边界用例），以及全仓密钥扫描。
> ⚠️ 本报告**不含任何密钥**；测试用密钥为临时伪造串，未使用服务器真实密钥。

---

## 一、结论摘要

| # | 验证项 | 结果 | 强度 |
|---|---|---|---|
| V-01 | 发码端与验码端算法一致性（800 张对撞） | ✅ 全部通过 | **实际执行** |
| V-02 | 伪造 / 篡改 / 换密钥攻击 | ✅ 全部被拒 | **实际执行** |
| V-03 | 兑换码归一化与哈希稳定性 | ✅ 符合预期 | **实际执行** |
| V-04 | 扣费换算 `customerCost` 全档位 | ✅ 与文档映射表一致 | **实际执行** |
| V-05 | 治理仓密钥扫描（40 文件） | ✅ 零真实密钥 | **实际执行** |
| V-06 | 表结构 ↔ 代码列名一致性 | ✅ 一一对应 | 静态校验 |
| V-07 | 路由清单 ↔ 文档一致性 | ✅ 17 条全部对上 | 静态校验 |
| V-08 | 并发扣费 / 重复兑换（真库） | ❌ **未验证** | 缺 Postgres 环境 |

**一句话**：钱算得对、码验得住、密钥没漏。剩下没验的只有"真数据库并发"这一项，它只能在服务器上验。

---

## 二、V-01 / V-02 / V-03 · 兑换码算法对撞（实际执行）

### 2.1 方法

把两端代码**逐行照抄**进同一沙箱执行，不做任何"简化"或"重写"：

- 发码端 ← `implementation/scripts/generate-ldxp-credit-codes.mjs` 的 nonce / payload / signature 三行
- 验码端 ← `implementation/canvas-api/ldxp-redeem.js` 的 `normalizeCode` / `signPayload` / `verifyCode`

### 2.2 对撞结果

```
面额 100 ：生成 200 张 → 通过 200 / 失败 0
面额 300 ：生成 200 张 → 通过 200 / 失败 0
面额 500 ：生成 200 张 → 通过 200 / 失败 0
面额 1000：生成 200 张 → 通过 200 / 失败 0
```

**结论**：两端 HMAC 算法完全一致（同一 payload、同一 secret、同一截断长度 32 位 hex 大写）。
**这为什么重要**：文档里写明"两边任何一处改动都必须同步另一处，否则已发出的码全部失效"。本项验证把这条风险从"靠人工纪律"降级为"已验证一致"。

### 2.3 攻击与边界用例

| 用例 | 期望 | 实测 |
|---|---|---|
| 真实码 | 通过 | ✅ 通过 |
| 篡改面额 100→1000（签名不动） | 拒 | ⛔ 已拒（`why=sig`） |
| 用另一个密钥签发 | 拒 | ⛔ 已拒 |
| 签名全 0 | 拒 | ⛔ 已拒 |
| 真实码签名改末位 1 个字符 | 拒 | ⛔ 已拒 |
| 非法面额 999（签名自洽） | 拒 | ⛔ 已拒（`why=denom`） |
| 缺签名段 | 拒 | ⛔ 已拒（`why=format`） |
| 空串 / null / 数字 | 拒 | ⛔ 已拒 |
| 全小写 + 前后空格 | 通过且**同哈希** | ✅ 归一化正确 |
| 同一张码两次 | 哈希一致 | ✅ |
| 两张不同码 | 哈希不同 | ✅ |

**关键结论**：篡改面额会被签名挡住（因为面额是 payload 的一部分），**不存在"买 100 档改成 1000 档"的漏洞**。
大小写与空格归一化后命中**同一条哈希** —— 这保证"同一张码无论用户怎么粘贴，都只能到账一次"。

---

## 三、V-04 · 扣费换算全档位（实际执行）

把 `credits.js` 的 `customerCost()` 照抄执行，与 `docs/PRICING_20260913.md` 的**26 档实时目录映射表**逐格比对：

| 紫域 cost | 代码算出扣点 | 文档写的 | 一致 |
|---|---|---|---|
| 0 | 0 | 0 | ✅ |
| 1 | 2 | 2 | ✅ |
| 5 | 8 | 8 | ✅ |
| 10 | 15 | 15 | ✅ |
| 50 | 75 | 75 | ✅ |
| 100 | 150 | 150 | ✅ |
| 150 | 225 | 225 | ✅ |
| 155 | 233 | 233 | ✅ |
| 175 | 263 | 263 | ✅ |
| 200 | 300 | 300 | ✅ |
| 225 | 338 | 338 | ✅ |
| 250 | 375 | 375 | ✅ |
| 260 | 390 | 390 | ✅ |
| 264 | 396 | 396 | ✅ |
| 300 | 450 | 450 | ✅ |
| 350 | 525 | 525 | ✅ |
| 360 | 540 | 540 | ✅ |
| 380 | 570 | 570 | ✅ |
| 392 | 588 | 588 | ✅ |
| 400 | 600 | 600 | ✅ |
| 444 | 666 | 666 | ✅ |
| 450 | 675 | 675 | ✅ |
| 500 | 750 | 750 | ✅ |
| 650 | 975 | 975 | ✅ |
| 700 | 1050 | 1050 | ✅ |
| 750 | 1125 | 1125 | ✅ |
| 950 | 1425 | 1425 | ✅ |
| 1500（真实任务实测成交价，非目录档） | 2250 | 2250 | ✅ |

不一致格数：**0**
边界行为：`cost = 0` → 返回 `0`（不是 1），符合"失败且 cost=0 不扣钱"的设计。

---

## 四、V-05 · 密钥扫描（实际执行）

对治理仓全部 40 个文件做正则扫描，匹配三类真实密钥特征：

| 特征 | 命中 |
|---|---|
| `zyai_...`（紫域 key 形态） | 0 |
| `sk-...`（OpenAI 形态） | 0 |
| `eyJ...`（JWT 形态） | 0 |

**结论**：治理仓零真实密钥。渠道模板里的 `apiKey` 是占位串 `ziyu-proxy`，真实 key 由 nginx 在服务端注入。

⚠️ **历史建议已被 D20 覆盖（2026-09-18）**：紫域渠道只有这一把 Key，老大裁决不轮换、不替换。当前 Key 保持服务器环境变量中的现值；只有实际失效或老大再次明确要求时才重新评估。

---

## 五、V-06 · 表结构 ↔ 代码一致性（静态校验）

逐列核对 `schema-credits.sql` 与代码里的 SQL 语句：

| 表 | 代码用到的列 | 建表是否都有 |
|---|---|---|
| `user_credits` | user_id, balance, updated_at | ✅ |
| `credit_ledger` | id, user_id, amount, balance_after, reason, task_id, recharge_request_id, metadata, created_at | ✅ |
| `credit_ledger` 幂等索引 | `uq_credit_ledger_task_reason (task_id, reason) WHERE task_id IS NOT NULL` | ✅ partial index，允许兑换/人工调整的 NULL task 多条共存 |
| `credit_redemptions` | code_hash(PK), user_id, credits, redeemed_at | ✅ |
| `channel_usage` | channel, task_id, user_id, status, ziyu_cost, charged_credits, result_url, local_media_key, updated_at | ✅ |
| `free_trial_usage` | user_id, period, used, updated_at | ✅ |
| `credit_adjustments` | user_id, admin_id, amount, note | ✅ |

`ON CONFLICT (code_hash) DO NOTHING` 依赖 `code_hash` 是**主键** —— 建表脚本里确实是 `PRIMARY KEY`，✅ 对得上。
`ON CONFLICT (user_id, period)` 依赖复合主键 —— ✅ 对得上。

---

## 六、V-07 · 路由清单（静态校验）

`routes-credits.js` 实际注册 **17 条**路由：

```
GET  /api/credits/me                      余额 + 流水 + 免费试拍余量
POST /api/credits/redeem                  兑换码
GET  /api/credits/redemptions             兑换历史
POST /api/credits/reserve                 预扣
POST /api/credits/settle                  结算
POST /api/credits/refund                  退款
GET  /api/credits/quote                   报价换算
GET  /api/credits/free-trial              试拍余量
POST /api/credits/free-trial/consume      消费一次试拍
GET  /api/ziyu/models                     模型目录（服务端代理）
GET  /api/ziyu/me                         紫域账号积分（管理员）
POST /api/ziyu/persist                    结果落盘
GET  /api/admin/credits/overview          管理总览
POST /api/admin/credits/adjust            人工调额
GET  /api/admin/credits/reconcile         对账差异
GET  /api/admin/credits/denominations     面额清单
POST /api/admin/credits/generate          在线发码
```

鉴权覆盖：**17 条全部 `requireAuth`**；其中 `/api/ziyu/me` 与 4 条 `/api/admin/*` 额外 `requireAdmin`。✅ 无任何匿名可达的计费/紫域路由。

**已确认无"绕过额度直接调紫域"的公开路由** —— 紫域调用只经 `/ziyu/` 网关（nginx 门禁 + Key 服务端注入），而预扣走 `/api/credits/reserve`。

⚠️ **但存在一个真实的顺序风险（批次 2）**，已记录在 `implementation/deploy/ziyu-nginx.conf.snippet` 第四节：
`/api/auth/verify` 目前同时接受"真会话"和"旧站点 cookie"。公开注册后，任何曾拿到旧站点密码的人，只要留着那枚 cookie 就能继续通过验证去花服务器上的紫域额度 —— 而他可能没账号也没余额。
**正确顺序**：先让额度体系对所有 `/ziyu/` 调用生效 → 再收紧 `verify` 的 legacy 分支 → 最后才考虑撤 `/ziyu/` 门禁。

---

## 七、V-08 · 未验证项（如实声明）

| 项 | 为什么没验 | 什么时候能验 |
|---|---|---|
| 真 Postgres 并发扣费 | 本会话无 shell、无数据库连接 | 服务器上两并发打同一 taskId |
| 重复兑换到账一次 | 同上（依赖数据库唯一键行为） | 服务器上同一张码提交两次 |
| 免费试拍月度重置 | 依赖服务器本地时区 | 上线后跨月观察 |
| nginx 片段真实加载 | 无 shell，不能跑 `nginx -t` | 上线时 |
| 紫域渠道脚本真实执行 | 无浏览器 | 上线前真机冒烟 |

### 7.1 落地器自身缺陷 I（实际执行 · 已修复并复验）

批次 1 的落地器 `implementation/scripts/apply-batch1.mjs` 曾有一个**只在"零写入"路径上暴露**的缺陷：

- **现象**：当所有步骤都已是最新（幂等跳过）时，脚本仍然打印「已写盘 N 处」，`N` 是步骤总数而非真实写入数 → 谎报。
- **影响面**：只影响最后那两行小结文案。文件内容、备份、退出码均正确，所以假源树首跑时不会暴露。
- **修法**：`flush()` 内部计数真实写入，函数返回该计数；调用点按 `written === 0` / `> 0` 分两套文案。`--dry-run` 分支在 `flush()` 之前就 `process.exit(0)`，不受影响。
- **复验（实际执行）**：假源树第五次真跑 —— 首跑打印「已写盘 10 处」，紧接着幂等复跑打印「无需改动：所有步骤都已是最新（幂等跳过），本次没有写任何文件」。两种情况文案均正确。

结论强度：**实际执行**（假源树）。**对真实权威树**：2026-09-13 已补做**零写入干跑**（读真文件、写内存覆盖层），`apply-batch1.mjs` 的 S1–S8 锚点逐条命中、权威树跑前跑后字节数一致 —— 见 `docs/VERIFICATION_20260913_APPLY_DRYRUN.md`。但**仍未真正写盘**，与 V-08 的未验证边界一致：干跑只证明"不会插错位置"，不证明"落地后能收钱"。

**本报告全部结论均标注了强度**：标"实际执行"的是真跑过的，标"静态校验"的是读代码比对出来的，标"未验证"的一律没写"已实现"。

---

## 七之二、第 20 轮复测（2026-09-13，实际执行 · 只读）

本节全部为**对紫域线上接口的真实调用**（`GET /api/v1/models`、`GET /api/v1/me`、`GET /api/v1/jobs?limit=100`），**未提交任何新任务、未新增花费**。

### 7b.1 目录与余额

| 项 | 结果 |
|---|---|
| 模型目录 | **44 个**（39 video + 5 image）；`cost` 取值集合 **27 档**（新增 `600`） |
| 新增档位 | `600` = 「官方稳定2.5 480p 30图+10视频+10音频 不卡人脸」 |
| 账号余额 | `credits = 12000`（第 19 轮两个探针共花 60：`802b8c52` 10 + `7c03ade8` 50） |
| `durationCosts` | **44/44 全为空** `{}`，不可依赖（结论不变） |

### 7b.2 任务全量（38 条）

| 项 | 结果 |
|---|---|
| 总数 | 38 条：completed **19** / failed **19** |
| failed 退款 | **19/19 `refunded=true`**，`refundAmount == cost`，mismatch **0** |
| failed 聚合 | 名义扣费 **3430** / 退款 **3430** / **净支出 0** |
| failed 分档 | `{0:3, 5:4, 200:6, 300:1, 350:2, 380:2, 450:1}` |

> 订正：早期文档写的「名义 9370 / 净支出 5940」是**算错的**（把 completed 的 cost 也算进了 failed 聚合），已全仓订正为 **3430 / 3430 / 0**。

### 7b.3 产出字段回归（★ 决定性）

| 任务 | 类型 | cost | 断言 |
|---|---|---|---|
| `7c03ade8` | video | 50 | ✅ 顶层 `resultUrl` = `hermes_video_1789273633_13f9499938.mp4`，`ok:true` |
| `802b8c52` | image | 10 | ✅ 顶层 `resultUrl` = `generated_image_1789273321_dd9db62c8b.png`，`ok:true`（**必须显式传 `kind:"image"`**，否则按 URL 推断） |
| `0046e0d8` | video | 350 | ✅ 正确判 `ok:false`（`RESULT_URL_MISSING`），输入素材 3 张图 |
| `195f4a3a` | video | 150 | ✅ **反例**：正确判 `ok:false`；输入素材 5 图 + 1 视频。**旧实现会把这 1 个输入视频当成品返回** |

结论：`ziyu.js` 重写后，**不再把用户上传的参考素材当产出交付**；取不到产出 URL 时**报错而不报成功**。

### 7b.4 由本轮暴露并修复的缺陷

| 缺陷 | 严重度 | 状态 |
|---|---|---|
| 产出字段取错（从 `assets` 取，应为顶层 `resultUrl`） | **致命**：出片全部丢结果，或交付用户自己的上传素材 | ✅ 治理仓 `ziyu.js` 已修；`ziyu-channel-template.json` 两段脚本已修；待用户终端执行落地器 |
| `POST /api/ziyu/persist` 落盘前未接 `resolveResultUrls()` 前置判断 | 高：`ok:false` 也可能被标成功落盘 | 🟡 已写入 `APPLY.md` 落盘前置条件，**代码待改**（`routes-credits.js`） |

---

## 七之三、第 95 轮复验（2026-09-13 · 实际执行 · 内存桩）

> ★ 本节所有结果**来自内存桩**（虚拟 pg 客户端），**从未在真实 Postgres 上执行过任何 SQL**。
> 它证明的是「逻辑自洽」，不是「真库能跑」。真库验证仍必须在上线前完成，见 §七。

### 7c.1 本轮修掉的三处缺陷

这三处的共同点是：**它们不会让账算错，而是让账"看起来全对"**。第三种最危险。

#### 缺陷 A —— 对账 SQL 与扣费公式不一致（会报假差异）

`credits.js` 的 `reconcileChannelUsage()` 用 SQL 重算"应收积分"，与 JS 的 `customerCost()` 必须是同一函数：

```sql
-- 修前（cost = 0 时期望 1，与 JS 的 0 不符 ⇒ 每笔零成本任务都被误报为差异）
GREATEST(1, CEIL(ziyu_cost * $2))
-- 修后
CASE WHEN ziyu_cost <= 0 THEN 0 ELSE GREATEST(1, CEIL(ziyu_cost * $2)) END
```

**逐值对照（18 例，0 处不匹配）** —— 左为紫域 `cost`，右为 JS / SQL 两边算出的应收积分：

| ziyu_cost | -5 | -1 | 0 | 0.0001 | 0.4 | 0.5 | 0.66 | 0.67 | 1 |
|---|---|---|---|---|---|---|---|---|---|
| 应收积分 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 2 | 2 |

| ziyu_cost | 1.5 | 2 | 3 | 7 | 19 | 100 | 200 | 1200 | 9999.9 |
|---|---|---|---|---|---|---|---|---|---|
| 应收积分 | 3 | 3 | 5 | 11 | 29 | 150 | 300 | 1800 | 15000 |

`mismatches = 0`。

对账 SQL 同时把三类行标为差异，语义已在注释里写明：

- `ziyu_cost IS NULL` —— 预扣了但从未结算（任务卡住 / 进程被杀）；
- `charged_credits IS NULL` —— 扣了钱但没登记用量；
- 金额不符 —— 真算错。

#### 缺陷 B —— `channel_usage` 表**没有任何写入点**（比 A 严重）

修前全仓 `INSERT INTO channel_usage` 命中 **0 处**。后果是一条完整的假绿链：

1. 表永远为空；
2. `settleTaskCredits()` 的 `UPDATE channel_usage ...` 静默影响 0 行（不报错）；
3. `reconcileChannelUsage()` 永远返回**空数组**；
4. 管理端看到的是「**今日零差异**」，而真相是「**一笔账都没在记**」。

修法：`credits.js` 新增 `recordChannelUsage(client, { userId, taskId, metadata, status, chargedCredits })`，
用 `INSERT ... ON CONFLICT (channel, task_id) DO UPDATE`（唯一索引 `uq_channel_usage_task`）。
**冲突时刻意不覆盖 `status`** —— 否则"预扣"这个早期调用会把已写好的终态倒退回 `reserved`。

接入点三处：

| 位置 | 场景 | 说明 |
|---|---|---|
| `reserveTaskCredits()` L240 | 正常预扣 | 落一行 `status=reserved` |
| `reserveTaskCredits()` L199 | **零预扣短路** | 见缺陷 C |
| `refundTaskCredits()` L387-393 | 显式退款 | 带 `AND status = 'reserved'` 守卫，不覆盖终态 |

`channel` / `modelId` / `mode` 一律从 `metadata` 取（新增 `pickMeta()`：只接受非空字符串、trim、截断 200 字符），
默认 `channel = 'ziyu'`。同时 `settleTaskCredits()` 里原先硬编码的 `channel = 'ziyu'` 改成 `$6` 参数化。

#### 缺陷 C —— 零预扣任务从对账里彻底消失（本轮新发现）

`credits` 为 0 的任务会走 `reserveTaskCredits()` 的短路分支，修前该分支**不留任何痕迹**，
于是这类任务既不进 `channel_usage`、也不进对账视野 —— 白送出去的量无人可见。
修法即缺陷 B 的第二个接入点。

### 7c.2 全生命周期模拟（12 步，内存桩）

初始：`user_credits` 余额 100000，其余表为空。

| # | 操作 | 结果 |
|---|---|---|
| 1 | 预扣 A 29 点 | `ok:true, charged:29, balance:99971` |
| 2 | 重复预扣 A | `ok:true, duplicate:true, balance:99971` —— **未重复扣** |
| 3 | 结算 A（紫域 cost=19 → 应收 29） | `ok:true, charged:29, reserved:29, delta:0` |
| 4 | 重复结算 A | `ok:true, duplicate:true` |
| 5 | 预扣 B 29 点 | `balance:99942` |
| 6 | 结算 B（cost=0，status=failed） | `charged:0, reserved:29, delta:-29` ⇒ **按差额退回 29 点**（不假设"失败必退"，一律以 cost 为准） |
| 7 | 预扣 C **0 点** | `ok:true, charged:0`，且 `channel_usage` **有行**（缺陷 C 的验证点） |
| 8 | 预扣 D 29 点 | `balance:99942` |
| 9 | 显式退款 D | `ok:true, refunded:true, amount:29, balance:99971` |
| 10 | 重复退款 D | `ok:true, refunded:false, duplicate:true` —— **未重复退** |
| 11 | 用户 u2 预扣 999999 点 | `ok:false, code:CREDITS_INSUFFICIENT`，且 **`channel_usage` 无行**（拒绝的请求不留痕，正确） |
| 12 | 已退款后再结算 D（cost=10） | `ok:true, delta:-14`，余额 99985 |

终值：`user_credits` 余额 99985，`credit_ledger` 7 条。

**第 12 步是本轮发现的一个边界（未修，如实记录）**：`settleTaskCredits()` 只检查"是否已结算过"，
**不检查"是否已退款"**。所以一个已显式退款的任务若之后又被结算，会按"预扣 29、应收 15"的差额再退 14 点。
正常链路不会走到（退款只用于"任务根本没建立起来"、之后不会再有 cost），
但**调用方必须保证退款后不再调结算**。已记入 §八 待办。

### 7c.3 对账接口的实际产出

12 步跑完后调 `reconcileChannelUsage({ days: 2 })`，返回：

```
[{"user_id":"u1","channel":"ziyu","task_id":"C","model_id":null,"mode":null,
  "status":"reserved","ziyu_cost":null,"charged_credits":0,"error_code":null}]
```

即**只有任务 C 被标为差异**（预扣了但还没结算 —— 正是 `ziyu_cost IS NULL` 这一类，符合预期）。
A（cost=19 / charged=29）与 D（cost=10 / charged=15）都**不再被误报** —— 这正是缺陷 A 修好的证据。

实际生成的 SQL 与参数（已打印确认）：

```sql
SELECT task_id, user_id, model_id, status, ziyu_cost, charged_credits, created_at
  FROM channel_usage
 WHERE created_at > NOW() - ($1 || ' days')::interval
   AND (ziyu_cost IS NULL OR charged_credits IS NULL
        OR charged_credits <> CASE WHEN ziyu_cost <= 0 THEN 0
                                   ELSE GREATEST(1, CEIL(ziyu_cost * $2)) END)
 ORDER BY created_at DESC
-- PARAMS ["2", 1.5]
```

### 7c.4 顺带复验的其它路径

| 项 | 结果 |
|---|---|
| `channel_usage` 写入内容 | A：`{status:completed, charged:29, ziyu_cost:19, model_id:veo3, mode:t2v}` —— metadata 正确透传 |
| 退款后 usage | D 行 `{status:completed, ..., error_code:task_refund}` |
| `getCreditSummary()` | 余额 99985、`pricing = {cnyPerCredit:0.1, multiplier:1.5, denominations:[100,300,500,1000]}` |
| 免费试拍（限 3 次/月） | 第 1/2/3 次 `ok:true`（used 1→2→3），第 4/5 次 `FREE_TRIAL_EXHAUSTED`；`limit=0` → `FREE_TRIAL_DISABLED`；不同用户互不影响 |
| `adminAdjustBalance(+100)` | 余额 99985 → 100085 |
| `adminCreditOverview()` | 返回 wallets（2 个用户）+ usage（3 行） |
| 语法 | `vm.compileFunction()` 编译 `credits.js` 模块体 → **SYNTAX OK** |

### 7c.5 本轮**没有**证明的事

- ❌ **从未在真实 Postgres 上执行任何一条 SQL**。所有事务、唯一索引冲突、`ON CONFLICT DO UPDATE ... WHERE` 的真实行为都未验证。
- ❌ **并发未验证**。`pg_advisory_xact_lock` 的作用只是"设计上串行化"，桩里是顺序执行的，证明不了真并发下的表现。
- ❌ `uq_channel_usage_task` 唯一索引在真实库里的定义未核对（桩里靠内存数组模拟）。
- ❌ 免费试拍的**跨月重置**只验证了同一 period 内的行为；跨月需要真实时间或真库。
- ❌ 内存桩的 `free_trial_usage` 分支曾把 `$3` 误读为 `$4`（已修正）。**这类桩自身出错的风险，是真库验证不可替代的直接理由。**

### 7c.6 落地器兼容性

改动只落在 `implementation/canvas-api/credits.js`（治理仓内），
`apply-batch1.mjs` L198-206 按**内容逐字比对**（`readText(to).text === body`）判断"已一致"，
不硬编码字节数或哈希 ⇒ **改 `credits.js` 不会破坏落地器**。
已重跑零写入干跑确认：批次 1 / 2 / 3 全部 `FAIL 0`，唯一 `BLOCK` 是与本次无关的 `B3-1`（`D-agent-auth` 待裁决），
7 个 `WATCH` 文件字节数零变化。

---
## 八、下一步

1. 给我紫域积分采购价（官方口径 ¥0.01/积分，需你确认真实到手价）→ 我出最终定价结论（见 `docs/PRICING_20260913.md` 第三节）
2. 服务器 4 个环境变量就绪 → `ZIYU_API_BASE` / `ZIYU_API_KEY` / `LDXP_REDEEM_SECRET`（≥32 字符）/ `FREE_TRIAL_MONTHLY_LIMIT`
3. 授权落代码到权威源码树 → 6 个文件 + 2 处接线（`server.js` 的 6 处必改见 `routes-credits.js` 顶部）

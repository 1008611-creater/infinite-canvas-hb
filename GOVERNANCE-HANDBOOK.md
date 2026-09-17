# GOVERNANCE-HANDBOOK.md · 无限画布（hb.cauai.fun）

> **⚠️ 2026-09-17 瘦身（R1 处置）**
> 本文件原先同时承担「状态快照 + 批次计划 + 接口变更 + 安全纪律 + 验收清单」五种职责，
> 其中三种与 `ROADMAP.md` / `BACKLOG.md` / `DECISIONS.md` **逐字重复**——
> 历史上「批次 1 已完成」的错误标注，正是因为要同步四处才漏改。
>
> **现在本文件只保留两件别人没有的东西：接口与数据变更清单、安全纪律。**
> 其余内容**不在这里维护**，请去下列 SSOT：
>
> | 想知道 | 去这里 |
> |---|---|
> | 做到哪了 / 下一步做什么 | `docs/ROADMAP.md` |
> | 待办事项 | `docs/BACKLOG.md` |
> | 决策与待裁决、阻塞项 | `docs/DECISIONS.md` |
> | 验收能不能发 | `implementation/deploy/ACCEPTANCE.md` |
> | 流程闸门与退出条件 | `docs/LIFECYCLE.md` |
> | 变更风险分级 | `docs/CHANGE-RISK.md` |
> | 文档权威度与上下文包 | `docs/INDEX.md` |
> | 项目审计事实与风险清单 | `docs/PROJECT_CONTEXT.md` |
>
> 旧版本的状态快照与三批次正文已迁移，未删除——见 `docs/ROADMAP.md` 与 `docs/DECISIONS.md`。

---

## 一、接口与数据变更（公开面）

**本表是「对外契约变化」的唯一登记处。** 任何会改变调用方行为的改动都要在这里加一行。

### 批次 1（设计已定，落地状态以 `docs/ROADMAP.md` 为准）

- 新增表（6 张）：`user_credits`、`credit_ledger`、`credit_redemptions`、`channel_usage`、`free_trial_usage`、`credit_adjustments`
- 新增接口：查询余额、兑换兑换码、管理员生成兑换码、管理员调整余额
- 新增网关路径 `/ziyu/`（服务端注入 Key）+ 渠道模板一条
  - **模板 `apiKey` 填非密钥占位串 `ziyu-proxy`，不是留空** —— 空 key 会被 `video.ts` L84-85 / L193-194 直接抛 `apiKeyRequired`（D10.6）
- 前端新增：余额显示、兑换入口、模型分组选择
- **不改动**：`/api/*` 现有账号/项目/素材/媒体/同步接口的对外契约；`AUTH_COOKIE` 保持长期固定

### 批次 2（待落地）

- nginx 路由变更：撤四处门禁（`/`、`/assets/`、`/config.js`、`/agnes/`）
- **`/dav/` 不改动**（D10.2 已移出批次 2）
- **`/ziyu/` 保留门禁**（D10.3）

### 批次 3（待落地，卡 `D-agent-auth`）

- `canvas-agent` 对外暴露形态未定 → 对外契约未定 → **本节暂空**

---

## 二、安全纪律（本文件的核心，不迁移）

### 2.1 密钥

- 永远不要把真实密钥、令牌、站点密码、`AUTH_COOKIE` 写进本文件夹，也不要贴进聊天。
- 已知的明文泄露点只写路径引用，不复制原文（清单见 `PRODUCTS.md` 第六节）。
- 需要提到密码时，只写"服务器 `/opt/agnes-video-proxy/.env` 里的 `SITE_PASSWORD`"。
- **凭据一旦出现在聊天/截图/日志，视为已泄露，必须轮换**（`CONSTRAINTS.md` C1.7）。

### 2.2 门禁与资金

- ★ **`/ziyu/` 门禁不是资金防线**：注册成功会下发 `canvas_auth` cookie，注册接口又不吃门禁（B-6，证据 `docs/STATUS_20260913_LIVE_GATE.md`）。
  **任何会花钱的路径必须走 `requireAuth` + 余额预扣**，不能只靠 nginx cookie 门禁。
- ★ **公开注册前必须先确认第一个注册者是 `admin`**：`promoteToAdminIfFirst()` 只对库里 `count(*) <= 1` 时生效，**顺序反了后果不可逆**。
- 普通用户访问网盘挂载必须被拒。
- 构建产物中搜不到紫域 Key。

### 2.3 数据与发布

- 四个**不可再生**数据卷，任何清理/迁移/重置前单独确认：`/opt/canvas-webdav`、`/opt/canvas-api-media`、`/opt/canvas-api-sync`、`/opt/canvas-postgres`。
- `JWT_SECRET` / `PG_PASSWORD` 必须持久化。
- 落权威源码树前必须过 `docs/LIFECYCLE.md` 的闸门 G3（书面批准）。源码树当前**可写**（2026-09-17 实测）。

---

## 三、验收

**不在这里重复清单。** 完整验收门槛见 `implementation/deploy/ACCEPTANCE.md`（A-00 ~ A-30）。

三条最容易漏、且代价最大的：

1. **错误路径**：余额不足被拒、并发提交不重复扣、失败任务按紫域 `cost` 对账。
2. **断言落盘**：验证结果必须存盘，不能只 `console.log`（`CONSTRAINTS.md` C4.5）。
3. **真人冒烟**：节点链真实执行仍未验证（B-1 残留），真跑会真出片/真花钱，需单独授权。

---

## 四、质量门

```bash
node E:/codex/huabu/scripts/verify.mjs           # 常规
node E:/codex/huabu/scripts/verify.mjs --strict  # warning 也判失败
```

覆盖：密钥扫描 / 文档链接 / `.bak` 残留 / 口径一致性（路由数·工具数·批次状态）/ 索引完整性 / 落地器零写入干跑。

---

> 本手册由治理流程维护。密钥、站点密码、令牌一律不进本文件夹。

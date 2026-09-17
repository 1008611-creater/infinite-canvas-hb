# 文档索引 · 无限画布（hb.cauai.fun）

> **本文件解决 R1（状态口径多源重复）与 R12（无上下文装载标准）。**
> 它不是目录清单，是**权威度声明 + 最小上下文包**。
> 证据基准日：2026-09-17。取证方式见 `PROJECT_CONTEXT.md`。

---

## 0. 三条使用规则（先看这个）

### 规则一：每类事实只有一个【SSOT】

标记 **【SSOT】** 的文件是该类事实的**唯一可改处**。其他文件引用它，**不得复制其内容**。
历史上正是因为「批次状态」在 5 份文档里各写一遍，才出现「批次 1 已完成」的错误标注并需跨文件订正。

### 规则二：证据类文档只追加，不改结论

标记 **【证据】** 的文件是某次实测的记录。**结论错了就在下面追加订正，绝不回头改写原文。**
改写会让"当时到底测出了什么"变得不可考，这正是 L2 验证据经历三轮订正的教训。

### 规则三：按任务读最小上下文包，不读全仓

41 份文档全读一遍是浪费，而且会读到过期结论。**先查下面 §3 的上下文包。**

---

## 1. 文档权威度总表

### 1.1 入口与铁律

| 文件 | 权威度 | 一句话 | 何时要改 |
|---|---|---|---|
| `README.md` | 入口 | 项目门面，指向本文档 | 拓扑/域名变化时 |
| **`AGENTS.md`** | **【SSOT】铁律** | 凭证、发布、数据卷、密钥纪律；**领域专属约束** | 领域事实变化时 |
| **`CONSTRAINTS.md`** | **【SSOT】通用约束** | 跨项目可复用的质量门槛（安全/架构/测试/文档） | 几乎不动 |
| **`docs/INDEX.md`**（本文件） | **【SSOT】导航** | 谁能改什么、读什么 | 新增/废止文档时 |
| `docs/PROJECT_CONTEXT.md` | 【证据】审计 | 2026-09-17 项目审计事实与风险清单 R1–R12 | 重新审计时追加 |

### 1.2 产品与架构

| 文件 | 权威度 | 一句话 |
|---|---|---|
| **`docs/PRODUCT_CHARTER.md`** | **【SSOT】产品边界** | 是什么/不是什么、视觉 DNA、事实分层、L1–L4 分级、用户必答五问 |
| **`docs/CANVAS_ARCHITECTURE.md`** | **【SSOT】技术架构** | 技术栈、部署拓扑、门禁设计、三个坑、三种视频模式 |
| **`docs/DECISIONS.md`** | **【SSOT】决策** | D1–D11 决策记录 + 待裁决 Q-1~Q-12 + 阻塞项 B-1~B-6 |
| `docs/UPSTREAM_MAP.md` | 【参考】 | 上游 MIT 项目对照与义务 |
| `docs/REVENUE_MODEL.md` | 【分析】 | 收益现实（当前无线上计费） |
| `docs/PRICING_20260913.md` | 【方案·待核对】 | 定价方案书：扣费口径、毛利敏感度、卡密面额 |
| `PRODUCTS.md` | 【索引】 | 相关产品权威路径 + 密钥泄露点位置清单 |

### 1.3 计划与状态

| 文件 | 权威度 | 一句话 |
|---|---|---|
| **`docs/ROADMAP.md`** | **【SSOT】计划** | 三批次（收得到钱 / 放得开 / 跑得顺）的详细范围与顺序 |
| **`docs/BACKLOG.md`** | 派生（读 ROADMAP） | 待办清单；**与 ROADMAP 重叠部分以 ROADMAP 为准** |
| **`docs/LIFECYCLE.md`** | **【SSOT】流程** | 九阶段生命周期 + 闸门 G1–G6 + 退出条件 |
| **`docs/CHANGE-RISK.md`** | **【SSOT】风险分级** | L0–L3 变更分级与对应流程轻重 |
| `GOVERNANCE-HANDBOOK.md` | **瘦身后**：只留安全纪律 | 历史状态快照已移除，指向 ROADMAP / DECISIONS |

### 1.4 证据与验证（只追加，不改结论）

| 文件 | 权威度 | 一句话 |
|---|---|---|
| `docs/STATUS_20260912.md` | 【证据】 | 896 文件扫描：批次 1 权威树零命中 |
| `docs/STATUS_20260913.md` | 【证据】 | 第 4 轮：Q-1~Q-12 答复原文 + 紫域实测 |
| `docs/STATUS_20260913_L2_EVIDENCE.md` | 【证据】 | L2 画布交互真实浏览器验证（**三轮订正，残留 = 节点链真实执行**） |
| `docs/STATUS_20260913_LIVE_GATE.md` | 【证据】 | **B-6：注册可自助获得门禁 cookie**，门禁不是资金防线 |
| `docs/VERIFICATION_20260913_APPLY_DRYRUN.md` | 【证据】 | 三批次落地器零写入干跑报告 |
| `docs/VERIFICATION_20260913_BILLING.md` | 【证据】 | 计费模块验证：卡密对撞、攻击用例、密钥扫描 |

### 1.5 交付件（`implementation/`，**未进权威树**）

| 文件 | 权威度 | 一句话 |
|---|---|---|
| **`implementation/deploy/ACCEPTANCE.md`** | **【SSOT】验收** | 30 项验收门槛 A-00~A-30 |
| `implementation/canvas-api/APPLY.md` | 【手册】 | 批次 1 接线步骤第 0–12 项 |
| `implementation/APPLY-RUNBOOK.md` | 【手册】 | 落地器使用手册（如何跑 `apply-batch1.mjs`） |
| `implementation/BATCH1-UI-RUNBOOK.md` | 【手册】 | 批次 1 前端部分（余额显示 / 兑换入口 / 模型分组）操作说明 |
| `implementation/deploy/ROLLBACK.md` | 【手册】 | R-00~R-03 回滚 |
| `implementation/deploy/batch2-*.md` | 【手册】 | 批次 2 验收/回滚/nginx 片段 |
| `implementation/deploy/batch3-*.md` | 【手册】 | 批次 3 操作手册/验收/回滚 |
| `implementation/canvas-api/*.js` | 【代码·未落地】 | 额度/卡密/紫域四模块 |
| `implementation/scripts/*.mjs` | 【工具】 | 落地器与干跑器 |

### 1.6 归档（`inventory/`）

外部文档的脱敏副本，`inventory/README.md` 有清单。**只读参考，不作权威。**
`inventory/画布验收清单.md` 含站点密码明文（`PRODUCTS.md` §六），不要复制其内容。

---

## 2. 当前状态：只有一个地方能查

> **⚠️ 「当前状态」不写在 INDEX 里。** 状态是易变的，写在这里就会重复 R1 的错误。
> 查状态去这三个 SSOT：
>
> | 想知道 | 去哪查 |
> |---|---|
> | 做到哪了、下一步做什么 | `docs/ROADMAP.md` |
> | 某个决定是怎么定的、还有什么没定 | `docs/DECISIONS.md` |
> | 能不能发、验收过了没 | `implementation/deploy/ACCEPTANCE.md` |
>
> 若发现三处说法不一致 → **口径冲突是 bug**，登记到 `docs/DECISIONS.md` 待裁决区，不要自行挑一个改。

---

## 3. 最小上下文包（按任务装载）

**用法**：开工前只读对应包里的文件。包外文件需要时再补，不预读。

| 包 | 适用任务 | 必读 |
|---|---|---|
| **P0 入门** | 第一次接触本项目 | `README.md` → `PRODUCTS.md` → `docs/PRODUCT_CHARTER.md` → `docs/CANVAS_ARCHITECTURE.md` → `AGENTS.md` |
| **P1 治理/文档** | 改文档、订正口径、重新审计 | `docs/INDEX.md` + `CONSTRAINTS.md` + `AGENTS.md` + `docs/LIFECYCLE.md` + `docs/PROJECT_CONTEXT.md` |
| **P2 前端/交互** | 改画布 UI、节点、连线、渠道模板 | `PRODUCT_CHARTER.md` + `CANVAS_ARCHITECTURE.md` + `AGENTS.md` + `CHANGE-RISK.md` + 目标模块文档 |
| **P3 后端/API** | 改 `canvas-api`、加路由、改鉴权 | `CANVAS_ARCHITECTURE.md` + `AGENTS.md` + `CONSTRAINTS.md` + `CHANGE-RISK.md`（**必读安全段**） |
| **P4 计费/额度** | 落批次 1、改扣费、发码 | `DECISIONS.md` D5/D6/D10/D11 + `REVENUE_MODEL.md` + `PRICING_20260913.md` + `implementation/canvas-api/APPLY.md` + `docs/STATUS_20260913_LIVE_GATE.md` |
| **P5 部署/发布** | 发布、回滚、改 nginx/容器 | `AGENTS.md` §2/§4/§5 + `CANVAS_ARCHITECTURE.md` 部署拓扑 + `CHANGE-RISK.md`（**一律 L3**） |
| **P6 验收/评审** | 判断能不能发 | `implementation/deploy/ACCEPTANCE.md` + `docs/STATUS_20260913_L2_EVIDENCE.md` + `CHANGE-RISK.md` + 本次变更的 PR |

---

## 4. 命名与取证规范

1. **引用任何数字必须带取证日期与口径**。例：路由数 24（2026-09-17 实测，不含 `app.use(`）。
2. **证据类文档的文件名带日期**（`STATUS_YYYYMMDD_*.md`），不覆盖、不改名。
3. **订正在文件底部追加**，格式：`> 订正（YYYY-MM-DD）：旧结论 X 作废，因为……`。
4. **废弃文件加 `.bak-roundNN` 后缀**而不是直接删，便于回溯；但**不允许被任何文档引用**（`verify.mjs` 会检出）。

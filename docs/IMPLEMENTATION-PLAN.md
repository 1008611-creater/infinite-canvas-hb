# 架构重置实施计划 · 无限画布

> 状态：执行中。G3 已批准；流程基线和垂直切片 001 已建立，产品功能仍按各自验收闸门推进。

## P0：冻结与基线

- 输入：`docs/ARCHITECTURE-RESET.md`、`AGENTS.md`、`CONSTRAINTS.md`、`docs/PROJECT_CONTEXT.md`。
- 输出：一份经 owner 确认的 Problem Brief；冻结新增批次和权威源码改动。
- 验证：治理仓 `node scripts/verify.mjs`；确认无源码树写入。
- 退出条件：范围、owner、非目标和风险级别明确。

## P1：选定一条垂直切片

- 输入：`docs/PRODUCT_CHARTER.md` 与当前线上真实缺口。
- 输出：Spec（主流程、错误流程、数据边界、验收标准）。
- 要求：不同时改 UI、API、部署和收费策略；若跨层，必须先写接口契约。
- 退出条件：每条验收标准都能由命令、浏览器步骤或可检查产物判定。

## P2：增量实现

- 输入：已批准 Spec、约束记录、实施计划。
- 输出：一个可独立验证的代码切片和失败测试。
- 要求：单项最多 5 个文件；原子提交；不得依赖其他未提交任务。
- 退出条件：定向验证通过，且变更未越过声明范围。

## P3：质量门

- 必跑：typecheck、lint、单测、API/契约测试、真实浏览器主流程、错误路径、密钥扫描、构建、冒烟。
- 治理仓：`node scripts/verify.mjs` 必须为 0；它只能证明治理仓和干跑，不替代源码验证。
- 退出条件：验证记录落盘，失败项明确标记，不得用“基本完成”掩盖缺口。

## P4：审查与发布

- Review：按 blocking / important / nit / praise 输出；blocking 必须为 0。
- 当前审查前置记录：`docs/SLICE-001-REVIEW.md`。其中 blocking 项明确保留，不能当作 G5 通过。
- 发布：引用 `implementation/deploy/ACCEPTANCE.md`、`implementation/deploy/ROLLBACK.md`，写明版本指纹和回滚演练。
- 退出条件：G5、G6 均通过；发布后冒烟和数据卷确认完成。

## P5：复盘

- 记录：实际偏差、漏检原因、违反的约束、下一次要增加的自动检查。
- 只更新：`docs/ROADMAP.md`（下一步）、`docs/DECISIONS.md`（决策）、对应证据文档（事实）。
- `web/package.json` 现提供统一的 `npm run verify`，串联类型检查、契约测试与生产构建；治理仓的 `node scripts/verify.mjs` 仍作为文档、密钥和落地器门禁。两者都通过后，才可进入真实浏览器、独立审查和发布闸门。

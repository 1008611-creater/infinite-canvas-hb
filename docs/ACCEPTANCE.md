# 验收入口 · 无限画布

本文件是架构重置后的统一入口，不复制验收状态。

- 当前发布验收 SOT：[`implementation/deploy/ACCEPTANCE.md`](../implementation/deploy/ACCEPTANCE.md)
- 生命周期闸门：[`docs/LIFECYCLE.md`](LIFECYCLE.md)
- 变更风险：[`docs/CHANGE-RISK.md`](CHANGE-RISK.md)
- 治理仓质量门：`node scripts/verify.mjs`

没有同时满足 G4（验证证据）、G5（blocking = 0）和 G6（发布/回滚/冒烟）的变更，一律视为不可发布。

# 垂直切片 001 · G5 审查前置报告

> 状态：**未通过 G5**。这是实现者的审查前置记录，不是独立 reviewer 的最终签字；真实上游、计费和发布证据齐全前，不得写 `blocking = 0`。

## 审查范围

- 输入资源链：`web/src/lib/canvas/canvas-chain.ts`、`canvas-resource-references.ts`
- 生成状态与刷新恢复：`canvas-generation-status.ts`、`canvas-generation-helpers.ts`、`types/canvas.ts`
- 视频提交与结果落盘：`project.tsx`、`services/api/video.ts`、`services/file-storage.ts`
- 请求幂等：`services/api/video-request-headers.ts`

## 已检查项

- `[praise]` 递归解析覆盖中间配置节点、汇聚分支去重和环路终止。
- `[praise]` 同一目标节点重复点击被前置去重；视频创建请求带业务 `Idempotency-Key`。
- `[praise]` 刷新会把 queued/running 任务恢复为明确失败，不留下永久 loading。
- `[praise]` 画布节点现在直接展示 queued/running/completed/failed 标签，状态不再只存在于 metadata。
- `[praise]` 临时远程 URL 无法写入本地媒体存储时进入失败路径。
- `[praise]` 本地模拟浏览器成功/失败路径已落盘，失败路径确认不再显示 `生成中`。

## 未关闭项

- `[blocking]` 缺真实上游一次性提交、任务状态、结果落盘和扣费/结算对账证据；对应 S3–S6 未通过。
- `[blocking]` 未完成独立 reviewer 审查；L3 变更按 `CHANGE-RISK.md` 需要两名 reviewer。
- `[blocking]` 未执行 G6 发布、回滚演练和发布后线上冒烟。
- `[important]` 本地模拟结果不能替代真实服务端日志、数据库记录和不可再生媒体卷读回。

## 当前判定

G4 仅完成本地与模拟证据，G5/G6 保持未通过；不得发布，不得把本切片标为完成。
- `[praise]` 代理层现在也执行幂等合并并校验请求摘要，且 CORS 预检明确允许 `Idempotency-Key`；前端去重不再是唯一防线。

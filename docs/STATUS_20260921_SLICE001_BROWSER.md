# 垂直切片 001 · 本地浏览器验证记录（2026-09-21）

## 范围

使用本地 Vite 预览 `http://127.0.0.1:4187/`，只验证画布、节点布局、图片参考连接和刷新恢复；没有填写生成提示词，没有点击生成，没有调用真实视频上游，也没有部署。

## 操作与证据

1. 打开 `/canvas`，新建画布。
2. 连续创建图片节点和视频节点。初次验证发现两个节点重叠，视频节点遮挡图片节点；修复默认落点和上传后图片尺寸变化的避让逻辑后重新验证。
3. 上传脱敏测试图片 `metaso.jpg` 到图片节点。
4. 在视频节点选择“从画布选择参考节点”，选中图片节点；界面显示参考已添加，视频模式切换为“全能参考”。
5. 刷新页面后重新打开视频节点；界面仍显示“断开参考连接”和“全能参考”，左侧仍有图片与视频两个节点。

浏览器截图：`E:/codex/huabu/output/playwright/canvas-chain-offset-2.png`、`E:/codex/huabu/output/playwright/vertical-slice-refresh.png`。

## 结果

| 标准 | 结果 | 说明 |
|---|---|---|
| S1 项目、节点、参考连接刷新后可恢复 | 通过（本地） | 刷新后两个节点和“断开参考连接”均可见 |
| S2 图片到视频的参考关系可建立且不被布局遮挡 | 通过（本地） | 参考选择完成，视频模式变为“全能参考” |
| S3 只发生一次真实提交并有上游任务标识 | 未验证 | 本轮没有点击生成 |
| S4 queued/running/completed 或明确 failed | 代码已补齐；真实上游未验证 | 节点现在展示 queued/running/completed/failed 标签；真实上游状态时间线仍需额度与服务端证据 |
| S5 结果落盘并刷新后可读取 | 未验证 | 需要真实视频结果；临时 URL 不再被当作成功 |
| S6 失败与扣费对账 | 未验证 | 需要授权额度和服务端证据 |
| S7 治理与专项验证 | 通过 | 治理质量门 7 PASS；Node 测试 6/6；类型检查和构建通过 |

## 本轮修复

- `project.tsx`：新节点按现有节点右边界布局；图片上传后若放大将主动避让右侧节点。
- `project.tsx` / `video.ts`：生成请求去重、业务请求 ID 与 `Idempotency-Key`、状态和任务标识持久化；无提示词且无参考输入的视频提交会被阻止；不可持久化视频结果进入失败路径。
- `agnes-video-proxy/server.js` / `idempotency-store.js` / `request-fingerprint.js`：代理提交边界放行 `Idempotency-Key` 的 CORS 预检，并对相同 key 做规范化请求摘要校验与并发合并；代理契约测试 6/6 通过。
- 代理预检实测：本地启动临时 18787 端口后，`OPTIONS /v1/videos` 返回 204，`Access-Control-Allow-Headers` 明确包含 `Idempotency-Key`；未发起任何上游任务。
- `video-request-headers.test.ts`：验证幂等请求头存在且空键不会发送。
- 本地模拟上游曾实际收到一次创建、一次轮询和一次内容读取请求；模拟字节不是合法视频，暴露并促成了 `file-storage.ts` 的媒体元数据超时兜底。该模拟不计入真实上游 S3–S6 通过。

### 本地模拟运行证据（不计入真实上游验收）

- 成功路径：生成按钮快速双击仍只产生一次创建、一次轮询、一次内容读取；请求带 `Idempotency-Key`；结果节点刷新后仍可选中，并显示存资产/下载等结果操作。
- 失败路径：一次创建、一次轮询返回 `mock upstream rate limit`；页面显示错误并提供重试，`生成中` 不再存在。
- 断言与截图：[`mock-video-evidence.json`](../output/playwright/mock-video-evidence.json)、`mock-video-success-refresh.png`、`mock-video-failure.png`。

## 闸门状态

本记录只证明本地浏览器交互和刷新恢复，不等于 G4 完成。真实提交、结果落盘、错误路径、独立审查和发布仍需 G4/G5/G6。

## 统一验证入口

源码树新增 `web/package.json` 的 `npm run verify`，本次已执行成功：类型检查通过、契约测试 18/18 通过、生产构建成功。治理仓 `node scripts/verify.mjs` 同样为 7 PASS / 0 WARN / 0 FAIL。该入口不替代真实上游、计费对账或发布后冒烟证据。
## 口径修订（2026-09-21）

本记录前文的旧测试数量属于代理边界补强前的快照；以本节为准：当前 `npm run verify` 已通过 **18/18 契约测试**（其中代理契约 6/6），并通过类型检查、生产构建；治理仓仍为 7 PASS / 0 WARN / 0 FAIL。
## 结果落盘校验补强（2026-09-21）

为防止临时结果 URL 返回 HTML/JSON 错误页却被保存为成功视频，`storeGeneratedVideo` 现在要求下载响应为 2xx，并拒绝非视频或通用二进制内容类型；同时检查无 Content-Type 响应的前缀；统一验证入口现为 **16/16 契约测试**（代理 6/6）。

代理本地 HTTP 上游集成实测已补充：JSON 与 multipart 两条提交路径各自用相同 Idempotency-Key 并发提交，均只触发 1 次对应上游创建；冲突键、非法 JSON 和 CORS 预检也已覆盖。证据见 proxy-idempotency-integration.json。

## 口径修订（二）（2026-09-21）

上一节的“16/16”是结果落盘校验补强当时的中间快照；随后加入取消终态和状态标签契约后，当前统一入口以最新实测为准：**18/18 契约与代理集成测试通过**，其中代理集成 6/6；类型检查、生产构建和治理仓 7 PASS / 0 WARN / 0 FAIL 均通过。该修订不改变 S3–S6 仍未取得真实上游证据的结论。

本轮又对本次新增的 6 个契约/代理文件执行了定向 Prettier 检查，全部通过；仓库全量格式检查仍受历史生成目录和既有文件影响，未把该噪声伪装成切片通过。

该定向检查已接入源码 `npm run verify` 的 `format:check:slice` 步骤；当前入口会先做类型检查，再做切片格式检查、18/18 契约测试和生产构建。

S1–S7 与 G4–G6 的当前口径同步写入 `output/slice-001-gate-status.json`；该文件只汇总证据状态，不把本地模拟升级为真实验收。

机器状态文件完整性已接入治理 `verify.mjs`；当前治理质量门为 **8 PASS / 0 WARN / 0 FAIL**。文档前文的 7 PASS 均为新增该检查前的历史快照。

发布包覆盖检查随后纳入同一质量门，确认两个新增代理模块同时出现在 Dockerfile、打包暂存、指纹和服务器复制步骤；当前严格复核为 **9 PASS / 0 WARN / 0 FAIL**，未执行真实服务器发布。

部署脚本又增加了运行时必需代理文件存在性检查：即使指纹文件未变化，只要代理模块缺失也会强制同步并重建；该逻辑已通过静态覆盖检查，真实服务器恢复演练仍未执行。

## 线上发布与发布后核对（2026-09-21 13:14，已上线）

老大指示跳过本地复测、直接上线，由他在线上点一次真实生成，我负责核对结果。本轮据此执行发布。

**发布产物**：`canvas-20260921-131453-ce730f5`（commit `ce730f5`），代理代码指纹 `4d906c4769c3`。

发布前门：源码 `npm run verify` 通过（类型检查 + 切片格式 + 18/18 契约与代理集成 + 生产构建）；
治理仓 `node scripts/verify.mjs --strict` = 9 PASS / 0 WARN / 0 FAIL。

发布脚本缺陷修复（`ce730f5`）：未显式传站点密码时，旧脚本会把 `WEBDAV_PASSWORD` 覆盖成空值，
静默改坏已配好的云同步；现改为沿用服务器现值，仅在服务器确实没有时给出警告。

服务器实测核对（全部为线上证据，非本地模拟）：

| 项 | 实测结果 |
|---|---|
| `current` 软链 | `releases/canvas-20260921-131453-ce730f5` |
| 带 cookie 回环读取 `/BUILD_INFO.txt` | `release=canvas-20260921-131453-ce730f5`，与包内一致 |
| deploy.sh 版本自愈 | 「版本校验通过」，未触发 web 容器重建 |
| 代理运行时文件 | 服务器目录与容器 `/app` 均含 `idempotency-store.js`、`request-fingerprint.js`（发布前缺失） |
| 代理容器 | 已重建，`Up`，`RestartCount=0`，日志含「Agnes OpenAI 兼容视频代理已启动」与「云端同步已启动」 |
| `PROXY_FINGERPRINT` 戳 | `4d906c4769c3138ea9a41e8ac7a0b255eeb2206234ab560b6b54c507108814f6`，与包内一致 |
| nginx | `nginx -t` 通过并 reload；回环 `index=200`、`/api/health=200` |
| 站点门禁 | 公网 `/` = 302 → `/login.html` = 200，门禁生效 |
| 云同步密码 | 未被改动（本次修复的直接受益点） |

**基线快照**：`output/slice001-prod/prod-baseline-20260921.txt`（用户尚未点生成时的服务端计数）。

**仍未取得证据（不得视为通过）**：S3 真实上游单次提交、S5 结果落盘与刷新后仍可读、S6 失败与扣费对账。
这三项要等老大在 https://hb.cauai.fun/canvas 点一次生成后，用服务端日志（容器内 `/app/proxy.log`）与媒体记录核对。

**回滚目标**：`releases/canvas-20260921-002224-839b5c8`。api 源码为直接覆盖而非软链，回滚 api 需重新发布旧 commit 并 `up -d --force-recreate api`。

## 首次真实失败路径证据：上游 503（2026-09-21 15:29 事故，15:27 修复上线）

老大在 `https://hb.cauai.fun/canvas/Zk7mgOc6wbxPpRt6aRweh` 点生成时报 **503**。以下全部为线上实测证据，不是本地模拟。

**证据链（三层日志互相对齐）**：

| 层 | 实测内容 |
|---|---|
| nginx access log（canvas-web） | `POST /agnes/v1/videos` → `503`，响应体 184 字节，referer 指向该画布 |
| 代理日志（容器内 `/app/proxy.log`） | `[提交-form] agnes-video-2.5-flash text 720P 16:9 6s refs=0` 后紧跟 `ERROR [错误] Agnes HTTP 503` |
| 上游归属 | `apihub.agnes-ai.com` 在 Cloudflare 之后，**不是本机**（本机公网 IP 与 `new-api` 模型表均与 Agnes 无关） |

**上游原因**：响应体 184 字节 = 代理包装层开销 36 字节 + 上游原文 148 字节；
形状 `{message: No available channel for model agnes-video-2.5-flash under group default (distributor) (request id: 32位)}` 恰好命中。
错误格式为 new-api 风格（`AgnesAI_error` + `request id`），即**上游该模型通道当时不可用/冷却中**。

**上游现状（事后实测）**：`GET /v1/models` → 200 且含 `agnes-video-2.5-flash`；
`POST /v1/videos` 缺 prompt → 400 `prompt is required`；`seconds:3` → 400 `seconds must be in [4, 12]`。
额度未耗尽：`/v1/dashboard/billing/subscription` → 200，`total_usage: 0`。
另实测免费档限流极硬：连续 6 次非法请求后，第 3~6 次全部 429。

**定性**：503 是上游瞬时故障，不是画布缺陷；切片 001（`910181f`）未改视频提交载荷形状，本次 503 不是该发布引入的回归。

**本次一并修掉的两个可观测性缺陷（commit `2e04b43`，已上线）**：

1. 代理只把 `Agnes HTTP 503` 写日志，上游 `detail` 从不落盘，线上无从判断是通道耗尽、限流还是参数被拒。
   现改为：上游原文（截断 500 字符）落 `proxy.log`，响应体 `error` 换成按状态码的人话，`detail` 仍原样保留供排查。
2. 前端视频接口缺 502/503 文案映射（图像、音频早有），页面只会显示 `视频任务创建失败（503）`。
   现补齐 404/502/503 映射，复用已有 i18n `serviceBusy` = 「服务繁忙（503），请稍后重试」。

**新增回归测试**：`proxy-integration.test.js` 增加「上游返回 503 → 断言响应体含上游原文、`error` 不是内部措辞、`proxy.log` 含上游原文」用例。
源码 `npm run verify` 通过：类型检查 + 切片格式 + **19/19** 契约与代理集成 + 生产构建。

**发布与发布后核对（本次真实执行）**：

| 项 | 实测结果 |
|---|---|
| 版本 | `releases/canvas-20260921-152530-2e04b43`（commit `2e04b43`） |
| 服务端 `BUILD_INFO.txt` | `release=canvas-20260921-152530-2e04b43`，与包内一致 |
| 代理指纹 | `3af73779c3b880af8f7ea7eeae78d090d44877709e5685a2b7c12b8cbc878f7a`（旧 `4d906c4769c3…`，指纹已变 = 确实重建） |
| 代理容器 | `Up`，日志含「Agnes OpenAI 兼容视频代理已启动」「云端同步已启动」 |
| 修复是否真在运行容器里 | 容器内 `/app/server.js` 命中 `UPSTREAM_STATUS_HINTS` 2 处 |
| nginx | `nginx -t` 通过并 reload；占位符残留 = 0 |
| 门禁 | 公网 `/` = 302 → `/login.html` = 200；回环 `/api/health` = 200 |
| 云同步密码 | 未被改动（`WEBDAV_PASSWORD` 仍在） |

**仍未取得证据（不得视为通过）**：S3 真实上游单次成功提交、S5 结果落盘与刷新后仍可读、S6 失败与扣费对账。
本次事故取得的是**失败路径**证据，不等于 S3 成功路径通过。

**本次回滚目标**：`releases/canvas-20260921-131453-ce730f5`。

# 项目上下文 · 无限画布（hb.cauai.fun）

> **本文件是第 0 步「项目审计」的唯一产出。**
> 生成日期：2026-09-17。生成方式：**跑命令看事实**，不采信任何既有文档的自述。
> 每条结论后面标注取证命令或文件。没有验证的，明确写「未验证」。

---

## 0. 一句话结论

这是一个**已经具备相当工程纪律、但缺少可执行生命周期**的项目：约束写得很硬、决策记录很全、落地器已就绪，
但**状态口径散落在 5 份以上文档里逐字重复**，且**没有任何一个命令能回答「现在能不能发」**。
本次架构治理要补的就是这两件事：单一状态源 + 统一质量门。

---

## 1. 项目识别

| 项 | 值 | 证据 |
|---|---|---|
| 产品 | 无限画布 = `https://hb.cauai.fun` | `PRODUCTS.md` §一 |
| 权威源码 | `E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas` | `AGENTS.md` §0；本次 `test -d` 通过 |
| Git remote | `1008611-creater/infinite-canvas-hb` | `PRODUCTS.md` |
| 上游 | `basketikun/infinite-canvas` v0.16.0（MIT） | `docs/UPSTREAM_MAP.md` |
| 当前分支 | `feat-server-deploy` | 实测 `git rev-parse --abbrev-ref HEAD` |
| 工作区 | 干净（仅未跟踪 `scratch/`，1 行） | 实测 `git status --porcelain` |
| **不是** | `ai.cauai.fun/studio/`（另一个画布产品） | `docs/DECISIONS.md` D1 |

**本仓（`E:\codex\huabu`）的性质**：规划与治理仓，不构建、不发布（`AGENTS.md` §0、D2）。

---

## 2. 技术栈与运行方式

| 层 | 实现 | 证据 |
|---|---|---|
| 构建 | Vite 7 | `docs/CANVAS_ARCHITECTURE.md` |
| 框架 | React Router 7 + TypeScript | 同上 |
| UI | Ant Design v6 + Tailwind | 同上 |
| 状态 | Zustand | 同上 |
| 本地存储 | IndexedDB（localforage） | 同上 |
| 云同步 | 自研 WebDAV（`canvas-webdav`） | 同上 |
| 服务端 | 自研 `canvas-api` + Postgres 16 | 同上 |
| 部署 | Docker Compose + nginx + Cloudflare Tunnel | 同上 |

**实测的规模数据（2026-09-17，与既有文档不一致，以此为准）**：

| 指标 | 本次实测 | 既有文档写的 | 处置 |
|---|---|---|---|
| 权威树文件总数（跳 `node_modules`/`.git`/`dist`/`scratch`/`logs`） | **1196** | 896（2026-09-12） | 旧数字已过期，引用时改注新值 |
| `canvas-api/server.js` 路由注册数 | **24**（`get/post/put/patch/delete`，不含 `use`） | 24 | ✅ 口径正确 |
| 治理仓 Markdown 文件数 | **41**（另有 3 份 `.bak-round95` 残留） | — | 见风险 R5 |
| 治理仓脚本 | 6 个 `.mjs` + 4 个 `.js` | — | — |

取证：

```bash
find "$SRC" -type f -not -path "*/node_modules/*" ... | wc -l                 # 1196
grep -cE "(app|router)\.(get|post|put|patch|delete)\(" "$SRC/canvas-api/server.js"   # 24
```

> ⚠️ 计数口径必须写死：**含 `app.use(` 会得到 27**，与既有文档的 24 不是矛盾，是口径不同。
> 以后引用路由数一律写「24（不含 `use`）」。

---

## 3. 权威源码树顶层结构（实测 `ls -1`）

```text
AGENTS.md  CHANGELOG.md  CONTRIBUTING.md  Dockerfile  LICENSE  README.md
SECURITY.md  VERSION  docker-compose.yml  docker-compose.local.yml
nginx.conf  render.yaml  vercel.json  skills-lock.json
agnes-video-proxy/  assets/  canvas-agent/  canvas-api/  canvas-webdav/
deploy/  docs/  plugins/  scratch/  scripts/  tools/  web/
```

---

## 4. 构建 / 部署 / 回滚

| 动作 | 入口 | 状态 |
|---|---|---|
| 发布 | 权威源码目录下 `bash scripts/deploy/publish.sh` | 现行 |
| 回滚 | `ln -sfn releases/<版本> current` + `nginx -s reload` | 现行 |
| 落地器干跑 | `node implementation/scripts/dry-run-all.mjs` | 现行，零写入 |
| 批次 1 落地 | `node implementation/scripts/apply-batch1.mjs` | **未执行** |

**★ 本次审计的重要变化 —— B-2 阻塞项状态改变：**

| 项 | 既有文档口径 | 本次实测 |
|---|---|---|
| 权威源码树写权限 | `EPERM`，无法写入（`docs/DECISIONS.md` D10.9 B-2） | ✅ **可写**（建临时文件成功并已清理） |

这意味着「落代码」从**技术阻塞**变成了**授权问题**——能不能落只取决于批准，不再取决于环境。
**这是一把双刃剑**：也意味着任何人/任何一次误执行都可能改动权威树，所以必须先把「谁批准落地」写成闸门（见 `LIFECYCLE.md` §闸门 G3）。

---

## 5. 凭证与数据边界

**凭证唯一权威位置**：服务器 `/opt/agnes-video-proxy/.env`、`/opt/infinite-canvas/api/api.env`。
本仓**不存任何密钥**（`AGENTS.md` §3 铁律）。

**已知的 5 个明文泄露点**（位置记录在 `PRODUCTS.md` §六，本仓不复制内容）：

1. `infinite-canvas-deploy\预置_agnes视频通道_控制台脚本.js`
2. `画布验收清单.md`
3. `infinite-canvas\docs\deployment-server.md`
4. `infinite-canvas\scripts\deploy\publish.sh`
5. `agnes-video-proxy\.env`（根级 + 仓库内两份）

**四个不可再生数据卷**（`AGENTS.md` §5）：`/opt/canvas-webdav`、`/opt/canvas-api-media`、`/opt/canvas-api-sync`、`/opt/canvas-postgres`。

---

## 6. 已有规范清单

| 文件 | 角色 | 行数 |
|---|---|---|
| `AGENTS.md` | 项目铁律（凭证、发布、数据、文档） | ~5.0 KB |
| `docs/PRODUCT_CHARTER.md` | 产品边界、视觉 DNA、事实分层、L1–L4 能力分级 | ~5.9 KB |
| `docs/DECISIONS.md` | 决策记录 D1–D11 + 待裁决 Q-1~Q-12 | ~25 KB |
| `docs/CANVAS_ARCHITECTURE.md` | 技术栈、部署拓扑、门禁设计、三个坑 | ~9.3 KB |
| `GOVERNANCE-HANDBOOK.md` | 状态快照 + 三批次 + 接口变更 + 安全纪律 + 验收 | ~11 KB |
| `docs/ROADMAP.md` | 三批次详细计划 | ~16 KB |
| `docs/BACKLOG.md` | 待办清单（与 ROADMAP 高度重叠） | ~8.3 KB |
| `implementation/deploy/ACCEPTANCE.md` | 30 项验收清单 | ~32 KB |
| `implementation/canvas-api/APPLY.md` | 批次 1 接线步骤（第 0–12 项） | ~36 KB |

**这些规范的质量本身是高的**——`AGENTS.md` 的凭证纪律、依赖方向、数据卷保护，
比多数团队的工程规范更严格。问题不在内容，在**结构**（见风险 R1）。

---

## 7. 已有质量门与缺口

**已有的**：

- `implementation/scripts/dry-run-all.mjs` —— 三批次落地器零写入干跑 + 权威树零变化核对，退出码 `0/1/2` 语义清晰。**这是本仓唯一一个真正可执行的检查。**
- `implementation/scripts/generate-ldxp-credit-codes.mjs` —— 发码脚本，实测 25/25。

**缺口（本次审计新增认定）**：

| # | 缺口 | 后果 |
|---|---|---|
| G1 | 没有统一入口命令，无法一键回答「现在能不能发」 | 每次靠人肉翻 5 份文档 |
| G2 | 文档交叉引用无机器校验 | 坏链、漂移无人发现 |
| G3 | 无密钥/敏感串扫描 | 违反 `AGENTS.md` §3 只能靠自觉 |
| G4 | 无「谁批准落地」的显式闸门 | 源码树已可写（本次新发现） |
| G5 | 无变更风险分级 | 改文案和改鉴权走同一流程 |
| G6 | 无按任务的最小上下文包 | AI/新人一上来就要读 41 份文档 |

---

## 8. 风险清单

按**处置优先级**排序。等级：🔴 高 / 🟡 中 / 🟢 低。

| # | 风险 | 等级 | 证据 | 处置 |
|---|---|---|---|---|
| **R1** | **状态口径多源重复**：批次状态在 `GOVERNANCE-HANDBOOK` §0-§2、`ROADMAP` 现状快照、`BACKLOG` 开头、`PRODUCT_CHARTER`、README 里**逐字重复**。历史上已因此出现「批次 1 已完成」的错误标注并需跨文件订正 | 🔴 | 五处文本对比 | 第 5 步：瘦身 GOVERNANCE-HANDBOOK，指向单一状态源 |
| **R2** | **源码树可写但无落地闸门**：B-2 从技术阻塞变成授权问题，误执行风险上升 | 🔴 | 本次写权限实测 | 第 3 步：LIFECYCLE 闸门 G3 |
| **R3** | **门禁不是资金防线 + 注册实测为开**：注册接口不吃门禁且下发 `canvas_auth` cookie | 🔴 | `docs/STATUS_20260913_LIVE_GATE.md`；`server.js` L109 注册路由存在 | 批次 1 额度体系是唯一锁；上线前必须确认 |
| **R4** | **无统一质量门** | 🟡 | 仅 1 个可执行检查 | 第 4 步：`scripts/verify.mjs` |
| **R5** | **3 份 `.bak-round95` 残留**：可能被误读为现行文件 | 🟡 | `find -name "*.bak*"` | 第 4 步：verify 检出并报警 |
| **R6** | **旧证据口径过期**：896 文件 → 现 1196；L2 残留项经历多次订正（三项→两项→一项） | 🟡 | 本次实测 vs 旧文档 | 第 1 步：INDEX 标注取证日期 |
| **R7** | **5 处密钥明文泄露点未清理** | 🟡 | `PRODUCTS.md` §六 | 保持「只记位置不复制」；verify 扫描本仓不出现密钥 |
| **R8** | **节点链真实执行未验证**（B-1 唯一残留） | 🟡 | `docs/STATUS_20260913_L2_EVIDENCE.md` | 真跑会真出片/真花钱，需单独授权 |
| **R9** | **`D-agent-auth` 未裁决**，批次 3 A-19 硬阻塞 | 🟡 | `docs/DECISIONS.md` D4 | 已问两次未答复，本次再提一次 |
| **R10** | **B-3 服务器 `.env` 四个变量未就绪** | 🟡 | D10.9 | 阻塞 S6 |
| **R11** | **B-4 紫域每积分实际采购价未确认**（官方 ¥0.01，实际到手价未知） | 🟢 | D10.9 | 影响毛利，不阻塞架构 |
| **R12** | 无按任务的上下文装载标准 | 🟢 | 无 `docs/INDEX.md` | 第 1 步 |

---

## 9. 本次审计的边界（诚实声明）

- **线上站点未做任何请求级验证**（本环境无浏览器、无 SSH）。所有"线上"结论均转引自有记录的文档。
- **`dry-run-all.mjs` 本轮未重跑**（第 6 步统一跑）。
- **源码树只做了写权限探测 + 关键词扫描 + git 状态**，未逐行阅读 `canvas-api` / `web` 源码。
- 文件数 1196 与既有 896 的差异**未逐项归因**（可能是新增文档/依赖/构建产物规则不同）。

---

> **追加（2026-09-17 同日晚些时候，只追加不改上文）**：
> 上文 §4 记录的「源码树可写」随后被实际使用——**批次 1 于本日落地**（提交 `ff6200a`，+2332 行，已推送 `feat-server-deploy`）。
> 上文 §8 的 **R2（源码树可写但无落地闸门）** 与 **B-2 落代码阻塞** 已通过闸门 G3 处置并关闭，详见 `docs/DECISIONS.md` **D12**。
> 上文 §7 的缺口 G4（无落地闸门）已补齐。
> **上文其余内容（风险 R1–R12、审计边界）保持不变，仍为当日早些时候的事实快照。**

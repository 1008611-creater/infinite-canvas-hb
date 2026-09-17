# 相关产品清单

**口径（2026-09-11）：本项目所说的"无限画布"就是 https://hb.cauai.fun。**

下面是所有相关产品的权威位置、角色与归属。**源目录保持原位，本文件夹只是索引**——这些产品体量大（含 `node_modules`、`.git`、构建产物），不搬迁、不复制。

根目录：`E:\codex\niannianai\zhuanhuiyuangong\`

---

## 一、画布本体（本项目）

| 产品 | 权威路径 | 角色 | 状态 |
|---|---|---|---|
| **无限画布** | `infinite-canvas\` | **hb.cauai.fun 的权威源码** | ✅ 已上线，端到端验证通过（2026-09-01） |

- Git remote：`https://github.com/1008611-creater/infinite-canvas-hb.git`
- 上游：`basketikun/infinite-canvas`（MIT），版本 `v0.16.0`
- 分支：18 个
- 发布：`bash scripts/deploy/publish.sh`
- 详见 `docs/UPSTREAM_MAP.md`

## 二、画布的配套件

> 状态口径（2026-09-13 细化）：**批次 1（收得到钱）代码已写完、落地器已就绪、权威树未落地。**
> 权威源码全文扫描 896 个文本文件，紫域 / 卡密 / 额度相关标识符**零命中**。交付件在 `implementation/`，落地器 `apply-batch1.mjs` 已在假源树复验通过，并于 2026-09-13 对真实权威树做了零写入干跑（锚点全部命中、权威树未变）。证据见 `docs/STATUS_20260912.md` 与 `docs/VERIFICATION_20260913_APPLY_DRYRUN.md`。

| 产品 | 权威路径 | 角色 | 状态 |
|---|---|---|---|
| 部署与 MCP 文档集 | `infinite-canvas-deploy\` | 6 份部署 / 配置 / 审计文档 | ✅ 现行 |
| 视频代理 | `infinite-canvas\agnes-video-proxy\` | 视频模型代理（**仓库内这份才是权威**） | ✅ 现行 |
| WebDAV 云同步 | `infinite-canvas\canvas-webdav\` | 跨设备同步服务，自带 99 项自测 | ✅ 现行 |
| 账号与媒体 API | `infinite-canvas\canvas-api\` | 账号 / 项目 / 素材 / 媒体（Postgres），**24 条路由** | ✅ 现行 |
| Agent + MCP | `infinite-canvas\canvas-agent\` | Agent 服务 + **34 个** MCP 工具（实测） | ✅ **已构建**（`dist/` 存在，2026-08-27），⏸ 未启用 |
| 发布脚本 | `infinite-canvas\scripts\deploy\publish.sh` | 一键发布 | ✅ 现行 |
| Windows 启动器 | `infinite-canvas\scripts\windows\` | 本地开发启动 | ✅ 现行 |
| **额度 / 卡密体系** | — | 批次 1 交付件，**只在 `implementation\` 里** | 🟡 代码已写完、落地器已就绪，**权威树未落地** |

### ⚠️ `canvas-agent` 工具数的订正

旧文档写「**六个** MCP 工具」，计划原文写「**25 个**」，**两个都不对**。

实测（`canvas-agent/src/canvas/schemas.ts` 的 `toolNames` 数组，`dist/canvas/schemas.js` 一致）为 **34 个**：

`site_navigate`, `canvas_list_projects`, `canvas_get_state`, `canvas_get_selection`, `canvas_export_snapshot`, `canvas_apply_ops`, `canvas_create_node`, `canvas_create_attachment_nodes`, `canvas_create_text_node`, `canvas_create_text_nodes`, `canvas_create_config_node`, `canvas_create_image_prompt_flow`, `canvas_create_generation_flow`, `canvas_generate_text`, `canvas_generate_image`, `canvas_generate_video`, `canvas_generate_audio`, `canvas_update_node`, `canvas_update_node_text`, `canvas_move_nodes`, `canvas_resize_node`, `canvas_delete_nodes`, `canvas_connect_nodes`, `canvas_select_nodes`, `canvas_set_viewport`, `canvas_run_generation`, `generation_get_status`, `workbench_image_get_config`, `workbench_image_generate`, `workbench_video_get_config`, `workbench_video_generate`, `prompts_search`, `assets_list`, `assets_add`

**以后一律以实测的 34 为准**，并标注「与计划原文的 25 个不一致」。待用户裁决是否以 34 定稿（见 `docs/DECISIONS.md` 的 D8）。

## 三、内容生产线（画布的下游用户）

| 产品 | 权威路径 | 角色 |
|---|---|---|
| 天宫漫剧交付包 | `天宫漫剧_全流程交付包_20260826\` | 画布要生产的内容 |
| 制片厂 | `念念制片厂\` | 内容生产组织 |
| 各类 Skill 包 | 同级多个目录 | 内容生产工具 |

**这些是画布的"用户"，不是画布本体。** 不要把它们的产出算进画布的能力与收益。

## 四、同所有者的其他产品（不属于本项目）

| 产品 | 权威路径 | 域名 | 说明 |
|---|---|---|---|
| 念念 Studio 画布 | `niannianai\` 目录树 | `ai.cauai.fun/studio/` | **另一个画布产品**，Nomi 派生，与本 fork 无关 |
| 豆包卡密授权 | `license-server\` | `dola.cauai.fun` | 独立产品，原型状态 |
| 商业控制面 | `commerce-work\` | `ai.cauai.fun` 线 | 属 Studio 线，不是画布 |

⚠️ **`ai.cauai.fun` 的积分账本不适用于无限画布。** 详见 `docs/REVENUE_MODEL.md`。

> 注意：`dola.cauai.fun` 的 `license-server` 也有一套卡密（兑换码）实现。**那套属于另一个产品**，不要直接搬过来当成画布的收款能力。画布的卡密设计稿见 `implementation/scripts/generate-ldxp-credit-codes.mjs`。

## 五、已过时 / 可忽略

| 路径 | 情况 |
|---|---|
| `agnes-video-proxy\`（根级） | **过时副本**。`server.js` 约 22KB，仓库内权威版约 33KB。不要引用根级那份。 |
| `launcher\{start.bat,stop.bat}` | 已被 `infinite-canvas\scripts\windows\` 取代 |
| `infinite-canvas_empty_bak\` | 空目录 |
| `infinite-canvas\scratch\` | 历史脚本，非权威 |

## 六、⚠️ 含明文敏感信息的文件（不要复制、不要外传）

> **口径订正（2026-09-17 实测）**：下表路径均相对 `E:\codex\niannianai\zhuanhuiyuangong\`，指的是**原始文件**。
> 治理仓 `E:\codex\huabu` 内的**副本已脱敏**——实测全仓检索站点密码字面量命中 0 处。
> 另：`infinite-canvas\scripts\deploy\publish.sh` 与 `docs\deployment-server.md` 的明文**已于 2026-09-17 清除**（提交 `4c7f48e`），但**历史提交里仍留有字面量**，需另行清历史。

| 文件 | 风险 |
|---|---|
| `infinite-canvas-deploy\预置_agnes视频通道_控制台脚本.js` | 内含多个**真实 API key** |
| `画布验收清单.md` | 含**站点密码明文**（2 处）。治理仓副本 `inventory\画布验收清单.md` 已脱敏，无风险 |
| `infinite-canvas\docs\deployment-server.md` | 含**站点密码明文**（1 处） |
| `infinite-canvas\scripts\deploy\publish.sh` | 默认参数里带站点密码 |
| `agnes-video-proxy\.env`（根级 + 仓库内两份） | 含**真实 key** |

这些文件**留在原位**，本文件夹只记录它们的存在与风险，不复制内容。需要密码时只写"服务器 `/opt/agnes-video-proxy/.env` 的 `SITE_PASSWORD`"。

## 七、已归档的文档副本

小的、必要的、非生成物的文档已复制到 `inventory\`，每份顶部标注了来源路径与复制日期。清单见 `inventory\README.md`。

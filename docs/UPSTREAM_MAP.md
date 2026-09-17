# 上游地图 · 无限画布

## 一句话

本产品是 MIT 开源项目 `basketikun/infinite-canvas` 的 fork。**fork 名 `infinite-canvas-hb`**，对应线上 `hb.cauai.fun`。

## 权威路径

| 项 | 值 |
|---|---|
| 权威源码目录 | `E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas` |
| Git remote | `https://github.com/1008611-creater/infinite-canvas-hb.git` |
| 上游项目 | `basketikun/infinite-canvas` |
| 上游版本 | `v0.16.0`（记录在仓库的 `VERSION` 文件） |
| 许可证 | **MIT** |
| 分支数 | 18 |

本文件夹（`E:\codex\huabu`）**不是**源码仓库，不构建、不发布。所有构建与发布都在权威源码目录里做。

## 分支情况

18 个分支，主要的功能分支：

- `feat-server-deploy` —— 服务端部署
- `feat-canvas-webdav-sync` —— WebDAV 云同步
- `feat-canvas-api-accounts` —— 账号体系
- `feat-openlux-mj-channels` —— OpenLux 与 MJ 渠道

**贡献规则：功能改动走独立分支 + PR，`master` 不直接提交。**

## 关键目录

| 目录 | 内容 |
|---|---|
| `web/` | Vite 前端工程（含 `dist/`、`node_modules/`、`logs/`） |
| `canvas-api/` | 账号 / 项目 / 素材 / 媒体服务（Node，Postgres） |
| `canvas-webdav/` | WebDAV 云同步服务（含三套自测） |
| `canvas-agent/` | Agent + MCP（**已构建**，`dist/` 存在 2026-08-27；实测 **34** 个工具；未启用） |
| `deploy/` | docker-compose、Dockerfile、nginx 配置、systemd 单元 |
| `scripts/` | 发布脚本、自测、Windows 启动器 |
| `plugins/` | `canvas/`、`infinite-canvas/` 插件 |
| `tools/` | `omniroute-guard/`、`mj-bridge/` |
| `docs/` | 部署文档、OmniRoute 集成文档 |
| `scratch/` | 历史脚本，**非权威，可忽略** |

### 自测覆盖

`canvas-webdav/` 自带三套自测，共 **99 项**：`selftest.js`（57 项）、`selftest-client.js`（33 项）、`selftest-proxy.js`（9 项）。API 侧另有 `scripts/selftest/api-sync.mjs`。

## ⚠️ 过时副本警告

**`zhuanhuiyuangong\agnes-video-proxy\`（根级）是过时的独立副本。**

- 根级副本 `server.js` 约 22KB
- 仓库内 `infinite-canvas/agnes-video-proxy/server.js` 约 33KB，**这才是权威版本**

引用代理实现时永远以仓库内的为准。根级那份是历史残留。

同样地，根级的 `launcher\{start.bat,stop.bat}` 已被 `infinite-canvas/scripts/windows/` 取代。

## MIT 义务

上游是 MIT 许可，**必须保留原作者信息**。

上游 README 里有一条明确要求（CAUTION 段原文大意）：项目处于开发阶段、不保证历史数据兼容；**二次开发与 PR 请保留原作者信息和前端页面标识**。

这条不只是许可证要求，也是品牌要求。本 fork 的前端页面保留了原项目标识。

### `canvas-agent` 订正（2026-09-12）

旧版本文档写"未构建"是**错的**。实测：

- `canvas-agent/dist/` 存在，`dist/canvas/schemas.js` 构建时间 2026-08-27
- `src/canvas/schemas.ts` 与 `dist/canvas/schemas.js` 的 `toolNames` **完全一致**（逐项比对为 true）
- 工具数 = **34**（旧文档写"六个"、计划原文写"25 个"，均不对）

清单见 `PRODUCTS.md` 第二节。

## 与上游的差异化

本 fork 相对上游的核心增量：

1. **三种视频模式** —— `text` / `keyframe`（首尾帧）/ `reference`（全能参考），上游没有这套模式与槽位互斥
2. **服务端部署能力** —— 账号、WebDAV 同步、媒体库、Postgres
3. **天宫漫剧工作台定位** —— 命名前缀、连线语义、视觉 DNA 约束

上游 README 的 CAUTION 段还提示：项目处于开发阶段，不保证历史数据兼容。**升级上游时要预期数据结构可能不兼容。**

## 另一个画布的路径（对照用，勿混）

`ai.cauai.fun/studio/` 是另一个产品，源码在另一棵目录树（`niannianai\` 下），与本 fork 无关。其 `PROJECT_INDEX.md` 把 Infinite Canvas 列为 P1 基础设施，那是**它自己的**规划，不构成本项目的上游关系。详见 `DECISIONS.md` 的 D1。

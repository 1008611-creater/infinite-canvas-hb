# inventory · 归档副本索引

本目录只放**小的、必要的、非生成物**文档副本。产品本体（含 `node_modules`、`.git`、构建产物）**不搬迁**，权威版本留在原位。

**本目录任何一份副本都不是权威版本。** 与原件不一致时以原件为准。每份副本顶部都标注了来源路径与复制日期。

源目录根：`E:\codex\niannianai\zhuanhuiyuangong\`

---

## 归档清单（2026-09-12 订正：批次 1 设计完成、实现未落地）

| 副本 | 来源 | 大小 | 说明 |
|---|---|---|---|
| `画布验收清单.md` | `画布验收清单.md` | 3.2KB | ⚠️ **已脱敏**：原件含站点密码明文 |
| `部署与MCP集成.md` | `infinite-canvas-deploy\README_部署与MCP集成.md` | 5.8KB | 部署流程与 MCP 集成 |
| `三块能力配置现状与补齐清单.md` | `infinite-canvas-deploy\三块能力配置现状与补齐清单.md` | 4.4KB | 视频 / 图片 / LLM 三块能力现状 |
| `如何一键接入agnes视频通道.md` | `infinite-canvas-deploy\如何一键接入agnes视频通道.md` | 2.2KB | 视频通道接入 |
| `MCP_SOP_天宫漫剧.md` | `infinite-canvas-deploy\MCP_SOP_天宫漫剧.md` | 8.7KB | 天宫漫剧生产 SOP、视觉 DNA、命名规范 |
| `审计报告_无限画布功能审计_20260827.md` | `infinite-canvas-deploy\审计报告_无限画布功能审计_20260827.md` | 6.1KB | 8/8 路由加载实测数据 |
| `omniroute-integration.md` | `infinite-canvas\docs\omniroute-integration.md` | 12.3KB | OmniRoute 网关集成（LLM 中转候选）。⚠️ 正文是 **2026-09-01 旧口径**，顶部已加「**已被批次 3 取代**」对照声明（2026-09-13）；**刻意保留 CRLF**，正文不重写 |
| `agnes-video-proxy-README.md` | `infinite-canvas\agnes-video-proxy\README.md` | 4.3KB | **仓库内权威版**的代理说明 |
| `canvas-webdav-README.md` | `infinite-canvas\canvas-webdav\README.md` | 7.0KB | WebDAV 云同步 |
| `canvas-agent-README.md` | `infinite-canvas\canvas-agent\README.md` | 6.6KB | Agent 与 MCP。⚠️ 原件可能仍写"六个工具"，**实测为 34 个**，见 `PRODUCTS.md` 第二节 |
| `license-server-README.md` | `license-server\README.md` | 1.6KB | 独立产品（dola.cauai.fun），**不属于画布** |
| `项目审计报告_20260827.md` | `项目审计报告_20260827.md` | 12.6KB | 治理审计，6 集群 |

## 刻意没有归档的文件（2026-09-12 订正：批次 1 设计完成、实现未落地）

| 文件 | 原因 |
|---|---|
| `infinite-canvas-deploy\预置_agnes视频通道_控制台脚本.js` | ⚠️ 内含**多个真实 API key**。只引用路径，不复制内容。 |
| `infinite-canvas\docs\deployment-server.md` | 含站点密码明文。需要部署细节时直接读原件。 |
| `infinite-canvas\scripts\deploy\publish.sh` | 默认参数里带站点密码。 |
| 任何 `.env` | 含真实密钥。**永远不归档。** |
| `infinite-canvas\web\`、`node_modules\`、`dist\` | 源码与构建产物，体量大且可再生。 |
| 成片、抽帧截图、抽卡结果 | 生成物，不是文档。 |

## 使用提醒（2026-09-12 订正：批次 1 设计完成、实现未落地）

- 这些副本是**快照**。原件更新后副本不会自动同步，需要时重新复制。
- 归档时已做敏感串扫描，但**不要**把本目录当作安全边界——原件里的明文密钥仍然存在，处置见 `docs/BACKLOG.md` P1-11。

# 无限画布 · hb.cauai.fun

这个文件夹专门负责 **无限画布**，线上地址 **https://hb.cauai.fun**。

> 口径确认（2026-09-11）：本项目所说的"无限画布"就是 `hb.cauai.fun`。
> 它和 `ai.cauai.fun/studio/`（念念 Studio 画布）是两个独立产品，详见 `docs/DECISIONS.md` 的 D1。

## 这是什么

一个基于 MIT 开源项目 `basketikun/infinite-canvas` 二次开发的 **AI 视频工作台画布**，当前部署形态是「天宫漫剧」内容生产工作台：

- **前端**：Vite 7 + React Router 7 + TypeScript + Ant Design v6 + Tailwind + Zustand
- **数据**：浏览器本地优先（IndexedDB / localforage），可选 WebDAV 云同步，服务端另有 Postgres 承载账号与媒体库
- **视频**：三种模式 —— 文生视频、首尾帧（keyframe）、全能参考（reference）；当前只开放免费的 `agnes-video-2.5-flash`
- **图片**：OpenLux 渠道（`gpt-image-2-c`）
- **访问**：站点密码门禁（`/login.html`），非公开站点（批次 2 计划撤门禁，见 `docs/ROADMAP.md`）
- **品牌**：保留原项目标识，见 `docs/UPSTREAM_MAP.md` 的 MIT 义务

## 线上形态

| 项 | 值 |
|---|---|
| 域名 | https://hb.cauai.fun |
| 入口链路 | Cloudflare → cloudflared 隧道 `hb-canvas` → 本机 `127.0.0.1:18085` |
| 源站 | 只走隧道，不开 80/443 直连；隧道停 = 域名打不开 |
| 权威源码 | `E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas` |
| Git remote | https://github.com/1008611-creater/infinite-canvas-hb |
| 上游版本 | `infinite-canvas` v0.16.0（MIT） |
| 发布方式 | 在权威源码目录执行 `bash scripts/deploy/publish.sh` |

**线上可用性本会话未验证**：本环境没有浏览器，无法打开站点做实测。最后一次有记录的端到端验证是 2026-09-01（首帧日落 → 尾帧灯笼，30 秒出片），原始记录见 `inventory/画布验收清单.md`。

## 本文件夹的定位

`E:\codex\huabu` 是**规划与治理文件夹**，不是可构建的源码仓库。

- 这里放：产品定位、架构说明、收益模型、路线图、上游地图、决策记录、产品清单
- 这里不放：`node_modules`、构建产物、`.env`、密钥、服务器数据副本
- 源码不搬进来。权威副本始终留在 `E:\codex\niannianai\zhuanhuiyuangong`，本文件夹只做索引，见 `PRODUCTS.md`

## 先读什么

1. **`docs/INDEX.md`** —— 文档权威度总表 + 按任务的最小上下文包。**不知道读什么时先读它。**
2. `PRODUCTS.md` —— 相关产品的权威路径清单
3. `docs/PRODUCT_CHARTER.md` —— 这是什么产品、不是什么产品
4. `docs/CANVAS_ARCHITECTURE.md` —— 真实技术栈与线上部署拓扑
5. `docs/REVENUE_MODEL.md` —— 收益现实（结论：线上目前没有任何计费；计费层代码已写完并在 `implementation/`，落地状态以 `docs/ROADMAP.md` 为准）
6. `docs/PRICING_20260913.md` —— **定价方案书（待你核对）**：扣费口径、毛利敏感度表、卡密面额
7. `docs/DECISIONS.md` —— 已定与待定决策（D10 = 2026-09-13 第 4 轮答复落地口径）
8. `docs/STATUS_20260913.md` —— 第 4 轮实测证据与阻塞项（含探针花费披露）
9. `docs/VERIFICATION_20260913_BILLING.md` —— **计费模块验证报告**（卡密算法对撞、攻击用例、密钥扫描；结论：钱算得对、码验得住）
10. `AGENTS.md` —— 在本文件夹里做事必须遵守的规则（领域铁律）

## 治理骨架（2026-09-17 建立）

| 文件 | 管什么 |
|---|---|
| `CONSTRAINTS.md` | 跨项目可复用的质量约束 C1–C8 + 本项目符合度快照 |
| `docs/INDEX.md` | 谁改什么、读什么（SSOT 声明 + 上下文包） |
| `docs/LIFECYCLE.md` | 九阶段生命周期 + 六闸门（**G3 = 落权威源码树的书面批准**） |
| `docs/CHANGE-RISK.md` | L0–L3 变更风险分级与对应流程轻重 |
| `docs/PROJECT_CONTEXT.md` | 2026-09-17 项目审计事实与风险清单 R1–R12 |
| `scripts/verify.mjs` | **统一质量门** |

**改完东西跑一次**：

```bash
node E:/codex/huabu/scripts/verify.mjs            # 常规
node E:/codex/huabu/scripts/verify.mjs --strict   # warning 也判失败
```

# MCP_SOP_天宫漫剧

> **归档副本** —— 来源：`E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas-deploy\MCP_SOP_天宫漫剧.md`
> 复制日期：2026-09-11　|　归集到：`E:\codex\huabu\inventory\`
> 原件仍在原位，**本副本不是权威版本**；两者不一致时以原件为准。

---

# MCP 工作流 SOP —— 天宫漫剧画布操作员手册

> 抽卡统一入口：需要 MJ 人物/建筑/场景时，调用 `ai-rpa-console/mxai_mcp_server.js`，由本地控制平面统一管理人工工作台与 AI 队列；道具/特效/光效/奇观主体仍走 OpenLux/image2，不得混用。

> 适用：通过 `infinite-canvas` MCP 操作画布的 AI 编程 Agent（Codex / Claude Code）。
> 目的：把《西游之重铸天庭》三集小而美漫剧的生产流程搬上画布，让抽卡、资产、分镜、验收在一个空间里可视化推进。
> 配套：视频统一走 Agnes 代理 `http://localhost:8787/v1`（OpenAI 兼容）。

---

## 0. 你不是编剧、不是资产师——你是「画布上的生产协调员」

你只能**编排节点、触发生成、登记状态**，不能越权替员工线程写剧本/资产/分镜正文。
主控（天宫主控）派工，你执行画布侧的落地与可视化。出图/出视频是**付费动作**：

- **Agnes Flash（720P）= 限时免费**：预演、抽卡、测提示词可放开。
- **正式成片（agnes-video-2.5 的 960P/2K、minimax、seedance）= 付费**：必须等老大当次明确授权，且写明次数/模型/分辨率后再批量。

---

## 1. 不可动摇的硬规则（来自 AGENTS.md，违反即作废）

1. **主角名 = 柳小念**，全文统一，禁止改回「柳念」或自作主张改名。
2. **不做连续长漫剧**，只做上/中/下三集；不主动铺第二季。
3. **视觉硬约束**：人物修长清俊、长袍轻纱、默认侧脸/背影/逆光、渺小超然；场景为中式天宫巨构（朱红立柱、勾心斗角斗拱、金瓦、汉白玉、圆月洞门、天瀑、金色云海）；电影级 3D 国漫、HDR、冷暖对撞、体积雾、Bloom；**禁止**欧美写实战争风、塑料 CGI、网红妆、正面特写定妆照式。
4. **事实分层**：每个关键节点 content 必须能回答属于 `source_fact`（原文）/ `adaptation`（合并删减）/ `影视化补强` / `unverified`（待确认）。
5. **不覆盖员工线程成品**；草稿不等于已批准结论，以 `project_state.yaml` 的 `status` 为准。

---

## 2. 你可用的画布工具

> **工具总数 = 34 个**（`canvas-agent/src/canvas/schemas.ts` 的 `toolNames`，与 `dist/canvas/schemas.js` 一致；
> `src/server/mcp.ts` L15 全量注册）。下表**只列本工作流最常用的 6 个**，不是全部。
> 自己核一遍：`node -e "import('./canvas-agent/dist/canvas/schemas.js').then(m=>console.log(m.toolNames.length))"` → 期望 `34`。
> 旧文档里写的「6 个」「25 个」都不对。

| 工具 | 用途 | 在本工作流中的典型用法 |
|---|---|---|
| `canvas_get_state` | 读整张画布 | 开工先看现有节点/连线，避免重复创建 |
| `canvas_get_selection` | 读选中节点 | 围绕用户点的节点继续操作（如基于某角色出视频）|
| `canvas_export_snapshot` | 导出快照 | 阶段结束存档、发给老大review |
| `canvas_apply_ops` | 批量增删改节点 | **核心**：铺剧本结构、建资产节点、回写验收状态 |
| `canvas_create_text_node` | 建文本节点 | 剧本段落、分镜说明、验收结论 |
| `canvas_create_image_prompt_flow` | 建图片/视频提示流节点 | **触发视频生成**：填 prompt + 参考图 + 视频模式，画布经代理打 Agnes |

---

## 3. 画布分层约定（请严格遵守命名，便于总览）

每张画布按「阶段泳道」或「集数」分区，节点标题统一前缀：

- 剧本：`[剧本] 上集 / 中集 / 下集` 文本节点
- 资产：`[资产·角色] 柳小念`、`[资产·场景] 天宫南天门`、`[资产·道具] 天瀑令`
- 分镜：`[分镜] S7-001 镜头描述`
- 抽卡：`[抽卡] 柳小念-逆光-2200s` 视频/图片流节点，metadata 记 `model / seconds / ar / status`
- 验收：`[验收] S9-xxx` 节点，status 用 `pass / fail / blocked`
- 阻塞：`[阻塞] 原因 + 卡点` ，连线指向被阻塞节点

连线语义：剧本 → 资产 → 分镜 → 抽卡 → 验收，形成一条可视生产链。

---

## 4. 七阶段 → 画布动作映射

| 阶段 | 你的画布动作 |
|---|---|
| 一 售前交接 | 建 `[交接]` 文本节点，列出客户背景/诉求/决策链/待确认；连线到后续 |
| 二 需求澄清 | `[需求]` 节点 + `[待确认]` 清单；用 `canvas_apply_ops` 批量建 |
| 三 交付计划 | `[计划]` 节点：里程碑/负责人/截止/依赖/风险；画布即甘特 |
| 四 执行跟踪 | 更新节点 status；新增 `[阻塞]` 并连线；`canvas_export_snapshot` 出周报底图 |
| 五 客户沟通 | 导出快照给老大做客户版；内部风险不上画布客户视角 |
| 六 验收交付 | `[验收] S9-xxx` 节点回写 pass/fail/blocked + 遗留问题清单 |
| 七 复盘 | `[复盘]` 节点沉淀 SOP/FAQ，连线到可复用资产 |

> 天宫漫剧本身的七阶段（剧本蒸馏→资产→分镜→视频编译→验收）映射同理：用上面资产/分镜/抽卡/验收前缀即可。

---

## 5. 出视频的标准动作（经 Agnes 代理）

在画布建 `canvas_create_image_prompt_flow` 节点，核心字段（以画布节点表单为准）：

- **prompt**：天宫视觉 DNA 描述 + 动作 + 运镜，中文。
- **模式**：
  - 文生视频 → `text`
  - 首帧/尾帧控制 → `keyframe`（给首帧/尾帧图，来自资产节点导出的 PNG）
  - 参考图保角色一致 → `reference`（≤5 张，指向 `[资产·角色]` 节点图）
- **参数**：`aspect_ratio=9:16`、`seconds`（封顶 12，预演用 5）、`size=720P`（Flash 固定）。
- **model**：`agnes-video-2.5-flash`（免费预演）/ `agnes-video-2.5`（正式，需授权）。

节点 metadata 记录：`{model, seconds, ar, status:"queued"}`，完成后回写 `video_url` 与 `status:"done"`。

> 参考图务必小图：代理已自动压缩并传 catbox；若直接给 URL 需公网可访问。

---

## 6.1 MJ 抽卡软件接入（人物 / 建筑 / 场景）

- 先启动 `ai-rpa-console`，再让 AI 调用 `mxai_mcp_server.js`；不要让每个 AI 线程各自启动一份适配器。
- 人工批量和 MCP 批量共用同一条本地队列，默认串行；同一时间只允许一个提交动作。
- 每张任务必须有唯一 `task_id`；控制台记录 `prompt_hash`、MJ 版本、画幅、模式、serial、结果路径和状态。
- MCP 或浏览器等待超时不等于失败：如果已经点过“立即生成”，状态应为 `receipt_pending`，先按 serial 回读，禁止自动重试。
- 人机验证、登录失效、内容审核、页面结构变化均停在人工处理，不得绕过。
- 结果必须先进入候选目录，人工 4 选 1 后才升级为正式资产。

## 6. 成本闸门（务必遵守）

- 单次 Flash 抽卡：可直接做，做完把 `video_url` 回写节点。
- 批量抽卡（同 prompt 多 take / 多镜头）：先在本会话跟老大确认**次数 + 模型 + 分辨率**，再循环建节点；MJ 人物/建筑/场景通过统一抽卡软件的 MCP 入口提交，道具/特效/光效/奇观主体不得发给该入口。
- 任何付费正式成片：必须老大当次授权原文，否则只建「待生成」节点、不触发。

---

## 7. 可直接复用的 ops 模板（JSON）

**铺一集剧本 + 资产 + 分镜骨架：**
```json
{
  "ops": [
    {"type":"add_node","nodeType":"text","title":"[剧本] 上集","position":{"x":0,"y":0},
     "metadata":{"content":"source_fact：原文第1-3章合并；主线：柳小念重铸天庭。","layer":"剧本"}},
    {"type":"add_node","nodeType":"text","title":"[资产·角色] 柳小念","position":{"x":0,"y":300},
     "metadata":{"content":"修长清俊/长袍轻纱/侧脸逆光；视觉DNA见AGENTS.md。","layer":"资产"}},
    {"type":"add_node","nodeType":"text","title":"[分镜] S7-001","position":{"x":300,"y":300},
     "metadata":{"content":"镜头：柳小念立于南天门，云海翻涌，缓推。","layer":"分镜"}},
    {"type":"add_edge","from":"[剧本] 上集","to":"[资产·角色] 柳小念"},
    {"type":"add_edge","from":"[资产·角色] 柳小念","to":"[分镜] S7-001"}
  ]
}
```
（边连接按画布实际节点 id 字段调整；先 `canvas_get_state` 取真实 id。）

**回写验收结论：**
```json
{
  "ops": [
    {"type":"update_node","id":"<S9节点id>","metadata":{"status":"pass","note":"视觉DNA达标，无欧美写实风"}}
  ]
}
```

---

## 8. 开工检查清单

1. `canvas_get_state` 看清现有结构，不重复建。
2. 确认本次动作属于哪个阶段、是否触发出图/出视频。
3. 免费预演 → 直接做；付费/批量 → 先向老大要授权。
4. 每次大动作后 `canvas_export_snapshot` 留档。
5. 主角名、视觉硬约束、事实分层三件事逐节点 self-check。

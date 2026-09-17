# 无限画布 · 批次 3「跑得顺」操作手册（batch3-ops.md）

> 文件：`implementation/deploy/batch3-ops.md`
> 状态：**设计稿 + 操作清单**。本文件描述的步骤**尚未在真实服务器 / 真实本机执行过任何一次**
> （本会话无 shell、无浏览器、无 SSH）。
> 治理仓：`E:/codex/huabu` ｜ 权威源码树（**只读**）：`E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas`
> 配套：验收 `implementation/deploy/batch3-acceptance.md`（B3-1 ~ B3-7）｜ 回滚 `implementation/deploy/batch3-rollback.md`
> ｜ 落地器 `implementation/scripts/apply-batch3.mjs`
> 父文件：`docs/ROADMAP.md` 批次 3 段（L97-128）、`GOVERNANCE-HANDBOOK.md` L66-78、`implementation/deploy/ROLLBACK.md` §4.3（L204-218）
> 规则来源：`AGENTS.md` §2 门禁与令牌、§4 发布与部署、§5 服务器数据

---

## 0. 一句话

**批次 3 与前两批的本质差异：它几乎不改源码树。**

前两批的交付件是「往权威树里改文件」；批次 3 的交付件是「**把已经存在的东西接起来**」：
`canvas-agent` **已构建**、`tools/omniroute-guard` **已存在**、天宫漫剧的节点是**画布上的数据不是代码**。

所以落地器 `apply-batch3.mjs` **一个字节都不写** —— 它只做「前置校验 + 打印待执行清单」。
真正的动作（起进程、开隧道、加防火墙规则、在画布上连节点）**必须由你在自己机器上做**。

---

## 1. ★ 先分清两台机器（看错这一节，后面全错）

批次 3 的「服务器」其实是**两台不同的机器**，混起来会做出错误判断：

| 代号 | 是哪台 | 上面跑什么 | 批次 3 要动它吗 |
| --- | --- | --- | --- |
| **机器 A · 画布源站** | `hb.cauai.fun` 的源站，路径 `/opt/infinite-canvas` | `web` / `agnes` / `api` / `db` 四个容器 + `cloudflared-canvas` 隧道 | **不动**（见 §3） |
| **机器 B · 本机** | 你日常开发用的这台 Windows 机器 | `canvas-agent`（默认 17371）与 omniroute（20128）/ 守卫（20129） | **主要动作都在这里**（见 §4） |

**为什么这样分**：从源码静态阅读看，`canvas-agent` 只监听 `127.0.0.1:17371`
（`canvas-agent/src/server/http.ts` L434 `app.listen(port, "127.0.0.1", ...)`），
`omniroute-guard` 默认 `GUARD_BIND=127.0.0.1`、上游是 `http://127.0.0.1:20128`。
**只绑回环 = 必须和调用它的东西在同一台机器上**，除非经隧道。

> ⚠️ 「`canvas-agent` 跑在你本机」这一条是**静态阅读**（配置目录 `~/.infinite-canvas/`、监听地址 127.0.0.1）
> 推出来的，**未在真机确认**。第一次动手前请先按 §4.1 核对。
> 如果你其实打算把 `canvas-agent` 放到机器 A 上跑，那它就不再是「本机 agent」，**本手册不覆盖这种部署**，需要重新评估。

---

## 2. 前置条件（未满足就不要开始）

| 项 | 要求 | 怎么确认 |
| --- | --- | --- |
| 批次 1 已落地 | `canvas-api/routes-credits.js` 存在 | 落地器会检查，缺了直接 `exit 2` |
| 批次 2 | **不阻塞批次 3** —— 两者改动面不重叠（批次 2 改 nginx 与前端常量，批次 3 改外部连接） | —— |
| Node | ≥ 20（落地器用 `import()` 动态加载与 `node:` 前缀导入） | `node -v` |
| `canvas-agent` 已构建 | `canvas-agent/dist/index.js` 存在 | 落地器会检查（见 §4.1） |
| 机器 A 可达 | 能 SSH 上机器 A | —— |
| ★ **`D-agent-auth` 已裁决** | **没有裁决就不能开工 B3-1** | `docs/DECISIONS.md` D4（L60 / L68）、`ACCEPTANCE.md` L568-570 |

> ★ **`D-agent-auth` 是本批次唯一的硬阻塞**：它决定 `canvas-agent` 对外暴露的鉴权形态。
> 三个选项与代价写在 §4.2，**需要你裁决**，本手册不代替你选。
> 其余六项（B3-2 ~ B3-7）**不被它阻塞**，可以先做。

---

## 3. 机器 A（画布源站）侧：**批次 3 无动作**

批次 3 **不改 nginx、不改 `.env`、不重建容器、不发布**。

| 你可能会想做的事 | 批次 3 要不要做 | 为什么 |
| --- | --- | --- |
| 改 `deploy/nginx-docker.conf` | ❌ 不要 | 批次 3 不新增任何 HTTP 路径。`canvas-agent` 与 LLM 中转走**独立隧道**，不经过画布源站的 nginx |
| 改 `/opt/infinite-canvas/api/api.env` | ❌ 不要 | 批次 3 不新增环境变量（批次 1 的四个变量见 `ACCEPTANCE.md` 附录 B） |
| `docker compose up -d --force-recreate` | ❌ 不要 | 没有 `.env` 变化就不需要重建 |
| 走一次 `publish.sh` | ❌ 不要 | 源码树零改动 |

> ⚠️ **唯一例外**：如果你最终决定**不**用独立隧道，而是把新服务挂在画布源站的 nginx 上，
> 那就要回到「改源码树 → 发布 → `nginx -t` → reload」的老路。**本手册不覆盖这条路线**。
> 本手册默认走 `docs/DECISIONS.md` D3 已定的方案：**守卫反代 + 具名隧道**。

---

## 4. 机器 B（本机）侧动作

### 4.1 先核对现状（只读，不改任何东西）

```powershell
# 1) 构建产物在不在（应打出文件信息，构建时间 2026-08-27 前后）
dir E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas\canvas-agent\dist\index.js

# 2) 工具数（应打出 tools = 34）
node -e "import(String.fromCharCode(46)+String.fromCharCode(47)+\"canvas-agent/dist/canvas/schemas.js\").then(m=>console.log(\"tools =\", m.toolNames.length))"
```

**期望**：

- 第 1 条：文件存在（`dist/` 构建于 2026-08-27，包版本 `0.6.0`）。
- 第 2 条：`tools = 34`。

**事实订正（别再被旧文档带偏）**：`canvas-agent` **已构建**，**实测 34 个工具**
（`src/canvas/schemas.ts` 的 `toolNames` 与 `dist/canvas/schemas.js` 完全一致；
`src/server/mcp.ts` L15 `toolNames.forEach(...)` 全量注册）。
旧文档写的「未构建、6 个工具」与计划原文写的「25 个」**都不对**。

> ⚠️ `inventory/canvas-agent-README.md` L108 与 `inventory/MCP_SOP_天宫漫剧.md` §2（L39-49）目前只列了 6 个**常用**工具，
> 那是节选不是全量。全量以 `src/canvas/schemas.ts` 的 `toolNames` 为准。

---

### 4.2 B3-1 · `canvas-agent` 对外暴露（★ 卡 `D-agent-auth`，未裁决不要动手）

**现状（静态阅读）**：

| 事实 | 位置 |
| --- | --- |
| 只监听 `127.0.0.1:17371` | `src/server/http.ts` L434 |
| 全局 token 中间件，失败返回 401 `invalid token` | `src/server/http.ts` L125-128 |
| 免 token 只有两条：`GET /health`、`GET /config` | `src/server/http.ts` L123-124 |
| token 存在 `~/.infinite-canvas/canvas-agent.json`（目录 0700 / 文件 0600） | `src/config.ts` |

> ★ **关键风险**：`validToken()`（`src/server/http.ts` L538-541）同时接受
> **请求头 `x-canvas-agent-token`** 与 **查询参数 `?token=`**。
> 一旦对外暴露，走 `?token=` 的请求会把 token 写进**浏览器历史、反向代理日志、Referer 头**。
> 这是「选项 (a)」的直接代价，不是理论风险。

**★ 暴露前必须知道的五条危险路由**（无论选哪条路线）：

| 路由 | 能做什么 |
| --- | --- |
| `POST /agent/codex/turn` | 驱动本机 Codex 跑一轮 |
| `POST /agent/claude/turn` | 驱动本机 Claude 跑一轮 |
| `POST /agent/local-file/reveal` | 在本机打开/定位文件 |
| `POST /api/tools` | 直接调用 34 个工具中的任意一个 |
| `POST /agent/codex/approval` | 替人做审批决定 |

**这五条合起来 = 把本机的执行能力交给对方。** 对外暴露的鉴权强度必须按这个量级来设计。

**三条路线（等用户裁决，本手册不替他选）**：

| 选项 | 做法 | 代价 |
| --- | --- | --- |
| **(a) 沿用现有 token** | 直接把 17371 经隧道暴露 | 改动最小；但 `?token=` 会进日志/历史，**token 泄露 = 整机 agent 可被驱动** |
| **(b) 另发凭据 + 守卫反代** | 照 `omniroute-guard` 模式新增 `canvas-agent-guard`：只绑本机、独立凭据、具名隧道 | 多一层进程；但公开面只剩一个受控端口，且**不暴露 `?token=` 这条路径** |
| **(c) 不对外暴露** | 只在本机用 | 风险最小；但 A-19 的目标缩水为「本机可用」，**「对外能力」这条不算交付** |

> ★ **CORS 白名单是累积的**：`setCors()`（`src/server/http.ts` L521-535）会把**首次带正确 token 的 Origin**
> 记进白名单并 `saveConfig()`。一旦暴露，任何拿到过 token 的来源都可能被**永久**写进白名单。
> 回滚时**记得一起清 `~/.infinite-canvas/canvas-agent.json` 里的白名单**，否则「关掉隧道」不等于「撤销访问」。

---

### 4.3 B3-2 · LLM 中转跨设备（`omniroute-guard`，20129）

**位置**：`tools/omniroute-guard/server.js`（136 行，**零依赖纯 Node http**，不需要 npm install）。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `GUARD_TOKEN` | **无默认，必填** | 缺失 → 打印错误并 `process.exit(1)`。**这是故意的守卫** |
| `GUARD_PORT` | `20129` | 对外那一个端口 |
| `UPSTREAM` | `http://127.0.0.1:20128` | 真正的 omniroute |
| `GUARD_BIND` | `127.0.0.1` | 只绑本机 |
| `GUARD_ALLOW_ORIGIN` | `*` | CORS 放行来源 |

**启动（PowerShell）**：

```powershell
$env:GUARD_TOKEN = "<你自己生成的长随机串>"
node E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas\tools\omniroute-guard\server.js
```

**启动（bash / WSL）**：

```bash
GUARD_TOKEN="<你自己生成的长随机串>" node tools/omniroute-guard/server.js
```

> ★ **启动日志会打印 token 的前 4 位与后 4 位**（`server.js` 的启动输出）。
> **不要把启动日志贴到任何公开处**（群、issue、截图）。
> ★ **不要为了图快把 `GUARD_TOKEN` 留空或改成弱口令** —— 它挡在 20128 前面，是唯一那道门。
> 比较用 `tokenMatches()`（`server.js` L42-50）**定长异或比较**，已经防了时序侧信道，不要自己改成 `===`。

**期望**：进程起来后打印监听 `127.0.0.1:20129`；本机 `curl http://127.0.0.1:20129/v1/models`（带对 token）能出模型列表。

---

### 4.4 B3-3 · 把 20128 收到本机（★ WSL 用户不要加）

**目标**：对外只留 20129（有 token），20128 只允许本机访问。

> ★ **WSL 例外**：如果这台机器上跑着 WSL，而且你有**从 WSL 访问 20128** 的需求，
> **不要加**这条规则 —— WSL2 走 NAT，从 WSL 看主机是「外部地址」，规则会把它一起挡掉。
> 加之前先想清楚你有没有这个用法。

**Windows（管理员 PowerShell）**：

```powershell
# 加规则
netsh advfirewall firewall add rule name="omniroute-20128-block-remote" dir=in action=block protocol=TCP localport=20128

# 撤销
netsh advfirewall firewall delete rule name="omniroute-20128-block-remote"
```

**为什么这样写能只挡外部**：Windows 防火墙的入站规则**不过滤回环流量**，
所以 `127.0.0.1:20128` 仍然通，来自其他设备的连接被挡。

> ⚠️ **未验证**：这条规则是否真的只挡外部、不影响本机与 WSL，**必须在真机测一次**。
> 测法：先 `curl http://127.0.0.1:20128/v1/models` 应通；再从另一台设备 `curl http://<本机IP>:20128/v1/models` 应超时。
> 两条都对才算这一步完成，见 `batch3-acceptance.md` B3-3。

---

### 4.5 具名隧道（把 20129 / canvas-agent 暴露出去）

**照现有范例做，三个都要新**：新服务名 + 新 token 目录 + 新 hostname。

现有范例在权威树 `deploy/`：

| 文件 | 内容 |
| --- | --- |
| `cloudflared-canvas.service` | 服务名 `cloudflared-canvas`；token 目录 `/etc/cloudflared-canvas/token`（`chmod 600`）；`ExecStart=/usr/bin/cloudflared --no-autoupdate tunnel run --protocol http2 --token-file /etc/cloudflared-canvas/token` |
| `cloudflared-canvas.yml.example` | `tunnel: e7eb70de-...`（**这是隧道 ID，不是密钥**）；`ingress: hb.cauai.fun -> http://127.0.0.1:18085`；末尾 `http_status:404` |

**三条硬约束**：

1. ★ **不要用 `cloudflared service install`** —— 它会跟机器上已经在跑的隧道**抢服务名**（`AGENTS.md` §4）。
   手写 unit 文件，服务名取新的。
2. ★ **quick tunnel（`trycloudflare` 临时域名）必须保持关闭** —— 那是一个**无鉴权的公网入口**
   （`docs/DECISIONS.md` D3、`ROLLBACK.md` L217-218）。图快开一次，等于把 20128 直接挂公网。
3. ★ **不用 Cloudflare Access** —— 它的交互式登录页与前端 `fetch` 不兼容（`docs/DECISIONS.md` D3）。
   对外鉴权由 `GUARD_TOKEN` 承担。

**验证隧道真的起来了**：

```bash
# 列出本机隧道连接（应看到新那条，且状态 healthy）
cloudflared tunnel list
```

> ⚠️ 上面这条命令**未在真机执行过**，仅按 cloudflared 常规用法写出。

---

## 5. 画布内容侧（B3-4 / B3-5）—— 没有命令行，全在画布上做

### 5.1 B3-4 · 天宫漫剧上 / 中 / 下三集流程跑通

**做什么**：把三集的节点链在画布上**串得起来、走得通**。

**★ 明确边界（写进验收证据里，不许省）**：本阶段目标是「**跑通流程**」，
**真出片等你单独授权**。**不许把「节点连起来了」写成「三集已产出」。**

**证据**：画布截图 + 用 `canvas_export_snapshot` 导出的快照 JSON + 时间戳。

> ★ **顺序风险**：批次 3 是在批次 1 的计费层**之上**做内容。
> 如果 L2 画布交互还没补完真机验证（缩放 / 节点链真实执行 / 插件安装三项仍缺证据，
> 见 `docs/STATUS_20260913_L2_EVIDENCE.md`），那么「链路走得通」这句本身**就无法证明** ——
> 节点连起来 ≠ 节点链能真的执行。

### 5.2 B3-5 · 事实分层节点规范落成

**四类标注**：`source_fact` / `adaptation` / `影视化补强` / `unverified`。

**做什么**：节点上能标这四类，且**在画布上能一眼区分**。

**证据**：四类各一个节点的截图 + 快照 JSON。

> ⚠️ 本项**只规定了分类名称**，「用什么字段存、怎么在画布上渲染」尚未设计。
> 落地时如果发现要改前端代码，那就**不再是「不改源码树」的批次 3 了** —— 停下来先回报。

---

## 6. 对账与告警（B3-6 / B3-7）

### 6.1 B3-6 · 每日对账

**两侧接口**：

| 侧 | 接口 | 说明 |
| --- | --- | --- |
| 本地 | `GET /api/admin/credits/reconcile?days=1` | 批次 1 提供（`canvas-api/routes-credits.js` L384），需管理员 |
| 紫域 | `GET /api/v1/jobs?limit=50` | **官方提供的对账入口**（limit 最大 100） |

**期望**：能看出「本地扣减」与「紫域 `cost`」的差异，且**有差异能定位到具体 task id**。

> ★ **一律先只读**。不要为了「把账修平」直接改表 —— 对账是**发现**差异，不是抹平差异。
> 需要修的时候走 `POST /api/admin/credits/adjust`（会写 `credit_adjustments` 留痕）。

### 6.2 B3-7 · 异常告警与失败日志

**三种异常，逐个造一次，看是否留痕**：

| # | 异常 | 期望留痕位置 |
| --- | --- | --- |
| 7.1 | 余额对不上（本地扣减 ≠ 紫域 `cost`） | 对账接口输出 + `credit_ledger` |
| 7.2 | 兑换失败（伪造码 / 重复码 / 过期码） | `credit_redemptions` 记录 + 接口 4xx 返回 |
| 7.3 | 紫域返回异常状态码 | `channel_usage` + api 日志 |

**证据**：三次异常各自的接口返回原文 + 对应表里的行（**可脱敏，但状态码与 error 字段要原文**）+ 时间戳。

> ⚠️ **「告警」目前没有独立通道** —— 现在只有「留痕」，没有主动推送。
> 本项验收的是**留痕**，不是「手机收到通知」。要不要加主动告警是后续单独议题，**不要在本批次里临时加**。

---

## 7. 四种结果的含义（落地器 `apply-batch3.mjs` 的输出口径）

| 状态 | 含义 | 要不要管 |
| --- | --- | --- |
| `PASS` | 前置校验通过 | 不用 |
| `TODO` | **有意不代做**的动作（起进程 / 隧道 / 防火墙 / 画布操作） | **要管**，按 §4 ~ §6 逐条做 |
| `BLOCK` | 前置缺失或**未裁决**（如 `D-agent-auth`） | **要管**，卡住后面 |
| `FAIL` | 路径不对 / 文件缺失（如源码树不存在、批次 1 未落地） | **要管**，见 §8 |

★ 与批次 1 / 批次 2 落地器的关键差异：**批次 3 的 `TODO` 是常态而不是异常**。
这个脚本**故意**不代做任何 SSH / docker / netsh / 隧道 / 画布操作 —— 它没有凭据，也不该有。

---

## 8. 退出码

| 码 | 含义 | 你该做什么 |
| --- | --- | --- |
| `0` | 校验全过（可能仍有 `TODO`） | 按 §4 ~ §6 逐条执行 |
| `1` | 有 `FAIL` | 按失败行的提示修（多半是文件缺失或路径不对） |
| `2` | 路径或前置不满足（源码树不存在 / 批次 1 未落地） | 检查 `--source=`，或先跑 `apply-batch1.mjs` |

---

## 9. 编号对照表

| 本手册 | 验收 `batch3-acceptance.md` | 主清单 `ACCEPTANCE.md` | 内容 |
| --- | --- | --- | --- |
| §4.1 | （前置） | —— | `canvas-agent` 现状核对（构建 / 34 工具） |
| §4.2 | **B3-1** | **A-19** | `canvas-agent` 对外可达 + 有鉴权（★ 卡 `D-agent-auth`） |
| §4.3 | **B3-2** | **A-20** | LLM 中转跨设备可用 |
| §4.4 + §4.5 | **B3-3** | **A-20 风险** | 20128 限本机 + quick tunnel 保持关闭 |
| §5.1 | **B3-4** | **A-21** | 天宫漫剧三集跑通流程（★ 不许写成三集已产出） |
| §5.2 | **B3-5** | **A-22** | 事实分层四类 |
| §6.1 | **B3-6** | **A-23** | 对账可用 |
| §6.2 | **B3-7** | **A-24** | 异常告警与失败日志 |

---

## 10. 顺序与风险（动手前读一遍）

| # | 风险 | 说明 |
| --- | --- | --- |
| ★1 | **`D-agent-auth` 未裁决** | 硬阻塞 B3-1。没裁决前**不要**把 17371 暴露出去。 |
| ★2 | **quick tunnel 不许开** | 无鉴权公网入口。回滚时也不许图快临时开（`ROLLBACK.md` L217-218）。 |
| ★3 | **20128 防火墙的 WSL 例外** | 有从 WSL 访问 20128 的需求就不要加规则。 |
| ★4 | **启动日志别外贴** | `omniroute-guard` 会打印 token 前 4 / 后 4 位。 |
| ★5 | **CORS 白名单是累积的** | 关隧道 ≠ 撤销访问。回滚要一起清 `~/.infinite-canvas/canvas-agent.json`。 |
| ★6 | **本批次「回滚 = 关开关」** | 唯一例外是 quick tunnel（见 ★2）。详见 `batch3-rollback.md`。 |
| ★7 | **L2 未验证会让 B3-4 失去意义** | 节点连起来 ≠ 节点链能执行。见 §5.1。 |

---

## 11. 未验证声明（诚实边界）

- 本文件**没有任何一步在真实环境执行过**。本会话**无 shell**（不能跑任何命令）、
  **无浏览器**（`cua.getState()` 返回 `Codex auth token is unavailable`）、**无 SSH**（不能上服务器）。
- 文中所有「来自 Lxx 行」的引用均为对治理仓与权威源码的**静态阅读**结果，**未运行验证**。
- §4.1 的第 2 条命令（`node -e` 动态 import `dist/canvas/schemas.js`）**未执行过**；
  它假设 `dist/canvas/schemas.js` 导出了 `toolNames`。若导出名不同，改用编辑器打开 `src/canvas/schemas.ts` 数一遍。
- §4.4 的 `netsh advfirewall` 规则**未在真机验证过**是否只挡外部、不影响本机与 WSL。
- §4.5 的 `cloudflared tunnel list` **未执行过**；服务名 `cloudflared-canvas` / token 目录 `/etc/cloudflared-canvas/token`
  来自 `deploy/cloudflared-canvas.service` 的静态阅读。
- §5 的两项（天宫漫剧、事实分层）**连设计都还没落地** —— 事实分层的字段与渲染方式未定。
- §6.2 的「告警」目前**只有留痕，没有主动推送通道**。
- **本文件不含任何真实密钥、令牌、站点密码、`AUTH_COOKIE`。**

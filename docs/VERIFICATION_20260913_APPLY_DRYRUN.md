# 落地器干跑验证报告 · 无限画布（批次 1 / 2 / 3）

> 日期：2026-09-13 ｜ 状态：**落地器锚点与真实权威树一致（只读模拟）；真实写入仍未执行**
> 验证对象：`implementation/scripts/apply-batch1.mjs` / `apply-batch2.mjs` / `apply-batch3.mjs`
> 验证手段：把落地器放进**零写入虚拟文件系统沙箱**里真跑一遍，读真实权威树、写内存覆盖层。
> 复验入口（已固化脚本）：`node E:/codex/huabu/implementation/scripts/dry-run-all.mjs` —— 见第 1.4 节。
> ⚠️ 本报告**不含任何密钥**；全程未使用紫域 Key，未联网，未启动任何进程。

---

## 〇、先说清楚这份报告证明了什么、没证明什么

**证明了**：三个落地器读的锚点、路径、前置判断，**与真实权威树（`E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas`）的实际内容对得上**。
这是第一次对着真实文件（而不是从权威树拷出来的假源树）跑。

**没有证明**：

- **没有真的写盘**。所有写入都落进内存覆盖层，权威树一个字节没变（核对表见第六节）。
- 没有构建、没有发布、没有连服务器、没有连数据库。
- 没有证明落地之后"能收钱"——那要等真机验收（`implementation/deploy/ACCEPTANCE.md`）。

**一句话**：以前只能说"脚本写完了、在假源树上跑通"；现在可以多说一句"**它对真实权威树也不会插错位置**"。但**第一次真跑仍然必须由你来做**，跑前先 `--dry-run` 读完输出。

---

## 一、方法：零写入虚拟文件系统沙箱

### 1.1 原理

把落地器的 `fs` 调用接到一个内存覆盖层上：

- `readFileSync` / `existsSync` / `statSync` —— 覆盖层里有就用覆盖层，没有就**读真实权威树**。
- `writeFileSync` / `copyFileSync` / `mkdirSync` —— **只写内存**，并记录"本会写哪些路径"。

所以：**读的是真文件，写的是假磁盘**。锚点匹配、前置判断、幂等判断全部按真实内容走；产物是模拟产物。

### 1.2 四个必须记住的坑（下次复用别重踩）

| # | 坑 | 后果 | 正确做法 |
|---|---|---|---|
| 1 | 沙箱里没有全局 `process` | 脚本一开头 `ReferenceError: process is not defined` | 必须注入假 `process`（含 `argv` / `exit` / `versions.node` / `env`） |
| 2 | 把 `fileURLToPath(import.meta.url)` 替换成**目录** | 脚本内部还有 `path.dirname(...)`，会再上一层 → 治理仓路径变成 `E:\codex`，报"治理仓文件全缺" | 必须替换成**完整文件路径** |
| 3 | 覆盖层的 key 用字符串拼 `/`，而脚本内部用 `path.join`（反斜杠） | `existsSync` 匹配不上 → 前置守卫误报"批次 1 未落地" | key 必须与脚本内部同一形态（`path.join`） |
| 4 | 本脚本自身被塞进沙箱跑时，没有注入 `fsReal` | 脚本一开头 `ReferenceError: fsReal is not defined` | 注入名清单：`fs` / `fsReal` / `path` / `process` / `console` / `Buffer` / `vm`（`fs` 与 `fsReal` 都传沙箱版 `ffs`） |

### 1.3 三段式跑法（有顺序依赖）

批次 2、批次 3 都以"批次 1 已落地"为前置。跑法是把上一批的覆盖层（去掉 `.bak-*` 备份）当下一批的基线：

1. 跑批次 1 → 得到覆盖层 A（10 个目标文件 + 6 个备份）
2. 用 A 的**目标文件**做基线，跑批次 2
3. 用 A 的**目标文件**做基线，跑批次 3

### 1.4 复验入口：`dry-run-all.mjs`（已固化，不必手搓沙箱）

上面 1.1–1.3 描述的方法**已经固化成一个脚本**，不必每次手工搭沙箱：

```bash
node E:/codex/huabu/implementation/scripts/dry-run-all.mjs              # 汇总模式
node E:/codex/huabu/implementation/scripts/dry-run-all.mjs --verbose    # 附落地器原始输出
node E:/codex/huabu/implementation/scripts/dry-run-all.mjs --source=E:/path/to/infinite-canvas
```

`implementation/scripts/dry-run-all.mjs`（11932 B / 256 行 / LF / 零依赖，只用 `node:fs` `node:path` `node:vm` `node:url`）做的事：

1. 把 `apply-batch1 / 2 / 3` 依次接进**零写入虚拟文件系统**，按 1 → 2 → 3 跑，并把上一批的模拟产物当下一批的基线，满足前置守卫。
2. 跑完核对权威树里 7 个「会被改动的候选文件」的字节数**跑前跑后是否一致**。

| 退出码 | 含义 |
|---|---|
| `0` | 三批都跑完，且权威树零变化 |
| `1` | **检测到权威树字节数变了** —— 严重，干跑不该写盘 |
| `2` | 路径不对 / 前置不满足（例如找不到权威树） |

它**不写盘、不起进程、不联网**。本报告第 2–4 节的数字就是它跑出来的。

**两处实现缺陷已修复并复验**：

| # | 缺陷 | 后果 | 修法 |
|---|---|---|---|
| 1 | FAIL / BLOCK 计数器原先用 `/\bFAIL\b/` 匹配**所有**日志行 | 把脚本自己的说明文字（如「1 = 有 FAIL」）算成失败 → 批次 3 误报 `FAIL 1` | 改为只认结果表行：`/^(S[0-9]+\|B[0-9]+\|B3-[0-9]+\|V[0-9]+)\s{2,}(FAIL\|BLOCK)\b/` |
| 2 | 脚本自身被塞进沙箱跑时未注入 `fsReal` | `ReferenceError: fsReal is not defined` | 注入名清单写进脚本头部注释：`fs` / `fsReal` / `path` / `process` / `console` / `Buffer` / `vm` |

> ⚠️ **单位坑**：文件清单里给的是 **UTF-8 字节数**（`statSync().size`）。同一份文件按**字符数**数会更小
> （例如批次 3 四件套：16376 / 12188 / 9765 / 7741 是字符数，19917 / 17634 / 13974 / 20828 是字节数）。两个都对，别当成矛盾。

---

## 二、批次 1（收得到钱）· 结果

**退出码 0 ｜ S1–S8 全部 OK / NOTE，零 FAIL ｜ 模拟写入 10 处（另加 6 个 `.bak-20260913` 备份）**

| 步骤 | 结果 | 说明 |
|---|---|---|
| S1 | OK | 写入 4 个模块到 `canvas-api/` |
| S2 | OK | `schema.sql` 追加 `user_credits` / `credit_ledger` / `credit_redemptions` / `channel_usage` / `free_trial_usage` / `credit_adjustments` |
| S3 | OK | `server.js` 补 import；CORS 允许 `Idempotency-Key`；插入 `requireAdmin`；挂载计费路由 |
| S4 | OK | `Dockerfile.api` 的 COPY 追加 4 个后端模块 |
| S5 | OK | `publish.sh` 打包列表 / 后端指纹 2 处 / Key 参数解析 / 空 Key 守卫 + `api.env` 写入 / `sed` 替换 `__ZIYU_KEY__` / 占位符 grep 同步 / 占位符硬失败自检 / API 源码上传列表 |
| S6 | NOTE | **不代做**：服务器 `api.env` 需 `LDXP_REDEEM_SECRET`（`openssl rand -hex 32`）、`FREE_TRIAL_MONTHLY_LIMIT`（默认 3）；改完必须 `docker compose up -d --force-recreate api` |
| S7 | OK | `nginx-docker.conf` 插入 `/ziyu/` location（37 行） |
| S7 | NOTE | **不代做**：上传后 `nginx -t` + `nginx -s reload` |
| S8 | OK | `channel-templates.ts`：插入脚本常量；`models` 支持 `script`；`ChannelTemplate` 支持 `apiKey`；透传 `apiKey` 与模型 `script`；追加紫域模板（27 个模型） |

### 2.1 关键锚点实测（从模拟产物里抓的行）

| 文件 | 行 | 内容 |
|---|---|---|
| `canvas-api/server.js` | L27 | `import { mountCreditRoutes } from "./routes-credits.js";` |
| `canvas-api/server.js` | L55 | CORS 白名单含 `Idempotency-Key` |
| `canvas-api/server.js` | L91 | `function requireAdmin(req, res, next)` |
| `canvas-api/server.js` | L186 | `mountCreditRoutes(app, { requireAuth, requireAdmin, registerMedia, query });` |
| `scripts/deploy/publish.sh` | L30 / L33 | Key 变量取值与 `--ziyu-key=` 参数分支 |
| `scripts/deploy/publish.sh` | L245-249 | 空 Key 守卫：拒绝把 `__ZIYU_KEY__` 替换成空串 |
| `web/src/stores/channel-templates.ts` | L58 | 收录 27 档（22 视频 + 5 图片）；线上目录共 44 档 |
| `web/src/stores/channel-templates.ts` | L64-66 | 目录实时拉取，本地只缓存分组与展示名；查不到要重选，不静默降级 |

### 2.2 换行制式（模拟产物实测）

| 文件 | 字节 | 行尾 |
|---|---|---|
| `canvas-api/credits.js` | 20238 | 478 CRLF / 0 loneLF |
| `canvas-api/ldxp-redeem.js` | 5993 | 149 CRLF |
| `canvas-api/ziyu.js` | 22310 | 464 CRLF |
| `canvas-api/routes-credits.js` | 21963 | 421 CRLF |
| `canvas-api/schema.sql` | 13562（原 5708） | 269 CRLF |
| `canvas-api/server.js` | 31613（原 31124） | 750 CRLF |
| `deploy/Dockerfile.api` | 766（原 714） | 25 CRLF |
| `scripts/deploy/publish.sh` | 18880（原 16558） | **329 loneLF**（LF 制式保持） |
| `deploy/nginx-docker.conf` | 9014（原 6631） | **208 loneLF**（LF 制式保持） |
| `web/src/stores/channel-templates.ts` | 22743（原 3994） | 390 CRLF |

结论：**该保 CRLF 的保住了，该保 LF 的也保住了**，没有出现"整文件被换行制式改写"这种会污染整个 diff 的事故。

---

## 三、批次 2（放得开）· 结果

**退出码 0 ｜ B1–B7 全部 OK / NOTE ｜ 模拟写入 3 个路径（含 1 个 `.bak-20260913`）**

| 步骤 | 结果 | 说明 |
|---|---|---|
| B1 | OK | 撤 `/` 页面门禁（原先 302 → `/login.html`） |
| B2 | OK | 撤 `/assets/` 门禁（原先 403） |
| B3 | OK | 撤 `/config.js` 门禁（原先 403） |
| B4 | OK | 撤 `/agnes/` 门禁（原先 403） |
| B5 | OK | 插入 61 行免费试拍限次片段（`auth_request` + 2 个具名 location） |
| B6 | OK | `use-config-store.ts` 默认 `baseUrl` 清空（不再默认打公网 OpenAI） |
| B7 | NOTE | **不代做**：公开注册 = 服务器 `api.env` 的 `ALLOW_REGISTER`；`publish.sh` 默认 1（开） |

> **为什么是 3 个路径而不是 4 个**：批次 2 的沙箱是**新开的**，只把批次 1 的产物（去掉 `.bak-*`）当基线。
> 所以 `deploy/nginx-docker.conf` 本身已在覆盖层里（再写不算新路径），批次 2 真正新增的是
> `deploy/nginx-docker.conf.bak-20260913`、`web/src/stores/use-config-store.ts` 及其 `.bak-20260913` 共 3 个。
> 其中 `nginx-docker.conf.bak-20260913` 与批次 1 共用，所以三批合计 16 + 3 = 19，去重后 **18** 个目标路径。

### 3.1 ⚠️ B7 带出来的一个真实风险

`publish.sh` 的 `ALLOW_REGISTER` 默认值是 **1（开）**，所以**线上当前很可能已经是公开注册状态**。
放开之前必须先在数据库里确认第一个注册者（你）已经是 `admin`：

```sql
SELECT id, email, role, created_at FROM users ORDER BY id ASC LIMIT 5;
```

若第一行 `role` 不是 `admin`，**先别放开**，先修角色。这一条已写进 `batch2-acceptance.md` 的 B2-7。

### 3.2 批次 2 之后的 nginx 结构（模拟产物实测）

| location | 行 | 门禁状态 |
|---|---|---|
| `location /` | L54 | **已撤** |
| `location /assets/` | L59 | **已撤** |
| `location = /config.js` | L66 | **已撤** |
| `location /agnes/` | L73 | **已撤** |
| `location /ziyu/` | L97 | **保留**（`if ($canvas_authed = 0) return 403`）—— 会烧真钱，批次 2 不放开 |
| `location = /agnes/v1/videos` | L146 | 新增 `auth_request /_canvas_free_trial_check` |
| `location = /_canvas_free_trial_check` | L178 | 新增（`internal`，外部访问不到） |
| `location @canvas_need_login` / `@canvas_trial_used` | L197 / L203 | 新增两个具名 location |
| `location /api/` | L215 | 不变 |
| `location /dav/` | L243 | 不变（本批次不动，网盘挂载收敛为管理员专用另排期） |

产物共 272 行 / 13009 字节 / 271 loneLF，`auth_request` 出现 4 次。
片段标记行 `BATCH2-NGINX-FRAGMENT-BEGIN` **不出现在产物里**（脚本只取标记之间的正文），这是正确的。

---

## 四、批次 3（跑得顺）· 结果

**退出码 0 ｜ V1–V9 全部 PASS ｜ B3-1 = BLOCK，B3-2 ~ B3-7 = TODO ｜ 零写入（设计如此）**

| 步骤 | 结果 | 说明 |
|---|---|---|
| V1 | PASS | 权威源码树存在 |
| V2 | PASS | `canvas-api/server.js` 存在 |
| V3 | PASS | 批次 1 已落地（`canvas-api/routes-credits.js` 存在） |
| V4 | PASS | `canvas-agent` 已构建（`dist/index.js`，209 B，2026-08-27） |
| V5 | PASS | `omniroute-guard` 存在（`tools/omniroute-guard/server.js`，5993 B） |
| V6 | PASS | `canvas-agent/dist/canvas/schemas.js` 存在 |
| V7 | PASS | 五条危险路由都在（5/5） |
| V8 | PASS | 治理仓批次 3 四件套齐全 |
| V9 | PASS | Node 版本 22.11.0（≥ 20） |
| **B3-1** | **BLOCK** | **`canvas-agent` 对外暴露被 `D-agent-auth` 阻塞 —— 鉴权形态未裁决** |
| B3-2 ~ B3-7 | TODO | 起守卫 / 收 20128 / 三集串通 / 事实分层 / 对账 / 异常留痕 —— 都要在你机器上做 |

**B3-1 是唯一的硬阻塞**，它卡的是"对外能力"这条交付。三个选项见 `docs/DECISIONS.md` D4 与 `implementation/deploy/ACCEPTANCE.md` 附录 A。**这一项必须你裁决，我不替你选。**

批次 3 的落地器**设计上就一个字节都不写**，所以本次干跑"零写入"是预期行为，不是失败。

---

## 五、前置守卫实测（两处都按设计生效）

| 场景 | 退出码 | 报错 |
|---|---|---|
| 批次 2，批次 1 **未**落地 | **2** | 「缺少 `canvas-api/routes-credits.js` —— 批次 1 还没落地。原因：B5 插入的 `/_canvas_free_trial_check` 子请求指向 `/api/credits/free-trial/check`，那条路由由批次 1 提供。」 |
| 批次 3，批次 1 **未**落地 | **2** | 「缺少 `canvas-api/routes-credits.js` —— 批次 1 还没落地。原因：批次 3 的 B3-6 对账接口 `/api/admin/credits/reconcile` 由批次 1 提供；批次 1 未落地时对账无意义，本脚本不再往下走。」 |

这条很重要：**批次 2、批次 3 不能抢在批次 1 前面跑**，脚本会自己拦住，而不是插出一个半成品。

---

## 六、权威树零写入核对（通过）

跑完后逐一确认，以下**全部不存在**：

| 核对项 | 结果 |
|---|---|
| `canvas-api/credits.js` | 不存在 ✅ |
| `canvas-api/ldxp-redeem.js` | 不存在 ✅ |
| `canvas-api/ziyu.js` | 不存在 ✅ |
| `canvas-api/routes-credits.js` | 不存在 ✅ |
| `canvas-api/server.js.bak-20260913` | 不存在 ✅ |
| `canvas-api/schema.sql.bak-20260913` | 不存在 ✅ |
| `deploy/nginx-docker.conf.bak-20260913` | 不存在 ✅ |
| `scripts/deploy/publish.sh.bak-20260913` | 不存在 ✅ |
| `deploy/Dockerfile.api.bak-20260913` | 不存在 ✅ |
| `web/src/stores/channel-templates.ts.bak-20260913` | 不存在 ✅ |
| `web/src/stores/use-config-store.ts.bak-20260913` | 不存在 ✅ |

被改动的 7 个既有文件，跑前跑后字节数**完全一致**：

| 文件 | 跑前 | 跑后 |
|---|---|---|
| `canvas-api/server.js` | 31124 | 31124 ✅ |
| `canvas-api/schema.sql` | 5708 | 5708 ✅ |
| `deploy/Dockerfile.api` | 714 | 714 ✅ |
| `deploy/nginx-docker.conf` | 6631 | 6631 ✅ |
| `scripts/deploy/publish.sh` | 16558 | 16558 ✅ |
| `web/src/stores/channel-templates.ts` | 3994 | 3994 ✅ |
| `web/src/stores/use-config-store.ts` | 22384 | 22384 ✅ |

> 落地器打印的「✓ 已写盘 N 处」是**脚本自己的话术**，写进的是内存覆盖层。
> 本报告的措辞一律是「**模拟写入**」，不写成「已落地」。

---

## 七、结论与下一步

### 7.1 结论

1. **三个落地器对真实权威树的锚点全部命中**，没有一处"找不到锚点"或"插错位置"。
2. **前置守卫按设计生效**（批次 2 / 批次 3 抢跑都会被拦下，退出码 2）。
3. **换行制式正确**，CRLF / LF 各归各位。
4. **权威树零写入**，核对通过。
5. 批次 1 的 **S6 / S7 服务器侧动作不代做**，批次 3 的 **B3-1 硬阻塞未解**。
6. **本次结论可复现**：全部由 `implementation/scripts/dry-run-all.mjs` 一次跑出（退出码 0），不必手工搭沙箱。

### 7.2 仍未验证（不许含糊）

| # | 未验证项 | 只能在哪儿验 |
|---|---|---|
| 1 | 落地器**真实写盘** | 你的本地终端 |
| 2 | 紫域插件脚本在**真实浏览器**里执行 | `hb.cauai.fun` 真机 |
| 3 | 计费路由打**真实 Postgres** 的并发行为 | 服务器 |
| 4 | nginx 片段能被**真实 nginx** 加载 | 服务器 `nginx -t` |
| 5 | 落盘 / 对账 / 免费试拍限次端到端 | 服务器 |
| 6 | `canvas-agent` 对外暴露（B3-1） | 需先裁决 `D-agent-auth` |

### 7.3 顺序风险（必须重复一次）

**L2 画布交互至今没有完整的真实浏览器证据**（残留：缩放、节点链真实执行、插件安装）。
本报告证明的是"落地器不会插错位置"，**不能替代 L2 冒烟**。
**A-06 之前必须补一次 L2 真机冒烟**，否则可能出现"能收钱但点不动"。

---

## 八、本文件自身状态

- 本文件**只记录验证过程与结果**，没有改过权威源码树，没有构建，没有发布。
- 本文件不含任何真实密钥、令牌、站点密码、`AUTH_COOKIE`。
- 本次干跑**未联网、未启动子进程、未花任何积分**。
- 复验脚本 `implementation/scripts/dry-run-all.mjs` 自身**只读权威树、只写内存覆盖层**；本次它在沙箱里跑，外层沙箱记录的写入数为 **0**。
- 落代码、动服务器、动数据卷，**全部需要用户单独授权**。

# 无限画布 · 批次 1 落地手册（APPLY-RUNBOOK.md）

> 治理仓：`E:\codex\huabu` ｜ 权威源码树：`E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas`
> 落地器：`implementation/scripts/apply-batch1.mjs` ｜ 最后更新：2026-09-13

---

## 0. 一句话

> **本文件覆盖三批落地器**：§1–§3 与 §5–§7 讲批次 1（主流程），§4.3 讲批次 2，**§4.4 讲批次 3**。
> 批次 2 / 批次 3 的验收与回滚各自有独立手册，见 §4.3 / §4.4 的指引。

批次 1 的 13 项源码改动（`APPLY.md` §3 第 0–12 项）落在 **10 个文件**上，**不在治理仓执行**（本仓无权威树写权限，也无 shell / SSH）。
你在**自己有写权限的终端**里跑一条命令，落地器负责幂等替换、逐处自检、打印每一步结果。
**它只改源码树里的文件**：不碰服务器、不碰数据卷、不发布、不构建。

---

## 1. 前置条件

| 项 | 要求 | 怎么确认 |
| --- | --- | --- |
| Node | ≥ 20（脚本用 `import()` 动态加载与 `node:` 前缀导入） | `node -v` |
| 权威树 | 已 `git status` 干净，或至少**没有别人正在改同一批文件** | `cd <权威树> && git status --short` |
| 磁盘 | 落地器会在每个被改文件旁写 `<文件>.bak-YYYYMMDD` | 预留几十 KB 即可 |
| 紫域 Key | 正式发布时才需要，**落地器本身不需要** | 见第 7 节 |

**先看一眼备份基线**：落地器**不会覆盖已存在的备份**（`.bak-YYYYMMDD` 已存在就保留最初那一份）。
所以如果你今天已经跑过一次、又想从「最初状态」回退，用 `git checkout` 而不是备份。

---

## 2. 命令

### 2.1 第一步：试运行（只读，不写盘）

```bash
node E:/codex/huabu/implementation/scripts/apply-batch1.mjs \
  --source=E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas \
  --dry-run
```

试运行会把每一步的 `OK / SKIP / NOTE / FAIL` 全部列出来，并列出「待写盘 N 处」的完整文件清单，
**但一个字节都不写**。末尾固定打印：`（--dry-run：以上为「将要做的改动」，未写盘。）`

**先把这份输出从头读到尾再往下走。** 尤其确认「待写盘」清单里没有你不想动的文件。

#### 2.1.1 三批次一次性干跑（推荐先跑这个）

批次 2 和批次 3 的落地器有**前置守卫**：批次 2 要求批次 1 已落地，批次 3 也要求批次 1 已落地。
所以想一次看全三批的结论，用这个总控脚本：

```bash
node E:/codex/huabu/implementation/scripts/dry-run-all.mjs
```

它做两件事：

1. 把三个落地器接进**零写入虚拟文件系统**（读的是真实权威树，写的是内存覆盖层），按 1 → 2 → 3 的顺序跑，
   并把批次 1 的**模拟产物**喂给批次 2 / 3 当输入 —— 这样前置守卫能被正确满足。
2. 跑完核对权威树里 7 个「会被改动的候选文件」的字节数**跑前跑后是否一致**，打印 `✓ 权威树零变化`。

它**不写盘、不起进程、不联网**。加上 `--verbose` 可以看落地器的完整原始输出。

退出码：`0` = 三批都跑完且权威树零变化 · `1` = **检测到权威树字节数变了**（严重，干跑不该写盘）· `2` = 路径不对或前置不满足。

> 干跑证明的是「**不会插错位置**」，不是「已经落地」。它替代不了第 2.2 步的真跑。
> 2026-09-13 的干跑结果见 `docs/VERIFICATION_20260913_APPLY_DRYRUN.md`（方法、退出码、两处已修缺陷见该报告 §1.4）。

### 2.2 第二步：正式写入

```bash
node E:/codex/huabu/implementation/scripts/apply-batch1.mjs \
  --source=E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas
```

不传 `--source` 时用脚本顶部的默认路径（就是上面这条）。

### 2.3 只跑其中几步（可选）

```bash
node E:/codex/huabu/implementation/scripts/apply-batch1.mjs --only=S3,S5
```

`--only=` 接受逗号分隔的步骤号（`S1`–`S8`，大小写不敏感）。**没点名的步骤完全不执行**，
也不会误报 `SKIP`。用途：分批落地、或某一处失败后只重跑那一步。

### 2.4 退出码

| 码 | 含义 | 你该做什么 |
| --- | --- | --- |
| `0` | 全部成功（或试运行结束） | 看末尾那行「已写盘 N 处 / 无需改动」 |
| `1` | 有 `FAIL`，**本次一个文件都没写** | 按第 5 节处理 |
| `2` | 找不到源码树，或路径不像无限画布 | 检查 `--source=` |

---

## 3. 四种结果的含义

| 状态 | 含义 | 要不要管 |
| --- | --- | --- |
| `OK` | 本次真的改了这个文件（已进「待写盘」队列） | 不用 |
| `SKIP` | **已经是最新**，幂等跳过，没重复插入 | 不用。这是重跑的正常结果 |
| `NOTE` | **有意不代做**的步骤（S6 服务器环境变量、S7 的 nginx reload） | **要管**，见第 6 节 |
| `FAIL` | 锚点找不到 / 文件缺失 —— **整个脚本中止，不写任何文件** | **要管**，见第 5 节 |

关键性质：**「全部成功才写盘」**。只要有一处 `FAIL`，前面的 `OK` 也不会落盘，
所以你永远不会拿到「改了一半」的源码树。修好锚点后原样重跑即可。

末尾那行小结是可信的：

- `✓ 已写盘 N 处。每处改动前都留了 .bak-YYYYMMDD 备份……` —— 本次确实写了 N 个文件；
- `✓ 无需改动：所有步骤都已是最新（幂等跳过），本次没有写任何文件。` —— 本次零写入（重跑的正常现象）。

---

## 4. 编号对照表（三套编号并存，别混）

同一件事在三份文件里有三种叫法：`implementation/canvas-api/APPLY.md` 用「§3 第 0–12 项」，
落地器内部用 `S1`–`S8`，`implementation/deploy/ACCEPTANCE.md` 用 `A-xx`。对照如下。

### 4.1 APPLY 第 0–12 项 ↔ 落地器 S1–S8

| APPLY.md §3 | 落地器 | 改什么 |
| --- | --- | --- |
| 第 0 项 | **S1** | 4 个后端模块搬进 `canvas-api/`（`credits.js` / `ldxp-redeem.js` / `ziyu.js` / `routes-credits.js`） |
| 第 5 项 | **S2** | `schema.sql` 末尾追加 6 张计费表 |
| 第 1 项 | **S3** | `server.js` 加 `import` |
| 第 2 项 | **S3** | `server.js` CORS 头加 `Idempotency-Key` |
| 第 3 项 | **S3** | `server.js` 新增 `requireAdmin` |
| 第 4 项 | **S3** | `server.js` 挂载计费路由 |
| 第 9 项 | **S4** | `deploy/Dockerfile.api` 的 COPY 加 4 个模块 |
| 第 6 项 | **S5** | `publish.sh` 打包列表加 4 个 js |
| 第 7 项 | **S5** | `publish.sh` `api_fingerprint()` 两处都加 |
| 第 8 项 | **S5** | `publish.sh` `upload_lf` 加 4 个 js |
| 第 10 项 | **S5** | `publish.sh` sed 加 `__ZIYU_KEY__` + grep 同步 + 空 Key 守卫 |
| —（APPLY §5 S6） | **S6** | 服务器 `api.env` 变量 —— **只提示，不代做** |
| 第 11 项 | **S7** | `nginx-docker.conf` 插入 `/ziyu/` location |
| 第 12 项 | **S8** | `channel-templates.ts` 补字段 + 透传 + 紫域模板 |
| —（APPLY §5 S9） | —（不在脚本内） | 跑批次 1 验收 A-00 ~ A-12 |

注意两套编号**不是一一对应**：`S3` 一个人干 APPLY 的第 1–4 项，`S5` 一个人干第 6/7/8/10 项。
所以别用「第几项」去猜 `--only=` 的参数，`--only=` 只认 `S1`–`S8`。

### 4.2 落地器 S1–S8 ↔ ACCEPTANCE A-xx（做完这步，哪条验收才有意义）

| 落地器 | 落地后立刻可验的 A-xx |
| --- | --- |
| S1 | A-00（四个模块在 ESM 下能被加载 —— **门槛项**） |
| S2 | A-04 / A-05 / A-23（额度、兑换、对账依赖这 6 张表） |
| S3 | A-03 / A-04 / A-05 / A-13（路由挂上、`requireAdmin` 生效） |
| S4 | A-00（漏了 COPY 就是线上 404 / 500） |
| S5 | A-01 / A-02（`/ziyu/` 反代与 Key 注入链路） |
| S6 | 附录 B（环境变量清单） |
| S7 | A-01 / A-02 / A-15（`/ziyu/` 生效且门禁没被一起撤掉） |
| S8 | A-03 / A-06（渠道能选中、能提交，不发 `apiKeyRequired`） |
| 全部 | A-06 ~ A-12 必须在真机跑，见 `implementation/deploy/ACCEPTANCE.md` |

★ **A-06（紫域真机冒烟）之前必须先补一次 L2 真实浏览器冒烟** —— 顺序风险写在 APPLY.md §1.2，
别跳过。画布交互至今只在 2026-09-01 的 Playwright 会话里覆盖了「节点渲染 / 拖拽连线 / 连线方向语义 /
`videoMode` 自动纠正 / 秒数钳位」，**缩放、节点链真实执行、插件安装三项仍缺证据**
（见 `docs/STATUS_20260913_L2_EVIDENCE.md`）。

### 4.3 批次 2 落地器 B1–B7 ↔ 主清单 A-xx ↔ 批次 2 验收项 B2-xx

批次 2 有**独立的验收手册**（`implementation/deploy/batch2-acceptance.md`）和**独立的回滚手册**
（`implementation/deploy/batch2-rollback.md`）。下面这张三列对照表是两套编号之间的桥。

| 落地器 | 落地后立刻可验的主清单项 | 对应批次 2 验收项 | 这一项改了什么 |
| --- | --- | --- | --- |
| B1 | A-14 | B2-1 | 撤掉 `location /` 的 cookie 门禁 |
| B2 | A-14 | B2-2 | 撤掉 `location /assets/` 的 cookie 门禁 |
| B3 | A-14 | B2-2 | 撤掉 `location = /config.js` 的 cookie 门禁 |
| B4 | A-14 | B2-3 | 撤掉 `location /agnes/` 的 cookie 门禁 |
| B5 | A-14 / **A-15** | **B2-4** / **B2-5** | 插入免费试拍限次片段（`auth_request` + 额度检查） |
| B6 | A-17 | B2-6 | 默认渠道 baseUrl 清空，不再指向公网 OpenAI |
| B7 | A-13 | B2-7 | 公开注册开关（**脚本只提示，不代做**） |
| — | **A-18** | `batch2-acceptance.md` §4 | L2 真机冒烟（**A-06 之前必做**） |

★ 三点口径，别搞混：

1. **B2-2 对应两个落地器**（B2 与 B3）：静态资源与运行期配置是两条独立 location，
   snippet 的 U1 要求**两条都实测**，只测一条不算过。
2. **B5 一项出两条验收**：B2-4 是正向（未登录 401 / 登录后前 3 次放行 / 第 4 次 403 且 `FREE_TRIAL_EXHAUSTED`），
   B2-5 是**反向断言**（`/ziyu/` 的门禁没被顺手撤掉，无 cookie 应得 **403**）。
   B2-5 是这一批次唯一**资金风险**的兜底，详见 `batch2-acceptance.md` §1。
3. ★ **B7 与 A-13 的顺序不能反，而且 2026-09-13 线上实测把这条顺序又往前推了一步**：
   `CANVAS_ALLOW_REGISTER` 线上**当前就是开着的**（`POST /api/auth/register` 返回 400 `password_too_short`，
   而非 403 `registration_closed`），所以第一步不是「打开注册」而是**先设成 `0` 并重建 api 容器**，
   然后查 `users` 表确认你是 `admin` 且没有陌生账号，再上额度体系，最后才放开注册。
   理由（B-6）：`/api/` 刻意不吃门禁，而注册成功会自动下发 `canvas_auth` 门禁 cookie，
   ⇒ 注册接口敞开期间**门禁可被自助绕过**，`/ziyu/` 的真实防线只有额度体系。
   完整证据见 `implementation/deploy/batch2-acceptance.md` §0.1 与 `docs/STATUS_20260913_LIVE_GATE.md`。
   脚本**只提示、不代做**（它没有服务器凭据），原因见 §6。

★ 落地器收尾提示（`implementation/scripts/apply-batch2.mjs` 末尾）已经指向
`batch2-acceptance.md` 的 B2-1 ~ B2-7 —— 跑完落地器照着那份手册逐条打勾即可。

### 4.4 批次 3 落地器 B3-1–B3-7 ↔ 主清单 A-19–A-24 ↔ 批次 3 验收项 B3-xx

批次 3 同样是**独立三件套**：操作手册 `implementation/deploy/batch3-ops.md`、验收
`implementation/deploy/batch3-acceptance.md`（B3-1 ~ B3-7）、回滚 `implementation/deploy/batch3-rollback.md`。

★ **但它的落地器形态和前两批完全不同，先读这一段再跑**：

`apply-batch3.mjs` **一个字节都不写**。它不改源码树、不写 `.bak`、不发布、不构建，
也不代做任何 SSH / docker / netsh / cloudflared / 画布操作 —— 它**只读本地文件系统**，
零网络请求、零进程、零写入。它做的三件事是：**前置校验 → 打印待执行清单 → 打印命令原文**。

原因：批次 3 的交付件不是「新代码」，而是「把已经存在的东西接起来」——
`canvas-agent` 已构建、`tools/omniroute-guard` 已存在、天宫漫剧的节点是**画布上的数据**。
真正的动作（起进程、开隧道、加防火墙规则、在画布上连节点）必须由你在自己机器上做。

**★ 所以批次 3 看到一堆 `TODO` 是常态，不是脚本没写完。**

| 落地器 | 落地后立刻可验的主清单项 | 对应批次 3 验收项 | 这一项是什么 |
| --- | --- | --- | --- |
| B3-1 | **A-19** | B3-1 | `canvas-agent` 对外可达 + 有鉴权（**★ 卡 `D-agent-auth`，未裁决则 BLOCK**） |
| B3-2 | A-20 | B3-2 | 起 `omniroute-guard`（20129），`GUARD_TOKEN` 必填 |
| B3-3 | A-20 | B3-3 | 20128 加防火墙规则限本机 + 双端自测 |
| B3-4 | A-21 | B3-4 | 天宫漫剧上/中/下三集**跑通流程** |
| B3-5 | A-22 | B3-5 | 事实分层四类标注落到节点上 |
| B3-6 | A-23 | B3-6 | 对账（依赖批次 1 的 `reconcile` 接口） |
| B3-7 | A-24 | B3-7 | 异常留痕（余额差异 / 兑换失败 / 紫域异常码） |

**命令**（注意：**没有 `--dry-run` 这一步的意义**，因为本脚本本来就不写盘；
`--dry-run` 只为参数兼容而保留）：

```bash
node E:/codex/huabu/implementation/scripts/apply-batch3.mjs \
  --source=E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas
```

| 参数 | 作用 |
| --- | --- |
| `--source=<路径>` | 权威源码树位置（不传则用脚本顶部默认值） |
| `--governance=<路径>` | 治理仓位置（不传则按脚本自身位置推断） |
| `--only=B3-2,B3-4` | 只检查点名的步骤 |
| `--ack-agent-auth` | **声明 `D-agent-auth` 已裁决**，把 B3-1 从 `BLOCK` 降为 `TODO` |
| `--strict` | 把 `BLOCK` 也算作失败（退出码 1） |

★ **`--ack-agent-auth` 的含义是「决策已定」，不是「跳过鉴权」。**
加了这个参数只是让脚本不再拦你，鉴权该怎么做仍然要照 `batch3-ops.md` §4.2 执行。

| 退出码 | 含义 | 你该做什么 |
| --- | --- | --- |
| `0` | 前置校验全过（**可能仍有 `TODO` / `BLOCK`**） | 照 `batch3-acceptance.md` 逐条打勾 |
| `1` | 有 `FAIL`（文件缺失 / Node 版本低 / 危险路由对不上）；`--strict` 时 `BLOCK` 也算 | 按提示修好再重跑，**重跑安全**（脚本只读） |
| `2` | 路径或前置不满足（找不到源码树 / 批次 1 还没落地） | **先跑批次 1 落地器**，再回来 |

★ 两点口径，别搞混：

1. **`B3-1` 的 `BLOCK` 不影响退出码**，但它是**硬阻塞** —— 不要带着它往下做。
   `D-agent-auth` 未裁决前 `A-19` 不许开始（见 `docs/DECISIONS.md` D4 L60 / L68、
   `ACCEPTANCE.md` 附录 A L568-570）。
2. **`B3-5` 若要改前端代码，批次 3 就不再是「不改源码树」的批次** —— 停下来先回报，拆独立批次。
   脚本会把这句话打进提示区。

★ 另外：`apply-batch3.mjs` 的 V3 校验会**拦住批次 1 未落地的情况**（找不到 `canvas-api/routes-credits.js` 就 `exit 2`），
因为 B3-6 的对账接口由批次 1 提供。顺序是**先批次 1，再批次 3**。


---

## 5. FAIL 了怎么办（回退与重试）

### 5.1 先别慌：FAIL 不等于改坏

落地器**全部成功才写盘**。出现 `FAIL` 时磁盘上什么都没变（`--dry-run` 也一样）。
失败信息长这样：

```
S5    FAIL    scripts/deploy/publish.sh · 找不到 /api/ 之前的注释锚点
```

### 5.2 三个动作，按顺序

1. **看清楚是哪个文件、哪个锚点**。FAIL 那一行的 `·` 后面就是原因。
2. **去权威树看一眼那个文件**，多半是上游被人改过、注释文案变了、或文件是旧版本。
3. **修好锚点或把文件恢复到脚本预期的版本**，然后**原样重跑**（脚本幂等，重跑安全）。

如果只是某一处出问题、你又想先落地别的：用 `--only=` 跳过它，但**别把 `FAIL` 当 `SKIP` 混过去**。

### 5.3 已经写盘了、但想撤销

三种粒度，从细到粗：

| 粒度 | 怎么做 | 适用 |
| --- | --- | --- |
| 单个文件 | 把 `<文件>.bak-YYYYMMDD` 覆盖回原文件 | 只想退一处 |
| 整批源码 | 在权威树 `git checkout -- <文件列表>` 或 `git stash` | 今天这次改动整体不要了 |
| 上线后 | 走 `implementation/deploy/ROLLBACK.md` 的 **R-00 ~ R-03**；批次 2 另见 `implementation/deploy/batch2-rollback.md` | 已经发布出去了 |

★ 注意两个坑：

- `.bak-YYYYMMDD` **只保留第一次**。同一天跑第二次不会刷新备份 —— 想回到「最初状态」用 `git`，别用备份。
- **S1 的 4 个新模块没有备份**（它们本来不存在）。要退就把它们删掉，同时把 `publish.sh` /
  `Dockerfile.api` 里的引用一起退（否则打包会报找不到文件）。

更完整的回退剧本（含数据库、发布、环境变量三类）见 `implementation/deploy/ROLLBACK.md`；
批次 2 的回退剧本单独成文，见 `implementation/deploy/batch2-rollback.md`（含「撤门禁容易、加回门禁难」的方向性风险）。

---

## 6. 为什么 S6 / S7 只提示、不代做

这不是偷懒，是**权限边界**：落地器只在本地文件系统上改文件，**它没有 SSH、没有服务器凭据**。

| 步骤 | 脚本做了什么 | 你必须自己在服务器上做什么 |
| --- | --- | --- |
| **S6** | 打印 `api.env` 还缺哪两个变量 | 在 `/opt/infinite-canvas/api/api.env` 写 `LDXP_REDEEM_SECRET`（`openssl rand -hex 32`）与可选的 `FREE_TRIAL_MONTHLY_LIMIT`（默认 3） |
| **S7** | 把 `/ziyu/` 块插进 `nginx-docker.conf` | 上传后 `docker compose exec -T web nginx -t && docker compose exec -T web nginx -s reload` |

★ **改完 `api.env` 必须重建容器**：`cd /opt/infinite-canvas && docker compose up -d --force-recreate api`。
不重建会出现「改了还是旧的」，而且日志里看不出来。

★ `LDXP_REDEEM_SECRET` 少于 32 字符会直接抛 `LDXP_PAYMENT_CHANNEL_UNAVAILABLE` —— **这是故意的**，
防止弱密钥上线。`ZIYU_API_BASE` / `ZIYU_API_KEY` 不用你手写，发布脚本会自动写进 `api.env`。

---

## 7. 落地之后的顺序（别跳）

1. 跑完落地器，确认末尾是「已写盘 N 处」（或重跑时的「无需改动」）。
2. 在权威树里**先自查**：`git diff --stat` 看改动范围是否符合预期（应为 6 个既有文件 + 4 个新文件）。
3. **服务器补 `api.env`**（S6）：`LDXP_REDEEM_SECRET` 必填，`FREE_TRIAL_MONTHLY_LIMIT` 可选。
4. **带 Key 发布**：

   ```bash
   CANVAS_ZIYU_API_KEY=<你的紫域 Key> bash scripts/deploy/publish.sh
   ```

   发布脚本会把 Key 写进服务器 `api.env`（**只进服务器**），并把 `nginx` 里的 `__ZIYU_KEY__` 占位符替换掉。
   **Key 为空时脚本会硬失败退出**，不会把带占位符的配置发上去 —— 这是刻意的守卫。

   ★ **Key 只存在于服务器 `/opt/infinite-canvas/api/api.env`**，绝不进仓库、前端、渠道模板。
   渠道模板里的 `apiKey` 是占位串 `ziyu-proxy`（空值会触发前端的 `apiKeyRequired` 报错），真实 Key 由 nginx
   `proxy_set_header Authorization` 在服务端注入并覆盖浏览器同名头。

5. **reload nginx**（S7 的提示）。
6. **重建 api 容器**（`docker compose up -d --force-recreate api`）。
7. 走 `implementation/deploy/ACCEPTANCE.md` 的 **A-00 ~ A-12**，逐条留证据。

★ 顺序风险（APPLY.md §1.2，必须原样保留）：**A-06 之前必须先补一次 L2 真实浏览器冒烟**。
否则可能出现「能收钱但点不动」。

---

## 8. 本文件的状态与未验证声明

- 本文件**只描述怎么落地**，没有改过权威源码树、没有构建、没有发布。
- 本文件不含任何真实密钥、令牌、站点密码、`AUTH_COOKIE`。
- 落地器 `apply-batch1.mjs` 已在**假源树**（从权威树拷出的 6 个文件的副本）上**真实执行并逐行核对产物**：
  8 步全绿、换行制式正确（`canvas-api/*` 与 `web/**/*.ts` 保 CRLF，`nginx-docker.conf` 与 `publish.sh` 保 LF）、
  备份齐全、跨模块导出契约对得上。`--dry-run`、`--only=S3,S5`、幂等复跑三种用法也已实测。
- ★ **但它从未对真实权威树真正写盘过**。2026-09-13 已对真实权威树做**零写入干跑**（读真文件、写内存覆盖层）：S1–S8 全绿、锚点逐条命中、权威树跑前跑后字节数一致，证据见 `docs/VERIFICATION_20260913_APPLY_DRYRUN.md`。
- 第一次真跑前，请先按 §2.1 跑 `--dry-run` 并把输出读完。
- 批次 2 的落地器 `apply-batch2.mjs` **同样只在假源树上实测过、从未真正写盘**（2026-09-13 已对真实权威树零写入干跑：B1–B7 全绿，产物 272 行、换行制式正确，见 `docs/VERIFICATION_20260913_APPLY_DRYRUN.md`）；
  它的验收手册是 `implementation/deploy/batch2-acceptance.md`（B2-1 ~ B2-7），回退手册是
  `implementation/deploy/batch2-rollback.md`。两份都是**设计稿，无一项在真机执行过**。
- 落地后的一切「是否真的能收钱」，以 `implementation/deploy/ACCEPTANCE.md` 的真机验收为准 ——
  本仓没有服务器、没有浏览器、没有 SSH，**任何真机结论都不能由本文件代替**。
- 批次 3 的落地器 `apply-batch3.mjs` **形态与前两批不同：它一个字节都不写**（详见 §4.4）。
  它的语法与行为已在治理仓内**受控试跑核对过**（用受控编译环境注入假的文件系统探测，走通 V1–V9 与 B3-1 ~ B3-7 全部输出分支）：
  试跑发现并修掉了一处**真实缺陷** —— 第 174 行提示字符串里的引号漏转义，会导致脚本**直接语法报错、跑不起来**。
  ★ 2026-09-13 已对**真实权威树**零写入干跑：V1–V9 全 PASS、B3-1 仍为 BLOCK、零写入，见 `docs/VERIFICATION_20260913_APPLY_DRYRUN.md`。
  ★ 但它**从未在你自己的终端里真跑过**（本环境无 shell、无法执行子进程）。第一次真跑请把输出读完。
- 批次 3 的三份手册（`batch3-ops.md` / `batch3-acceptance.md` / `batch3-rollback.md`）与落地器一样，
  **全部是设计稿，没有一项在真机执行过**。批次 3 的动作（起守卫、开隧道、加防火墙规则、画布连节点）
  **一件都还没发生**。


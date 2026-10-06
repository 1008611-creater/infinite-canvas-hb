# 无限画布 · 回滚手册（三批次）

> 文件：`implementation/deploy/ROLLBACK.md`
> 状态：**设计稿 + 操作清单**。本文件描述的步骤**尚未在真实服务器执行过任何一次**（本会话无 shell、无浏览器、无 SSH）。
> 所有"已验证"标注均指**对权威源码逐行核对**，不等于"已在线上试过"。
> 关联：`ACCEPTANCE.md`（验收编号 A-xx 与本文件 R-xx 一一对应）、`APPLY.md`（接线清单）。
> 规则来源：`E:\codex\huabu\AGENTS.md` §4 发布与部署、§5 服务器数据。

---

## 0. 一句话原则

**回滚不是"撤销代码"，回滚是"把线上指针指回上一个已知可用的整包"。**

因此：

- 前端 / 静态资源 / nginx 配置 —— 可秒级回滚（换软链 + reload）。
- 后端 API 镜像 —— 可回滚（换软链 + 重建容器），但**镜像里的迁移代码可能已经改过数据库**。
- **数据库表与数据 —— 不可秒级回滚**，必须单独确认，见 §2。
- **三个数据卷 —— 永远不参与回滚**，见 §3。

---

## 1. 通用回滚动作（R-00）

### 1.1 看当前跑的是哪个版本

```bash
# 服务器上
readlink /opt/infinite-canvas/current
cat /opt/infinite-canvas/current/dist/BUILD_INFO.txt
ls -1dt /opt/infinite-canvas/releases/canvas-* | head -10
```

`deploy.sh` 第 139 行每次发布结束都会打印当前版本，第 136-137 行会**只保留最近 5 个** release
（`KEEP_RELEASES`，默认 5）。**所以回滚窗口是最近 5 个版本**，更早的包已经被删掉，
需要重新发布一次旧 commit 才能回去。

### 1.2 回滚到上一个版本

```bash
# 1) 确认目标版本目录真的存在且完整
ls -1 /opt/infinite-canvas/releases/canvas-<目标版本>/dist/index.html

# 2) 切软链 —— ★ 必须用「相对路径」★
cd /opt/infinite-canvas
ln -sfn releases/canvas-<目标版本> current

# 3) 让 nginx 重新读取
docker compose -f /opt/infinite-canvas/docker-compose.yml --project-directory /opt/infinite-canvas exec -T web nginx -t
docker compose -f /opt/infinite-canvas/docker-compose.yml --project-directory /opt/infinite-canvas exec -T web nginx -s reload
```

**为什么必须相对**：`deploy.sh` 第 45-46 行的注释写得很直白 —— `current` 会被挂进
nginx 容器，路径变成 `/usr/share/nginx/canvas/current`。写成绝对路径的话容器里解析不到
`/opt/infinite-canvas`，root 目录不存在，**所有请求 500**。
`ln -sfn` 写绝对路径不会报错，只会安静地把站点打死。

**为什么是 reload 不是重启**：nginx 配置与静态资源是**挂目录**生效的
（`AGENTS.md` §4「挂目录，不挂单个文件」）。`docker compose up -d` 对已经存在的容器
不会重新解析软链，表现为"回滚命令全绿、线上还是新版"。

### 1.3 回滚后必须做的两件事

1. 版本自愈校验：`curl -sS -H "Cookie: canvas_auth=\$AUTH_COOKIE" http://127.0.0.1:18085/BUILD_INFO.txt`
   —— 期望看到目标版本的 `release=` 行。不带 cookie 会 302 到登录页，拿到空内容，
   容易误判成"版本读不到"（`deploy.sh` 第 107-113 行踩过这个坑）。
2. 在 `ACCEPTANCE.md` 的对应条目上**记一笔**：回滚时间、回滚原因、回滚到的版本号。
   不回填的话，下一轮审计会把"设计稿"当成"已上线"。

---

## 2. ★ 数据库回滚 —— 必须单独确认，默认不做 ★

### 2.1 本批次新增的 6 张表

来源：`implementation/canvas-api/schema-credits.sql`（154 行，全部 `IF NOT EXISTS`）。

| 表 | 存什么 | 丢了会怎样 |
|---|---|---|
| `user_credits` | 每个用户的余额 | **用户的钱**，不可再生 |
| `credit_ledger` | 额度流水（预扣/结算/退款/兑换/管理调整） | 对账依据，不可再生 |
| `credit_redemptions` | 兑换记录（**只存码的 SHA256**） | 无法判断某码是否已用 → 重复到账风险 |
| `channel_usage` | 渠道用量（含紫域 job id / cost / 结果 URL / 本地 media key） | 与紫域对账的唯一凭据 |
| `free_trial_usage` | 免费试拍次数（按 `YYYY-MM` 计） | 用户可重置免费额度 |
| `credit_adjustments` | 管理员人工调整记录 | 审计线索丢失 |

**结论：这 6 张表属于"不可再生数据"，与 `/opt/canvas-postgres` 同级对待。**

### 2.2 代码回滚时，表怎么办

**默认动作：不回滚表结构。**

理由：

- `schema.sql` / `schema-credits.sql` 全部是 `CREATE TABLE IF NOT EXISTS`，
  旧版代码在"表存在但没人写"的情况下**完全正常运行**——旧代码根本不知道这些表的存在。
- 反过来，`DROP TABLE` 是**单向**的：如果回滚后发现问题想再切回新版，
  余额和流水已经没了，用户的钱没法凭空恢复。

**所以：回滚代码 ≠ 回滚表。表留着，代码退回去。**

### 2.3 什么情况下才需要动表（且必须单独确认）

只有下面三种，**每一种都要先停下来问人，不要自己执行**：

| 场景 | 建议动作 | 为什么不能自动做 |
|---|---|---|
| 新表写入了脏数据，污染了业务 | 先 `SELECT` 看清范围，再逐条 `UPDATE`/`DELETE` | `DELETE` 掉的是流水，等于抹掉账 |
| 表结构本身设计错了（字段类型/约束不对） | 加新列或新表，**不要 `DROP` 旧表** | 已有数据要能迁移过去 |
| 需要彻底放弃这套计费（用户改主意了） | 先 `pg_dump` 全量备份，再决定 | 备份没做之前，任何 `DROP` 都不可逆 |

**操作前硬性要求**（`AGENTS.md` §5）：

```bash
# 先备份，再动任何东西
docker compose -f /opt/infinite-canvas/docker-compose.yml --project-directory /opt/infinite-canvas \
  exec -T postgres pg_dump -U canvas canvas > /root/canvas-backup-\$(date -u +%Y%m%d%H%M%S).sql
```

> ⚠️ 上面这条命令**未在真实环境执行过**（本会话无 shell）。容器名 `postgres` 与用户名
> `canvas` 来自 `deploy/docker-compose.yml` 与 `canvas-api/db.js` L15 的默认
> `postgres://canvas:<PASSWORD>@localhost:5432/canvas`，**上线前请先用
> `docker compose ps` 核对容器名**。

---

## 3. ★ 三个不可再生数据卷 —— 不参与回滚 ★

`AGENTS.md` §5 明令，任何清理、迁移、重置前必须单独确认：

| 路径 | 内容 | 回滚影响 |
|---|---|---|
| `/opt/canvas-webdav` | 用户云同步数据 | 回滚**不碰**它。回滚代码不影响这里 |
| `/opt/canvas-api-media` | 媒体库（含紫域结果落盘） | 回滚**不碰**它。**紫域结果 URL 24 小时后清理，落盘副本是唯一留存** |
| `/opt/canvas-postgres` | 账号与项目数据（含 §2 的 6 张新表） | 回滚**不碰**它 |

**特别提醒**：批次 1 的"结果立即落盘"逻辑（`implementation/canvas-api/ziyu.js`
`persistRemoteMedia()`）写的就是 `/opt/canvas-api-media`。如果回滚时顺手把这个卷清了，
用户会**永久失去**已经出好的片子——因为上游 24 小时后已经删了。

---

## 4. 三批次各自的回滚范围

### 4.1 批次 1（收得到钱）· R-01

| 改动 | 回滚方式 | 风险 |
|---|---|---|
| `canvas-api` 新增 5 个文件 + 接入 server.js | 换软链回上一个 release，**重建 api 容器** | 低。表保留（§2.2） |
| nginx 新增 `/ziyu/` 块 | 换软链 + `nginx -s reload` | 低 |
| `publish.sh` sed 增加 `__ZIYU_KEY__` | 换软链（脚本本身不参与线上运行） | 低 |
| 前端渠道模板加紫域 | 换软链 + reload | 低 |
| 新增 6 张表 | **不回滚**（§2.2） | —— |
| 服务器 `.env` 新增 `ZIYU_API_KEY` 等 | **不回滚**（留着不影响旧代码） | 低 |

**重建 api 容器这条不能省**：后端代码是 `publish.sh` 第 274-278 行 `upload_lf` 直接
覆盖到 `/opt/infinite-canvas/api/` 的，而 `api` 容器的构建上下文就是这个目录
（`deploy/Dockerfile.api` 注释第 2 行）。**光换软链不会让 api 容器回到旧代码**——
这一点与前端不同，容易漏。

```bash
# 批次 1 回滚：先换软链，再重建 api
cd /opt/infinite-canvas && ln -sfn releases/canvas-<目标版本> current
docker compose -f /opt/infinite-canvas/docker-compose.yml --project-directory /opt/infinite-canvas up -d --force-recreate api
docker compose -f /opt/infinite-canvas/docker-compose.yml --project-directory /opt/infinite-canvas exec -T web nginx -s reload
```

> ⚠️ `api` 服务名来自 `deploy/docker-compose.yml`，**未实测**。执行前先 `docker compose config --services` 核对。
> ⚠️ 更麻烦的一点：`upload_lf` 是**直接覆盖** `/opt/infinite-canvas/api/` 下的文件的，
> 不是软链。也就是说**回滚前端软链不会把 api 源码还原**。要真正回到旧 api 代码，
> 得重新发布一次旧 commit（`publish.sh` 会用旧源码覆盖回去）。
> **这是本批次回滚方案里唯一一个"不干净"的地方，必须如实告诉用户。**

### 4.2 批次 2（放得开）· R-02

批次 2 的核心是**改 nginx 门禁**，回滚面最小也最干净：

| 改动 | 回滚方式 |
|---|---|
| 撤掉 `/`、`/assets/`、`/config.js`、`/agnes/` 四处 `if ($canvas_authed = 0)` | 重新粘回这 4 段，`nginx -s reload` |
| ~~`/dav/` 改为管理员专用~~ **已移出批次 2（Q-10）** | 本阶段不改动 `/dav/`，无回滚面 |
| `CANVAS_ALLOW_REGISTER=0` | **设为 `0`**（2026-09-13 实测线上是**开**的，没有可回退的旧值），**重建 api 容器** |
| 免费试拍限次上线 | 属批次 1 的代码，回滚见 R-01 |

**★ `AUTH_COOKIE` 在任何回滚里都不许动**（`AGENTS.md` §2）：
它是"已登录"的凭证，换一次 = **所有用户被迫重新登录**。
`CANVAS_LEGACY_TOKEN` 与它同值，必须同步保持。

**★ 改 `.env` 必须重建容器**（`AGENTS.md` §2）：

```bash
# 改了 api.env / .env 之后
docker compose -f /opt/infinite-canvas/docker-compose.yml --project-directory /opt/infinite-canvas up -d --force-recreate api
```

不重建的话会出现"密码改了还是旧的"，**而且日志里看不出来**——这是已经踩过的坑。

**★ 撤门禁的回滚有个方向性风险**：撤门禁是"从紧到松"，回滚是"从松到紧"。
如果撤门禁期间**已经有陌生人在用**（批次 2 的目标就是让陌生人能用），
那么回滚会把**正在用的用户**一起挡在门外。这是产品决策，不是技术故障，
回滚前要想清楚。相关决策项：`D-batch2-ziyu-gate`。

> ★ **B-6 订正（2026-09-13 线上实测）**：门禁 cookie 由服务端在注册/登录成功时自动下发
> （`canvas-api/auth.js` `setSitePassCookie()` 写 `canvas_auth`），而 `/api/` 刻意不吃门禁。
> ⇒ **注册接口敞开的期间，门禁本来就是可自助绕过的**；撤门禁增加的真正风险是**额度**（`/ziyu/` 被刷钱），
> 不是「入口」。回滚加回门禁时被挡住的，是**从未注册/登录成功过**的访客。
> 完整证据链见 `implementation/deploy/batch2-acceptance.md` §0.1 与 `docs/STATUS_20260913_LIVE_GATE.md`。

### 4.3 批次 3（跑得顺）· R-03

| 改动 | 回滚方式 | 风险 |
|---|---|---|
| `canvas-agent` 对外暴露（守卫反代 + 具名隧道） | 停掉隧道 / 撤掉反代规则 | 低，与画布主站解耦 |
| LLM 中转切到 20129 + 具名隧道 | 前端渠道 baseUrl 改回 `http://127.0.0.1:20128` | 低，**但要先把防火墙规则撤了**，否则本机也连不上 |
| 天宫漫剧三集流程 | 画布上的节点是数据，不是代码 | **回滚代码不影响画布内容** |
| 事实分层节点规范 | 同上 | —— |
| 对账看板 | 属批次 1 的 `/api/admin/credits/*`，回滚见 R-01 | —— |

**批次 3 的回滚特点：几乎全是"外部连接"而不是"线上代码"**，
所以回滚基本等于"关掉某个开关"。但有一个例外：

> ⚠️ **quick tunnel 保持关闭**（`docs/DECISIONS.md` D3）。
> 回滚 LLM 中转时**不要**为了图快临时开 quick tunnel —— 那是一个无鉴权的公网入口。

---

## 5. 回滚决策表（"出事了先看这张表"）

| 现象 | 大概率原因 | 回滚动作 | 编号 |
|---|---|---|---|
| 站点全站 500 | `current` 被写成绝对软链 | `ln -sfn releases/<版本> current` | R-00 |
| 回滚命令全绿但线上还是新版 | 只换了软链没 reload / 没重建容器 | `nginx -s reload`；api 走 `--force-recreate` | R-00 / R-01 |
| 紫域接口全 401 | `__ZIYU_KEY__` 占位符没被替换 | 检查 `publish.sh` sed 三处（见 `ziyu-nginx.conf.snippet` 第三节） | R-01 |
| 改了密码但登录还是旧的 | `.env` 改了没重建容器 | `up -d --force-recreate` | R-02 |
| 用户被集体登出 | `AUTH_COOKIE` 被换了 | **不可逆**，只能重新告知用户登录 | R-02 |
| 用户说"我的片子不见了" | 紫域 24h 清理 + 没落盘 | 查 `/opt/canvas-api-media`；**不要清这个卷** | §3 |
| 兑换码重复到账 | `credit_redemptions` 的 `ON CONFLICT` 没生效 | 查表 + 查 `credit_ledger`，**不要删表** | §2.3 |
| 余额对不上 | 紫域 `cost` 与本地扣减不一致 | 走 `/api/admin/credits/reconcile`，**先只读** | §2.3 |

---

## 6. 未验证声明（诚实边界）

- 本文件所有 `docker compose` / `ln -sfn` / `curl` 命令**均未在真实服务器执行过**。
  本会话无 shell、无 SSH、无浏览器（`cua.getState()` 返回 `Codex auth token is unavailable`）。
- 容器名 `api` / `web` / `postgres` 来自 `deploy/docker-compose.yml` 的**静态阅读**，
  未用 `docker compose config --services` 核对过。
- `KEEP_RELEASES=5` 来自 `deploy.sh` L20 默认值，**服务器上是否被环境变量覆盖未核实**。
- §4.1 里"api 源码是直接覆盖、不在软链里"这一条是从 `publish.sh` L274-278 `upload_lf`
  与 `Dockerfile.api` 注释推出来的，**未实测验证**。这是本文件里**最需要真人确认的一条**。
- 回滚演练**从未做过**。建议：批次 1 上线后一周内，在低峰期做一次"发一个无功能变更的版本、
  再回滚回去"的演练，把 §6 里这些"未验证"变成"已验证"。

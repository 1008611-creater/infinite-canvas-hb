# 无限画布 · 批次 2「放得开」回滚手册（R-02 展开）

> 文件：`implementation/deploy/batch2-rollback.md`
> 状态：**设计稿 + 操作清单**。本文件描述的步骤**尚未在真实服务器执行过任何一次**（本会话无 shell、无浏览器、无 SSH）。
> 父文件：`implementation/deploy/ROLLBACK.md` 的 **§4.2 批次 2（L175-202）**；本文件是它的可执行展开。
> 配套：验收 `implementation/deploy/batch2-acceptance.md`（B2-1 ~ B2-7）、片段说明 `batch2-nginx.conf.snippet`。
> 规则来源：`E:\codex\huabu\AGENTS.md` §2 门禁与令牌、§4 发布与部署、§5 服务器数据。

---

## 0. 一句话

**批次 2 的回滚面是全三批里最小、最干净的** —— 它只改了一处 nginx 配置和前端一个常量。
但它有**一个别的批次没有的方向性风险**：撤门禁是「从紧到松」，回滚是「从松到紧」，
**回滚会把正在用的陌生用户一起挡在门外**。这是产品决策，不是技术故障（详见 §4）。

> ⚠️ **B-6（2026-09-13 线上实测，本文件的前提之一）**：门禁 cookie 不是「只有管理员能拿到」——
> 服务端在注册/登录成功时会自动下发 `canvas_auth`（`canvas-api/auth.js` `setSitePassCookie()`），
> 而 `/api/` 刻意不吃 cookie 门禁。**注册接口敞开的期间，门禁本来就是可自助绕过的。**
> 所以本文件里「回滚会把用户挡在门外」的严重性要打折：真正要防的是**额度**，不是门禁。
> 完整证据链与次生风险见 `batch2-acceptance.md` §0.1。

---

## 1. 本批次到底改了什么（回滚面清单）

| 改动 | 位置 | 回滚方式 | 风险 |
| --- | --- | --- | --- |
| 撤掉 `/`、`/assets/`、`/config.js`、`/agnes/` 四处 `if ($canvas_authed = 0)` | 源码树 `deploy/nginx-docker.conf` | 把这 4 段粘回去，重新发布 + `nginx -s reload` | 低（配置层） |
| 插入免费试拍限次片段（`location = /agnes/v1/videos` + `auth_request` + 两个具名 location） | 同上 | 删掉该片段，重新发布 + reload | 低，但**删掉 = `/agnes/v1/videos` 变公开**，见 §4 |
| 前端默认渠道 `OPENAI_BASE_URL` 清空 | 源码树 `web/src/stores/use-config-store.ts` | 换软链回上一个 release，或改回原常量再发布 | 低 |
| ~~`/dav/` 改为管理员专用~~ | —— | **已移出批次 2**（用户裁定 Q-10，`docs/DECISIONS.md` D10.2） | 无回滚面 |
| 公开注册开关 `ALLOW_REGISTER` | 服务器 `/opt/infinite-canvas/api/api.env` | **设为 `0`**（线上实测当前为**开**，不是「改回原值」），改完**必须重建 api 容器** | 低，但见 §3.1 / §4 |

**本批次不涉及**：新增后端文件、数据库表、`.env` 里的密钥类变量。
所以**没有**「漏改 `publish.sh` 打包列表」「漏改 `Dockerfile.api` COPY」「漏重建容器」这三类批次 1 的坑。

> ⚠️ 唯一例外：如果你为了调免费试拍次数**同时改了** `api.env` 的 `FREE_TRIAL_MONTHLY_LIMIT`，
> 那就回到「**改 `.env` 必须重建容器**」这条铁律，见 §3.2。

---

## 2. 步骤一 · 把四处门禁加回去（主回滚动作）

### 2.1 ★ 必须改源码树，不能只在服务器手改

`nginx-docker.conf` 是**发布时被 `sed` 替换占位符后覆盖到容器**的。
如果你只在服务器上改 `/etc/nginx/conf.d/default.conf`：

1. 下次发布**会把它盖掉**，而且没人会记得；
2. 源码树与线上不一致，下一个接手的人会按源码树理解线上行为，**判断全错**。

所以正确做法是：**在源码树改 → 重新发布**。

### 2.2 要粘回的原文（逐字，含首尾大括号）

四处门禁的原文与删除位置，**逐字抄录在** `implementation/deploy/batch2-nginx.conf.snippet` **第一节（L24-77）**。
那里同时写明了「哪些东西明确不动」（`map $http_cookie $canvas_authed`、`/login.html`、`/agnes/auth`、`/ziyu/` 块、`/dav/`、`/show/`、`/api/`）。

**回滚 = 把该文件第一节标着「← 删这 3 行」的那 4 段 `if` 块粘回对应 location**。

| 位置 | 要粘回的原文 |
| --- | --- |
| `location / {` 内，`try_files` 之前 | `if ($canvas_authed = 0) {` / `return 302 /login.html;` / `}` |
| `location /assets/ {` 内，`expires 30d;` 之前 | `if ($canvas_authed = 0) {` / `return 403;` / `}` |
| `location = /config.js {` 内，`add_header Cache-Control "no-store";` 之前 | `if ($canvas_authed = 0) {` / `return 403;` / `}` |
| `location /agnes/ {` 内，`proxy_set_header Authorization ...` 之前 | `if ($canvas_authed = 0) {` / `return 403;` / `}` |

> ★ **粘回时不要动 `map $http_cookie $canvas_authed`（文件头部 L12-15）** —— 它在批次 2 期间只剩 `/ziyu/` 一个使用者，
> 但从来没被删过；门禁加回来后它重新变成四处门禁的判据。删了它会让所有 `if` 直接报错（`nginx -t` 不过）。

### 2.3 免费试拍片段怎么办

**推荐保留，不要删。** 理由：

- 它是**独立于 cookie 门禁**的一层保护。门禁加回去之后，它对外部访客不再触发（`/agnes/` 已被 403 挡住），
  但对**已登录用户**仍然在限次 —— 而限次本来就该有（批次 1 的免费额度设计），不是批次 2 的临时措施。
- 删掉它需要**再发一次版**，而收益只是「少一段 nginx 配置」。

**只有在一种情况下才删**：这段片段本身导致 nginx 起不来（`nginx -t` 失败）或导致正常用户全部 401（snippet U2 未验证项成真）。
此时删除片段是**止血**，不是回滚策略。删完要同步更新 `batch2-nginx.conf.snippet` 的状态标注，避免下次发布又被插回去。

### 2.4 发布与 reload

```bash
# 1) 在权威源码树改完 deploy/nginx-docker.conf 之后，走一次完整发布
cd E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas
bash scripts/deploy/publish.sh

# 2) 服务器上：先测配置再 reload（不要跳过 nginx -t）
docker compose -f /opt/infinite-canvas/docker-compose.yml --project-directory /opt/infinite-canvas \
  exec -T web nginx -t
docker compose -f /opt/infinite-canvas/docker-compose.yml --project-directory /opt/infinite-canvas \
  exec -T web nginx -s reload

# 3) 确认门禁真的回来了：无 cookie 访问首页应当被 302 到 /login.html
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://hb.cauai.fun/
```

**期望**：第 3 步打出 `302 https://hb.cauai.fun/login.html`。打出 `200` 说明门禁没加回去。

> ⚠️ 服务名 `web` / 容器名 `canvas-web` 来自 `deploy/docker-compose.yml` 的**静态阅读**，**未在真实服务器执行过**。
> 执行前先 `docker compose config --services` 核对。

---

## 3. 步骤二 · 环境变量类回滚

### 3.1 ★ 公开注册开关（订正：线上实测是「开」的，回滚动作是**设成 0**）

> **实测证据（2026-09-13，匿名只读探测）**：`POST /api/auth/register` 用合法邮箱 + 1 位密码，
> 返回 **400 `password_too_short`** —— 说明请求已走到密码长度校验，**注册开关是开的**
> （关闭时应为 403 `registration_closed`）。探测**未创建任何账号**：`canvas-api/server.js` L109-129
> 的顺序是先判 `ALLOW_REGISTER` → 校验邮箱 → 校验密码长度 → 才 `createUser()`。
> 完整证据与次生风险（首个注册者会被提为管理员）见 `batch2-acceptance.md` §0.1。

```bash
# 服务器上：把 /opt/infinite-canvas/api/api.env 里的 ALLOW_REGISTER 设为 0
# 注意不是「改回原值」—— 线上当前就是开的，没有可回退的旧值。
# 然后必须重建 api 容器（见 3.2）。
```

**期望**：新邮箱注册返回 403 `registration_closed`（`canvas-api/server.js` L109-129）。
**这一条应排在批次 2 的最前面**，先于撤门禁执行：否则陌生人可以先注册（顺带拿到门禁 cookie），
之后再收口就只能靠人工清理用户表。

### 3.2 ★ 改 `.env` 必须重建容器

```bash
docker compose -f /opt/infinite-canvas/docker-compose.yml --project-directory /opt/infinite-canvas \
  up -d --force-recreate api
```

**不重建会出现「密码改了还是旧的」，而且日志里看不出来** —— 这是已经踩过的坑（`AGENTS.md` §2）。
本批次只有在同时改了 `api.env`（`ALLOW_REGISTER` / `FREE_TRIAL_MONTHLY_LIMIT`）时才需要这一步。

### 3.3 ★ `AUTH_COOKIE` 在任何回滚里都不许动

- 它是「已登录」的凭证，**换一次 = 所有用户被迫重新登录**（`AGENTS.md` §2）。
- `CANVAS_LEGACY_TOKEN` 与它**同值**，必须同步保持。
- 本批次的所有回滚动作**都不需要**碰这两个值。如果你发现自己的回滚步骤里要改它，说明走错路了。

---

## 4. ★ 方向性风险：回滚会把正在用的用户挡在门外

**这是批次 2 回滚与批次 1 回滚最大的不同。**

- **批次 1 回滚**：把计费层退掉。用户可能抱怨「怎么不能用了」，但不会有账号层面的断裂。
- **批次 2 回滚**：把门禁加回去。而批次 2 的**全部目的**就是让陌生人能打开画布并注册。

**后果**：撤门禁期间**已经注册并正在使用**的用户，回滚后会被 cookie 门禁挡住，
**而且他们没有站点密码**（批次 2 的注册用户从来不需要站点密码）—— 他们**根本进不来**，只能看到登录页。

> ★ **这是产品决策，不是技术故障。**
> 回滚前必须想清楚：是「宁可挡住在用用户，也要止血」还是「先修问题，不回滚」。
> 相关决策项：`ACCEPTANCE.md` 附录 `D-batch2-ziyu-gate`（L530-553）。

> ★ **B-6 让「挡人」的严重性打折（2026-09-13 实测）**：门禁 cookie 由服务端在注册/登录成功时自动下发
> （`canvas-api/auth.js` `setSitePassCookie()` 写 `canvas_auth`），且 `/api/` 刻意不吃门禁。
> 所以**注册接口敞开的期间，门禁本来就是可自助绕过的**：撤门禁增加的真正风险是**额度**（/ziyu/ 被刷钱），
> 不是「入口」。回滚加回门禁时，被挡住的恰恰是**从未注册/登录成功过**的访客。
> 详见 `batch2-acceptance.md` §0.1。

**如果确实要回滚但不想挡人**，有一个折中（**未验证**）：

- 只加回 `/agnes/` 那一处门禁（止血：挡住烧钱端点），**保留 `/`、`/assets/`、`/config.js` 三处开放**（新用户还能进来）。
- 代价：新用户进来后点出片会被 403，观感是「产品坏了」。需要前端配合给出提示。
- **这个折中从未验证过**，属于临时止血方案，不要当成正式回滚路径。

---

## 5. 逐项回滚对照表

| 现象 | 大概率原因 | 回滚动作 | 参考 |
| --- | --- | --- | --- |
| 撤门禁后陌生用户涌入、无法管控 | 预期行为（这就是批次 2 的目的） | 按 §4 决策是否加回门禁 | §2 / §4 |
| `/agnes/v1/videos` 被刷、烧上游额度 | 免费试拍限次片段没生效（snippet U1/U2 成真） | 先加回 `location /agnes/` 门禁（§2.2），再查片段 | §2.2 |
| 已登录用户也 401 | `proxy_set_header Cookie $http_cookie` 没带过去（U2） | 删掉免费试拍片段止血（§2.3），保留门禁 | §2.3 |
| nginx 起不来（`nginx -t` 失败） | 片段插入位置或具名 location 冲突 | 删掉片段，`nginx -t` 通过后 reload | §2.3 |
| 新用户注册后不是普通用户 | 首个注册者会被 `promoteToAdminIfFirst()`（`count(*) <= 1` → `role=admin`）提为管理员 —— 这是 **B-6 的次生风险**，不是顺序 bug | 先按 §3.1 把注册关掉，再查 `users` 表人工修正 role | §3.1 / B-6 |
| 改了注册开关但不生效 | `.env` 改了没重建容器 | `up -d --force-recreate api` | §3.2 |
| 老用户说「我的模型配置没了」 | 前端 `OPENAI_BASE_URL` 清空（B6） | 换软链回上一个 release；老用户已持久化的值不受影响 | §1 |

---

## 6. 未验证声明（诚实边界）

- 本文件所有 `docker compose` / `bash scripts/deploy/publish.sh` / `curl` 命令**均未在真实服务器执行过**。
  本会话无 shell、无 SSH、无浏览器（`cua.getState()` 返回 `Codex auth token is unavailable`）。
- 服务名 `web` / `api` / 容器名 `canvas-web` / `canvas-api` 来自 `deploy/docker-compose.yml` 的**静态阅读**，
  未用 `docker compose config --services` 核对过。
- §2.2 的四处门禁原文来自 `batch2-nginx.conf.snippet` 第一节的**逐字抄录**（该文件对权威树 `deploy/nginx-docker.conf` 的 165 行做过全文核对），
  但**未在真实 nginx 上验证过粘回去之后 `nginx -t` 是否通过**。
- §4 的「折中方案」（只加回 `/agnes/` 门禁）**从未验证过**，是临时止血思路，不是正式回滚路径。
- **回滚演练从未做过。** 建议：批次 2 上线后一周内，在低峰期做一次「发一个无功能变更的版本、再回滚回去」的演练，
  把本文件里的「未验证」变成「已验证」。

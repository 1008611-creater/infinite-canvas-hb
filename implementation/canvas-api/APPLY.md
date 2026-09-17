# 无限画布 · 批次 1 接线说明（APPLY.md）

> 文件：`implementation/canvas-api/APPLY.md`
> 状态：**设计稿 + 模块级验证已完成**。本文件逐条描述"把批次 1 的代码接进权威源码树"要改的每一处。
> **本文件没有改动任何权威源码，也没有发布任何东西。** 本仓（`E:\codex\huabu`）是治理仓，不改源码（`AGENTS.md` §0）。
> 关联：`ACCEPTANCE.md`（验收 A-xx）、`ROLLBACK.md`（回滚 R-xx）、`schema-credits.sql`、`ziyu-nginx.conf.snippet`、`../web/ziyu-channel-template.json`、`../scripts/generate-ldxp-credit-codes.mjs`

---

## 0. 一句话

把 4 个新模块（`credits.js` / `ldxp-redeem.js` / `ziyu.js` / `routes-credits.js`）
+ 1 段建表 SQL + 1 条 nginx 路由 + 1 条前端渠道模板，接进权威源码树
`E:\codex\niannianai\zhuanhuiyuangong\infinite-canvas`。

改动共 **13 处独立改动**（第 0 项已完成）。早期草稿把它写成"14 项"，是把第 0 项（模块制式）重复编号了一次；
本文件以 13 个独立改动为准，编号 0–12。

---

## 1. 落地前必须知道的三件事

### 1.1 ★ 模块制式：canvas-api 是 ESM ★

`canvas-api/package.json` 含 `"type": "module"`（已实测确认，见 §4 证据表）。
`server.js` / `db.js` / `auth.js` 全部用 `import`/`export`。

如果把这 4 个新模块按 CommonJS（`require` / `module.exports`）原样拷进去，Node 启动时会抛
`ERR_REQUIRE_ESM` 或 `ReferenceError: require is not defined`，**整个 `/api/` 挂掉 —— 登录、项目、素材、媒体全不可用**。
而发布脚本的指纹只做哈希比对、不解析语法，**发布日志可能全绿**（这类"日志全绿、线上跑旧版/坏版"的坑 `AGENTS.md` §4 已记过一次）。

→ 第 0 项已处理：四个模块在治理仓内已全部改写为 ESM，并做了真实加载验证（见 §4）。

### 1.2 ★ 顺序风险（必须原样保留）★

画布交互（L2）**已有部分真实浏览器证据，但不是全绿**（2026-09-13 订正，详见 `docs/STATUS_20260913_L2_EVIDENCE.md`）。
权威源码树 `.probe/` 下留有 2026-09-01 的 Playwright 真实浏览器会话，已覆盖拖拽、连线（含反向起拖）、
连线方向语义、`videoMode` 自动纠正、秒数按模型钳位；**残留三项：缩放 / 节点链真实执行 / 插件安装**。
本计划仍是在 L2 **未全绿**的前提下先建 L4 计费层，因此**"能收钱但点不动"的可能依然存在**，只是
范围收窄到上述三项。批次 1 上线前**必须**补一次真实浏览器冒烟并留存断言输出
（见 `ACCEPTANCE.md` 的 A-18 / A-25），否则等于给一台不工作的机器装上收款码。

### 1.3 密钥纪律（最容易被破坏的一条）

- 真实密钥、令牌、站点密码、`AUTH_COOKIE` 一律**不进本仓、不进前端、不进模板**，只存服务器 `.env`。
- 本文里凡涉及真实值的占位一律写成 `<redacted>` 或只写路径引用。
- 已知明文泄露点**只写路径、不复制原文**（`AGENTS.md` §3）：
  `预置_agnes视频通道_控制台脚本.js`、`画布验收清单.md`、`docs/deployment-server.md`、
  `scripts/deploy/publish.sh`（其站点密码默认值在 L167 一带）、两份 `agnes-video-proxy/.env`。
- 需要提站点密码时，只写"服务器 `/opt/agnes-video-proxy/.env` 里的 `SITE_PASSWORD`"。

---

## 2. 文件清单（治理仓 → 权威源码树）

| # | 治理仓（本仓） | 目标（权威源码树） | 落地方式 |
|---|---|---|---|
| 1 | `implementation/canvas-api/credits.js` | `canvas-api/credits.js` | 新增文件（第 0 项已完成 ESM 化） |
| 2 | `implementation/canvas-api/ldxp-redeem.js` | `canvas-api/ldxp-redeem.js` | 新增文件 |
| 3 | `implementation/canvas-api/ziyu.js` | `canvas-api/ziyu.js` | 新增文件 |
| 4 | `implementation/canvas-api/routes-credits.js` | `canvas-api/routes-credits.js` | 新增文件 |
| 5 | `implementation/canvas-api/schema-credits.sql` | **并入** `canvas-api/schema.sql` | 追加，不新增文件（见第 5 项） |
| 6 | `implementation/deploy/ziyu-nginx.conf.snippet` | `deploy/nginx-docker.conf` | 片段粘入（见第 11 项） |
| 7 | `implementation/web/ziyu-channel-template.json` | `web/src/stores/channel-templates.ts` | 转写为 TS 条目（见第 12 项） |
| 8 | `implementation/scripts/generate-ldxp-credit-codes.mjs` | 无需入库 | 运维脚本，本地跑，不进发布包 |

> 第 5 项为什么不新增文件：`canvas-api/db.js` 的 `migrate()` 只读 `schema.sql` 一个文件（L40-44），
> 不会自动发现新 SQL 文件。追加是最小改动路径。另一条路（改 `migrate()` + 改 `Dockerfile.api` COPY）见第 5 项末尾。

---


## 3. 逐条改动说明（第 0–12 项）

每项格式：**改哪个文件 → 锚点行 → 改成什么 → 漏改的后果**。
所有行号均为对权威源码树的**静态阅读**结果（未运行验证，见 §7）。

### 3.0 锚点逐行复核（2026-09-13，第 16–19 轮汇总）

下表 13 处锚点**全部第一手复核成立**（逐行读原文，非推测）。复核时同时记录了每个目标文件的**行数**与**换行符**——
因为权威树里 `canvas-api/*`、`schema.sql`、`package.json`、`Dockerfile.api`、`web/src/**/*.ts` 是 **CRLF**，
而 `deploy/nginx-docker.conf`、`scripts/deploy/publish.sh` 是 **LF**；落代码时**必须保持原制式**，整文件重写会把 CRLF 变成 LF，产生一整份"每行都改过"的假 diff。

| 项 | 文件 | 行数 / 换行 | 锚点复核结果 |
| --- | --- | --- | --- |
| 1 | `canvas-api/server.js` | 741 / CRLF | ✅ L17-26 为 import 区，**L26 = `import * as auth from "./auth.js";`** |
| 2 | `canvas-api/server.js` | 同上 | ✅ L52-55 为 CORS 头块，**L54 = `"Content-Type, Authorization, Content-Range, X-Upload-Offset",`** |
| 3 | `canvas-api/server.js` | 同上 | ✅ **L87 = `requireAuth` 收尾 `}`**，**L89 = `/api/auth/verify` 注释行** |
| 4 | `canvas-api/server.js` | 同上 | ✅ **L176 = `app.get("/api/auth/me", ...)`**，**L178 = `// ---- 通用 CRUD`**；`registerMedia` 确在 **L447**；`POST /api/media/import-url` 确在 **L485** |
| 5 | `canvas-api/schema.sql` | 116 / CRLF | ✅ **L115 = 最后一条 `CREATE INDEX ... idx_logs_domain`**，**L116 = 空行（文件末尾）** |
| 6 | `scripts/deploy/publish.sh` | 295 / LF | ✅ **L92 = `cp canvas-api/server.js ... "$STAGE/api/"`**（列表与文档一致，5 个文件） |
| 7 | `scripts/deploy/publish.sh` | 同上 | ✅ **L119 = `openssl dgst` 分支**，**L121 = `sha256sum` 分支**，两处 `cat` 列表完全相同 |
| 8 | `scripts/deploy/publish.sh` | 同上 | ✅ **L274-278 = 5 行 `upload_lf canvas-api/*`**；**L215 = `API_ENV_FILE="${APP_ROOT}/api/api.env"`** |
| 9 | `deploy/Dockerfile.api` | 26 / CRLF | ✅ **L16 = `COPY server.js db.js auth.js schema.sql ./`** |
| 10 | `scripts/deploy/publish.sh` | 同上 | ✅ **L237-240** 原地回写块：**L238 = sed 两个 `-e`**，**L240 = 守卫 `grep -c '__AGNES_TOKEN__\|__AUTH_COOKIE__'`** |
| 11 | `deploy/nginx-docker.conf` | 165 / LF | ✅ **L99 = `/agnes/` 块收尾 `}`**，**L101 = `# 画布服务端 API（账号 / 项目 / 素材 / 媒体文件）。`**；`publish.sh` **L155** 确为该 conf 的 `upload_lf` |
| 12 | `web/src/stores/channel-templates.ts` | 77 / CRLF | ✅ **L9-20 = `ChannelTemplate` 类型（实测 7 字段）**，**L22-63 = 数组（3 条）**，**L65-76 = `createChannelFromTemplate()`**，**L70 = `apiKey: ""`** |

**第 12 项的旁证也已复核**：`web/src/stores/use-config-store.ts` **L16** = `script?: string;`（`ChannelModel` 内）；
**L282-285** = `isAiConfigReady()`，要求 `channel.apiKey.trim()` 非空；
`web/src/services/api/video.ts` **L84-85**（`createPluginVideoTask`）与 **L193-194**（`assertVideoConfig`）均为 `if (!config.apiKey.trim()) throw`。

> 复核方式：直接读权威源码树原文并逐行打印，**未运行、未修改**。行号若与本文后续描述不符，**以本表为准**（本表是最近一次复核）。

---

### 第 0 项 · 四个新模块已 ESM 化（治理仓内已完成，非"待改"）

**改哪个文件**：治理仓的 `credits.js` / `ldxp-redeem.js` / `ziyu.js` / `routes-credits.js`。

**事实依据**：

- `canvas-api/package.json` **L5** 是 `"type": "module"`（已复核）。
- `canvas-api/server.js` **L17-26** 全部使用 `import`（已复核）。

**现状**：四个模块在治理仓内**已全部改写为 ESM**（`import { getPool, query } from './db.js'`、`export { ... }`），
并在桩环境真实加载成功（4/4，见 §4 证据 E-01）。

**漏改的后果**：Node 启动时抛 `ERR_REQUIRE_ESM` 或 `ReferenceError: require is not defined`，
**整个 `/api/` 挂掉 —— 登录、项目、素材、媒体全不可用**。
而发布脚本的指纹只做哈希比对、不解析语法，**发布日志可能全绿**（AGENTS.md §4 记过同类事故）。

> 本项不是"要不要改"的选项，是其余 12 项的前置条件。

---

### 第 1 项 · `server.js` 加 import

**改哪个文件**：`canvas-api/server.js`

**锚点**：L17-26 是 import 区，末行 L26 为 `import * as auth from "./auth.js";`。
新增一行插在 **L26 之后**。

**改成什么**：

```js
import { mountCreditRoutes } from "./routes-credits.js";
```

**漏改的后果**：第 4 项调用处抛 `ReferenceError: mountCreditRoutes is not defined`，API 进程启动即崩。

---

### 第 2 项 · `server.js` CORS 头加 `Idempotency-Key`

**改哪个文件**：`canvas-api/server.js`

**锚点**：L52-55，现值为

```js
"Content-Type, Authorization, Content-Range, X-Upload-Offset",
```

**改成什么**：末尾追加 `, Idempotency-Key`（即 L54 变成五个头）。

**为什么**：紫域 `POST /api/v1/jobs` **必须带 `Idempotency-Key`**（官方要求，缺了会重复扣额度）。
浏览器跨域时，非简单头会触发预检，白名单里没有这个头就会被拦。

**漏改的后果**：当前同域部署（`hb.cauai.fun` 前端 + `/ziyu/` 反代）下**大概率无感**；
一旦前后端不同源，紫域提交被 CORS 预检拒绝，表现为"点了生成没反应"。

---

### 第 3 项 · `server.js` 新增 `requireAdmin`

**改哪个文件**：`canvas-api/server.js`

**锚点**：L87 是 `requireAuth` 的收尾 `}`，L89 是 `/api/auth/verify` 的注释。
新增代码插在 **L87 之后、L89 之前**。

**改成什么**：

```js
/** 管理员守卫：未登录 401，非管理员 403。只用于 /api/admin/* 与 /api/ziyu/me。 */
function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ error: "auth_required" });
    if (req.user.role !== "admin") return res.status(403).json({ error: "admin_required" });
    next();
}
```

**漏改的后果**：第 4 项 `mountCreditRoutes` 会因 `requireAdmin is required` **直接抛错**，
API 起不来。这是**有意的 fail-fast**：宁可起不来，也不要让管理员接口裸奔。

> ✅ **已核对（2026-09-13）**：`schema.sql` L21 `role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin'))`；
> `auth.js` 的 `findUserById()` SELECT 列含 `role`；`server.js` L73-87 的 `requireAuth` 把**完整用户行**赋给 `req.user`。
> **字段名正确，上面这段 `requireAdmin` 可直接用**（原「未验证 U-02」已关闭）。

---

### 第 4 项 · `server.js` 挂载额度路由

**改哪个文件**：`canvas-api/server.js`

**锚点**：L176 是 `app.get("/api/auth/me", ...)`，L178 是 `// ---- 通用 CRUD` 注释。
调用插在 **L176 之后、L178 之前**。

**改成什么**：

```js
mountCreditRoutes(app, { requireAuth, requireAdmin, registerMedia, query });
```

**依赖核对**：

- `query` —— L25 已确认存在（`import { query, migrate, closeDb } from "./db.js";`）✅
- `requireAuth` —— L87 之前已定义 ✅
- `requireAdmin` —— 由第 3 项新增 ✅
- `registerMedia` —— ✅ **已核对（2026-09-13）**：`server.js` **L447** 确有
  `async function registerMedia(userId, storageKey, objectKey, buffer, { mimeType, sourceUrl })`，
  **但它是模块内私有函数，没有 export**。
  → **仍然按上面这行注入**（`registerMedia` 与 `mountCreditRoutes` 同在 `server.js` 模块作用域内，可直接引用，无需 export）；
  → `persistRemoteMedia()` 内部在 `registerMedia` 不是函数时**直接 throw**（`ziyu.js` L418），不再静默降级；
    `routes-credits.js` 也在调用前先挡一道 `MEDIA_NOT_READY`。
  → 另一条等价路径是复用现成路由 `POST /api/media/import-url`（`server.js` L485-519），
    它内部同样调 `registerMedia` 并写 `media_files.source_url`；**两条路径都成立，不要自己重写下载逻辑**。

**★ 落盘实现（第 47 轮已落地 · `routes-credits.js` L274-333）**

`POST /api/ziyu/persist` 现在的行为（body：`{ taskId, url?, kind? }`）：

1. 传了 `taskId` → 先查 `/api/v1/jobs/<taskId>`；`status !== 'completed'` 一律 **409 `TASK_NOT_COMPLETED`**（带 `status` / `progress`），不落盘；
2. 任务完成 → 走 `resolveResultUrls(job, kind)`（`ziyu.js` L375）；`ok:false` → **422 `RESULT_URL_MISSING`**（带 `warning` / `taskId`），**不落盘、不写 `media_files`**，只打一条 `console.warn`；
3. 产出 URL **逐个** `persistRemoteMedia()`（多图任务不再只存第一张），任一条失败 → 502 并带 `savedCount`；
4. **全部成功之后**才执行 `SQL_MARK_ZIYU_RESULT`，回填 `channel_usage.result_url` / `local_media_key`（对账用）；
5. 响应向后兼容：顶层仍是 `storageKey` / `bytes` / `checksum` / `mimeType`，另加 `ok` / `count` / `items`；
6. 不传 `taskId` 的老路径（直传 `url`）仍可用，保留 400 `URL_REQUIRED` / 500 `MEDIA_NOT_READY`。

> ⚠️ **绝不允许把 `job.assets` 当产出**：`assets` 是用户上传的输入参考素材。
> `ziyu.js` 的 `extractResultUrls()`（L298-327）只读顶层 `resultUrl` / `previewUrl` / `preview`；
> 本路由文件全文**不出现 `assets`** —— 这条口径由 D11 固定，改代码时不要"顺手回看 assets"。

漏改的后果：出片全部丢结果，或交付错文件（用户拿到自己上传的素材）。

**漏改的后果**：`/api/credits/*` 与 `/api/ziyu/*` 全部 404，前端拿不到余额、兑不了码。

---

### 第 5 项 · `schema-credits.sql` 追加到 `schema.sql` 末尾

**改哪个文件**：`canvas-api/schema.sql`（LEN=116，末尾 L115 是最后一条 `CREATE INDEX`，L116 为空行）

**改成什么**：把 `implementation/canvas-api/schema-credits.sql` **全文追加**到文件末尾。

**依据**：`canvas-api/db.js` **L40-44** 的 `migrate()` 只读 `schema.sql` 一个文件
（`fs.readFileSync(path.join(here, "schema.sql"), "utf8")`），**不会自动发现新 SQL 文件**。
`schema-credits.sql` 里 6 张表 + 全部索引都是 `IF NOT EXISTS`，可重复执行。

**漏改的后果**：`user_credits` / `credit_ledger` / `credit_redemptions` / `channel_usage` /
`free_trial_usage` / `credit_adjustments` 都不存在 → 余额、兑换、扣费全 500。

**另一条路（不推荐）**：新增 `schema-credits.sql` 独立文件 + 改 `migrate()` 读两个文件
+ 改 `Dockerfile.api` COPY + 改 `publish.sh` 两处清单。改动面大 4 倍，收益为零。

---

### 第 6 项 · `publish.sh` L92 cp 列表加 4 个 js

**改哪个文件**：`scripts/deploy/publish.sh`

**锚点**：**L92**（发布包打包）：

```bash
cp canvas-api/server.js canvas-api/db.js canvas-api/auth.js canvas-api/schema.sql canvas-api/package.json "$STAGE/api/"
```

**改成什么**：在 `canvas-api/schema.sql` 之后追加
`canvas-api/credits.js canvas-api/ldxp-redeem.js canvas-api/ziyu.js canvas-api/routes-credits.js`。

**漏改的后果**：发布包里没有新模块 → 服务器 `releases/<版本>/api/` 缺文件。

---

### 第 7 项 · `publish.sh` `api_fingerprint()` 两处都要加（L119 + L121）

**改哪个文件**：`scripts/deploy/publish.sh`

**锚点**：**L117-123** 是 `api_fingerprint()`：

- **L119** 是 `openssl dgst` 分支
- **L121** 是 `sha256sum` 分支

**改成什么**：两个分支的 `cat` 文件列表**都要**加那 4 个 js。

**漏改的后果**：只改一处 → 在没有 `openssl` 的机器上指纹不变 → 脚本判定"后端没变、不重建镜像" →
**发布日志全绿、线上跑旧版**。`publish.sh` L94-97 的注释就是为记录这类事故而写的。

---

### 第 8 项 · `publish.sh` L274-278 `upload_lf` 加 4 个 js

**改哪个文件**：`scripts/deploy/publish.sh`

**锚点**：**L274-278**，5 行 `upload_lf`，把 `canvas-api/` 直接传到 `${APP_ROOT}/api/`。

**为什么要单独上传**：L269-273 的注释写明了 —— docker-compose 的 `build.context` 是**固定目录**
`/opt/infinite-canvas/api`，而发布包要等 `deploy.sh` 才解到 `releases/<版本>/`，
且版本号每次都不同。所以必须在 `deploy.sh` 之前把源码放好，否则构建上下文是空的。

**漏改的后果**：即使第 6 项打包对了，**build context 里仍然缺文件** → 镜像构建出来就少模块。

---

### 第 9 项 · `Dockerfile.api` L16 COPY 加 4 个 js

**改哪个文件**：`deploy/Dockerfile.api`

**锚点**：**L16**：

```dockerfile
COPY server.js db.js auth.js schema.sql ./
```

**改成什么**：加 `credits.js ldxp-redeem.js ziyu.js routes-credits.js`。

**漏改的后果**：`Cannot find module './credits.js'` → API 容器起不来。
**这是 13 项里最容易漏的一处** —— 因为本地开发目录里文件是存在的，
只有构建镜像时才会发现少了 COPY，而"本地能跑"会给人已经改完的错觉。

---

### 第 10 项 · `publish.sh` L238 sed 加 `__ZIYU_KEY__`、L240 grep 同步 ★

**改哪个文件**：`scripts/deploy/publish.sh`

**锚点**：**L237-240**（nginx conf 占位符替换，原地回写）：

现 L238：

```bash
sed -e 's|__AGNES_TOKEN__|${ACCESS_TOKEN}|g' -e 's|__AUTH_COOKIE__|${AUTH_COOKIE}|g' default.conf > .default.conf.new
```

**改成什么**：加第三个 `-e`：

```bash
-e 's|__ZIYU_KEY__|${ZIYU_API_KEY}|g'
```

**同一条命令末尾的守卫 grep（L240）也要同步**，加上 `__ZIYU_KEY__`。

**取值来源**：用现成的 `remote_env_get()` 从 `API_ENV_FILE` 读。
`API_ENV_FILE` 在 **L215** 定义为 `${APP_ROOT}/api/api.env`。
**该文件与站点密码、`AUTH_COOKIE` 同级机密，不得进仓库、不得进本文件夹。**

**★ 漏改的后果最阴**：

nginx 会把**字面量** `Bearer __ZIYU_KEY__` 发给紫域 → 必然 **401**，
而**发布日志全绿、容器健康检查也过**（因为 `/api/` 一切正常）。
只会在真人点"生成"时表现为"提交失败"，排查方向会被彻底带偏。

**附带风险**：若 `ZIYU_API_KEY` 在服务器 `.env` 里**尚未就位**，sed 会把它替换成**空串** →
`Authorization: Bearer ` → 同样 401。**所以顺序是：先确认 `.env` 就位，再发布。**

---

### 第 11 项 · `nginx-docker.conf` 插入 `/ziyu/` 块

**改哪个文件**：`deploy/nginx-docker.conf`（LEN=165）

**锚点**：**L99** 是 `/agnes/` 块的收尾 `}`，**L101** 是"画布服务端 API"注释。
插入位置 = **L99 之后、L101 之前**。

**改成什么**：`implementation/deploy/ziyu-nginx.conf.snippet` §一 的 `location /ziyu/ { ... }` 块
（snippet 内 **L27-63**，共 37 行）。

**三个关键点**：

1. **保留门禁**：`if ($canvas_authed = 0) { return 403; }` —— 批次 1 **不撤** `/ziyu/` 门禁（理由见 D-batch2-ziyu-gate）。
2. **覆盖而非追加**：`proxy_set_header Authorization "Bearer __ZIYU_KEY__";`
   会**覆盖**浏览器发来的同名头，所以前端填什么 apiKey 都不影响安全性。
3. **尾斜杠剥前缀**：`proxy_pass https://ziyuai.vip/;`
   `/ziyu/api/v1/jobs` → `https://ziyuai.vip/api/v1/jobs` ✅

**生效方式**：`docker compose exec -T web nginx -s reload`
（**先 `nginx -t` 校验**）。**不要重建 web 容器** —— 重建不会让挂目录里的新 conf 生效，
是 AGENTS.md §4 记录过的典型误操作。

**发布链路**：nginx conf 由 `publish.sh` **L155** `upload_lf deploy/nginx-docker.conf "${APP_ROOT}/nginx/default.conf"` 上传。

**漏改的后果**：`/ziyu/` 404（或落到默认 location），前端紫域渠道完全不可用。

---

### 第 12 项 · `channel-templates.ts` 补字段 + 加紫域模板

**改哪个文件**：`web/src/stores/channel-templates.ts`（LEN=77）。三处小改。

**(1) `ChannelTemplate` 类型（L9-20）加两个可选字段**

实测该类型**只有 7 个字段**（`id / name / baseUrl / apiFormat / models / imageBatchLimit / editViaGenerations / hint`），
**既没有 `script` 也没有 `apiKey`**。新增：

```ts
script?: string;
apiKey?: string;
```

> 注意：模型级的 `script` **不需要改类型** —— `web/src/stores/use-config-store.ts` **L16** 已有
> `ChannelModel.script?: string`（已复核）。缺的只是"模板能把它透传下去"。

**(2) `createChannelFromTemplate()`（L65-76）改为透传**

实测 **L70** 写死 `apiKey: ""`，且**完全不传 `script`**。改成：

- `apiKey: template.apiKey ?? ""`
- 模型映射时带上 `...(model.script ? { script: model.script } : {})`

**铁律不动**：`channelTemplates` 数组里**绝不出现真实 Key**。
紫域模板填的是**非密钥占位串** `ziyu-proxy`。

**(3) `channelTemplates` 数组（L22-63）追加紫域条目**

字段与 `implementation/web/ziyu-channel-template.json` 一致（含 `models[].script`）。

**为什么必须给占位串、不能留空**（实测，非推测）：

- `web/src/services/api/video.ts` **L84-85**（`createPluginVideoTask`）与 **L193-194**（`assertVideoConfig`）
  都是 `if (!config.apiKey.trim()) throw`，空 key 直接抛 `apiKeyRequired`，**任务根本不会发出**。
- `web/src/stores/use-config-store.ts` **L282-285** `isAiConfigReady()` 同样要求 `channel.apiKey.trim()` 非空。

**漏改的后果**：渠道加得进去、模型选得出来，但一点"生成"就抛 `apiKeyRequired`。

> ⚠️ `ziyu.js` 文件头 L16-18 的注释已经按"占位串"口径改写完毕，
> 与旧的"apiKey 必须留空"说法不再冲突（该冲突见 D-web-1）。

---

## 4. 验证证据表（全部为桩环境，非真机）

下表每一条都是**本仓内实测**得到的，但**必须连着读这行前提**：

> ★ 全部证据均在**桩环境**中取得：内存版 Postgres 桩（模拟 `query` / `getPool` / 事务）+ `globalThis.process` 环境变量桩。
> **不是**权威源码树、**不是**真实服务器、**不是**真实 Postgres、**不是**真实紫域 API。
> 因此这些证据能证明的是「逻辑正确、并发正确、幂等正确、密钥纪律正确」，
> **不能**证明「在线上跑得通」。后者见 §7 未验证声明。

| 编号 | 验的是什么 | 怎么验的 | 结果 | 覆盖的验收项 |
| --- | --- | --- | --- | --- |
| E-01 | 四个新模块在 ESM 下能否被加载 | 以 `type: module` 桩包导入 `credits.js` / `routes-credits.js` / `ldxp-redeem.js` / `ziyu.js` | 4/4 加载成功 | A-00（新增门槛项） |
| E-02 | 路由是否都挂上了 | 用桩 `app` 收集 `mountCreditRoutes` 注册的路径与方法 | 18 条，与设计一致（批次 2 追加 `/api/credits/free-trial/check`） | A-03 / A-04 |
| E-03 | `requireAdmin` 缺失时会不会静默降级 | 不传 `requireAdmin` 调用 `mountCreditRoutes` | 立即抛错（fail-fast），不静默放行 | A-13（越权面） |
| E-04 | 纯函数边界 | `customerCost()` 等 9 项：最小 1 点、向上取整、cost=0 得 0 | 9/9 通过（200→300、1500→2250、0→0） | A-08 |
| E-05 | 发码端到端 | 本地生成 25 张 300 点码，逐张过服务端 `verifyCode()` | OK 25/25，唯一哈希 25，bad=[] | A-05 |
| E-06 | 兑换负例 | 篡改签名 / 篡改面额(300→1000) / 非法面额 999 / 空串 / 错误密钥 / 密钥过短或缺失 | 前四类 → `LDXP_REDEEM_CODE_INVALID`；错误密钥 → 拒绝；密钥不合格 → 抛 `LDXP_PAYMENT_CHANNEL_UNAVAILABLE`；小写输入 → 正常通过（`normalizeCode` 预期行为） | A-05 |
| E-07 | ★ 并发重复扣费（真实漏洞） | 同一 taskId 并发三次预扣 | a=`{charged:300,balance:700}`，b/c=`{duplicate:true}`；余额 700，reservation 流水仅 1 条 | A-10 |
| E-08 | 并发重复结算 | 同一 taskId 并发两次结算 | s1=`{balance:700,delta:0}`，s2=`{duplicate:true}` | A-10 |
| E-09 | ★ 已结算任务再退款（真实漏洞） | 结算完成后再调退款 | 修复前：`{ok:true,refunded:true,amount:300}`（白送钱）；修复后：`{ok:false,code:"ALREADY_SETTLED"}`，路由返回 409 | A-09 / A-10 |
| E-10 | 结算四分支 | A 补扣 / B 失败 cost=0 / C 补扣失败 / D 未结算退款 | A：预扣300→实际300→扣450，余额550，delta150；B：预扣2250→cost=0→余额3000，delta-2250；C：余额0，metadata 记 `pending:true,shortfall:1950`；D：ok，重复退款 `duplicate` | A-08 / A-09 |
| E-11 | 发码两条路是否同源 | 管理端在线 `signPayload` 与本地生成器 HMAC 交叉验证 | 一致 | A-05 |
| E-12 | 权威源码锚点是否可信 | 逐行读权威树，记录行号（见 §3 各项） | 全部第一手复核；`package.json` L5 `"type":"module"`、`schema.sql` 116 行、`nginx-docker.conf` 165 行等 | 全部 |
| E-13 | 紫域真实计费口径 | 实跑 `zy_model_2db335ab16705b6ffb21` 提交 30 秒 | **实际扣 1500**，而 models 目录里 `cost=200`、`costPerSecond=50` | A-08（对账口径） |

| E-14 | ★ 13 处锚点是否仍然成立（第 16–19 轮后复核） | 逐行读权威源码树原文并打印行号 + 行数 + 换行符 | **13/13 成立**，详见 §3.0 复核表 | 全部 |

**E-07 / E-09 的读法**：这两条不是"顺带发现的小问题"，而是**两个真实的资金漏洞**——
一个会重复扣用户的钱，一个会让平台白送钱。修复方式与代码位置见 `credits.js` 的 `lockTask()`（L142-144）
与 `refundTaskCredits()`（L285-306），以及 `routes-credits.js` L208-219 的 409 分支。

**E-13 的结论（会写进对账逻辑）**：紫域 models 目录里的 `cost` **不是**真实计费单价。
真实扣费 = `costPerSecond × 秒数`（30 × 50 = 1500）。
因此估算用 `costPerSecond > 0 ? costPerSecond × 秒数 : cost`，**最终一律以 job 返回的 `cost` 字段为准**。

---

## 5. 落地顺序与检查点

顺序不是随手排的：**每一步都以前一步"已自查通过"为前提**，任何一步失败就停在那里，不要往下走。

> ★ **执行入口**：本仓**没有**权威源码树的写权限（实测 `EPERM`），也不含 shell / SSH。
> 因此 S1–S5、S8 这 13 处改动**不在本仓执行**，而是通过
> **`implementation/APPLY-RUNBOOK.md` + `implementation/scripts/apply-batch1.mjs`** 交付：
> 你在**自己有写权限的终端**里跑一条命令，脚本做**幂等**替换、逐处自检、并把每处结果打出来。
> 本仓只负责"写清楚怎么改"和"给出可执行的落地器"，**不替你落代码、不发布**。

| 步骤 | 做什么 | 自查方式（做完立刻做，不要攒） |
| --- | --- | --- |
| S1 | 把 4 个 js + 1 个 sql 拷进权威树 `canvas-api/` | 目录里 `ls` 到 5 个文件；`node --input-type=module -e "import(...)"` 能加载 |
| S2 | 追加 `schema-credits.sql` 内容到 `schema.sql` 末尾 | 文件变长；6 张表 + 2 个唯一索引都在；**全部 `IF NOT EXISTS`** |
| S3 | 改 `server.js`（第 1–4 项：import / CORS / `requireAdmin` / 挂载） | 启动无语法错误；`requireAdmin` 在缺字段时不静默放行 |
| S4 | 改 `deploy/Dockerfile.api` L16 的 COPY | 4 个 js 都在 COPY 列表里（**漏了就是线上 404 / 500**） |
| S5 | 改 `publish.sh` 四处：L92 cp、L119+L121 指纹、L238 sed + L240 grep、L274-278 upload_lf | ★ 第 10 项（`__ZIYU_KEY__`）**最容易漏**：sed 改了、grep 没改，守卫会在发布时把正确的替换当异常拦下 |
| S6 | 在服务器 `api.env` 写 4 个环境变量（`ZIYU_API_BASE` / `ZIYU_API_KEY` / `LDXP_REDEEM_SECRET` / `FREE_TRIAL_MONTHLY_LIMIT`） | **改完必须重建容器**，否则"改了还是旧的"且日志里看不出来 |
| S7 | 改 `nginx-docker.conf`，插入 `/ziyu/` 块（§三 的 `ziyu-nginx.conf.snippet`） | `nginx -t` 通过；`/ziyu/` 仍保留门禁；`Authorization` 是服务端注入的 `Bearer __ZIYU_KEY__` |
| S8 | 改 `web/src/stores/channel-templates.ts` 三处 | 渠道能选中；**一按生成不发 `apiKeyRequired`**（这是 L12 项的唯一验收方式） |
| S9 | 跑批次 1 的验收清单 A-00 ~ A-12 | 逐条留证据；★ **A-06 之前必须先补一次 L2 真实浏览器冒烟** |

**S6 / S7 是两道不可回退的关口**：

- 环境变量只进服务器 `.env`，**绝不进仓库、前端、模板**；
- `AUTH_COOKIE` 一旦生成就**长期固定**，换一次 = 所有用户被迫重新登录；
- 三个数据卷（`/opt/canvas-webdav`、`/opt/canvas-api-media`、`/opt/canvas-postgres`）**不可再生**，任何操作前单独确认。

---

## 6. 与 ACCEPTANCE / ROLLBACK 的编号对照

本文件是"怎么做"，`implementation/deploy/ACCEPTANCE.md` 是"怎么算过"，`implementation/deploy/ROLLBACK.md` 是"出事怎么退"。三者用编号对齐：

| 本文件（APPLY） | 验收（ACCEPTANCE） | 回滚（ROLLBACK） |
| --- | --- | --- |
| §3 第 0–1 项（ESM / import） | A-00（新增门槛项） | R-00 通用回滚 |
| §3 第 2 项（CORS `Idempotency-Key`） | A-03 / A-06 | R-00 |
| §3 第 3–4 项（`requireAdmin` / 挂载） | A-04 / A-05 / A-13 | R-00 |
| §3 第 5 项（schema 追加） | A-04 / A-05 / A-23 | R-01（数据库，默认不做） |
| §3 第 6–9 项（发布链路四处） | A-01 / A-02 | R-02（发布回滚） |
| §3 第 10 项（`__ZIYU_KEY__` sed + grep） | A-01 / A-02 | R-02 |
| §3 第 11 项（nginx `/ziyu/`） | A-01 / A-15 | R-02 |
| §3 第 12 项（渠道模板） | A-03 | R-00（纯前端，随版本回滚） |
| §5 S6（服务器 `.env`） | 附录 B | R-03（环境变量回滚） |
| §5 S9（批次 1 验收） | A-00 ~ A-12 | R-01 / R-02 / R-03 |

---

## 7. 未验证声明（不许含糊）

以下每一条都是**本仓无法验证、必须在真机补**的。谁把它们说成"已完成"，谁就是在造假。

| 编号 | 未验证的东西 | 为什么本仓验证不了 | 补验证的时机与方式 |
| --- | --- | --- | --- |
| U-01 | ★ **L2 画布交互**（拖拽 / 连线 / 缩放 / 节点链执行 / 插件安装）—— **🟡 已部分关闭（2026-09-13）** | 本环境**仍没有可用浏览器**（`cua.getState()` 返回 `Codex auth token is unavailable`），且无 shell / SSH。**但复核出既有证据**：权威树 `.probe/` 有 2026-09-01 的 Playwright 真实浏览器会话 | **已覆盖**：节点渲染、拖拽连线（含反向起拖）、连线方向语义、`videoMode` 自动纠正、秒数钳位。**残留**：缩放 / 节点链真实执行（会话用占位素材，未真调接口）/ 插件安装。**且需复跑并留存断言输出**——现有产物只能证明"完整走完、未触发中止路径"，中间 `check()` 结果未落盘。详见 `docs/STATUS_20260913_L2_EVIDENCE.md` |
| ~~U-02~~ | ~~`req.user.role` 这个字段名到底对不对~~ **✅ 已关闭（2026-09-13）** | — | 已核对：`schema.sql` L21 `role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin'))`；`auth.js` `findUserById()` 的 SELECT 列含 `role`；`server.js` L73-87 `requireAuth` 把完整行赋给 `req.user`。**字段名正确，`requireAdmin` 写法成立。** |
| ~~U-03~~ | ~~`registerMedia` 的真实函数名~~ **✅ 已关闭（2026-09-13）** | — | 已核对：`server.js` L447 `async function registerMedia(userId, storageKey, objectKey, buffer, { mimeType, sourceUrl })` **存在，但是模块内私有函数、未 export**。★ **落地做法订正见 §3 第 4 项：改为复用现成路由 `POST /api/media/import-url`（`server.js` L485-519），它内部已调 `registerMedia` 并写 `source_url`。不要试图 import 私有函数，也不要自己重写下载逻辑。** |
| ~~U-04~~ | ~~紫域 `POST /api/v1/jobs` 响应的确切字段名~~ **✅ 已关闭（第 20 轮，2026-09-13）** | — | ★ **旧结论写反了，已推翻**：完成任务的产出在**顶层 `job.resultUrl`**（`previewUrl` / `preview` 同值）；`job.assets.{image\|video\|audio}` 是**输入参考素材**，不是产出。**实证**：`7c03ade8`（video，cost=50）→ `resultUrl` 命中 `hermes_video_1789273633_13f9499938.mp4`；`802b8c52`（image，cost=10）→ `resultUrl` 命中 `generated_image_1789273321_dd9db62c8b.png`。**反例**：`195f4a3a` 结果 URL 已过 24 小时清理，`assets` 里只剩用户上传的 5 张图 + 1 个视频（`uploadedAt` 全部早于任务创建）——旧实现会把**用户输入**当成品交付。代码已改：`ziyu.js` 删除 assets 兜底，`resultUrl` 缺失即 `throw`（`RESULT_URL_MISSING`）。**口径**：产出字段 = 顶层 `resultUrl`；`assets` 仅作输入素材留档。 |
| U-05 | nginx 配置能否真实加载 | 无服务器、无 shell | 上线时 `nginx -t`；`/ziyu/` 的 `if ($canvas_authed = 0) return 403` 是资金防线，配错 = 未登录也能烧积分 |
| U-06 | `canvas-agent` 到底几个工具 —— **✅ 已关闭（2026-09-13）** | — | 已逐字复核：权威树 **`canvas-agent/src/canvas/schemas.ts`** 的 `toolNames` 数组共 **34** 项；`canvas-agent/src/server/mcp.ts` **L13** 用 `toolNames.forEach((name) => registerCanvasTool(...))` **全量注册、无过滤**；`canvas/src/tools.ts` 的 `isToolName()` 白名单同源。**工具数 = 34**（计划原文的 25 与旧文档的 6 均作废）。出处同步写入 `inventory/canvas-agent-README.md` 的订正说明。 |
| U-07 | 服务器 `.env` 里 4 个变量是否已就绪 | 无 SSH | S6 时逐项确认；`LDXP_REDEEM_SECRET` 少于 32 字符会直接抛 `LDXP_PAYMENT_CHANNEL_UNAVAILABLE`（这是**故意的**，防止弱密钥上线） |
| U-08 | 真实 Postgres 上的并发行为 | 桩是内存版，advisory lock 是模拟的 | 真机用两个并发请求打同一个 taskId；`pg_advisory_xact_lock(hashtext(...))` 的行为与桩不完全等价 |
| U-09 | 图片模型 `image-2-1k` 是否**稳定超时** | 4 次探针（2026-09-13：`9832cce5` / `84601fad` / `c64dcb10` / `51dd2fe5`），**4/4 failed** | 4 次全失败且**全部 `refunded=true`**（名义 20 积分，实扣 **0**，账号余额探针前后一致）。**建议上线时把 `image-2-1k` 从默认展示里摘掉或降权**，等有成功样本再加回。**不是硬阻塞。** |
| U-10 | `GET /api/v1/me` 是否返回 `apiKeys` 字段 | 两轮口径不一致：第 3 轮记录说有，本轮实测**只有 `{ok, user:{username, credits}}`** | 不阻塞：本站不依赖该字段（Key 只在服务器）。以**本轮实测为准**，旧记录作废 |
| U-11 | 紫域失败退款的**长期**比例 | 本轮把样本扩到 **19 条 failed**（`GET /api/v1/jobs` 全量），**19/19 全部 `refunded=true` 且 `refundAmount == cost`，0 例外** | 失败任务名义扣费合计 **3430** / 实际退款 **3430** / **净支出 0（19/19 全退）**。分布：`cost=0` 三条、`5` 四条、`200` 六条、`300` 一条、`350` 两条、`380` 两条、`450` 一条。**「全退」是观测事实，不是契约** —— 代码仍按「不假设必退」写（一律以 job 返回的 `cost` 字段对账），批次 3 对账看板持续统计。 |

---

## 8. 本文件自身的状态

- 本文件**只描述怎么改**，**没有改过权威源码树**，**没有构建**，**没有发布**。
- 本文件不含任何真实密钥、令牌、站点密码、`AUTH_COOKIE`。
- 落代码、动服务器、动数据卷，**全部需要用户单独授权**。
- 本文件的**可执行落地器**是 `implementation/scripts/apply-batch1.mjs`（幂等、逐处自检），使用说明见 `implementation/APPLY-RUNBOOK.md`。
- 最后一次锚点复核：**2026-09-13**，13/13 成立（§3.0）。

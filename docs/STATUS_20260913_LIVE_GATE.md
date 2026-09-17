# 线上门禁现状 · 与一个真实敞口（2026-09-13 实测）

> 本文件只记录**只读探测**结果。没有登录、没有创建账号、没有改任何线上数据。
> 探测源：本机 → `https://hb.cauai.fun`（Cloudflare 前置，`server: cloudflare`）。

---

## 1. 一句话结论

1. **门禁现在是开着的**，且注册开关**也是开着的**（`ALLOW_REGISTER` 未关闭）。
2. 这构成一个**当下就存在的敞口**：**注册接口不吃 cookie 门禁，而注册成功会顺手发下门禁 cookie**。
   于是「知道注册接口地址」的人可以**自己造一个账号**，从而绕过站点密码，直接进入画布。
3. 批次 2 原计划是「**先**确认第一个注册者（你）是管理员，**再**打开公开注册」。
   实测表明这个顺序已经被现实越过了 —— **公开注册其实已经开着**，而门禁仍被当作唯一屏障。

---

## 2. 线上现状实测（全部为只读请求）

| 探测 | 结果 | 读法 |
|---|---|---|
| `GET /login.html` | **200** | 登录页本身免门禁（设计如此） |
| `GET /` | **302 → /login.html** | **门禁生效中**，访客被挡 |
| `GET /assets/` | **403** | 静态资源门禁生效 |
| `GET /config.js` | **403** | 运行期配置门禁生效 |
| `GET /agnes/` | **403** | Agnes 代理门禁生效 |
| `GET /ziyu/` | **302 → /login.html** | **`/ziyu/` 尚不存在**（不是 404，是被门禁的兜底 location 接走） |
| `GET /dav/` | **401 Unauthorized** | WebDAV 由 Basic Auth 兜底，未变 |
| `GET /api/health` | **200** `{"ok":true,"db":true}` | API 存活、数据库连通 |
| `GET /api/auth/verify` | **401** | 无会话时正确拒绝 |
| `GET /api/projects` | **401** `{"error":"unauthorized"}` | 数据接口不吃门禁，但**自己要求会话** |
| `GET /api/media` | **401** `{"error":"unauthorized"}` | 同上 |
| `POST /api/auth/login`（畸形凭据） | **401** `invalid_credentials` | 登录接口对所有人可达（设计如此） |
| `POST /api/auth/register`（邮箱非法） | **400** `invalid_email` | **已越过开关判断** → 说明注册**没被关闭** |
| `POST /api/auth/register`（邮箱合法、密码 1 位） | **400** `password_too_short` | **开关是开的**（关闭时会返回 403 `registration_closed`） |

**关于最后两条的说明**：`password_too_short` 是**在创建用户之前**返回的，所以这两次探测
**没有创建任何账号、没有写入任何数据**。判读依据是源码执行顺序 ——
`canvas-api/server.js` L109-129：先判 `ALLOW_REGISTER`，再校验邮箱，再校验密码长度，
最后才 `createUser()`。

---

## 3. 敞口：证据链

### 3.1 四条事实（每条都能在源码里对上）

| # | 事实 | 证据 |
|---|---|---|
| ① | `/api/` **刻意不吃 cookie 门禁** | `deploy/nginx-docker.conf` L101-107 注释原文：「这里**刻意不吃** cookie 门禁：登录与注册接口本身必须在没有门禁的情况下可达」 |
| ② | 注册接口**默认放行** | `canvas-api/server.js` L111：`if (process.env.ALLOW_REGISTER === "0") return res.status(403)...` —— 只有显式设成 `0` 才关 |
| ③ | 注册成功会**下发门禁 cookie** | `canvas-api/auth.js`：`setSessionCookies()` 末尾调用 `setSitePassCookie(res)`，而后者写入 `canvas_auth`（`LEGACY_COOKIE = "canvas_auth"`，值与 `CANVAS_LEGACY_TOKEN` 相同） |
| ④ | 第一个注册者会被**自动提权为管理员** | `canvas-api/auth.js` `promoteToAdminIfFirst()`：`count(*) <= 1` 时 `UPDATE users SET role = 'admin'`；调用点 `server.js` L120 |

### 3.2 组合起来是什么

```
任何人 → POST /api/auth/register（不经门禁）
       → 201 创建账号
       → 响应里 Set-Cookie: canvas_auth=<门禁串>
       → 该人现在持有门禁 cookie
       → GET / 直接 200，进入画布
```

也就是说：**站点密码这道门，对「知道注册接口存在的人」是透明的。**
门禁当前挡住的只是「不知道有注册接口、只会打开首页」的访客。

### 3.3 一个附带的次生风险

如果**目前库里一个用户都没有**，那么**下一个注册的人就是管理员**（事实 ④）。
「注册的人是谁」目前不受任何控制 —— 谁先注册谁就是管理员。

> 本会话**没有**探测「库里是否已有用户」，因为唯一的探测手段是发起真实注册，
> 那会写入数据。**这一项保持未知**，需要你在服务器上查一次（见第 5 节）。

---

## 4. 影响评估

| 时点 | 影响 | 严重度 |
|---|---|---|
| **现在** | 陌生人可自行注册进画布。目前画布**不花钱**（`/ziyu/` 不存在），风险是「白用算力 + 管理员位可能被占」 | 🟠 中 |
| **批次 1 上线后** | 若照原计划（`/ziyu/` 保留门禁），陌生人注册后**同样拿到门禁 cookie** → 可调 `/ziyu/` → **花服务器上的紫域额度** | 🔴 **高** |
| **批次 2 上线后** | 门禁整体撤掉，这个问题自然消失；但届时**额度体系必须已经生效** | 🟡 取决于顺序 |

**关键结论**：批次 1 的 `/ziyu/` 门禁**不能**被当作资金防线。
门禁 cookie 是**可自助获得**的，它只防「不知道注册接口的人」。
真正的资金防线只能是**额度体系**（`requireAuth` + 余额预扣），这也是批次 1 本来就有的设计 ——
但原文档把它当成「第二道锁」，实际上它是**唯一**那道锁。

> 补充：`/ziyu/` 一旦上线，它的门禁分支用 `if ($canvas_authed = 0) return 403`，
> 而 `$canvas_authed` 认的正是注册时下发的 `canvas_auth`。所以这个推论是闭合的。

---

## 5. 建议处置（需要你裁决）

**最小动作（无论选哪条都要做）**：

1. 立刻在服务器 `.env` 里把 `CANVAS_ALLOW_REGISTER=0`，**重建 api 容器**。
   （改 `.env` 不重建 = 没生效，且日志里看不出来 —— 见 `AGENTS.md` §2。）
2. 确认「第一个注册者是你」这件事已经完成：在服务器上查一次用户表，
   确认你本人那条记录 `role = admin`。若库里已有**陌生人**账号，需要单独处置。

**批次 2 的顺序要改**（这是本文件最重要的建议）：

```
原计划： 开公开注册 → 撤门禁
实际应： 先让额度体系对所有 /ziyu/ 调用生效
      → 再把 /api/auth/verify 的 legacy 分支收紧（或下线）
      → 再确认管理员归属
      → 最后才开公开注册 / 撤门禁
```

理由：`/api/auth/verify`（`server.js` L89-96）**同时接受**真会话 **或** legacy 站点 cookie。
只要 legacy 分支还在，门禁 cookie 就等价于一个「无限期的准会话」。
`implementation/deploy/ziyu-nginx.conf.snippet` 第四节已经写了同一个风险，
本文件是它在**线上状态**上的实证。

---

## 6. 未验证声明

- 本文件所有线上结论都来自**匿名只读 HTTP 请求**，时间 2026-09-13。
- **未验证**：数据库里当前有几个用户、第一个是不是管理员（需要服务器侧查询）。
- **未验证**：`ALLOW_REGISTER` 在服务器 `.env` 里的字面值（只验证了**运行时行为**是「开」）。
  运行时的开，可能来自「设成了 1」，也可能来自「根本没设这个变量」。
- **未做**：没有注册任何账号，没有登录，没有触碰 `/dav/`，没有触碰任何数据接口。
- 本文件不含任何真实密钥、令牌、站点密码、`AUTH_COOKIE`。

---

## 7. 复现方法（你自己可跑）

```bash
# 门禁是否开着：应看到 302 → /login.html
curl -sI https://hb.cauai.fun/ | head -3

# 注册开关是否开着：
#   403 registration_closed  = 已关（好）
#   400 password_too_short   = 已开（当前就是这个）
#   邮箱故意用 .invalid 域名、密码故意只写 1 位 —— 不会创建任何账号
curl -s -X POST https://hb.cauai.fun/api/auth/register \
  -H "content-type: application/json" \
  -d '{"email":"probe-noop@example.invalid","password":"x"}'
```

---

## 8. 本文件自身状态

- 本文件为**新增**（2026-09-13）。
- 本文件**没有改过权威源码树**，**没有构建**，**没有发布**，**没有改过服务器**。
- 结论已回填：`docs/STATUS_20260913.md` §5 阻塞项 B-5 / B-6。

# CAUAI 统一入口（T1）· 部署手册与回滚

> 垂直切片 002 的 T1 交付物，承载域名 **`one.cauai.fun`**。
> 本目录是治理仓内的落地件（未进权威源码树）；`hb` / `sd2` / `apic` 三个现有站点在本切片中**零改动**。
> 切片背景与验收口径见 [SLICE-002-PLAN.md](../../docs/SLICE-002-PLAN.md) 的 T1 段与
> [SLICE-002-SPEC.md](../../docs/SLICE-002-SPEC.md) §4.1；决策记录见 [DECISIONS.md](../../docs/DECISIONS.md) **D43**。

## 1. 这是什么

一个自包含的静态入口页，只做两件事：**列出三个产品**、**把用户送到对应站点**。
它不反代任何后端、不连任何数据库、不引入身份服务。

| 卡片 | 目标 |
|---|---|
| 无限画布 | `https://hb.cauai.fun` |
| 念念 AI 视频工作台 | `https://sd2.cauai.fun` |
| New API 模型网关 | `https://apic.cauai.fun` |

**T1 的边界**：只解决「一个入口」。一套账号 = T2，一套额度 = T3，两者都是 L3，各自需要 G3 书面批准。

## 2. 本目录文件 → 服务器落地位置

| 本目录 | 服务器 | 说明 |
|---|---|---|
| `index.html` | `/opt/cauai-entry/site/index.html` | 入口页本体。自包含（内联样式 + data-URI favicon），不依赖 `/assets` |
| `nginx.conf` | `/opt/cauai-entry/conf.d/entry.conf` | 静态站配置 + `/healthz` 探针 + 安全响应头 |
| `docker-compose.yml` | `/opt/cauai-entry/docker-compose.yml` | 单服务 `nginx:1.27-alpine`，只绑 `127.0.0.1:18090` |
| `cloudflared-entry.yml.example` | `/etc/cloudflared-entry/config.yml` | 隧道 ingress。**`.example` 后缀是刻意的**，避免被当成真配置误用；服务器上落地时去掉 `.example` |
| `cloudflared-entry.service` | `/etc/systemd/system/cloudflared-entry.service` | 隧道进程。**不要用 `cloudflared service install`**（会创建名为 `cloudflared` 的服务，跟机器上已有隧道抢名字） |

隧道凭据 `/etc/cloudflared-entry/creds.json`（600）**不在本仓**，只存在于服务器。

## 3. 为什么另起一条隧道，而不接进 Caddy

宿主 80/443 由 `deeptutor-public-caddy` 占用，其 Caddyfile 是**只读挂载**（rw=false），
且 `hb` 与 `apic` 在其中声明为 `http://`（TLS 由隧道终止，写成 https 会 308 循环）。

把入口页塞进 Caddy 需要改一个只读文件，并且会碰到三个现有站点的路由。因此入口页**刻意不走 Caddy**：

```
浏览器 → Cloudflare → 隧道 cauai-entry → 127.0.0.1:18090 → nginx 容器 cauai-entry
```

这条路**完全不碰 Caddyfile，也不碰三个现有站点的任何配置**，是本切片风险最低的路径。

隧道写法沿用 `cloudflared-apic` 的「`--config` + 本地 ingress 文件」（可读、可验、可回滚），
不沿用 `cloudflared-canvas` / `cloudflared-huowenti` 的 token 写法（那种写法服务器上没有本地配置可审计）。

## 4. 首次部署步骤

前置：本机可 `ssh` 到宿主机（别名 `haika-kidswear-1757`）；`cloudflared` 已登录并持有 `cauai.fun` 区域权限。

```bash
# 4.1 建目录并上传静态件
ssh <host> 'mkdir -p /opt/cauai-entry/conf.d /opt/cauai-entry/site /etc/cloudflared-entry'
scp implementation/entry/index.html                     <host>:/opt/cauai-entry/site/index.html
scp implementation/entry/nginx.conf                     <host>:/opt/cauai-entry/conf.d/entry.conf
scp implementation/entry/docker-compose.yml             <host>:/opt/cauai-entry/docker-compose.yml
scp implementation/entry/cloudflared-entry.yml.example  <host>:/etc/cloudflared-entry/config.yml
scp implementation/entry/cloudflared-entry.service      <host>:/etc/systemd/system/cloudflared-entry.service

# 4.2 起静态站（只监听 127.0.0.1:18090）
ssh <host> 'cd /opt/cauai-entry && docker compose up -d'

# 4.3 建隧道并取凭据（凭据落到 /etc/cloudflared-entry/creds.json，权限 600）
ssh <host> 'cloudflared tunnel create cauai-entry'
ssh <host> 'mv /root/.cloudflared/<TUNNEL-ID>.json /etc/cloudflared-entry/creds.json && chmod 600 /etc/cloudflared-entry/creds.json'

# 4.4 校验 ingress（--config 必须放在 tunnel 之前）
ssh <host> 'cloudflared --config /etc/cloudflared-entry/config.yml tunnel ingress validate'
ssh <host> 'cloudflared --config /etc/cloudflared-entry/config.yml tunnel ingress rule https://one.cauai.fun'

# 4.5 DNS 与开机自启
ssh <host> 'cloudflared tunnel route dns cauai-entry one.cauai.fun'
ssh <host> 'systemctl daemon-reload && systemctl enable --now cloudflared-entry'
```

**改入口页内容时**：只需重传 `index.html` 到 `/opt/cauai-entry/site/`，容器挂的是**目录**，无需重启。
（挂单个文件会因 inode 绑定而永远读旧内容 —— 见 `AGENTS.md` §4。）

## 5. 验收命令与实测结果

| 验收项 | 命令 | 2026-09-21 实测 |
|---|---|---|
| 公网可达 | `curl -s -o /dev/null -w '%{http_code}' https://one.cauai.fun/` | `200` |
| 健康探针 | `curl -s -o /dev/null -w '%{http_code}' https://one.cauai.fun/healthz` | `200` |
| 本地探针 | `ssh <host> 'curl -s -o /dev/null -w %{http_code} http://127.0.0.1:18090/healthz'` | `200` |
| 容器健康 | `ssh <host> 'docker ps | grep cauai-entry'` | `Up (healthy)`，`127.0.0.1:18090->80/tcp` |
| 隧道在跑 | `ssh <host> 'systemctl is-active cloudflared-entry'` | `active` |
| 三站未受影响 | `curl -s -o /dev/null -w '%{http_code}' https://hb.cauai.fun/`（同法测 sd2 / apic） | `302` / `307` / `200` |

**页面内容验收**（真实浏览器，脚本 [entry-verify.mjs](../../scratch/entry-verify.mjs)）：

```
status 200 · title CAUAI · 创作矩阵 · cardCount 3 · consoleErrors none
card1 无限画布 | hb.cauai.fun | https://hb.cauai.fun | 节点编排,图生视频,素材库
card2 念念 AI 视频工作台 | sd2.cauai.fun | https://sd2.cauai.fun | 视频生成,脚本到成片,任务队列
card3 New API 模型网关 | apic.cauai.fun | https://apic.cauai.fun | API 密钥,模型路由,用量计量
h1 一个入口，三个工作台 · 移动端 390px 单列 · 三卡片目标站可达 200 / 200 / 200
```

截图：`output/entry-verify/desktop-1440.png`、`output/entry-verify/mobile-390.png`、`output/entry-verify/mobile-390-bottom.png`。

## 6. 回滚（★ 已实测，不是纸面方案）

停掉入口**不影响任何现有站点**。四步，顺序执行：

```bash
# R1 停隧道
ssh <host> 'systemctl stop cloudflared-entry'

# R2 停容器并删网络
ssh <host> 'cd /opt/cauai-entry && docker compose down'

# R3 确认本地端口已关闭
ssh <host> 'curl -s -o /dev/null -w %{http_code} http://127.0.0.1:18090/healthz'   # 期望 000

# R4 复测三站
#    期望 hb 302 / sd2 307 / apic 200（与回滚前一致）
```

**2026-09-21 实测结果**：R1 后 `is-active` = `inactive`；R2 后容器与网络均被移除；
R3 返回 `000`（连接被拒绝）；R4 复测 `one` = `530`（隧道断开，符合预期），
`hb` = `200`、`sd2` = `307`、`apic` = `200` **全部正常**。

恢复：`cd /opt/cauai-entry && docker compose up -d` + `systemctl start cloudflared-entry`，两条命令即可复原。

**不删的东西**：`/etc/cloudflared-entry/`（凭据与 ingress）与 DNS 记录 `one.cauai.fun` 保留，只停进程。
这样回滚是**可逆**的；彻底下线需要另外批准。

## 7. 已知坑

1. **`sd2` 冷启动慢**：入口上线前后都观察到偶发首访超时（`522`，约 40 秒后恢复），连测 6 次即稳定 `307`。与本变更无关，不要当成入口引入的回归。
2. **`cloudflared ingress` 子命令的参数位置**：必须写成 `cloudflared --config <file> tunnel ingress validate`，`--config` 放 `tunnel` 之前才生效。
3. **不要把入口页挂进 Caddy**：Caddyfile 只读（rw=false），且改它会波及三站路由。
4. **`hb` 与 `apic` 在 Caddy 里是 `http://`**：入口页自身不经 Caddy，所以这条不影响入口；但将来若有人把入口接进 Caddy，写成 https 会造成 308 循环。
5. **端口**：`18090` 已被入口占用。`18091` / `18092` / `18093` 当前空闲。
6. **`cloudflared` 有 outdated 警告**（2026.7.3）：属正常，未升级，不要为消除警告而升级。

## 7.5 统一子域名回源（2026-09-25）

新增独立回源入口，只服务以下四个地址：

| 地址 | 回源目标 | 源站实测 |
|---|---|---|
| `one.cauai.fun` | 现有入口容器 | 200，标题「CAUAI · 创作矩阵」 |
| `hb.one.cauai.fun` | 无限画布 | 302，与旧站一致 |
| `sd2.one.cauai.fun` | 视频工作台 | 307，页面标题正常 |
| `apic.one.cauai.fun` | 模型网关 | 200，标题「New API」 |

落地目录是服务器 `/opt/cauai-one-origin`，容器名 `cauai-one-origin`，只监听 `127.0.0.1:18091`。它连接四个现有容器网络，不修改旧入口配置，也不读取四个不可再生数据目录。

入口页三个按钮已改为新地址。旧的 `hb.cauai.fun`、`sd2.cauai.fun`、`apic.cauai.fun` 仍保持原样。

腾讯云国内加速尚未切换：本机没有腾讯云配置入口。域名目前仍由 Cloudflare 管理，因此公网还不能解析这四个新地址。

## 8. 统一登录中转（2026-09-26）

`origin/` 增加 `cauai-auth-broker` 服务。它通过画布内网登录接口验证密码，不保存密码；登录成功后签发 60 秒、单次使用的 HS256 票据，分别换取画布 `canvas_session` 或 sd2 `niannian_session`。

服务器首次启用前，创建只存在服务器的 `/opt/cauai-one-origin/auth.env`：

```dotenv
UNIFIED_AUTH_SECRET=<至少 16 个字符的随机值>
```

画布 API 与 sd2 的环境配置也使用同一个值，并在 sd2 增加：

```dotenv
UNIFIED_AUTH_SECRET=<同一个值>
UNIFIED_AUTH_ORIGIN=https://one.cauai.fun
```

部署时把 `origin/auth-broker/` 一并上传到 `/opt/cauai-one-origin/auth-broker/`，并把 `origin/docker-compose.yml`、`origin/Caddyfile` 更新到服务器，再执行：

```bash
cd /opt/cauai-one-origin && docker compose build auth && docker compose up -d auth origin
```

未配置 `UNIFIED_AUTH_SECRET` 时，中转服务返回 503，原三个站点不受影响。回滚时停止并移除 `cauai-auth-broker`，再恢复入口页三个原始链接即可。

## 9. 不做的事（本目录的红线）

- 不改 `hb` / `sd2` / `apic` 的任何路由、容器、`.env`、nginx 片段。
- 不碰 `AGENTS.md` §5 的四个不可再生数据卷（`/opt/canvas-webdav`、`/opt/canvas-api-media`、`/opt/canvas-postgres`、`/opt/canvas-api-sync`）。
- 不把任何真实密钥、令牌、站点密码、`AUTH_COOKIE` 写进本目录或聊天。
- 不在本目录里新增身份服务 —— 那是 T2，需要单独的 G3 批准。

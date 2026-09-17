# 服务器部署（hb.cauai.fun）

本机开发 → GitHub PR → 合并 → 一键上线。服务器只负责跑，不负责构建（省磁盘，也不受服务器访问 GitHub 慢的影响）。

## 架构

```
浏览器 → Cloudflare（DNS + HTTPS）→ cloudflared tunnel → 127.0.0.1:18085 (nginx 容器)
                                                            ├─ /login.html  登录页（免门禁，只有一个密码框）
                                                            ├─ /            静态前端，无 cookie 跳登录页
                                                            ├─ /agnes/…     cookie 门禁 → agnes 容器:8787（视频代理）
                                                            ├─ /dav/…       Basic Auth → agnes 容器:8789（云端同步 WebDAV）
                                                            └─ /show/…      免门禁静态目录（交付展示用）
```

- **为什么用 Tunnel**：服务器不需要开放任何入站端口，cloudflared 主动外连到 Cloudflare 边缘。
  有些机房会把 80/443 拦掉（103.236.92.40 就是这种情况：80 返回机房拦截页，其余端口全封），
  这时 Tunnel 是唯一出路——前提是这台机器**出网能连到 Cloudflare**（`nc -vz 198.41.200.43 7844` 可测）。
- **为什么前端调 `/agnes` 而不是 `http://localhost:8787`**：浏览器里的 localhost 指的是访问者自己的电脑。
  走同域路径由 nginx 转发，才真正打到服务器的代理。
- **两道锁**：
  1. cookie 门禁 —— 陌生访客打不开页面
  2. 代理侧 `PROXY_ACCESS_TOKEN` —— 就算绕过页面直接打接口也用不了

  令牌由 **nginx 注入**（`proxy_set_header Authorization "Bearer ..."`），不是前端发的：
  浏览器对同一个请求只能发一个 Authorization 头。

### 门禁：只输密码，不要用户名

不用 Basic Auth，因为**它协议上强制带用户名**，做不到「只输密码」。现在的流程是：

1. 访客打开任意页面 → nginx 发现没有 `canvas_auth` cookie → 302 到 `/login.html`
2. 登录页只有一个密码框，把密码 `POST /agnes/auth`
3. 代理比对服务端 `.env` 里的 `SITE_PASSWORD`，通过才下发 `canvas_auth=<随机串>` 的 cookie（HttpOnly，30 天）
4. nginx 只比对这个随机串，不解析密码

**密码只在服务端**，登录页源码里拿不到它，页面只能拿到「通过 / 不通过」。
改密码：改服务器 `/opt/agnes-video-proxy/.env` 的 `SITE_PASSWORD` 再重建容器，或用
`CANVAS_SITE_PASSWORD=新密码 bash scripts/deploy/publish.sh`（脚本会检测变化并自动重建）。

`AUTH_COOKIE` 是「已登录」的凭证，**必须固定**：它由 `publish.sh` 首次生成后写进 `.env` 并一直复用。
每次部署都重新生成的话，已登录的人会被迫反复登录。

### 云端同步（WebDAV）：画布与素材上云

画布前端本来就有完整的同步引擎（`web/src/services/app-sync.ts`），同步**画布 / 我的资产 /
生图记录 / 视频记录**，并把引用到的本地媒体文件（图片、视频、音频）二进制也一起传上去。
但仓库里一直缺配套服务端，所以这些数据实际上只活在浏览器 IndexedDB 里——清一次站点数据就没了。

现在部署栈自带 `canvas-webdav`（源码在 `canvas-webdav/`，说明见其 README）：
跑在 **agnes 容器内的独立端口 8789**，nginx 把 `/dav/` 反代进来，数据落在宿主机 `/opt/canvas-webdav`。

前端怎么配：画布右上角**配置 → WebDAV 同步**，填

| 字段 | 值 |
| --- | --- |
| WebDAV 地址 | `https://hb.cauai.fun/dav` |
| 用户名 | `canvas` |
| 密码 | 站点密码（`SITE_PASSWORD`）。**权威值只在服务器 `/opt/agnes-video-proxy/.env`**，本文档不记录明文 |
| 目录 | 留空，或用 `infinite-canvas` 之类给自己分个文件夹 |

点「测试连接」应提示可用，再点同步即可。换设备后用同一份配置同步，画布和素材就会补齐
（含缺失的媒体文件，会一并下载回来）。

几条设计约束，改的时候别踩：

1. **`/dav/` 不吃 cookie 门禁**。原因是原生 WebDAV 客户端（访达、资源管理器、手机文件 App）
   带不了站点的 `canvas_auth` cookie，这一层的安全由 Basic Auth 兜住，凭据与站点密码一致，
   不会比后台更宽松。也正因如此，`hb.cauai.fun/dav` 在浏览器里直接打开会弹账号密码框。
2. **凭据写进服务器 `.env`**（`WEBDAV_USER` / `WEBDAV_PASSWORD`），由 `publish.sh` 维护，
   默认复用站点密码；单独设密码用 `CANVAS_WEBDAV_PASSWORD=xxx bash scripts/deploy/publish.sh`。
3. **数据卷必须持久化**（compose 里的 `/opt/canvas-webdav:/data`）。代理代码一改就会重建容器，
   卷没挂出去的话用户的画布和成片会被一起删掉。
4. 大文件上传在 nginx 侧放开了限制（`client_max_body_size 0` + `proxy_request_buffering off`），
   别改回默认的 1m / 缓冲转发，否则同步带视频会直接 413 或占满磁盘内存。
5. **视频走分片上传**。公网这层还有 Cloudflare 管着，它给源站的时间只有 100 秒，
   而 PUT 的响应必须等整个请求体收完才发得出去——家里上行 2Mbps 时单次请求过 20MB 必被掐（524），
   和文件总量无关，只看这一次要传多久。所以前端把超过 4MB 的文件切成 4MB 一片，
   逐片 PUT 到同一路径（`Content-Range` + `X-Upload-Offset`），中间片落在同目录 `.parts/` 暂存，
   最后一片原子改名成正式文件。**别把 nginx 的 `proxy_read_timeout` 调小**，
   也别去动 `.parts/` 的权限——它是分片暂存区，启动时会自动清理超过
   `WEBDAV_PART_MAX_AGE_HOURS`（默认 24 小时）的遗留分片。第三方 WebDAV 服务不认分片时前端会自动回退整包上传。

## 服务器上的路径

| 路径 | 用途 |
| --- | --- |
| `/opt/infinite-canvas/current` | 软链，指向当前生效版本 |
| `/opt/infinite-canvas/releases/canvas-*` | 历史版本，默认保留最近 5 个 |
| `/opt/infinite-canvas/docker-compose.yml` | web + agnes 两个容器 |
| `/opt/infinite-canvas/nginx/default.conf` | 站点与 `/agnes`、`/dav` 反代配置（`__AGNES_TOKEN__` / `__AUTH_COOKIE__` 部署时会被替换） |
| `/opt/infinite-canvas/show/` | 免门禁展示目录，交付链接走 `https://hb.cauai.fun/show/<子目录>/` |
| `/opt/infinite-canvas/secrets/htpasswd` | Basic Auth 账号密码 |
| `/opt/infinite-canvas/scripts/deploy/deploy.sh` | 服务器端部署脚本 |
| `/opt/agnes-video-proxy/` | 代理代码 + `Dockerfile` + `.env`（**密钥只在这里，不进 git**） |
| `/opt/canvas-webdav/` | 云端同步数据目录，挂进容器当 `/data`（**画布与素材的实际存放处，删了就没了**） |

> 两个容易踩空的地方，改 compose 或部署脚本时别退回去：
> 1. **挂目录，不挂单个文件**。docker 的 bind mount 是按 inode 绑的，`current` 软链切换和 `sed -i` 改配置都会换 inode，
>    挂单文件/单目录时容器读到的永远是启动时那一份——发布日志全绿，线上却还在跑旧版本，重载 nginx 也没用。
> 2. **`current` 必须是相对软链**（`releases/canvas-xxx`）。用绝对路径的话，容器里解析不到 `/opt/infinite-canvas`，
>    root 目录不存在，所有请求直接 500。

## 首次安装（一次性）

### 1. 服务器上准备目录

```bash
mkdir -p /opt/infinite-canvas/releases /opt/agnes-video-proxy
```

### 2. 代理密钥与访问令牌

```bash
cat > /opt/agnes-video-proxy/.env <<'EOF'
AGNES_API_KEY=你的 Agnes Key
AGNES_BASE_URL=https://apihub.agnes-ai.com
PROXY_PORT=8787
PROXY_ACCESS_TOKEN=随机长串（前端构建时要用同一个值）
AGENT_UPLOAD=auto
DEFAULT_AR=9:16
DEFAULT_SECONDS=12
EOF
chmod 600 /opt/agnes-video-proxy/.env
```

### 3. 拉起容器

`publish.sh` 会把 `docker-compose.yml`、`nginx-docker.conf`、`Dockerfile` 一并传上去，
第一次跑 `bash scripts/deploy/publish.sh` 就会自动 build + up，不需要手工执行 compose 命令。

需要服务器有 `docker` 和 `docker compose` 插件。

### 4. Cloudflare 后台

1. **Zero Trust → Networks → Tunnels → Create a tunnel**，类型选 Cloudflared，命名（如 `hb-canvas`）
2. 回到该 tunnel 的 **Public Hostname** 页，加一条：
   - Subdomain: `hb`，Domain: `cauai.fun`
   - Service: `HTTP` → `127.0.0.1:18085`
3. 如果 `hb.cauai.fun` 已经有旧的 DNS 记录（比如指到旧部署），先删掉它，否则新记录建不上
4. 把建 tunnel 时给的那串 **token** 拿到服务器上：

   ```bash
   mkdir -p /etc/cloudflared-canvas
   echo '<token>' > /etc/cloudflared-canvas/token
   chmod 600 /etc/cloudflared-canvas/token
   cp /opt/infinite-canvas/cloudflared-canvas.service /etc/systemd/system/
   systemctl daemon-reload
   systemctl enable --now cloudflared-canvas
   ```

> **别用 `cloudflared service install`**：它会建一个叫 `cloudflared` 的 systemd 服务，
> 和这台机器上已经在跑的 kidswear 隧道抢名字（那个是手动起的裸进程，用 `/etc/cloudflared/token`）。
> 仓库里的 `deploy/cloudflared-canvas.service` 用独立服务名 + 独立 token 目录，两个隧道各跑各的。
> 服务单元会由 `publish.sh` 上传到 `/opt/infinite-canvas/cloudflared-canvas.service`。

## 日常更新

PR 合进 master 后，在本机仓库根目录执行：

```bash
CANVAS_SSH_HOST=<你的 ssh 别名> bash scripts/deploy/publish.sh
```

它会用线上参数构建前端（`/agnes` + 访问令牌）、打包上传、在服务器做原子切换并重载 nginx。
访问令牌默认从本机 `agnes-video-proxy/.env` 的 `PROXY_ACCESS_TOKEN` 读取，也可以用 `CANVAS_ACCESS_TOKEN=xxx` 传入。

> 后端代码（`agnes-video-proxy/server.js` + `canvas-webdav/server.js` + `package.json`）**变了才会重建 agnes 镜像**，
> 判断依据是发布机算出的代码指纹（`proxy/PROXY_FINGERPRINT`），服务器上存一份比对。
> 改完后端代码发布时看到 `==> 更新后端代码（Agnes 代理 + 云端同步）` 才算生效——
> 以前是拿 `server.js` 单文件比对，新增 `webdav.js` 这种兄弟模块时不会触发重建，
> 发布日志全绿、线上却还在跑旧镜像。新增后端文件时**记得同步改 `publish.sh` 的打包列表和 `deploy/Dockerfile.proxy` 的 COPY`**。

> Windows 上注意：工作区里的 `.sh` 是 CRLF，直接 scp 到 Linux 会报
> `set: pipefail\r: invalid option name`。`publish.sh` 已经在上传统一转成 LF，别绕过它手动传。

> 代理的 `.env`（Agnes Key + 访问令牌）**不在 git 里**。首次部署时 `publish.sh` 会自动从本机上传一份；
> 之后服务器有了就不再覆盖（避免冲掉线上手工改的配置）。想强制同步，先到服务器删掉 `/opt/agnes-video-proxy/.env` 再跑。

看到 `==> 完成：<版本> 已上线` 才算发布成功。

## 上线后自检

在服务器上依次跑，四项必须全绿：

```bash
# 1) 没登录访问首页 → 应跳登录页（302，Location 指向 /login.html）
curl -sS -o /dev/null -w 'home=%{http_code}\n' http://127.0.0.1:18085/
curl -sSI http://127.0.0.1:18085/ | grep -i '^location'

# 2) 登录页本身必须能打开（它若也被挡住，用户永远进不来）
curl -sS -o /dev/null -w 'login=%{http_code}\n' http://127.0.0.1:18085/login.html   # 期望 200

# 3) 错误密码 → 401
curl -sS -o /dev/null -w 'badpw=%{http_code}\n' \
  -X POST -H 'Content-Type: application/json' -d '{"password":"wrong"}' \
  http://127.0.0.1:18085/agnes/auth                                                 # 期望 401

# 4) 正确密码 → 200，并拿到 cookie
curl -sS -c /tmp/ck -o /dev/null -w 'login=%{http_code}\n' \
  -X POST -H 'Content-Type: application/json' -d '{"password":"<站点密码>"}' \
  http://127.0.0.1:18085/agnes/auth                                                 # 期望 200

# 5) 带上 cookie 走反代
curl -sS -b /tmp/ck -o /dev/null -w 'agnes=%{http_code}\n' \
  http://127.0.0.1:18085/agnes/v1/models                                            # 期望 200

# 6) 不给 cookie 打接口
curl -sS -o /dev/null -w 'nocookie=%{http_code}\n' \
  http://127.0.0.1:18085/agnes/v1/models                                            # 期望 403

# 7) 第二道锁：绕开 nginx 直连代理容器，不带令牌
docker exec canvas-agnes-proxy wget -qO- http://127.0.0.1:8787/v1/models            # 期望 401（不是 200）

# 8) 云端同步：不带凭据应 401
curl -sS -o /dev/null -w 'dav_noauth=%{http_code}\n' -X PROPFIND -H 'Depth: 0' \
  http://127.0.0.1:18085/dav/                                                        # 期望 401

# 9) 云端同步：带凭据应 207（-u 用户名:密码；密码就是站点密码）
curl -sS -o /dev/null -w 'dav_auth=%{http_code}\n' -u canvas:<站点密码> -X PROPFIND -H 'Depth: 0' \
  http://127.0.0.1:18085/dav/                                                        # 期望 207

# 10) 数据卷真的挂上了（这里必须是挂载点，否则容器一重建数据就没了）
docker exec canvas-agnes-proxy sh -c 'df -h /data | tail -1'
```

第 7 项如果是 200，说明 `PROXY_ACCESS_TOKEN` 没生效（多半是 `.env` 没传上去或容器没重建），
此时站点密码是唯一防线。容器重建才读新 `.env`：

```bash
cd /opt/infinite-canvas && docker compose up -d --force-recreate agnes
```

## 回滚

```bash
ssh <服务器>
cd /opt/infinite-canvas
ls -1dt releases/canvas-*
ln -sfn releases/<要回到的那个版本> current      # 必须是相对路径，见上面两条注意事项
docker compose exec -T web nginx -s reload
```

## 排查

```bash
cd /opt/infinite-canvas
docker compose ps
docker compose logs --tail=50 agnes
docker compose exec -T web nginx -t

# 代理探活（/health 不需要令牌）
docker compose exec -T agnes wget -qO- http://127.0.0.1:8787/health

# 登录走一遍（看是否 200 + 是否下发 cookie）
curl -sS -i -X POST -H 'Content-Type: application/json' \
  -d '{"password":"<站点密码>"}' http://127.0.0.1:18085/agnes/auth | head -8

# 带 cookie 走一遍反代
curl -sS -b 'canvas_auth=<AUTH_COOKIE 的值>' http://127.0.0.1:18085/agnes/v1/models

# 隧道
systemctl status cloudflared-canvas
journalctl -u cloudflared-canvas -n 50 --no-pager
```

### 改了密码却不生效

环境变量是**容器启动时注入**的：改完 `.env` 不重建容器，进程里还是旧值，
表现为「密码明明改了，输新的还报错、输旧的还能进」，而且日志里看不出任何异常。

```bash
cd /opt/infinite-canvas && docker compose up -d --force-recreate agnes
docker exec canvas-agnes-proxy printenv | grep -E 'SITE_PASSWORD|AUTH_COOKIE'
```

用 `publish.sh` 发布时不用管这一步——脚本会检测 `.env` 变化并自动重建。

### 登录后立刻又跳回登录页

先看 cookie 到底有没有写进去：

```bash
curl -sS -i -X POST -H 'Content-Type: application/json' \
  -d '{"password":"<站点密码>"}' http://127.0.0.1:18085/agnes/auth | grep -i set-cookie
```

- 没有 `Set-Cookie` → 代理没读到 `AUTH_COOKIE`，检查 `/opt/agnes-video-proxy/.env` 并重建容器
- 有 `Set-Cookie` 但页面还是跳 → nginx 里的 cookie 值和代理下发的不一致，
  比对 `/opt/infinite-canvas/nginx/default.conf` 的 `canvas_auth=` 与 `.env` 的 `AUTH_COOKIE`

### 登录页没有样式 / 点了没反应

登录页是**完全自包含**的（样式和脚本都内联在 `login.html` 里）。
如果给它加了外链资源（比如 `/assets/xxx.css`），那些请求会被 nginx 门禁挡掉——
登录页把自己关在门外了。改动登录页时必须保持自包含。

### 发布脚本报 `unexpected EOF while looking for matching '"'`

`ssh` 默认会吃掉脚本自己的 stdin，导致它后面的命令读不到输入。
`publish.sh` 里所有 ssh 都带 `-n`，手写 ssh 命令时也要带上。

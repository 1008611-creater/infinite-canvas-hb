# 服务器部署（hb.cauai.fun）

本机开发 → GitHub PR → 合并 → 一键上线。服务器只负责跑，不负责构建（省磁盘，也不受服务器访问 GitHub 慢的影响）。

## 架构

```
浏览器 → Cloudflare（DNS + HTTPS）→ cloudflared tunnel → 127.0.0.1:18085 (nginx 容器)
                                                            ├─ /          静态前端（volume 挂载 current/dist）
                                                            └─ /agnes/…   Basic Auth → agnes 容器:8787（只在 compose 内网）
```

- **为什么用 Tunnel**：服务器不需要开放任何入站端口，cloudflared 主动外连到 Cloudflare 边缘。
  有些机房会把 80/443 拦掉（103.236.92.40 就是这种情况：80 返回机房拦截页，其余端口全封），
  这时 Tunnel 是唯一出路——前提是这台机器**出网能连到 Cloudflare**（`nc -vz 198.41.200.43 7844` 可测）。
- **为什么前端调 `/agnes` 而不是 `http://localhost:8787`**：浏览器里的 localhost 指的是访问者自己的电脑。
  走同域路径由 nginx 转发，才真正打到服务器的代理。
- **两道锁**：
  1. nginx Basic Auth —— 陌生访客打不开页面
  2. 代理侧 `PROXY_ACCESS_TOKEN` —— 就算绕过页面直接打接口也用不了

  令牌由 **nginx 注入**（`proxy_set_header Authorization "Bearer ..."`），不是前端发的：
  浏览器对同一个请求只能发一个 Authorization 头，Basic Auth 会和 Bearer 打架。

## 服务器上的路径

| 路径 | 用途 |
| --- | --- |
| `/opt/infinite-canvas/current` | 软链，指向当前生效版本 |
| `/opt/infinite-canvas/releases/canvas-*` | 历史版本，默认保留最近 5 个 |
| `/opt/infinite-canvas/docker-compose.yml` | web + agnes 两个容器 |
| `/opt/infinite-canvas/nginx/default.conf` | 站点与 `/agnes` 反代配置（`__AGNES_TOKEN__` 部署时会被替换） |
| `/opt/infinite-canvas/secrets/htpasswd` | Basic Auth 账号密码 |
| `/opt/infinite-canvas/scripts/deploy/deploy.sh` | 服务器端部署脚本 |
| `/opt/agnes-video-proxy/` | 代理代码 + `Dockerfile` + `.env`（**密钥只在这里，不进 git**） |

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

> Windows 上注意：工作区里的 `.sh` 是 CRLF，直接 scp 到 Linux 会报
> `set: pipefail\r: invalid option name`。`publish.sh` 已经在上传统一转成 LF，别绕过它手动传。

> 代理的 `.env`（Agnes Key + 访问令牌）**不在 git 里**。首次部署时 `publish.sh` 会自动从本机上传一份；
> 之后服务器有了就不再覆盖（避免冲掉线上手工改的配置）。想强制同步，先到服务器删掉 `/opt/agnes-video-proxy/.env` 再跑。

看到 `==> 完成：<版本> 已上线` 才算发布成功。

## 上线后自检

在服务器上依次跑，四项必须全绿：

```bash
# 1) 首页
curl -sS -o /dev/null -w 'home=%{http_code}\n' http://127.0.0.1:18085/            # 期望 200

# 2) 经 Basic Auth 走反代
curl -sS -o /dev/null -w 'agnes=%{http_code}\n' -u 用户名:密码 \
  http://127.0.0.1:18085/agnes/v1/models                                          # 期望 200

# 3) 不给密码
curl -sS -o /dev/null -w 'nopass=%{http_code}\n' http://127.0.0.1:18085/agnes/v1/models   # 期望 401

# 4) 第二道锁：绕开 nginx 直连代理容器，不带令牌
docker exec canvas-agnes-proxy wget -qO- http://127.0.0.1:8787/v1/models          # 期望 401（不是 200）
```

第 4 项如果是 200，说明 `PROXY_ACCESS_TOKEN` 没生效（多半是 `.env` 没传上去或容器没重建），
此时 Basic Auth 是唯一防线。容器重建才读新 `.env`：

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

# 经 Basic Auth 走一遍反代
curl -u 用户名:密码 http://127.0.0.1:18085/agnes/v1/models

# 隧道
systemctl status cloudflared
journalctl -u cloudflared -n 50 --no-pager
```

### 输对密码反而 500

日志里是 `[crit] open() "/etc/nginx/.htpasswd-canvas" failed (13: Permission denied)`。
读这个文件的是 **nginx worker 进程**（官方镜像里是 `nginx` 用户），所以文件必须**其他用户可读**：

```bash
chmod 644 /etc/nginx/.htpasswd-canvas
```

杀伤力在于症状反直觉：不输密码时 nginx 直接返 401（压根没去读文件），看着一切都正常；
**只有输对密码才会 500**，很容易误判成代理或反代出了问题。

### 发布脚本报 `unexpected EOF while looking for matching '"'`

`ssh` 默认会吃掉脚本自己的 stdin，导致它后面的命令读不到输入。
`publish.sh` 里所有 ssh 都带 `-n`，手写 ssh 命令时也要带上。

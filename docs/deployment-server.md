# 服务器部署（hb.cauai.fun）

本机开发 → GitHub PR → 合并 → 一键上线。服务器只负责跑，不负责构建（服务器磁盘紧张，且访问 GitHub 很慢）。

## 架构

```
浏览器 → Cloudflare（DNS + HTTPS）→ cloudflared tunnel → 127.0.0.1:18085 (nginx)
                                                            ├─ /           静态前端（/opt/infinite-canvas/current/dist）
                                                            └─ /agnes/…   Basic Auth → 127.0.0.1:8787 (agnes-video-proxy, systemd)
```

- **为什么用 Tunnel**：这台机器公网 80 被机房拦截页占用、443 完全不通，开端口也访问不到；cloudflared 是主动外连，不需要开放任何入站端口。
- **为什么前端调 `/agnes` 而不是 `http://localhost:8787`**：浏览器里的 localhost 指的是访问者自己的电脑。走同域路径由 nginx 转发，才真正打到服务器的代理。
- **两道锁**：nginx Basic Auth（防陌生人打开页面）+ 代理侧 `PROXY_ACCESS_TOKEN`（防绕过页面直接打接口）。

## 服务器上的路径

| 路径 | 用途 |
| --- | --- |
| `/opt/infinite-canvas/current` | 软链，指向当前生效版本 |
| `/opt/infinite-canvas/releases/canvas-*` | 历史版本，默认保留最近 5 个 |
| `/opt/infinite-canvas/scripts/deploy/deploy.sh` | 服务器端部署脚本 |
| `/opt/agnes-video-proxy/` | 代理代码 + `.env`（**密钥只在这里，不进 git**） |
| `/etc/nginx/conf.d/hb-canvas.conf` | 站点与 `/agnes` 反代配置 |
| `/etc/nginx/.htpasswd-canvas` | Basic Auth 账号密码 |
| `/etc/cloudflared/canvas.yml` | Tunnel ingress |

## 首次安装（一次性）

在服务器上执行，模板文件都在仓库 `deploy/` 目录里。

```bash
# 1. 目录
mkdir -p /opt/infinite-canvas/releases /opt/infinite-canvas/scripts/deploy /opt/agnes-video-proxy

# 2. 代理密钥与访问令牌（不要提交到 git）
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

# 3. systemd 托管代理
cp deploy/agnes-video-proxy.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now agnes-video-proxy
curl -s http://127.0.0.1:8787/health          # 期望 {"ok":true,...}

# 4. nginx
cp deploy/nginx-hb-canvas.conf.example /etc/nginx/conf.d/hb-canvas.conf
printf '用户名:$(openssl passwd -apr1 密码)\n' > /etc/nginx/.htpasswd-canvas
chmod 640 /etc/nginx/.htpasswd-canvas
nginx -t && systemctl reload nginx

# 5. Cloudflare Tunnel
#    修改 /etc/cloudflared/canvas.yml，加一条 hostname: hb.cauai.fun → http://127.0.0.1:18085
systemctl enable --now cloudflared-canvas

# 6. Cloudflare 后台加 DNS：CNAME  hb → <tunnel-uuid>.cfargotunnel.com（代理状态：已代理）
```

## 日常更新

PR 合进 master 后，在本机仓库根目录执行：

```bash
bash scripts/deploy/publish.sh
```

它会用线上参数构建前端（`/agnes` + 访问令牌）、打包上传、在服务器做原子切换并重載 nginx。
访问令牌默认从本机 `agnes-video-proxy/.env` 的 `PROXY_ACCESS_TOKEN` 读取，也可以用 `CANVAS_ACCESS_TOKEN=xxx` 传入。

## 回滚

```bash
ssh <服务器>
ls -1dt /opt/infinite-canvas/releases/canvas-*
ln -sfn /opt/infinite-canvas/releases/<要回到的那个版本> /opt/infinite-canvas/current
systemctl reload nginx
```

## 排查

```bash
systemctl status agnes-video-proxy cloudflared-canvas
journalctl -u agnes-video-proxy -n 50 --no-pager
tail -f /opt/agnes-video-proxy/proxy.log      # 代理自己落盘的日志
curl -u 用户名:密码 http://127.0.0.1:18085/agnes/v1/models
```

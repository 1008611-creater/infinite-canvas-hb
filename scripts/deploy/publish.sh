#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 本机发布脚本（Git Bash / Linux / macOS 均可跑）
#
#   1. 用线上参数构建前端（VITE_AGNES_BASE_URL=/agnes，VITE_AGNES_API_KEY=访问令牌）
#   2. 把「前端产物 + Agnes 代理代码」打成一个 release 包
#   3. 上传到服务器并触发 scripts/deploy/deploy.sh 做原子切换
#
# 用法：
#   bash scripts/deploy/publish.sh
#
# 可用环境变量覆盖：
#   CANVAS_SSH_HOST        默认 psyidc-liuliang5（~/.ssh/config 里的别名，端口/密钥都在那）
#   CANVAS_APP_ROOT        默认 /opt/infinite-canvas
#   CANVAS_PROXY_ROOT      默认 /opt/agnes-video-proxy
#   CANVAS_AGNES_BASE_URL  默认 /agnes（同域反代，不要改成带域名的地址）
#   CANVAS_ACCESS_TOKEN    默认读取本机 agnes-video-proxy/.env 里的 PROXY_ACCESS_TOKEN
#   CANVAS_SITE_PASSWORD   站点登录密码（只输密码、不要用户名），默认 lsb123456
#   CANVAS_RUNTIME         docker（默认）| systemd
# ---------------------------------------------------------------------------
set -euo pipefail

SSH_HOST="${CANVAS_SSH_HOST:-haika-kidswear-1757}"
APP_ROOT="${CANVAS_APP_ROOT:-/opt/infinite-canvas}"

# -n 必须加：ssh 默认会把脚本自己的 stdin 吃掉，导致 ssh 之后的命令读不到输入，
# bash 会报 "line N: unexpected EOF while looking for matching `\"'" 且后面的步骤静默不执行。
SSH=(ssh -n)
AGNES_BASE_URL_VALUE="${CANVAS_AGNES_BASE_URL:-/agnes}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# 临时文件一律放在仓库内，用相对路径。
#
# 别用 mktemp：Windows / Git Bash 下它返回的是 C:\Users\...\Temp\tmp.XXX 这种混合路径，
# 而环境里的 rm 被安全删除机制包了一层，会把它当相对路径拼到当前目录后面
# （变成 <仓库>/C:/Users/...），canonicalize 失败 → rm 返回非 0 → set -e 直接中断发布，
# 而且没有任何错误输出，只看到脚本「卡在上传那一步」。
# 仓库内的相对路径 tar / scp / rm 三者都能处理。
TMP_DIR=".deploy-tmp"
mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR" 2>/dev/null || true' EXIT

# 访问令牌：优先用环境变量，其次读本机代理 .env，两者都没有就报错（否则线上代理会 401）
ACCESS_TOKEN="${CANVAS_ACCESS_TOKEN:-}"
if [[ -z "$ACCESS_TOKEN" && -f agnes-video-proxy/.env ]]; then
    ACCESS_TOKEN="$(grep -E '^PROXY_ACCESS_TOKEN=' agnes-video-proxy/.env | head -1 | cut -d= -f2- | tr -d '\r"'"'"' ' || true)"
fi
if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "✗ 没拿到 PROXY_ACCESS_TOKEN。请在 agnes-video-proxy/.env 里配置，或用 CANVAS_ACCESS_TOKEN=xxx 传入。"
    echo "  这个值必须与服务器上 agnes-video-proxy/.env 里的 PROXY_ACCESS_TOKEN 完全一致。"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "✗ 本机没找到 npm，无法构建前端。"
    exit 1
fi

COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RELEASE="canvas-${STAMP}-${COMMIT}"

echo "==> 构建前端（agnes=$AGNES_BASE_URL_VALUE）"
cd web
# 这两个值是编译进 JS 的，运行时改不了，必须在构建时注入。
# 漏了 VITE_AGNES_BASE_URL 的话，产物里就是默认的 localhost:8787——
# 页面照样打得开、回环自检照样 200，但访客浏览器会去连他自己的电脑，视频功能全废。
VITE_AGNES_BASE_URL="$AGNES_BASE_URL_VALUE" \
VITE_AGNES_API_KEY="$ACCESS_TOKEN" \
    npm run build
cd "$ROOT"

# 产物校验：构建日志看着正常不代表值真的注入了，直接搜产物
if ! grep -rqF "$AGNES_BASE_URL_VALUE" web/dist/assets/*.js 2>/dev/null; then
    echo "✗ 构建产物里找不到 ${AGNES_BASE_URL_VALUE}，VITE_AGNES_BASE_URL 没注入，中止发布"
    exit 1
fi
echo "==> 产物校验通过：已注入 ${AGNES_BASE_URL_VALUE}"

echo "==> 打包 $RELEASE"
STAGE="$TMP_DIR/stage"
rm -rf "$STAGE" 2>/dev/null || true
mkdir -p "$STAGE/dist" "$STAGE/proxy"
cp -r web/dist/. "$STAGE/dist/"
cp agnes-video-proxy/server.js agnes-video-proxy/package.json "$STAGE/proxy/"
printf 'release=%s\ncommit=%s\nbuilt_at=%s\nagnes_base_url=%s\n' \
    "$RELEASE" "$COMMIT" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$AGNES_BASE_URL_VALUE" > "$STAGE/dist/BUILD_INFO.txt"
TARBALL="$TMP_DIR/${RELEASE}.tar.gz"
tar -czf "$TARBALL" -C "$STAGE" dist proxy

echo "==> 上传并部署到 ${SSH_HOST}:${APP_ROOT}"
"${SSH[@]}" "$SSH_HOST" "mkdir -p ${APP_ROOT}/releases ${APP_ROOT}/scripts/deploy ${APP_ROOT}/nginx ${CANVAS_PROXY_ROOT:-/opt/agnes-video-proxy}"

# Windows 工作区里的文本文件是 CRLF，Linux 的 bash / systemd / nginx 遇到 CRLF 会直接报错
# （典型症状：set: pipefail\r: invalid option name），所以脚本和配置上传前统一转成 LF。
upload_lf() {
    local src="$1" dest="$2" tmp
    tmp="$TMP_DIR/upload.tmp"
    sed 's/\r$//' "$src" > "$tmp"
    scp "$tmp" "${SSH_HOST}:${dest}"
    : > "$tmp"   # 清空内容而不是删除文件：rm 在这个环境里会被安全删除机制拦下
}

scp "$TARBALL" "${SSH_HOST}:${APP_ROOT}/releases/${RELEASE}.tar.gz"
upload_lf scripts/deploy/deploy.sh "${APP_ROOT}/scripts/deploy/deploy.sh"

# 同步服务器配置文件（幂等，改了仓库里的模板就会跟着生效）
upload_lf deploy/docker-compose.yml "${APP_ROOT}/docker-compose.yml"
upload_lf deploy/nginx-docker.conf "${APP_ROOT}/nginx/default.conf"

# ---------------------------------------------------------------------------
# 站点门禁：只输密码，不要用户名
#
# Basic Auth 协议上强制带用户名，做不到「只输密码」，所以改成 cookie 门禁：
# 密码存在服务端 .env，登录页 POST 给代理校验，通过才下发 canvas_auth 这个 cookie。
#
# AUTH_COOKIE 必须持久化：它就是「已登录」的凭证，每次部署都换的话，
# 用户会被迫反复登录。所以首次生成后写进服务器 .env，之后一律复用。
# ---------------------------------------------------------------------------
PROXY_ROOT="${CANVAS_PROXY_ROOT:-/opt/agnes-video-proxy}"
SITE_PASSWORD="${CANVAS_SITE_PASSWORD:-lsb123456}"
ENV_FILE="${PROXY_ROOT}/.env"
ENV_CHANGED=0

remote_env_get() {
    "${SSH[@]}" "$SSH_HOST" "grep -E '^${2}=' '$1' 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r'" 2>/dev/null || true
}
# 返回 0 表示值确实变了（环境变量要重建容器才生效，所以需要标记一下）
remote_env_set() {
    local file="$1" key="$2" value="$3"
    if [[ "$(remote_env_get "$file" "$key")" == "$value" ]]; then
        return 1
    fi
    "${SSH[@]}" "$SSH_HOST" "touch '$file'; chmod 600 '$file'; \
        if grep -q '^${key}=' '$file' 2>/dev/null; then \
            sed -i 's|^${key}=.*|${key}=${value}|' '$file'; \
        else \
            printf '${key}=%s\n' '${value}' >> '$file'; \
        fi"
    return 0
}

AUTH_COOKIE="$(remote_env_get "$ENV_FILE" AUTH_COOKIE)"
if [[ -z "$AUTH_COOKIE" ]]; then
    AUTH_COOKIE="$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    echo "==> 首次部署：生成登录凭证"
fi
remote_env_set "$ENV_FILE" AUTH_COOKIE "$AUTH_COOKIE" && ENV_CHANGED=1
remote_env_set "$ENV_FILE" SITE_PASSWORD "$SITE_PASSWORD" && ENV_CHANGED=1
echo "==> 站点密码已设为 ${SITE_PASSWORD}（登录凭证固定不变）"

# 替换占位符。用「重定向回写」而不是 sed -i：sed -i 会换 inode，
# 当年单文件挂载时就栽在这上面（容器一直读旧内容），原地写最稳。
"${SSH[@]}" "$SSH_HOST" "cd ${APP_ROOT}/nginx && \
    sed -e 's|__AGNES_TOKEN__|${ACCESS_TOKEN}|g' -e 's|__AUTH_COOKIE__|${AUTH_COOKIE}|g' default.conf > .default.conf.new && \
    cat .default.conf.new > default.conf && rm -f .default.conf.new && \
    (grep -c '__AGNES_TOKEN__\|__AUTH_COOKIE__' default.conf || true)"

upload_lf deploy/Dockerfile.proxy "${PROXY_ROOT}/Dockerfile"
# 隧道服务单元（老大在 CF 后台建好 tunnel 后，用它在服务器上把隧道跑起来）
upload_lf deploy/cloudflared-canvas.service "${APP_ROOT}/cloudflared-canvas.service"

# 代理的 .env（含 Agnes 上游 Key 与访问令牌）不在 git 里，需要单独同步。
# 只在服务器还没建过时才上传，避免覆盖线上手工改过的配置；改了本机 .env 想同步就手动删服务器上那份再跑。
if [[ -f agnes-video-proxy/.env ]]; then
    if "${SSH[@]}" "$SSH_HOST" "test -f ${PROXY_ROOT}/.env"; then
        echo "==> 服务器已有 ${PROXY_ROOT}/.env，跳过同步（如需覆盖请先手动删除）"
    else
        echo "==> 首次部署：上传 agnes-video-proxy/.env"
        upload_lf agnes-video-proxy/.env "${PROXY_ROOT}/.env"
        "${SSH[@]}" "$SSH_HOST" "chmod 600 ${PROXY_ROOT}/.env"
    fi
else
    echo "⚠ 本机没有 agnes-video-proxy/.env，服务器若也没有，代理会因缺 Agnes Key 而生成失败"
fi

"${SSH[@]}" "$SSH_HOST" "CANVAS_RUNTIME=${CANVAS_RUNTIME:-docker} bash ${APP_ROOT}/scripts/deploy/deploy.sh ${APP_ROOT}/releases/${RELEASE}.tar.gz"

# 环境变量是容器启动时注入的：.env 改了不重建容器就不会生效，
# 表现为「密码明明改了却还是旧的」，而且看日志看不出来，只能靠这里兜住。
if [[ "$ENV_CHANGED" == "1" ]]; then
    echo "==> 代理配置有变更，重建容器让新环境变量生效"
    "${SSH[@]}" "$SSH_HOST" "cd ${APP_ROOT} && docker compose up -d --force-recreate agnes 2>&1 | tail -3"
fi

echo "==> 完成：$RELEASE 已上线"
# 临时目录由上面的 trap 清理

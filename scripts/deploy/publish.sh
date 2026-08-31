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
#   CANVAS_RUNTIME         docker（默认）| systemd
#   CANVAS_BASIC_AUTH      "用户名:密码"，首次部署时生成 Basic Auth（已存在则不覆盖）
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
STAGE="$(mktemp -d)"
mkdir -p "$STAGE/dist" "$STAGE/proxy"
cp -r web/dist/. "$STAGE/dist/"
cp agnes-video-proxy/server.js agnes-video-proxy/package.json "$STAGE/proxy/"
printf 'release=%s\ncommit=%s\nbuilt_at=%s\nagnes_base_url=%s\n' \
    "$RELEASE" "$COMMIT" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$AGNES_BASE_URL_VALUE" > "$STAGE/dist/BUILD_INFO.txt"
TARBALL="$(mktemp -d)/${RELEASE}.tar.gz"
tar -czf "$TARBALL" -C "$STAGE" dist proxy

echo "==> 上传并部署到 ${SSH_HOST}:${APP_ROOT}"
"${SSH[@]}" "$SSH_HOST" "mkdir -p ${APP_ROOT}/releases ${APP_ROOT}/scripts/deploy ${APP_ROOT}/nginx ${APP_ROOT}/secrets ${CANVAS_PROXY_ROOT:-/opt/agnes-video-proxy}"

# Windows 工作区里的文本文件是 CRLF，Linux 的 bash / systemd / nginx 遇到 CRLF 会直接报错
# （典型症状：set: pipefail\r: invalid option name），所以脚本和配置上传前统一转成 LF。
upload_lf() {
    local src="$1" dest="$2" tmp
    tmp="$(mktemp)"
    sed 's/\r$//' "$src" > "$tmp"
    scp "$tmp" "${SSH_HOST}:${dest}"
    rm -f "$tmp"
}

scp "$TARBALL" "${SSH_HOST}:${APP_ROOT}/releases/${RELEASE}.tar.gz"
upload_lf scripts/deploy/deploy.sh "${APP_ROOT}/scripts/deploy/deploy.sh"

# 同步服务器配置文件（幂等，改了仓库里的模板就会跟着生效）
upload_lf deploy/docker-compose.yml "${APP_ROOT}/docker-compose.yml"
upload_lf deploy/nginx-docker.conf "${APP_ROOT}/nginx/default.conf"
"${SSH[@]}" "$SSH_HOST" "sed -i 's|__AGNES_TOKEN__|${ACCESS_TOKEN}|' ${APP_ROOT}/nginx/default.conf"

# 兼容迁移：早期把 Basic Auth 放在 /etc/nginx/.htpasswd-canvas（单文件挂载，改密码后容器读不到）
"${SSH[@]}" "$SSH_HOST" "if [[ ! -f ${APP_ROOT}/secrets/htpasswd && -f /etc/nginx/.htpasswd-canvas ]]; then \
        cp /etc/nginx/.htpasswd-canvas ${APP_ROOT}/secrets/htpasswd; \
        echo '==> 已迁移 Basic Auth 到 ${APP_ROOT}/secrets/htpasswd'; \
    fi; \
    chmod 644 ${APP_ROOT}/secrets/htpasswd 2>/dev/null || true"
upload_lf deploy/Dockerfile.proxy "${CANVAS_PROXY_ROOT:-/opt/agnes-video-proxy}/Dockerfile"
# 隧道服务单元（老大在 CF 后台建好 tunnel 后，用它在服务器上把隧道跑起来）
upload_lf deploy/cloudflared-canvas.service "${APP_ROOT}/cloudflared-canvas.service"

# 代理的 .env（含 Agnes 上游 Key 与访问令牌）不在 git 里，需要单独同步。
# 只在服务器还没建过时才上传，避免覆盖线上手工改过的配置；改了本机 .env 想同步就手动删服务器上那份再跑。
PROXY_ROOT="${CANVAS_PROXY_ROOT:-/opt/agnes-video-proxy}"
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

# 首次部署时生成 Basic Auth 账号密码（已存在则不覆盖，避免把改过的密码冲掉）
if [[ -n "${CANVAS_BASIC_AUTH:-}" ]]; then
    "${SSH[@]}" "$SSH_HOST" "command -v openssl >/dev/null || { echo '✗ 服务器没有 openssl，无法生成密码'; exit 1; }; \
        mkdir -p ${APP_ROOT}/secrets; \
        H=\$(openssl passwd -apr1 '${CANVAS_BASIC_AUTH#*:}'); \
        grep -q '^${CANVAS_BASIC_AUTH%%:*}:' ${APP_ROOT}/secrets/htpasswd 2>/dev/null \
            || printf '%s:%s\n' '${CANVAS_BASIC_AUTH%%:*}' \"\$H\" >> ${APP_ROOT}/secrets/htpasswd; \
        chmod 644 ${APP_ROOT}/secrets/htpasswd"
    # 644 不能改成 640：读取这个文件的是 nginx 的 worker 进程（docker 官方镜像里是 nginx 用户），
    # 权限不够时「没输密码」看着正常（直接返 401），但「输对密码」反而 500，排查时极易误判。
fi

"${SSH[@]}" "$SSH_HOST" "CANVAS_RUNTIME=${CANVAS_RUNTIME:-docker} bash ${APP_ROOT}/scripts/deploy/deploy.sh ${APP_ROOT}/releases/${RELEASE}.tar.gz"

rm -rf "$STAGE" "$(dirname "$TARBALL")"
echo "==> 完成：$RELEASE 已上线"

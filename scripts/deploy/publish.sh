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
#   CANVAS_AGNES_BASE_URL  默认 /agnes（同域反代，不要改成带域名的地址）
#   CANVAS_ACCESS_TOKEN    默认读取本机 agnes-video-proxy/.env 里的 PROXY_ACCESS_TOKEN
# ---------------------------------------------------------------------------
set -euo pipefail

SSH_HOST="${CANVAS_SSH_HOST:-psyidc-liuliang5}"
APP_ROOT="${CANVAS_APP_ROOT:-/opt/infinite-canvas}"
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

echo "==> 构建前端（base=$AGNES_BASE_URL_VALUE）"
cd web
npm run build
cd "$ROOT"

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
ssh "$SSH_HOST" "mkdir -p ${APP_ROOT}/releases ${APP_ROOT}/scripts/deploy"
scp "$TARBALL" "${SSH_HOST}:${APP_ROOT}/releases/${RELEASE}.tar.gz"
scp scripts/deploy/deploy.sh "${SSH_HOST}:${APP_ROOT}/scripts/deploy/deploy.sh"
ssh "$SSH_HOST" "bash ${APP_ROOT}/scripts/deploy/deploy.sh ${APP_ROOT}/releases/${RELEASE}.tar.gz"

rm -rf "$STAGE" "$(dirname "$TARBALL")"
echo "==> 完成：$RELEASE 已上线"

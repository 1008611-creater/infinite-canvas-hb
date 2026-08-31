#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 服务器端部署脚本（由 scripts/deploy/publish.sh 远程调用，也可以手动跑）
#
#   bash /opt/infinite-canvas/scripts/deploy/deploy.sh /opt/infinite-canvas/releases/canvas-xxx.tar.gz
#
# 流程：解压到 releases/<版本> → 原子切换 current 软链 → 更新 Agnes 代理 → 校验并重载 nginx。
# 任何一步失败都会退出，不会把线上切到半成品（软链只在解压成功后才切换）。
#
# 两种运行方式：
#   CANVAS_RUNTIME=docker   （默认）静态文件由 compose 挂载，代理跑在容器里
#   CANVAS_RUNTIME=systemd  静态文件由宿主机 nginx 托管，代理跑在 systemd 里
# ---------------------------------------------------------------------------
set -euo pipefail

APP_ROOT="${CANVAS_APP_ROOT:-/opt/infinite-canvas}"
PROXY_ROOT="${CANVAS_PROXY_ROOT:-/opt/agnes-video-proxy}"
RUNTIME="${CANVAS_RUNTIME:-docker}"
TARBALL="${1:-}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

if [[ -z "$TARBALL" || ! -f "$TARBALL" ]]; then
    echo "用法: bash $0 <release.tar.gz>"
    exit 1
fi

COMPOSE_FILE="${APP_ROOT}/docker-compose.yml"
compose() { docker compose -f "$COMPOSE_FILE" --project-directory "$APP_ROOT" "$@"; }

RELEASES_DIR="${APP_ROOT}/releases"
NAME="$(basename "$TARBALL" .tar.gz)"
TARGET="${RELEASES_DIR}/${NAME}"

echo "==> 解压 ${NAME}"
rm -rf "$TARGET"
mkdir -p "$TARGET"
tar -xzf "$TARBALL" -C "$TARGET"

if [[ ! -f "${TARGET}/dist/index.html" ]]; then
    echo "✗ 包里没有 dist/index.html，拒绝上线"
    exit 1
fi

echo "==> 切换 current 软链"
# 必须是「相对」软链：current 会被挂进 nginx 容器（路径变成 /usr/share/nginx/canvas/current），
# 用绝对路径的话容器里解析不到 /opt/infinite-canvas，root 目录不存在，所有请求 500。
ln -sfn "releases/${NAME}" "${APP_ROOT}/current"

if [[ -f "${TARGET}/proxy/server.js" ]] && ! cmp -s "${TARGET}/proxy/server.js" "${PROXY_ROOT}/server.js"; then
    echo "==> 更新 Agnes 代理代码"
    install -d "$PROXY_ROOT"
    cp "${TARGET}/proxy/server.js" "${PROXY_ROOT}/server.js"
    cp "${TARGET}/proxy/package.json" "${PROXY_ROOT}/package.json" 2>/dev/null || true
    if [[ "$RUNTIME" == "docker" ]]; then
        compose build agnes
        compose up -d agnes
    else
        systemctl restart agnes-video-proxy
    fi
    sleep 2
fi

echo "==> 校验并重载 nginx"
if [[ "$RUNTIME" == "docker" ]]; then
    # 幂等：容器不存在就创建，存在就确保在运行
    compose up -d
    sleep 2
    compose exec -T web nginx -t
    compose exec -T web nginx -s reload
else
    nginx -t
    systemctl reload nginx
fi
curl -sS -o /dev/null -w "本地回环自检: %{http_code}\n" --max-time 5 http://127.0.0.1:18085/ || true

# 版本自愈：软链切换后，容器挂载的如果是「会换 inode 的路径」（老配置里的 current/dist），
# 它会继续服务旧版本——发布日志一片绿，线上却没变。这里核对容器实际在跑的版本，不一致就重建。
EXPECTED_RELEASE="$(sed -n 's/^release=//p' "${TARGET}/dist/BUILD_INFO.txt" 2>/dev/null || true)"
if [[ -n "$EXPECTED_RELEASE" && "$RUNTIME" == "docker" ]]; then
    ACTUAL_RELEASE="$(curl -sS --max-time 5 http://127.0.0.1:18085/BUILD_INFO.txt 2>/dev/null \
        | sed -n 's/^release=//p' | tr -d '\r' || true)"
    if [[ "$ACTUAL_RELEASE" != "$EXPECTED_RELEASE" ]]; then
        echo "==> 容器还在跑旧版本（期望 ${EXPECTED_RELEASE}，实际 ${ACTUAL_RELEASE:-读不到}），重建 web 容器"
        compose up -d --force-recreate web
        sleep 3
        ACTUAL_RELEASE="$(curl -sS --max-time 5 http://127.0.0.1:18085/BUILD_INFO.txt 2>/dev/null \
            | sed -n 's/^release=//p' | tr -d '\r' || true)"
        if [[ "$ACTUAL_RELEASE" != "$EXPECTED_RELEASE" ]]; then
            echo "✗ 重建后版本仍不对（实际 ${ACTUAL_RELEASE:-读不到}），请上服务器排查"
        fi
    else
        echo "==> 版本校验通过：${ACTUAL_RELEASE}"
    fi
fi

echo "==> 清理旧版本（保留最近 ${KEEP_RELEASES} 个）"
ls -1dt "${RELEASES_DIR}"/canvas-* 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo "==> 当前版本：$(readlink "${APP_ROOT}/current")"
cat "${TARGET}/dist/BUILD_INFO.txt" 2>/dev/null || true

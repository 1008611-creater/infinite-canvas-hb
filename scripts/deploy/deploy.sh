#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 服务器端部署脚本（由 scripts/deploy/publish.sh 远程调用，也可以手动跑）
#
#   bash /opt/infinite-canvas/scripts/deploy/deploy.sh /opt/infinite-canvas/releases/canvas-xxx.tar.gz
#
# 流程：解压到 releases/<版本> → 原子切换 current 软链 → 更新后端代码（代理 + 云端同步）→ 校验并重载 nginx。
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

# 后端代码（Agnes 代理 + 云端同步 WebDAV）变更检测。
#
# 不要再退回「拿 server.js 单文件做 cmp」：新增兄弟模块（比如 webdav.js）时它不会触发重建，
# 发布日志一片绿，线上却还是旧镜像，还得上服务器手动 build 一次。
# 指纹由发布机（publish.sh）算好随包带过来，覆盖 proxy/ 下全部代码。
NEED_PROXY_UPDATE=0
FINGERPRINT_STAMP="${PROXY_ROOT}/PROXY_FINGERPRINT"
PACKAGE_FINGERPRINT="$(cat "${TARGET}/proxy/PROXY_FINGERPRINT" 2>/dev/null | tr -d '\r\n' || true)"
CURRENT_FINGERPRINT="$(cat "$FINGERPRINT_STAMP" 2>/dev/null | tr -d '\r\n' || true)"

# 指纹文件可能因人工清理、旧版本迁移或恢复操作而与实际文件脱钩；
# 运行时必需模块缺失时，即使指纹相同也必须重新复制并重建。
for required_module in server.js webdav.js idempotency-store.js request-fingerprint.js package.json; do
    if [[ ! -f "${PROXY_ROOT}/${required_module}" ]]; then
        NEED_PROXY_UPDATE=1
        echo "⚠ 服务器缺少代理运行时文件 ${required_module}，将强制同步"
    fi
done

if [[ -n "$PACKAGE_FINGERPRINT" ]]; then
    if [[ "$PACKAGE_FINGERPRINT" != "$CURRENT_FINGERPRINT" ]]; then
        NEED_PROXY_UPDATE=1
    fi
elif [[ -f "${TARGET}/proxy/server.js" ]] && ! cmp -s "${TARGET}/proxy/server.js" "${PROXY_ROOT}/server.js"; then
    # 兼容旧发布包（没有指纹文件）：退回单文件比对，至少不会漏掉 server.js 的改动
    echo "⚠ 发布包里没有后端代码指纹，退回按 server.js 单文件比对"
    NEED_PROXY_UPDATE=1
    PACKAGE_FINGERPRINT="legacy-$(date -u +%Y%m%d%H%M%S)"
fi

if [[ "$NEED_PROXY_UPDATE" == "1" ]]; then
    echo "==> 更新后端代码（Agnes 代理 + 云端同步）"
    install -d "$PROXY_ROOT"
    cp "${TARGET}/proxy/server.js" "${PROXY_ROOT}/server.js"
    cp "${TARGET}/proxy/package.json" "${PROXY_ROOT}/package.json" 2>/dev/null || true
    for module in idempotency-store.js request-fingerprint.js; do
        if [[ -f "${TARGET}/proxy/${module}" ]]; then
            cp "${TARGET}/proxy/${module}" "${PROXY_ROOT}/${module}"
        else
            echo "✗ 包里缺少 ${module}，代理无法启动，发布中止"
            exit 1
        fi
    done
    if [[ -f "${TARGET}/proxy/webdav.js" ]]; then
        cp "${TARGET}/proxy/webdav.js" "${PROXY_ROOT}/webdav.js"
    else
        echo "⚠ 包里没有 webdav.js，云端同步不会启动"
        rm -f "${PROXY_ROOT}/webdav.js" 2>/dev/null || true
    fi
    printf '%s\n' "$PACKAGE_FINGERPRINT" > "$FINGERPRINT_STAMP"
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
#
# 站点有 cookie 门禁，不带 cookie 请求会被 302 到登录页，curl 拿到的是空内容。
# 不带上凭证就会误判成「版本读不到」，进而每次发布都白重建一次 web 容器（还会打印一条假的失败告警）。
AUTH_COOKIE_VALUE="$(grep -E '^AUTH_COOKIE=' "${PROXY_ENV_FILE:-/opt/agnes-video-proxy/.env}" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r' || true)"
CURL_AUTH=()
if [[ -n "$AUTH_COOKIE_VALUE" ]]; then
    CURL_AUTH=(-H "Cookie: canvas_auth=${AUTH_COOKIE_VALUE}")
fi
read_served_release() {
    curl -sS --max-time 5 "${CURL_AUTH[@]}" http://127.0.0.1:18085/BUILD_INFO.txt 2>/dev/null \
        | sed -n 's/^release=//p' | tr -d '\r' || true
}
EXPECTED_RELEASE="$(sed -n 's/^release=//p' "${TARGET}/dist/BUILD_INFO.txt" 2>/dev/null || true)"
if [[ -n "$EXPECTED_RELEASE" && "$RUNTIME" == "docker" ]]; then
    ACTUAL_RELEASE="$(read_served_release)"
    if [[ "$ACTUAL_RELEASE" != "$EXPECTED_RELEASE" ]]; then
        echo "==> 容器还在跑旧版本（期望 ${EXPECTED_RELEASE}，实际 ${ACTUAL_RELEASE:-读不到}），重建 web 容器"
        compose up -d --force-recreate web
        sleep 3
        ACTUAL_RELEASE="$(read_served_release)"
        if [[ "$ACTUAL_RELEASE" != "$EXPECTED_RELEASE" ]]; then
            echo "✗ 重建后版本仍不对（实际 ${ACTUAL_RELEASE:-读不到}），请上服务器排查"
        else
            echo "==> 重建后版本校验通过：${ACTUAL_RELEASE}"
        fi
    else
        echo "==> 版本校验通过：${ACTUAL_RELEASE}"
    fi
fi

echo "==> 清理旧版本（保留最近 ${KEEP_RELEASES} 个）"
ls -1dt "${RELEASES_DIR}"/canvas-* 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo "==> 当前版本：$(readlink "${APP_ROOT}/current")"
cat "${TARGET}/dist/BUILD_INFO.txt" 2>/dev/null || true

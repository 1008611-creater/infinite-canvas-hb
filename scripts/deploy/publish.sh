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
#   CANVAS_SITE_PASSWORD   站点登录密码（只输密码、不要用户名）。
#                          不设默认值：未设置时脚本会中止并提示，避免密码进仓库。
#                          权威值只在服务器 /opt/agnes-video-proxy/.env 的 SITE_PASSWORD。
#   CANVAS_RUNTIME         docker（默认）| systemd
# ---------------------------------------------------------------------------
set -euo pipefail

SSH_HOST="${CANVAS_SSH_HOST:-haika-kidswear-1757}"
APP_ROOT="${CANVAS_APP_ROOT:-/opt/infinite-canvas}"

# 紫域（ziyuai.vip）上游 Key —— 只从命令行参数或环境变量读，绝不写进仓库。
#   优先级：--ziyu-key=<key>  >  $CANVAS_ZIYU_API_KEY
#   ${VAR:-} 的写法不是啰嗦：脚本开头是 set -euo pipefail，裸写 $CANVAS_ZIYU_API_KEY
#   在变量未设置时会先崩在「unbound variable」，下面那段友好提示永远走不到。
ZIYU_API_KEY="${CANVAS_ZIYU_API_KEY:-}"
for CANVAS_ARG in "$@"; do
    case "$CANVAS_ARG" in
        --ziyu-key=*) ZIYU_API_KEY="${CANVAS_ARG#--ziyu-key=}" ;;
    esac
done

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
mkdir -p "$STAGE/dist" "$STAGE/proxy" "$STAGE/api"
cp -r web/dist/. "$STAGE/dist/"
cp agnes-video-proxy/server.js agnes-video-proxy/idempotency-store.js agnes-video-proxy/request-fingerprint.js agnes-video-proxy/package.json "$STAGE/proxy/"
# 云端同步服务（WebDAV）：源码在 canvas-webdav/，进容器后与代理同目录，名字固定为 webdav.js
# （agnes-video-proxy/server.js 里就是按 ./webdav 去 require 的）。
cp canvas-webdav/server.js "$STAGE/proxy/webdav.js"
# 服务端 API（账号 / 项目 / 素材 / 媒体）：源码在 canvas-api/，落到服务器 /opt/infinite-canvas/api
cp canvas-api/server.js canvas-api/db.js canvas-api/auth.js canvas-api/schema.sql canvas-api/credits.js canvas-api/ldxp-redeem.js canvas-api/ziyu.js canvas-api/routes-credits.js canvas-api/email.js canvas-api/email-verify.js canvas-api/package.json "$STAGE/api/"

# 后端代码指纹：deploy.sh 靠它决定「要不要重建 agnes 镜像」。
# 以前是拿 server.js 单文件做 cmp，结果新增 webdav.js 这种兄弟模块时不会触发重建，
# 表现为「发布全绿、新功能却没上线」，还得上服务器手动 docker compose build。
# 现在把 proxy/ 下所有代码一起算进指纹。
proxy_fingerprint() {
    # 优先用 openssl（脚本前面已经在用它生成随机串），没有就退回 sha256sum。
    # 末尾的 `|| true` 是有意为之：文件缺失时这里不该直接中断整个发布，
    # 让调用方用一句人话报错（见下面的指纹为空检查）。
    if command -v openssl >/dev/null 2>&1; then
        cat "$STAGE/proxy/server.js" "$STAGE/proxy/webdav.js" "$STAGE/proxy/idempotency-store.js" "$STAGE/proxy/request-fingerprint.js" "$STAGE/proxy/package.json" 2>/dev/null | openssl dgst -sha256 -r | cut -d' ' -f1 || true
    else
        cat "$STAGE/proxy/server.js" "$STAGE/proxy/webdav.js" "$STAGE/proxy/idempotency-store.js" "$STAGE/proxy/request-fingerprint.js" "$STAGE/proxy/package.json" 2>/dev/null | sha256sum | cut -d' ' -f1 || true
    fi
}
PROXY_FINGERPRINT="$(proxy_fingerprint)"
if [[ -z "$PROXY_FINGERPRINT" ]]; then
    echo "✗ 算不出后端代码指纹（缺 server.js / webdav.js / idempotency-store.js / request-fingerprint.js / package.json？），中止发布"
    exit 1
fi
printf '%s\n' "$PROXY_FINGERPRINT" > "$STAGE/proxy/PROXY_FINGERPRINT"
echo "==> 后端代码指纹 ${PROXY_FINGERPRINT:0:12}"

# API 代码指纹：同理，api/ 下所有源码一起算，避免改了 db.js 却不重建镜像。
api_fingerprint() {
    if command -v openssl >/dev/null 2>&1; then
        cat "$STAGE/api/server.js" "$STAGE/api/db.js" "$STAGE/api/auth.js" "$STAGE/api/schema.sql" "$STAGE/api/credits.js" "$STAGE/api/ldxp-redeem.js" "$STAGE/api/ziyu.js" "$STAGE/api/routes-credits.js" "$STAGE/api/email.js" "$STAGE/api/email-verify.js" "$STAGE/api/package.json" 2>/dev/null | openssl dgst -sha256 -r | cut -d ' ' -f1 || true
    else
        cat "$STAGE/api/server.js" "$STAGE/api/db.js" "$STAGE/api/auth.js" "$STAGE/api/schema.sql" "$STAGE/api/credits.js" "$STAGE/api/ldxp-redeem.js" "$STAGE/api/ziyu.js" "$STAGE/api/routes-credits.js" "$STAGE/api/email.js" "$STAGE/api/email-verify.js" "$STAGE/api/package.json" 2>/dev/null | sha256sum | cut -d ' ' -f1 || true
    fi
}
API_FINGERPRINT="$(api_fingerprint)"
if [[ -z "$API_FINGERPRINT" ]]; then
    echo "✗ 算不出 API 代码指纹（缺 canvas-api/ 下的文件？），中止发布"
    exit 1
fi
printf '%s\n' "$API_FINGERPRINT" > "$STAGE/api/API_FINGERPRINT"
echo "==> API 代码指纹 ${API_FINGERPRINT:0:12}"

printf 'release=%s\ncommit=%s\nbuilt_at=%s\nagnes_base_url=%s\n' \
    "$RELEASE" "$COMMIT" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$AGNES_BASE_URL_VALUE" > "$STAGE/dist/BUILD_INFO.txt"
TARBALL="$TMP_DIR/${RELEASE}.tar.gz"
tar -czf "$TARBALL" -C "$STAGE" dist proxy api

echo "==> 上传并部署到 ${SSH_HOST}:${APP_ROOT}"
"${SSH[@]}" "$SSH_HOST" "mkdir -p ${APP_ROOT}/releases ${APP_ROOT}/scripts/deploy ${APP_ROOT}/nginx ${APP_ROOT}/api ${CANVAS_PROXY_ROOT:-/opt/agnes-video-proxy} ${CANVAS_WEBDAV_DATA:-/opt/canvas-webdav} ${CANVAS_API_MEDIA:-/opt/canvas-api-media} ${CANVAS_API_SYNC:-/opt/canvas-api-sync} ${CANVAS_POSTGRES_DATA:-/opt/canvas-postgres}"

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
# 站点密码**不设默认值**：默认密码写进脚本 = 写进仓库 = 泄露。
# 未显式提供时不覆盖服务器上的现值（AUTH_COOKIE/站点密码本就该长期固定）。
SITE_PASSWORD="${CANVAS_SITE_PASSWORD:-}"
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
if [[ -n "$SITE_PASSWORD" ]]; then
    remote_env_set "$ENV_FILE" SITE_PASSWORD "$SITE_PASSWORD" && ENV_CHANGED=1
    echo "==> 站点密码已更新（登录凭证固定不变）"
else
    echo "==> 未提供 CANVAS_SITE_PASSWORD：沿用服务器 ${ENV_FILE} 里现有的 SITE_PASSWORD，不改动"
fi

# 云端同步（WebDAV）凭据。
# 默认直接复用站点密码：少记一个密码，且「能进后台的人才能同步」，不会多开一个口子。
# 这一层走 Basic Auth（原生 WebDAV 客户端带不了站点的 cookie），
# 想单独换密码就用 CANVAS_WEBDAV_PASSWORD=xxx 跑发布。
WEBDAV_USER_VALUE="${CANVAS_WEBDAV_USER:-canvas}"
WEBDAV_PASSWORD_VALUE="${CANVAS_WEBDAV_PASSWORD:-$SITE_PASSWORD}"
remote_env_set "$ENV_FILE" WEBDAV_USER "$WEBDAV_USER_VALUE" && ENV_CHANGED=1
if [[ -n "$WEBDAV_PASSWORD_VALUE" ]]; then
    remote_env_set "$ENV_FILE" WEBDAV_PASSWORD "$WEBDAV_PASSWORD_VALUE" && ENV_CHANGED=1
    echo "==> 云端同步已配置：WebDAV 地址 https://hb.cauai.fun/dav ，用户名 ${WEBDAV_USER_VALUE}，密码同站点密码"
else
    # 站点密码与 WebDAV 密码都没显式提供时，绝不能拿空值覆盖服务器上的现值：
    # 那会把已经配好的云同步悄悄改成空密码，用户端表现为「同步突然连不上」，
    # 而发布日志里只有一行成功。这里沿用现值，只在服务器确实没有时提醒一次。
    if [[ -z "$(remote_env_get "$ENV_FILE" WEBDAV_PASSWORD)" ]]; then
        echo "警告：服务器 ${ENV_FILE} 里没有 WEBDAV_PASSWORD，且本次未提供 CANVAS_SITE_PASSWORD / CANVAS_WEBDAV_PASSWORD，云同步暂不可用"
    else
        echo "==> 未提供站点密码：沿用服务器 ${ENV_FILE} 里现有的 WebDAV 密码，不改动"
    fi
fi

# ---------------------------------------------------------------------------
# 服务端 API 的密钥与数据库口令
#
# 这两个值都必须持久化，理由和 AUTH_COOKIE 一样：每次部署都重新生成的话，
# JWT_SECRET 一换所有人的登录态立刻全掉，PG_PASSWORD 一换新容器就连不上老库
# （postgresql 的初始密码只在数据目录首次初始化时生效，改了也白改）。
# ---------------------------------------------------------------------------
API_ENV_FILE="${APP_ROOT}/api/api.env"
API_ENV_CHANGED=0
JWT_SECRET="$(remote_env_get "$API_ENV_FILE" JWT_SECRET)"
if [[ -z "$JWT_SECRET" ]]; then
    JWT_SECRET="$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    echo "==> 首次部署：生成 API 令牌密钥"
fi
PG_PASSWORD_VALUE="$(remote_env_get "$API_ENV_FILE" PG_PASSWORD)"
if [[ -z "$PG_PASSWORD_VALUE" ]]; then
    PG_PASSWORD_VALUE="$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    echo "==> 首次部署：生成数据库口令"
fi
remote_env_set "$API_ENV_FILE" JWT_SECRET "$JWT_SECRET" && API_ENV_CHANGED=1
remote_env_set "$API_ENV_FILE" PG_PASSWORD "$PG_PASSWORD_VALUE" && API_ENV_CHANGED=1
# 注册开关：老大建好自己账号后，用 CANVAS_ALLOW_REGISTER=0 跑一次发布就关掉公开注册
CANVAS_ALLOW_REGISTER_VALUE="${CANVAS_ALLOW_REGISTER:-1}"
remote_env_set "$API_ENV_FILE" ALLOW_REGISTER "$CANVAS_ALLOW_REGISTER_VALUE" && API_ENV_CHANGED=1
"${SSH[@]}" "$SSH_HOST" "chmod 600 '$API_ENV_FILE'"

if [[ -z "$ZIYU_API_KEY" ]]; then
    echo "✗ 未提供紫域 API Key，中止发布。"
    echo "    用法：CANVAS_ZIYU_API_KEY=<key> bash scripts/deploy/publish.sh"
    echo "      或：bash scripts/deploy/publish.sh --ziyu-key=<key>"
    echo "    否则 nginx 里的 __ZIYU_KEY__ 会被替换成空串，紫域必然 401，"
    echo "    而发布日志仍然全绿，线上排查会非常痛苦。"
    exit 1
fi
# 紫域上游地址与 Key 一并写进服务器 api.env（改了必须重建容器才生效）。
remote_env_set "$API_ENV_FILE" ZIYU_API_BASE "https://ziyuai.vip" && API_ENV_CHANGED=1
remote_env_set "$API_ENV_FILE" ZIYU_API_KEY "$ZIYU_API_KEY" && API_ENV_CHANGED=1
echo "==> 紫域上游已配置（Key 长度 ${#ZIYU_API_KEY}，不打印内容）"
echo "==> API 密钥已配置（公开注册：${CANVAS_ALLOW_REGISTER_VALUE}）"

# 替换占位符。用「重定向回写」而不是 sed -i：sed -i 会换 inode，
# 当年单文件挂载时就栽在这上面（容器一直读旧内容），原地写最稳。
"${SSH[@]}" "$SSH_HOST" "cd ${APP_ROOT}/nginx && \
    sed -e 's|__AGNES_TOKEN__|${ACCESS_TOKEN}|g' -e 's|__AUTH_COOKIE__|${AUTH_COOKIE}|g' -e 's|__ZIYU_KEY__|${ZIYU_API_KEY}|g' default.conf > .default.conf.new && \
    cat .default.conf.new > default.conf && rm -f .default.conf.new && \
    (grep -c '__AGNES_TOKEN__\|__AUTH_COOKIE__\|__ZIYU_KEY__' default.conf || true)"

# 占位符自检：只要还剩一个没被替换，线上就是「日志全绿但必然 401」。
NGINX_REMAIN=$("${SSH[@]}" "$SSH_HOST" "grep -c '__AGNES_TOKEN__\|__AUTH_COOKIE__\|__ZIYU_KEY__' '${APP_ROOT}/nginx/default.conf' || true")
if [[ "$NGINX_REMAIN" != 0 ]]; then
    echo "✗ nginx 配置里仍有 ${NGINX_REMAIN} 处未替换的占位符，中止发布"
    exit 1
fi

# docker-compose 里也有占位符（数据库口令、站点 cookie），同样原地回写。
# 注意顺序：必须先上传仓库里的模板（上面已做），再替换，
# 否则会把上一轮已经替换过值的文件再 sed 一遍（幂等，但占位符早已不在了）。
"${SSH[@]}" "$SSH_HOST" "cd ${APP_ROOT} && \
    sed -e 's|__AUTH_COOKIE__|${AUTH_COOKIE}|g' -e 's|__PG_PASSWORD__|${PG_PASSWORD_VALUE}|g' docker-compose.yml > .docker-compose.yml.new && \
    cat .docker-compose.yml.new > docker-compose.yml && rm -f .docker-compose.yml.new && \
    (grep -c '__AUTH_COOKIE__\|__PG_PASSWORD__' docker-compose.yml || true)"

upload_lf deploy/Dockerfile.proxy "${PROXY_ROOT}/Dockerfile"
upload_lf deploy/Dockerfile.api "${APP_ROOT}/api/Dockerfile"
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

# API 源码直接上传，不走发布包：
#   docker-compose 的 build.context 是固定目录 /opt/infinite-canvas/api，
#   而发布包要等 deploy.sh 才解到 releases/<版本>/ 下，每次版本还不一样。
#   更关键的是 deploy.sh 里有 `compose up -d`，会连带拉起 api ——
#   那时若构建上下文还是空的，compose 会失败。所以必须在 deploy.sh 之前把源码放好。
upload_lf canvas-api/server.js "${APP_ROOT}/api/server.js"
upload_lf canvas-api/db.js "${APP_ROOT}/api/db.js"
upload_lf canvas-api/auth.js "${APP_ROOT}/api/auth.js"
upload_lf canvas-api/schema.sql "${APP_ROOT}/api/schema.sql"
upload_lf canvas-api/package.json "${APP_ROOT}/api/package.json"
upload_lf canvas-api/credits.js "${APP_ROOT}/api/credits.js"
upload_lf canvas-api/ldxp-redeem.js "${APP_ROOT}/api/ldxp-redeem.js"
upload_lf canvas-api/ziyu.js "${APP_ROOT}/api/ziyu.js"
upload_lf canvas-api/routes-credits.js "${APP_ROOT}/api/routes-credits.js"
upload_lf canvas-api/email.js "${APP_ROOT}/api/email.js"
upload_lf canvas-api/email-verify.js "${APP_ROOT}/api/email-verify.js"
echo "==> API 源码已就位"

"${SSH[@]}" "$SSH_HOST" "CANVAS_RUNTIME=${CANVAS_RUNTIME:-docker} bash ${APP_ROOT}/scripts/deploy/deploy.sh ${APP_ROOT}/releases/${RELEASE}.tar.gz"

echo "==> 构建并启动 API（账号 / 项目 / 素材 / 媒体）"
"${SSH[@]}" "$SSH_HOST" "cd ${APP_ROOT} && docker compose build api 2>&1 | tail -4 && docker compose up -d --force-recreate api 2>&1 | tail -4"

# 环境变量是容器启动时注入的：.env 改了不重建容器就不会生效，
# 表现为「密码明明改了却还是旧的」，而且看日志看不出来，只能靠这里兜住。
if [[ "$ENV_CHANGED" == "1" ]]; then
    echo "==> 代理配置有变更，重建容器让新环境变量生效"
    "${SSH[@]}" "$SSH_HOST" "cd ${APP_ROOT} && docker compose up -d --force-recreate agnes 2>&1 | tail -3"
fi

echo "==> 完成：$RELEASE 已上线"
# 临时目录由上面的 trap 清理

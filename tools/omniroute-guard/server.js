#!/usr/bin/env node
// ---------------------------------------------------------------------------
// OmniRoute 守卫反代（零依赖，纯 Node http）
//
// 干两件事：
//   1. 给「完全没有鉴权」的 OmniRoute 网关加一道 Bearer 令牌
//   2. 输出正确的 CORS 头，让公网画布页面能跨域调用
//
// 为什么需要它：
//   OmniRoute 默认监听 0.0.0.0:20128 且不做任何鉴权——同一个局域网里任何人都能白用你的
//   模型额度。而 Cloudflare Access 那套「交互式登录」和浏览器 fetch 不兼容（会把请求
//   302 到登录页，fetch 直接失败），所以公网场景只能靠「请求头带令牌」这一条路。
//
// 用法：
//   set GUARD_TOKEN=你的长随机令牌
//   node server.js
//
// 环境变量：
//   GUARD_TOKEN          必填。调用方必须带 Authorization: Bearer <这个值>
//   GUARD_PORT           默认 20129
//   UPSTREAM             默认 http://127.0.0.1:20128
//   GUARD_ALLOW_ORIGIN   默认 *（允许任意来源）。想收紧就填画布域名，如 https://hb.cauai.fun
//   GUARD_BIND           默认 127.0.0.1（只本机可连，由 cloudflared 负责对外）
// ---------------------------------------------------------------------------
const http = require("node:http");

const PORT = Number(process.env.GUARD_PORT || 20129);
const UPSTREAM = (process.env.UPSTREAM || "http://127.0.0.1:20128").replace(/\/+$/, "");
const TOKEN = (process.env.GUARD_TOKEN || "").trim();
const ALLOW_ORIGIN = process.env.GUARD_ALLOW_ORIGIN || "*";
const BIND = process.env.GUARD_BIND || "127.0.0.1";

if (!TOKEN) {
    console.error("✗ 必须设置 GUARD_TOKEN，否则等于没加锁。");
    console.error("  生成方式（PowerShell）：");
    console.error('  -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % { [char]$_ })');
    process.exitCode = 1;
    return;
}

// 令牌比较定长，避免被计时攻击试探出前缀
function tokenMatches(provided) {
    if (typeof provided !== "string") return false;
    const a = Buffer.from(provided);
    const b = Buffer.from(TOKEN);
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
    return diff === 0;
}

function sendJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(payload),
        "Access-Control-Allow-Origin": ALLOW_ORIGIN,
    });
    res.end(payload);
}

// 允许调用方带的头。Authorization 是画布必须带的，content-type 是 JSON 请求自带。
const ALLOW_HEADERS = "Authorization, Content-Type, x-api-key, anthropic-version, x-omniroute-connection";
const ALLOW_METHODS = "GET, POST, PUT, DELETE, PATCH, OPTIONS";

const server = http.createServer((req, res) => {
    // 预检（浏览器在发带 Authorization 的跨域请求前一定会先发 OPTIONS）
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": ALLOW_ORIGIN,
            "Access-Control-Allow-Methods": ALLOW_METHODS,
            "Access-Control-Allow-Headers": ALLOW_HEADERS,
            "Access-Control-Max-Age": "86400",
        });
        res.end();
        return;
    }

    // 健康检查不验令牌，方便 cloudflared 探活
    if (req.url === "/health") {
        sendJson(res, 200, { ok: true, upstream: UPSTREAM, guarded: true });
        return;
    }

    const auth = req.headers.authorization || "";
    const provided = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    if (!tokenMatches(provided)) {
        sendJson(res, 401, { error: { message: "unauthorized：令牌不对或没带 Authorization 头" } });
        return;
    }

    const target = new URL(req.url || "/", UPSTREAM);
    const headers = { ...req.headers };
    delete headers.host; // 必须删，否则上游按错误的 Host 处理
    delete headers["content-length"]; // 由上游按实际 body 重新算

    const upstreamReq = http.request(
        target,
        { method: req.method, headers, agent: false },
        (upstreamRes) => {
            // 上游可能已经在回 CORS 头了，这里统一覆盖，避免重复导致浏览器报错
            const out = { ...upstreamRes.headers };
            out["access-control-allow-origin"] = ALLOW_ORIGIN;
            out["access-control-allow-headers"] = ALLOW_HEADERS;
            out["access-control-allow-methods"] = ALLOW_METHODS;
            // SSE 流式：不要缓冲，否则文字会一大段一大段地蹦
            out["cache-control"] = "no-cache";
            out["x-accel-buffering"] = "no";
            res.writeHead(upstreamRes.statusCode || 502, out);
            upstreamRes.pipe(res);
        },
    );

    upstreamReq.on("error", (error) => {
        console.error(`[guard] 上游请求失败 ${req.method} ${req.url}:`, error.message);
        if (!res.headersSent) {
            sendJson(res, 502, { error: { message: `连不上 OmniRoute（${UPSTREAM}）：${error.message}` } });
        } else {
            res.end();
        }
    });

    // 客户端中途断开（画布里点了停止）就别再占着上游连接
    res.on("close", () => upstreamReq.destroy());
    req.pipe(upstreamReq);
});

server.listen(PORT, BIND, () => {
    console.log(`==> OmniRoute 守卫已启动`);
    console.log(`    监听      http://${BIND}:${PORT}`);
    console.log(`    转发到    ${UPSTREAM}`);
    console.log(`    允许来源  ${ALLOW_ORIGIN}`);
    console.log(`    令牌      ${TOKEN.slice(0, 4)}...${TOKEN.slice(-4)}（共 ${TOKEN.length} 位）`);
    console.log(`    自检      curl -H "Authorization: Bearer <令牌>" http://127.0.0.1:${PORT}/v1/models`);
});

#!/usr/bin/env node
// ============================================================================
// 无限画布 · 批次 2 落地器（apply-batch2.mjs）
// ----------------------------------------------------------------------------
// 作用：把治理仓（E:\codex\huabu）里的批次 2 交付件，幂等地接进权威源码树。
//
// 前置：批次 1（apply-batch1.mjs）必须已经跑过。
//       本脚本会检查 canvas-api/routes-credits.js 是否存在，不存在直接退出（exit 2）。
//
// 设计原则（与批次 1 完全一致，便于维护）：
//   1. 幂等 —— 每处改动先判断「是否已应用」，已应用就跳过，重跑不会重复插入。
//   2. 保换行 —— 读入检测 CRLF/LF，内部统一按 LF 处理，写回时还原原制式。
//   3. 锚点用字符串定位，不写死行号 —— 上游文件被改行也不会错插。
//   4. 全部成功才写盘 —— 任何一处锚点找不到，直接中止，不产生半成品。
//   5. 写前备份 —— <文件>.bak-YYYYMMDD（已存在则不覆盖，保住最初那一份）。
//
// 与批次 1 的唯一机制差异：
//   批次 2 有两处改动落在**同一个文件**（deploy/nginx-docker.conf）。
//   批次 1 的 patch() 每次都从磁盘重新读，两处改动会互相覆盖。
//   这里加了一层 STAGED 暂存：同一文件第二次 patch 从「已暂存的文本」继续改，
//   保证两处改动叠加而不是覆盖。
//
// 有意不做的事：
//   公开注册开关（服务器 api.env）、容器重建、nginx reload、任何 ssh / docker 操作
//   —— 只打印提示。本脚本只改「权威源码树里的文件」，不碰服务器、不碰数据卷、不发布。
//
// 用法见同目录上层的 APPLY-RUNBOOK.md。
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GOVERNANCE = path.resolve(HERE, "..", "..");
const DEFAULT_SOURCE = "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas";

const NGINX = "deploy/nginx-docker.conf";
const SNIPPET = "implementation/deploy/batch2-nginx.conf.snippet";
const FRAGMENT_BEGIN = "BATCH2-NGINX-FRAGMENT-BEGIN";
const FRAGMENT_END = "BATCH2-NGINX-FRAGMENT-END";

// ---------------------------------------------------------------- 参数

function parseArgs(argv) {
    const out = { _: [] };
    for (let i = 0; i < argv.length; i += 1) {
        const a = argv[i];
        if (a === "--dry-run") { out["dry-run"] = true; continue; }
        if (a.startsWith("--")) {
            const eq = a.indexOf("=");
            if (eq > 0) out[a.slice(2, eq)] = a.slice(eq + 1);
            else out[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
            continue;
        }
        out._.push(a);
    }
    return out;
}

const args = parseArgs(process.argv.slice(2));
const GOVERNANCE = path.resolve(args.governance || DEFAULT_GOVERNANCE);
const SOURCE = path.resolve(args.source || DEFAULT_SOURCE);
const DRY = Boolean(args["dry-run"]);
const ONLY = args.only ? new Set(String(args.only).split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)) : null;
const STAMP = new Date().toISOString().slice(0, 10).replace(/-/g, "");

const results = [];
const fails = [];
const pending = [];   // { kind: "write", target, text, eol }
const STAGED = new Map();   // 绝对路径 → 已暂存文本（同一文件多处改动串行叠加）

function ok(id, detail) { results.push({ id, status: "OK", detail }); }
function skip(id, detail) { results.push({ id, status: "SKIP", detail }); }
function fail(id, detail) { results.push({ id, status: "FAIL", detail }); fails.push(id + " · " + detail); }
function want(id) { return !ONLY || ONLY.has(id); }
function note(id, detail) { results.push({ id, status: "NOTE", detail }); }

// ---------------------------------------------------------------- 读写

const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);
const CRLF = CR + LF;

function readText(p) {
    const raw = fs.readFileSync(p, "utf8");
    const eol = raw.includes("\r\n") ? "\r\n" : "\n";
    return { eol, text: raw.split("\r\n").join("\n") };
}

/** 取「当前应当改的文本」：优先用本次已暂存的内容，否则读磁盘。 */
function currentOf(p) {
    const staged = STAGED.get(p);
    if (staged !== undefined) return staged;
    return readText(p).text;
}

function backupOf(p) { return p + ".bak-" + STAMP; }

function queueWrite(p, text, eol) {
    STAGED.set(p, text);
    const existing = pending.findIndex((it) => it.target === p);
    if (existing >= 0) { pending[existing].text = text; pending[existing].eol = eol; return; }
    pending.push({ kind: "write", target: p, text, eol });
}

function flush() {
    let n = 0;
    for (const item of pending) {
        n += 1;
        if (fs.existsSync(item.target)) {
            const b = backupOf(item.target);
            if (!fs.existsSync(b)) fs.copyFileSync(item.target, b);
        }
        const outText = item.eol === "\r\n" ? item.text.split("\n").join("\r\n") : item.text;
        fs.writeFileSync(item.target, outText, "utf8");
    }
    return n;
}

// ---------------------------------------------------------------- 通用改动器
// transform(text) 返回：
//   null             → 已应用，幂等跳过
//   { text, detail } → 待写入的新内容
//   { error }        → 锚点找不到，计为失败
function patch(id, rel, transform) {
    if (!want(id)) return;
    const p = path.join(SOURCE, rel);
    if (!fs.existsSync(p)) { fail(id, "目标文件不存在：" + rel); return; }
    let r;
    try {
        const text = currentOf(p);
        const eol = readText(p).eol;
        r = transform(text, p);
        if (r && r.text !== undefined) r.eol = r.eol || eol;
    } catch (e) {
        fail(id, "处理 " + rel + " 时抛错：" + (e && e.message));
        return;
    }
    if (!r) { skip(id, rel + " 已是最新（幂等跳过）"); return; }
    if (r.error) { fail(id, rel + " · " + r.error); return; }
    queueWrite(p, r.text, r.eol);
    ok(id, rel + " · " + r.detail);
}

function insertBeforeLine(text, anchor, block) {
    const i = text.indexOf(anchor);
    if (i < 0) return null;
    const lineStart = text.lastIndexOf(LF, i) + 1;
    return text.slice(0, lineStart) + block + text.slice(lineStart);
}

function rtrimNewlines(s) {
    let i = s.length;
    while (i > 0 && (s[i - 1] === LF || s[i - 1] === CR)) i -= 1;
    return s.slice(0, i);
}

function readGov(rel) {
    const p = path.join(GOVERNANCE, rel);
    if (!fs.existsSync(p)) return null;
    return readText(p).text;
}


// ============================================================================
// 落地步骤 B1–B7
// ----------------------------------------------------------------------------
// 编号对照（与 implementation/APPLY-RUNBOOK.md §4.3 一致）：
//   B1 = nginx 撤 location / 门禁          B5 = nginx 插入免费试拍限次片段
//   B2 = nginx 撤 location /assets/ 门禁   B6 = use-config-store.ts 默认 baseUrl 清空
//   B3 = nginx 撤 location = /config.js    B7 = 公开注册开关（只提示，脚本不代做）
//   B4 = nginx 撤 location /agnes/ 门禁
//
// ⚠️ 全部四处门禁一律「整块精确匹配删除」，绝不做全局替换。
//    批次 1 插进去的 /ziyu/ 块自带一模一样的 if ($canvas_authed = 0)，
//    全局替换 = 把紫域那道门也拆了 = 给全网开一台刷余额的免费出片机。
// ============================================================================

/** 只替换第一处；不用 String.replace 的字符串参数（$& / $1 有替换模式坑）。 */
function replaceOnce(text, from, to) {
    const i = text.indexOf(from);
    if (i < 0) return null;
    return text.slice(0, i) + to + text.slice(i + from.length);
}

/** 多行文本一律这样拼，避免在源码里写 \n 转义。 */
function joinLines(arr) { return arr.join(LF); }

// ---------------------------------------------------------------- B1
const GATE1 = {
    name: "页面 location /",
    marker: "批次 2 起不再吃 cookie 门禁 —— 公开访客要能打开站点并注册。",
    detail: "撤 / 页面门禁（302 /login.html）",
    before: joinLines([
        "    # 页面：没 cookie 就踢去登录页。",
        "    location / {",
        "        if ($canvas_authed = 0) {",
        "            return 302 /login.html;",
        "        }",
        "        try_files $uri $uri/ /index.html;",
        "    }",
    ]),
    after: joinLines([
        "    # 页面：批次 2 起不再吃 cookie 门禁 —— 公开访客要能打开站点并注册。",
        "    # 安全边界移到了应用层：/api/ 除 auth/health 外一律要求有效会话。",
        "    location / {",
        "        try_files $uri $uri/ /index.html;",
        "    }",
    ]),
};

// ---------------------------------------------------------------- B2
const GATE2 = {
    name: "静态资源 location /assets/",
    marker: "批次 2 起公开可读（未登录访客也要能加载页面与样式）",
    detail: "撤 /assets/ 门禁（403）",
    before: joinLines([
        "    # 静态资源：这里是程序化请求，302 到登录页没有意义，直接 403。",
        "    location /assets/ {",
        "        if ($canvas_authed = 0) {",
        "            return 403;",
        "        }",
        "        expires 30d;",
    ]),
    after: joinLines([
        "    # 静态资源：批次 2 起公开可读（未登录访客也要能加载页面与样式）。",
        "    location /assets/ {",
        "        expires 30d;",
    ]),
};

// ---------------------------------------------------------------- B3
const GATE3 = {
    name: "运行期配置 location = /config.js",
    marker: "运行期配置，禁止缓存（批次 2 起公开可读）",
    detail: "撤 /config.js 门禁（403）",
    before: joinLines([
        "    # 运行期配置，禁止缓存，同样要门禁",
        "    location = /config.js {",
        "        if ($canvas_authed = 0) {",
        "            return 403;",
        "        }",
        "        add_header Cache-Control \"no-store\";",
    ]),
    after: joinLines([
        "    # 运行期配置，禁止缓存（批次 2 起公开可读）。",
        "    # 这个文件里只有地址与开关，没有任何密钥 —— 密钥一律由服务端注入。",
        "    location = /config.js {",
        "        add_header Cache-Control \"no-store\";",
    ]),
};

// ---------------------------------------------------------------- B4
const GATE4 = {
    name: "Agnes 代理 location /agnes/",
    marker: "批次 2 起不再吃 cookie 门禁：公开访客也要能拉模型列表",
    detail: "撤 /agnes/ 门禁（403）",
    before: joinLines([
        "    # Agnes 视频代理。",
        "    # 接口是程序调用的，返回 302 会让前端拿到 HTML 却当 JSON 解析，所以直接 403。",
        "    location /agnes/ {",
        "        if ($canvas_authed = 0) {",
        "            return 403;",
        "        }",
        "",
        "        # 令牌由 nginx 补上——浏览器不可能同时发两个 Authorization 头。",
    ]),
    after: joinLines([
        "    # Agnes 视频代理。",
        "    # 批次 2 起不再吃 cookie 门禁：公开访客也要能拉模型列表、轮询任务状态。",
        "    # 唯一会用真钱调上游的端点 /agnes/v1/videos 由下面的免费试拍限次片段单独把守。",
        "    location /agnes/ {",
        "        # 令牌由 nginx 补上——浏览器不可能同时发两个 Authorization 头。",
    ]),
};

function dropGate(id, spec) {
    patch(id, NGINX, function (text) {
        if (text.indexOf(spec.marker) >= 0) return null;   // 幂等：已撤过
        if (text.indexOf(spec.before) < 0) {
            return { error: "找不到门禁原文（" + spec.name + "）—— 文件可能已被手工改过，请人工核对后再跑" };
        }
        return { text: replaceOnce(text, spec.before, spec.after), detail: spec.detail };
    });
}

function b1() { dropGate("B1", GATE1); }
function b2() { dropGate("B2", GATE2); }
function b3() { dropGate("B3", GATE3); }
function b4() { dropGate("B4", GATE4); }

// ---------------------------------------------------------------- B5
// 插入免费试拍限次片段。正文从 batch2-nginx.conf.snippet 的 BEGIN/END 标记之间取，
// 每行统一加 4 空格缩进 —— 行号不写死，片段改了落地器自动跟随。
function b5() {
    const id = "B5";
    if (!want(id)) return;
    const snippet = readGov(SNIPPET);
    if (snippet === null) { fail(id, "缺少 " + SNIPPET); return; }

    const all = snippet.split(LF);
    const begin = all.findIndex(function (l) { return l.indexOf(FRAGMENT_BEGIN) >= 0; });
    const end = all.findIndex(function (l) { return l.indexOf(FRAGMENT_END) >= 0; });
    if (begin < 0 || end < 0 || end <= begin) { fail(id, "片段标记不完整（BEGIN/END）"); return; }

    const body = all.slice(begin + 1, end);
    if (!body.length) { fail(id, "片段正文为空"); return; }

    const indented = body.map(function (l) { return l.length ? "    " + l : l; });
    const block = [
        "    # ------------------------------------------------------------------------",
        "    # 免费试拍限次（批次 2 · B5 插入）",
        "    #",
        "    # 为什么必须有这一段：批次 2 撤掉了 /agnes/ 的 cookie 门禁，而",
        "    # /agnes/v1/videos 是整站唯一会用真钱调上游的端点。",
        "    # 撤门禁与限次必须**同一次发布**落地，不能分两次。",
        "    #",
        "    # 判据是 URI 而不是方法：nginx 的 auth_request 发出去的是 GET 子请求，",
        "    # 子请求里 $request_method 恒为 GET，拿不到原始的 POST。",
        "    # 详细取舍与未验证项见 implementation/deploy/batch2-nginx.conf.snippet 的 R1–R5 / U1–U4。",
        "    # ------------------------------------------------------------------------",
    ].concat(indented).concat([""]).join(LF);

    const anchor = "    # 画布服务端 API（账号 / 项目 / 素材 / 媒体文件）。";
    patch(id, NGINX, function (text) {
        if (text.indexOf("location = /agnes/v1/videos {") >= 0) return null;   // 幂等
        const next = insertBeforeLine(text, anchor, block + LF);
        if (!next) return { error: "找不到插入锚点（画布服务端 API 注释行）" };
        return { text: next, detail: "插入 " + body.length + " 行免费试拍限次片段（auth_request + 两个具名 location）" };
    });
}

// ---------------------------------------------------------------- B6
// 默认渠道不再指向公网 OpenAI：未配 Key 的访客一打开就吃 401，观感像"产品坏了"。
// 只改常量定义这一行 —— L165 / L172 / L478 三处引用会自动跟随；
// 只清 L165 / L172 会被 createModelChannel 重新灌回。
function b6() {
    const id = "B6";
    if (!want(id)) return;
    patch(id, "web/src/stores/use-config-store.ts", function (text) {
        if (text.indexOf("const OPENAI_BASE_URL = \"\";") >= 0) return null;   // 幂等
        const anchor = "const OPENAI_BASE_URL = \"https://api.openai.com\";";
        if (text.indexOf(anchor) < 0) return { error: "找不到 OPENAI_BASE_URL 常量定义" };
        const replacement = joinLines([
            "// 批次 2（B6）：默认渠道不再指向公网 OpenAI —— 没配 Key 的访客一打开就看到 401。",
            "// 留空后，新建渠道必须先填自己的 baseUrl（首次使用引导），而不是默默打一个必然失败的请求。",
            "// ⚠️ 只影响**新用户 / 清空 localStorage 之后**的默认值；老用户已持久化的",
            "//    api.openai.com 不会被清掉，需要在「设置 → 渠道」里自行修改。",
            "const OPENAI_BASE_URL = \"\";",
        ]);
        return { text: replaceOnce(text, anchor, replacement), eol: CRLF, detail: "默认渠道 baseUrl 清空（不再默认打 api.openai.com）" };
    });
}

// ---------------------------------------------------------------- B7
// 公开注册开关在服务器 /opt/infinite-canvas/api/api.env 的 ALLOW_REGISTER。
// 本脚本不碰服务器、不代做这一步，只把该查什么、该注意什么写清楚。
function b7() {
    const id = "B7";
    if (!want(id)) return;
    note(id, "★ 2026-09-13 线上实测：注册已经是【开】的（POST /api/auth/register 合法邮箱+短密码 → 400 password_too_short，关闭时应为 403 registration_closed）。");
    note(id, "★ 所以这一项不是「打开」而是「先关掉、再按顺序打开」：见 docs/STATUS_20260913_LIVE_GATE.md。");
    note(id, "公开注册 = 服务器 api.env 的 ALLOW_REGISTER；publish.sh 默认值 1（开），脚本不代做。");
    note(id, "放开前先做两件事：① 服务器 api.env 设 ALLOW_REGISTER=0 并重建 api 容器；② 查 users 表确认你本人 role=admin 且没有陌生账号（前 5 行 id/email/role/created_at）。");
    note(id, "线上当前实际值【已实测为开】（见上）；api.env 里的字面值仍未读到，需服务器侧确认。");
    note(id, "当前线上已是【开】，正常路径是先设 0 收口；将来真要放开再跑 publish.sh 带 CANVAS_ALLOW_REGISTER=1（会写 api.env 并重建 api 容器）。");
}

// ============================================================================
// 主流程
// ============================================================================

function printHeader() {
    console.log("无限画布 · 批次 2 落地器（apply-batch2）");
    console.log("  治理仓：" + GOVERNANCE);
    console.log("  权威树：" + SOURCE);
    console.log("  模式：" + (DRY ? "试运行（只读不写）" : "正式写入") + (ONLY ? " ｜ 仅执行 " + Array.from(ONLY).join(",") : " ｜ 全部"));
    console.log("");
}

function printTable() {
    console.log("");
    console.log("步骤  结果    说明");
    console.log("----  ------  ------------------------------------------------------------------");
    for (const r of results) {
        const id = String(r.id).padEnd(4);
        const st = String(r.status).padEnd(6);
        console.log(id + "  " + st + "  " + r.detail);
    }
    if (pending.length) {
        console.log("");
        console.log("待写盘 " + pending.length + " 处：");
        for (const item of pending) {
            console.log("  · " + item.target);
        }
    }
}

if (!fs.existsSync(SOURCE)) {
    console.error("✗ 找不到权威源码树：" + SOURCE);
    console.error("  用 --source=<路径> 指定，或改脚本顶部的 DEFAULT_SOURCE。");
    process.exit(2);
}
if (!fs.existsSync(path.join(SOURCE, "canvas-api", "server.js"))) {
    console.error("✗ 这个路径看起来不是无限画布的源码树（缺少 canvas-api/server.js）：" + SOURCE);
    process.exit(2);
}
if (!fs.existsSync(path.join(SOURCE, "canvas-api", "routes-credits.js"))) {
    console.error("✗ 缺少 canvas-api/routes-credits.js —— 批次 1 还没落地。");
    console.error("  先跑：node implementation/scripts/apply-batch1.mjs --source=<权威树路径>");
    console.error("  原因：B5 插入的 /_canvas_free_trial_check 子请求指向");
    console.error("        /api/credits/free-trial/check，那条路由由批次 1 提供。");
    process.exit(2);
}

printHeader();
b1(); b2(); b3(); b4(); b5(); b6(); b7();
printTable();

if (fails.length) {
    console.error("");
    console.error("✗ 有 " + fails.length + " 处失败，本次未写盘（脚本幂等，修好后重跑即可）：");
    for (const f of fails) console.error("  · " + f);
    process.exit(1);
}

if (DRY) {
    console.log("");
    console.log("（--dry-run：以上为「将要做的改动」，未写盘。）");
    process.exit(0);
}

const written = flush();
console.log("");
if (written === 0) {
    console.log("✓ 无需改动：所有步骤都已是最新（幂等跳过），本次没有写任何文件。");
} else {
    console.log("✓ 已写盘 " + written + " 处。每处改动前都留了 .bak-" + STAMP + " 备份，回退＝把备份覆盖回原文件。");
}
console.log("下一步按 implementation/APPLY-RUNBOOK.md 走：");
console.log("  1) 先补 L2 真机冒烟 —— 只剩【节点链真实执行】一项（真跑会真出片/真花钱，需单独授权）；A-06 之前必做；");
console.log("  2) 服务器 nginx -t 通过后 reload（见上面 B5 的片段说明）；");
    console.log("  3) ★ 立刻确认 api.env 的 ALLOW_REGISTER 并设为 0 + 重建 api 容器（实测注册当前是开的）；再确认你本人是 admin");
console.log("  4) 走 implementation/deploy/batch2-acceptance.md 的 B2-1~B2-7 逐条验收。");

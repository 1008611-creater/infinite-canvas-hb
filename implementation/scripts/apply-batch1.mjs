#!/usr/bin/env node
// ============================================================================
// 无限画布 · 批次 1 落地器（apply-batch1.mjs）
// ----------------------------------------------------------------------------
// 作用：把治理仓（E:\codex\huabu）里的批次 1 交付件，幂等地接进权威源码树。
//
// 设计原则：
//   1. 幂等 —— 每处改动先 includes() 判断，已应用就跳过，重跑不会重复插入。
//   2. 保换行 —— 读入检测 CRLF/LF，内部统一按 LF 处理，写回时还原原制式。
//   3. 锚点用字符串定位，不写死行号 —— 上游文件被改行也不会错插。
//   4. 全部成功才写盘 —— 任何一处锚点找不到，直接中止，不产生半成品。
//   5. 写前备份 —— <文件>.bak-YYYYMMDD（已存在则不覆盖，保住最初那一份）。
//
// 有意不做的事：
//   S6 服务器环境变量、S7 的 nginx reload、任何 ssh / docker 操作 —— 只打印提示。
//   本脚本只改「权威源码树里的文件」，不碰服务器、不碰数据卷、不发布。
//
// 用法见同目录上层的 APPLY-RUNBOOK.md。
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GOVERNANCE = path.resolve(HERE, "..", "..");
const DEFAULT_SOURCE = "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas";

const MODULES = ["credits.js", "ldxp-redeem.js", "ziyu.js", "routes-credits.js"];

const ADMIN_BLOCK = [
    "/** 管理员守卫：未登录 401，非管理员 403。只用于 /api/admin/* 与 /api/ziyu/me。 */",
    "function requireAdmin(req, res, next) {",
    "    if (!req.user) return res.status(401).json({ error: \"auth_required\" });",
    "    if (req.user.role !== \"admin\") return res.status(403).json({ error: \"admin_required\" });",
    "    next();",
    "}",
].join("\n");

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
const pending = [];   // { kind: "write" | "copy", ... }

function ok(id, detail) { results.push({ id, status: "OK", detail }); }
function skip(id, detail) { results.push({ id, status: "SKIP", detail }); }
function fail(id, detail) { results.push({ id, status: "FAIL", detail }); fails.push(id + " · " + detail); }
function want(id) { return !ONLY || ONLY.has(id); }

// ---------------------------------------------------------------- 读写

function readText(p) {
    const raw = fs.readFileSync(p, "utf8");
    const eol = raw.includes("\r\n") ? "\r\n" : "\n";
    return { eol, text: raw.split("\r\n").join("\n") };
}

function backupOf(p) { return p + ".bak-" + STAMP; }

function queueWrite(p, text, eol) {
    pending.push({ kind: "write", target: p, text, eol });
}

function queueCopy(from, to) {
    pending.push({ kind: "copy", from, to });
}

function flush() {
    let n = 0;
    for (const item of pending) {
        n += 1;
        if (item.kind === "copy") {
            if (fs.existsSync(item.to)) {
                const b = backupOf(item.to);
                if (!fs.existsSync(b)) fs.copyFileSync(item.to, b);
            }
            fs.copyFileSync(item.from, item.to);
            continue;
        }
        // 新文件（S1 的 4 个模块）此前不存在，没有东西可备份 —— 跳过而不是崩。
        if (fs.existsSync(item.target)) {
            const b = backupOf(item.target);
            if (!fs.existsSync(b)) fs.copyFileSync(item.target, b);
        }
        const out = item.eol === "\r\n" ? item.text.split("\n").join("\r\n") : item.text;
        fs.writeFileSync(item.target, out, "utf8");
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
        const { text, eol } = readText(p);
        r = transform(text, p);
    } catch (e) {
        fail(id, "处理 " + rel + " 时抛错：" + (e && e.message));
        return;
    }
    if (!r) { skip(id, rel + " 已是最新（幂等跳过）"); return; }
    if (r.error) { fail(id, rel + " · " + r.error); return; }
    queueWrite(p, r.text, r.eol || readText(p).eol);
    ok(id, rel + " · " + r.detail);
}

function insertBefore(text, anchor, block) {
    const i = text.indexOf(anchor);
    if (i < 0) return null;
    return text.slice(0, i) + block + text.slice(i);
}

function insertBeforeLine(text, anchor, block) {
    const i = text.indexOf(anchor);
    if (i < 0) return null;
    const lineStart = text.lastIndexOf(LF, i) + 1;
    return text.slice(0, lineStart) + block + text.slice(lineStart);
}

function insertAfter(text, anchor, block) {
    const i = text.indexOf(anchor);
    if (i < 0) return null;
    return text.slice(0, i + anchor.length) + block + text.slice(i + anchor.length);
}

// ============================================================================
// 落地步骤 S1–S8
// ----------------------------------------------------------------------------
// 编号对照（两套编号并存，RUNBOOK 里有表）：
//   S1 = 四个后端模块进 canvas-api/        S5 = publish.sh 六处 + 守卫
//   S2 = schema.sql 追加计费表             S6 = 服务器 api.env 变量（只提示）
//   S3 = server.js 四处接线                S7 = nginx-docker.conf 插入 /ziyu/ 片段
//   S4 = Dockerfile.api COPY               S8 = channel-templates.ts 紫域模板
// ============================================================================

const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);
const CRLF = CR + LF;

function note(id, detail) { results.push({ id, status: "NOTE", detail }); }

/** 去掉结尾的换行符（不碰正文），用于拼接前归一化。 */
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

function eolOf(p) { return fs.existsSync(p) ? readText(p).eol : CRLF; }

// ---------------------------------------------------------------- S1
// 四个后端模块从治理仓搬进权威树的 canvas-api/。
// 注意：治理仓是 LF、权威树是 CRLF，所以走 queueWrite 并按目标文件原有制式还原，
// 不用 queueCopy —— copy 分支不做换行转换。
function s1() {
    const id = "S1";
    if (!want(id)) return;
    const missing = [];
    let queued = 0;
    let same = 0;
    for (const name of MODULES) {
        const from = path.join(GOVERNANCE, "implementation", "canvas-api", name);
        const to = path.join(SOURCE, "canvas-api", name);
        if (!fs.existsSync(from)) { missing.push(name); continue; }
        const body = readText(from).text;
        if (fs.existsSync(to) && readText(to).text === body) { same += 1; continue; }
        queueWrite(to, body, eolOf(to));
        queued += 1;
    }
    if (missing.length) { fail(id, "治理仓缺文件：" + missing.join(", ")); return; }
    if (queued === 0) { skip(id, "4 个后端模块已与治理仓一致"); return; }
    ok(id, "写入 " + queued + " 个模块到 canvas-api/（已一致 " + same + " 个）");
}

// ---------------------------------------------------------------- S2
// schema.sql 末尾追加计费表。全部 IF NOT EXISTS，重复执行安全。
function s2() {
    const id = "S2";
    if (!want(id)) return;
    const extra = readGov("implementation/canvas-api/schema-credits.sql");
    if (extra === null) { fail(id, "缺少 implementation/canvas-api/schema-credits.sql"); return; }
    patch(id, "canvas-api/schema.sql", function (text) {
        if (text.indexOf("user_credits") >= 0) return null;
        const merged = rtrimNewlines(text) + LF + LF + rtrimNewlines(extra) + LF;
        return {
            text: merged,
            eol: CRLF,
            detail: "追加 user_credits / credit_ledger / credit_redemptions / channel_usage / free_trial_usage / credit_adjustments",
        };
    });
}

// ---------------------------------------------------------------- S3
// server.js 四处接线：import / CORS 允许头 / requireAdmin / 挂载计费路由。
function s3() {
    const id = "S3";
    if (!want(id)) return;
    patch(id, "canvas-api/server.js", function (text) {
        const done = [];
        let t = text;

        if (t.indexOf('from "./routes-credits.js"') < 0) {
            const anchor = 'import * as auth from "./auth.js";';
            const next = insertAfter(t, anchor, LF + 'import { mountCreditRoutes } from "./routes-credits.js";');
            if (!next) return { error: "找不到 auth.js 的 import 锚点" };
            t = next;
            done.push("补 import");
        }

        if (t.indexOf("Idempotency-Key") < 0) {
            const anchor = 'Content-Type, Authorization, Content-Range, X-Upload-Offset",';
            if (t.indexOf(anchor) < 0) return { error: "找不到 CORS 允许头锚点" };
            t = t.replace(anchor, 'Content-Type, Authorization, Content-Range, X-Upload-Offset, Idempotency-Key",');
            done.push("CORS 允许 Idempotency-Key");
        }

        if (t.indexOf("function requireAdmin(") < 0) {
            const next = insertBefore(t, "/** nginx auth_request 用：", ADMIN_BLOCK + LF + LF);
            if (!next) return { error: "找不到 requireAdmin 的插入锚点（/api/auth/verify 前的注释）" };
            t = next;
            done.push("插入 requireAdmin");
        }

        if (t.indexOf("mountCreditRoutes(app,") < 0) {
            const anchor = 'app.get("/api/auth/me", requireAuth, (req, res) => res.json({ user: req.user }));';
            const next = insertAfter(t, anchor, LF + LF + "mountCreditRoutes(app, { requireAuth, requireAdmin, registerMedia, query });");
            if (!next) return { error: "找不到 /api/auth/me 锚点" };
            t = next;
            done.push("挂载计费路由");
        }

        if (done.length === 0) return null;
        return { text: t, eol: CRLF, detail: done.join("；") };
    });
}

// ---------------------------------------------------------------- S4
// Dockerfile.api：新增后端文件必须同时改这里和 publish.sh 的打包列表。
function s4() {
    const id = "S4";
    if (!want(id)) return;
    patch(id, "deploy/Dockerfile.api", function (text) {
        if (text.indexOf("credits.js") >= 0) return null;
        const anchor = "COPY server.js db.js auth.js schema.sql ./";
        if (text.indexOf(anchor) < 0) return { error: "找不到 COPY 锚点" };
        return {
            text: text.replace(anchor, "COPY server.js db.js auth.js schema.sql credits.js ldxp-redeem.js ziyu.js routes-credits.js ./"),
            eol: CRLF,
            detail: "COPY 追加 4 个后端模块",
        };
    });
}

// ---------------------------------------------------------------- S5
// publish.sh 六处 + 两道守卫。这是最危险的一步：
// 漏掉打包列表 → 服务器上永远跑旧代码；漏掉 __ZIYU_KEY__ 替换 → 必然 401 但日志全绿。
function s5() {
    const id = "S5";
    if (!want(id)) return;

    const KEY_INPUT = [
 "# 紫域（ziyuai.vip）上游 Key —— 只从命令行参数或环境变量读，绝不写进仓库。",
 "#   优先级：--ziyu-key=<key>  >  $CANVAS_ZIYU_API_KEY",
 "#   ${VAR:-} 的写法不是啰嗦：脚本开头是 set -euo pipefail，裸写 $CANVAS_ZIYU_API_KEY",
 "#   在变量未设置时会先崩在「unbound variable」，下面那段友好提示永远走不到。",
 "ZIYU_API_KEY=\"${CANVAS_ZIYU_API_KEY:-}\"",
 "for CANVAS_ARG in \"$@\"; do",
 "    case \"$CANVAS_ARG\" in",
 "        --ziyu-key=*) ZIYU_API_KEY=\"${CANVAS_ARG#--ziyu-key=}\" ;;",
 "    esac",
 "done",
    ].join(LF);

    const GUARD = [
 "if [[ -z \"$ZIYU_API_KEY\" ]]; then",
 "    echo \"✗ 未提供紫域 API Key，中止发布。\"",
 "    echo \"    用法：CANVAS_ZIYU_API_KEY=<key> bash scripts/deploy/publish.sh\"",
 "    echo \"      或：bash scripts/deploy/publish.sh --ziyu-key=<key>\"",
 "    echo \"    否则 nginx 里的 __ZIYU_KEY__ 会被替换成空串，紫域必然 401，\"",
 "    echo \"    而发布日志仍然全绿，线上排查会非常痛苦。\"",
 "    exit 1",
 "fi",
 "# 紫域上游地址与 Key 一并写进服务器 api.env（改了必须重建容器才生效）。",
 "remote_env_set \"$API_ENV_FILE\" ZIYU_API_BASE \"https://ziyuai.vip\" && API_ENV_CHANGED=1",
 "remote_env_set \"$API_ENV_FILE\" ZIYU_API_KEY \"$ZIYU_API_KEY\" && API_ENV_CHANGED=1",
 "echo \"==> 紫域上游已配置（Key 长度 ${#ZIYU_API_KEY}，不打印内容）\"",
    ].join(LF);

    const VERIFY = [
 "# 占位符自检：只要还剩一个没被替换，线上就是「日志全绿但必然 401」。",
 "NGINX_REMAIN=$(\"${SSH[@]}\" \"$SSH_HOST\" \"grep -c '__AGNES_TOKEN__\\|__AUTH_COOKIE__\\|__ZIYU_KEY__' '${APP_ROOT}/nginx/default.conf' || true\")",
 "if [[ \"$NGINX_REMAIN\" != 0 ]]; then",
 "    echo \"✗ nginx 配置里仍有 ${NGINX_REMAIN} 处未替换的占位符，中止发布\"",
 "    exit 1",
 "fi",
    ].join(LF);

    patch(id, "scripts/deploy/publish.sh", function (text) {
        const done = [];
        let t = text;

        // ① 发布包打包列表
        const cpBefore = 'cp canvas-api/server.js canvas-api/db.js canvas-api/auth.js canvas-api/schema.sql canvas-api/package.json "$STAGE/api/"';
        const cpAfter = 'cp canvas-api/server.js canvas-api/db.js canvas-api/auth.js canvas-api/schema.sql canvas-api/credits.js canvas-api/ldxp-redeem.js canvas-api/ziyu.js canvas-api/routes-credits.js canvas-api/package.json "$STAGE/api/"';
        if (t.indexOf(cpBefore) >= 0) {
            t = t.replace(cpBefore, cpAfter);
            done.push("发布包打包列表");
        } else if (t.indexOf(cpAfter) < 0) {
            return { error: "找不到 cp 打包列表锚点" };
        }

        // ② 后端指纹（openssl 与 sha256sum 两处同款 cat）
        const fpBefore = 'cat "$STAGE/api/server.js" "$STAGE/api/db.js" "$STAGE/api/auth.js" "$STAGE/api/schema.sql" "$STAGE/api/package.json"';
        const fpAfter = 'cat "$STAGE/api/server.js" "$STAGE/api/db.js" "$STAGE/api/auth.js" "$STAGE/api/schema.sql" "$STAGE/api/credits.js" "$STAGE/api/ldxp-redeem.js" "$STAGE/api/ziyu.js" "$STAGE/api/routes-credits.js" "$STAGE/api/package.json"';
        if (t.indexOf(fpBefore) >= 0) {
            const n = t.split(fpBefore).length - 1;
            t = t.split(fpBefore).join(fpAfter);
            done.push("后端指纹 " + n + " 处");
        } else if (t.indexOf(fpAfter) < 0) {
            return { error: "找不到 api_fingerprint 的 cat 锚点" };
        }

        // ③ 参数解析（插在 APP_ROOT 之后）
        if (t.indexOf("--ziyu-key=") < 0) {
            const anchor = 'APP_ROOT="${CANVAS_APP_ROOT:-/opt/infinite-canvas}"';
            const next = insertAfter(t, anchor, LF + LF + KEY_INPUT);
            if (!next) return { error: "找不到 APP_ROOT 锚点（参数解析）" };
            t = next;
            done.push("Key 参数解析");
        }

        // ④ 空 Key 守卫 + api.env 写入（插在 chmod 600 之后）
        if (t.indexOf("未提供紫域 API Key") < 0) {
            const anchor = "\"${SSH[@]}\" \"$SSH_HOST\" \"chmod 600 '$API_ENV_FILE'\"";
            const next = insertAfter(t, anchor, LF + LF + GUARD);
            if (!next) return { error: "找不到 chmod 600 锚点（空 Key 守卫）" };
            t = next;
            done.push("空 Key 守卫 + api.env 写入");
        }

        // ⑤ nginx 占位符替换加 __ZIYU_KEY__
        const sedAnchor = "-e 's|__AUTH_COOKIE__|${AUTH_COOKIE}|g' default.conf > .default.conf.new";
        const sedAfter = "-e 's|__AUTH_COOKIE__|${AUTH_COOKIE}|g' -e 's|__ZIYU_KEY__|${ZIYU_API_KEY}|g' default.conf > .default.conf.new";
        if (t.indexOf(sedAnchor) >= 0) {
            t = t.replace(sedAnchor, sedAfter);
            done.push("sed 替换 __ZIYU_KEY__");
        } else if (t.indexOf(sedAfter) < 0) {
            return { error: "找不到 sed 替换锚点" };
        }

        // ⑥ 占位符 grep 同步（顺带把「只打印计数」改成硬失败）
        const grepBefore = "    (grep -c '__AGNES_TOKEN__\\|__AUTH_COOKIE__' default.conf || true)\"";
        const grepAfter = "    (grep -c '__AGNES_TOKEN__\\|__AUTH_COOKIE__\\|__ZIYU_KEY__' default.conf || true)\"";
        if (t.indexOf(grepBefore) >= 0) {
            t = t.replace(grepBefore, grepAfter);
            done.push("占位符 grep 同步");
        } else if (t.indexOf(grepAfter) < 0) {
            return { error: "找不到占位符 grep 锚点" };
        }

        // ⑦ 占位符自检（硬失败）
        if (t.indexOf("NGINX_REMAIN") < 0) {
            const gi = t.indexOf(grepAfter);
            if (gi < 0) return { error: "找不到占位符自检的插入点" };
            t = t.slice(0, gi + grepAfter.length) + LF + LF + VERIFY + t.slice(gi + grepAfter.length);
            done.push("占位符硬失败自检");
        }

        // ⑧ API 源码上传列表
        if (t.indexOf("upload_lf canvas-api/credits.js") < 0) {
            const anchor = 'upload_lf canvas-api/package.json "${APP_ROOT}/api/package.json"';
            const block = [
                LF + 'upload_lf canvas-api/credits.js "${APP_ROOT}/api/credits.js"',
                'upload_lf canvas-api/ldxp-redeem.js "${APP_ROOT}/api/ldxp-redeem.js"',
                'upload_lf canvas-api/ziyu.js "${APP_ROOT}/api/ziyu.js"',
                'upload_lf canvas-api/routes-credits.js "${APP_ROOT}/api/routes-credits.js"',
            ].join(LF);
            const next = insertAfter(t, anchor, block);
            if (!next) return { error: "找不到 upload_lf package.json 锚点" };
            t = next;
            done.push("API 源码上传列表");
        }

        if (done.length === 0) return null;
        return { text: t, eol: LF, detail: done.join("；") };
    });
}

// ---------------------------------------------------------------- S6
// 有意不代做：服务器 api.env 里的密钥与开关。只打印清单。
function s6() {
    const id = "S6";
    if (!want(id)) return;
    note(id, "【不代做】服务器 /opt/infinite-canvas/api/api.env 还需要两个变量（ZIYU_API_BASE / ZIYU_API_KEY 已由发布脚本自动写入）：");
    note(id, "  · LDXP_REDEEM_SECRET —— 卡密签名密钥，生成：openssl rand -hex 32");
    note(id, "  · FREE_TRIAL_MONTHLY_LIMIT —— 免费试拍每账号每月次数，默认 3，可不写");
    note(id, "  ⚠️ 改完 api.env 必须重建容器：cd /opt/infinite-canvas && docker compose up -d --force-recreate api");
}

// ---------------------------------------------------------------- S7
// nginx-docker.conf：把 /ziyu/ 片段插到 /agnes/ 块之后、/api/ 块之前。
function s7() {
    const id = "S7";
    if (!want(id)) return;
    const snippet = readGov("implementation/deploy/ziyu-nginx.conf.snippet");
    if (snippet === null) { fail(id, "缺少 implementation/deploy/ziyu-nginx.conf.snippet"); return; }

    const all = snippet.split(LF);
    const from = 27;
    const to = 63;
    if (all.length < to) { fail(id, "片段文件只有 " + all.length + " 行，取不到 " + from + "-" + to + " 行"); return; }
    const body = all.slice(from - 1, to).map(function (line) {
        return line.trim() === "" ? line : "    " + line;
    }).join(LF);

    const banner = [
        "    # ---------------------------------------------------------------------------",
        "    # 紫域（ziyuai.vip）中转：Key 由服务端注入，浏览器不持有真实 Key。",
        "    # 本段由 implementation/scripts/apply-batch1.mjs 从",
        "    # implementation/deploy/ziyu-nginx.conf.snippet 的第 " + from + "-" + to + " 行插入。",
        "    # 批次 1 保留 cookie 门禁 —— /ziyu/ 会花真金白银，免门禁等于公开烧钱代理。",
        "    # ---------------------------------------------------------------------------",
    ].join(LF);

    patch(id, "deploy/nginx-docker.conf", function (text) {
        if (text.indexOf("location /ziyu/") >= 0) return null;
        const anchor = "# 画布服务端 API（账号 / 项目 / 素材 / 媒体文件）。";
        const next = insertBeforeLine(text, anchor, banner + LF + body + LF + LF);
        if (!next) return { error: "找不到 /api/ 之前的注释锚点" };
        return { text: next, eol: LF, detail: "插入 /ziyu/ location（" + (to - from + 1) + " 行）" };
    });

    note(id, "【不代做】上传后在服务器执行：docker compose exec -T web nginx -t && docker compose exec -T web nginx -s reload");
}

// ---------------------------------------------------------------- S8
// channel-templates.ts：加类型字段、透传 script/apiKey、追加紫域模板。
function tsLiteral(body) {
    const BS = String.fromCharCode(92);
    const BT = String.fromCharCode(96);
    const D = "$" + "{";
    return BT + body.split(BS).join(BS + BS).split(BT).join(BS + BT).split(D).join(BS + D) + BT;
}

/**
 * 把紫域渠道脚本包在本站额度事务外壳里。
 *
 * 渠道脚本本身仍负责紫域提交与轮询；外壳只拦截 /models、/jobs、/jobs/{id}：
 *   - 第一次提交前按实时目录估算并 POST /api/credits/reserve；
 *   - 任务进入终态后用真实 job.cost POST /api/credits/settle；
 *   - provider 在真正建立任务前失败才 POST /api/credits/refund；
 *   - 已提交但 cost 尚不可得时保留 reservation，交给对账，不擅自退款。
 * 这样不需要改 model-plugin.ts，也不会把紫域 Key 放进前端。
 */
function withCreditBilling(body, capability) {
    const wrapper = [
        "function __creditCustomerCost(value) {",
        "  var n = Number(value);",
        "  if (!Number.isFinite(n) || n <= 0) return 0;",
        "  return Math.max(1, Math.ceil(n * 1.5));",
        "}",
        "async function __creditPost(path, payload) {",
        "  var response = await fetch(\"/api/credits\" + path, { method: \"POST\", credentials: \"include\", signal: signal, headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify(payload) });",
        "  var data = null;",
        "  try { data = await response.json(); } catch (_) {}",
        "  if (!response.ok) throw new Error((data && (data.message || data.error)) || (\"额度接口失败 HTTP \" + response.status));",
        "  return data || {};",
        "}",
        "var __creditProviderHttp = http;",
        "var __creditCatalog = null;",
        "var __creditTask = null;",
        "var __creditProviderJobId = null;",
        "var __creditProviderSubmitted = false;",
        "function __creditTaskId() { return \"ziyu-\" + Date.now() + \"-\" + Math.random().toString(36).slice(2); }",
        "function __creditJob(value) { return (value && value.job) || value || null; }",
        "async function __creditReserve(body) {",
        "  var list = (__creditCatalog && Array.isArray(__creditCatalog.models)) ? __creditCatalog.models : [];",
        "  var modelId = body && body.modelId;",
        "  var modelEntry = null;",
        "  for (var i = 0; i < list.length; i++) { if (list[i] && (list[i].id === modelId || list[i].name === modelId)) { modelEntry = list[i]; break; } }",
        "  if (!modelEntry) throw new Error(\"紫域模型目录已变化，请刷新模型列表后重试\");",
        "  var match = String((body && body.duration) || \"1\").match(/(\\d+(?:\\.\\d+)?)/);",
        "  var seconds = match ? Number(match[1]) : 1;",
        "  var cps = Number(modelEntry.costPerSecond);",
        "  var rawCost = cps > 0 ? cps * seconds : Number(modelEntry.cost || 0);",
        "  var credits = __creditCustomerCost(rawCost);",
        "  if (!(credits > 0)) throw new Error(\"紫域目录没有可用的计费信息，拒绝提交\");",
        "  var reservation = { id: __creditTaskId(), estimatedZiyuCost: rawCost, estimatedCredits: credits, modelId: modelEntry.id || modelId, seconds: seconds };",
        "  __creditProviderJobId = null;",
        "  __creditProviderSubmitted = false;",
        "  await __creditPost(\"/reserve\", { taskId: reservation.id, credits: credits, metadata: { channel: \"ziyu\", capability: " + JSON.stringify(capability) + ", modelId: reservation.modelId, estimatedZiyuCost: rawCost, seconds: seconds } });",
        "  __creditTask = reservation;",
        "}",
        "async function __creditSettle(job) {",
        "  if (!__creditTask) return;",
        "  var rawCost = Number(job && job.cost);",
        "  if (!Number.isFinite(rawCost)) throw new Error(\"紫域终态没有 cost，保留预扣并转人工对账\");",
        "  await __creditPost(\"/settle\", { taskId: __creditTask.id, ziyuCost: rawCost, status: String((job && job.status) || \"completed\"), metadata: { channel: \"ziyu\", capability: " + JSON.stringify(capability) + ", providerJobId: __creditProviderJobId || null, estimatedZiyuCost: __creditTask.estimatedZiyuCost } });",
        "  __creditTask = null;",
        "  __creditProviderJobId = null;",
        "  __creditProviderSubmitted = false;",
        "}",
        "async function __creditRefundBeforeProviderTask(reason) {",
        "  if (!__creditTask || __creditProviderSubmitted) return;",
        "  try { await __creditPost(\"/refund\", { taskId: __creditTask.id, reason: reason || \"provider_submit_failed\" }); } catch (_) {}",
        "  __creditTask = null;",
        "}",
        "http = {",
        "  url: __creditProviderHttp.url,",
        "  post: async function (path, payload, options) {",
        "    if (path === \"/jobs\") {",
        "      if (__creditTask) throw new Error(\"上一紫域任务尚未完成额度结算\");",
        "      await __creditReserve(payload || {});",
        "      var created;",
        "      try { created = await __creditProviderHttp.post(path, payload, options); }",
        "      catch (error) { await __creditRefundBeforeProviderTask(\"provider_submit_failed\"); throw error; }",
        "      __creditProviderSubmitted = true;",
        "      var createdJob = __creditJob(created);",
        "      __creditProviderJobId = (created && (created.jobId || created.id)) || (createdJob && createdJob.id) || null;",
        "      if (!__creditProviderJobId) throw new Error(\"紫域已响应但没有任务号，预扣保留待对账\");",
        "      return created;",
        "    }",
        "    return __creditProviderHttp.post(path, payload, options);",
        "  },",
        "  get: async function (path, options) {",
        "    var result = await __creditProviderHttp.get(path, options);",
        "    if (path === \"/models\") { __creditCatalog = result; return result; }",
        "    if (path.indexOf(\"/jobs/\") === 0) {",
        "      var job = __creditJob(result);",
        "      if (job && job.id) __creditProviderJobId = job.id;",
        "      var status = String((job && job.status) || \"\").toLowerCase();",
        "      if ([\"completed\", \"failed\", \"timed out\", \"timeout\", \"canceled\", \"cancelled\"].indexOf(status) >= 0) await __creditSettle(job);",
        "    }",
        "    return result;",
        "  },",
        "};",
        "try {",
        "  var __creditResult = await (async function () {",
        body,
        "  })();",
        "  if (__creditTask) throw new Error(\"紫域脚本结束但额度尚未结算，结果不予交付\");",
        "  return __creditResult;",
        "} catch (error) {",
        "  await __creditRefundBeforeProviderTask(\"provider_task_not_created\");",
        "  throw error;",
        "}",
    ].join(LF);
    return wrapper;
}

function s8() {
    const id = "S8";
    if (!want(id)) return;
    const raw = readGov("implementation/web/ziyu-channel-template.json");
    if (raw === null) { fail(id, "缺少 implementation/web/ziyu-channel-template.json"); return; }

    let tpl;
    try {
        tpl = JSON.parse(raw);
    } catch (e) {
        fail(id, "模板 JSON 解析失败：" + (e && e.message));
        return;
    }

    const models = (tpl.channel && tpl.channel.models) || [];
    if (!models.length) { fail(id, "模板里没有模型"); return; }

    const videoBody = withCreditBilling(String(tpl.scripts.video), "video");
    const imageBody = withCreditBilling(String(tpl.scripts.image), "image");
    const videoScript = tsLiteral(videoBody);
    const imageScript = tsLiteral(imageBody);

    // 只编译，不执行：先把两段最终注入 model-plugin.ts 的脚本过一遍语法门槛。
    try {
        const compilePlugin = (script) => new Function(
            "prompt", "images", "messages", "params", "model", "baseUrl", "apiKey", "systemPrompt",
            "reasoningEffort", "http", "request", "poll", "sleep", "signal", "onDelta",
            "\"use strict\"; return (async () => {\n" + script + "\n})();",
        );
        compilePlugin(videoBody);
        compilePlugin(imageBody);
    } catch (e) {
        fail(id, "紫域视频 / 图片脚本编译失败：" + (e && e.message));
        return;
    }

    const modelLines = models.map(function (m) {
        const cap = m.capability === "image" ? "image" : "video";
        const scriptName = cap === "image" ? "ZIYU_IMAGE_SCRIPT" : "ZIYU_VIDEO_SCRIPT";
        return "            { name: " + JSON.stringify(m.name) + ", capability: \"" + cap + "\", script: " + scriptName + " },";
    });

    const constBlock = [
        "/**",
        " * 紫域（ziyuai.vip）插件脚本 —— 走渠道自带的 script 字段（model-plugin.ts 的 new Function 沙箱）。",
        " * " + models.length + " 个模型只对应两段脚本（视频 / 图片各一段），抽成模块级常量，避免 TS 源码膨胀约 150KB。",
        " *",
        " * 脚本里的沙箱变量只有 15 个：prompt / images / messages / params / model / baseUrl",
        " * / apiKey / systemPrompt / reasoningEffort / http / request / poll / sleep / signal / onDelta。",
        " * 真实 API Key 不在脚本里 —— 由 nginx 的 proxy_set_header Authorization 在服务端注入。",
        " * S8 会再包一层本站额度事务：/jobs 前 reserve，终态按 job.cost settle，提交前失败才 refund。",
        " *",
        " * ⚠️ 截至 2026-09-13，这两段脚本从未在真实浏览器里执行过一次，首次上线必须人工冒烟。",
        " */",
        "const ZIYU_VIDEO_SCRIPT = " + videoScript + ";",
        "",
        "const ZIYU_IMAGE_SCRIPT = " + imageScript + ";",
        "",
    ].join(LF);

    const channelEntry = [
        "    {",
        "        id: \"ziyu\",",
        "        name: \"紫域\",",
        "        baseUrl: \"/ziyu/api\",",
        "        apiFormat: \"openai\",",
        "        // 占位串：真实 Key 由 nginx 在服务端注入并整条覆盖浏览器同名头，写什么都不会泄露。",
        "        // 但不能留空 —— video.ts 在 apiKey 为空时会直接抛 apiKeyRequired，出片主链路就走不到插件脚本。",
        "        apiKey: \"ziyu-proxy\",",
        "        models: [",
    ].concat(modelLines).concat([
        "        ],",
        "        hint: \"紫域视频 / 图片（服务端已注入 Key，无需填写）。提交后按积分扣额度；失败任务以紫域返回的 cost 字段对账，不假设「失败必退」。\",",
        "    },",
    ]).join(LF);

    patch(id, "web/src/stores/channel-templates.ts", function (text) {
        const done = [];
        let t = text;

        if (t.indexOf("ZIYU_VIDEO_SCRIPT") < 0) {
            const anchor = "export const channelTemplates: ChannelTemplate[] = [";
            const next = insertBefore(t, anchor, constBlock + LF);
            if (!next) return { error: "找不到 channelTemplates 锚点" };
            t = next;
            done.push("插入脚本常量");
        }

        if (t.indexOf("script?: string }>;") < 0) {
            const anchor = "    models: Array<{ name: string; capability: ModelCapability }>;";
            if (t.indexOf(anchor) < 0) return { error: "找不到 models 字段声明锚点" };
            t = t.replace(anchor,
                "    /** 模型可自带插件脚本（可选）。 */" + LF +
                "    models: Array<{ name: string; capability: ModelCapability; script?: string }>;");
            done.push("models 支持 script");
        }

        if (t.indexOf("apiKey?: string;") < 0) {
            const anchor = "    baseUrl: string;" + LF + "    apiFormat: ApiCallFormat;";
            if (t.indexOf(anchor) < 0) return { error: "找不到 baseUrl / apiFormat 声明锚点" };
            t = t.replace(anchor,
                "    baseUrl: string;" + LF + "    apiFormat: ApiCallFormat;" + LF +
                "    /** 占位 Key（可选）。真实 Key 由服务端注入；留空会让 video.ts 直接抛 apiKeyRequired。 */" + LF +
                "    apiKey?: string;");
            done.push("ChannelTemplate 支持 apiKey");
        }

        if (t.indexOf("template.apiKey ??") < 0) {
            const anchor = "        apiKey: \"\",";
            if (t.indexOf(anchor) < 0) return { error: "找不到 createChannelFromTemplate 的 apiKey 锚点" };
            t = t.replace(anchor, "        apiKey: template.apiKey ?? \"\",");
            done.push("透传模板 apiKey");
        }

        if (t.indexOf("...(model.script ? { script: model.script } : {})") < 0) {
            const anchor = "models: template.models.map((model): ChannelModel => ({ name: model.name, capability: model.capability })),";
            if (t.indexOf(anchor) < 0) return { error: "找不到 createChannelFromTemplate 的 models 映射锚点" };
            t = t.replace(anchor,
                "models: template.models.map((model): ChannelModel => ({" + LF +
                "            name: model.name," + LF +
                "            capability: model.capability," + LF +
                "            ...(model.script ? { script: model.script } : {})," + LF +
                "        })),");
            done.push("透传模型 script");
        }

        if (t.indexOf("id: \"ziyu\"") < 0) {
            const anchor = "];" + LF + LF + "export function createChannelFromTemplate";
            if (t.indexOf(anchor) < 0) return { error: "找不到 channelTemplates 数组收尾锚点" };
            t = t.replace(anchor, channelEntry + LF + anchor);
            done.push("追加紫域模板（" + modelLines.length + " 个模型）");
        }

        if (done.length === 0) return null;
        return { text: t, eol: CRLF, detail: done.join("；") };
    });
}

// ============================================================================
// 主流程
// ============================================================================

function printHeader() {
    console.log("无限画布 · 批次 1 落地器（apply-batch1）");
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
            console.log("  · " + (item.kind === "copy" ? item.to : item.target));
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

printHeader();
s1(); s2(); s3(); s4(); s5(); s6(); s7(); s8();
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
console.log("  1) 服务器补 api.env 的 LDXP_REDEEM_SECRET（见上面 S6）；");
console.log("  2) 用 CANVAS_ZIYU_API_KEY=<key> 跑发布（脚本会写 api.env + 替换 nginx 占位符）；");
console.log("  3) 服务器 nginx -t 后 reload（见上面 S7）；");
console.log("  4) 重建 api 容器；5) 走 implementation/deploy/ACCEPTANCE.md 的 A-00~A-27。");

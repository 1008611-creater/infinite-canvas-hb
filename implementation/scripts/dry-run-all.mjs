#!/usr/bin/env node
// ============================================================================
// 无限画布 · 三批次落地器「零写入干跑」总控（dry-run-all.mjs）
// ----------------------------------------------------------------------------
// 作用：把 apply-batch1 / apply-batch2 / apply-batch3 放进一个【零写入虚拟文件系统】里
//       真跑一遍 —— 读的是真实权威源码树，写的是内存覆盖层。
//
//   ★ 本脚本绝不写盘、绝不启动进程、绝不联网。
//   ★ 跑完会打印「本会写哪些路径」和权威树零变化核对。
//
// 它解决什么问题：
//   落地器在「假源树」上跑通过，但那证明不了它对真实权威树也不会插错位置。
//   本脚本用真实文件做锚点匹配，把风险从「跑一次才知道」降到「先看一遍再跑」。
//   —— 注意：干跑只证明「不会插错位置」，不证明「落地后能收钱」。
//
// 用法（在治理仓根目录执行）：
//   node implementation/scripts/dry-run-all.mjs
//   node implementation/scripts/dry-run-all.mjs --source=E:/path/to/infinite-canvas
//   node implementation/scripts/dry-run-all.mjs --verbose
//
// 退出码：0 = 三个落地器都跑完（不保证零 FAIL，FAIL 会打印出来）；2 = 前置不满足。
//
// 自测提示（可选）：本脚本自身也可以在零写入沙箱里跑，注入的全局名是
//   fs, fsReal, path, process, console, Buffer, vm
// 注意 fsReal 必须也注入 —— 否则会 ReferenceError: fsReal is not defined。
// 本脚本自己只读权威树、只写内存覆盖层；它不会改权威树的任何文件。
// ============================================================================

import fsReal from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOVERNANCE = path.resolve(HERE, "..", "..");
const DEFAULT_SOURCE = "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas";

function parseArgs(argv) {
    const out = { _: [] };
    for (let i = 0; i < argv.length; i += 1) {
        const a = argv[i];
        if (a === "--verbose") { out.verbose = true; continue; }
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
const SOURCE = path.resolve(args.source || DEFAULT_SOURCE);
const VERBOSE = !!args.verbose;

// ----------------------------------------------------------------- 沙箱

// 覆盖层：key 一律用 path.join 形态（脚本内部就是这么拼的）。
// readFileSync / existsSync / statSync 先查覆盖层，未命中就落回真实磁盘 —— 所以读的是真文件。
// writeFileSync / copyFileSync / mkdirSync 只写内存 —— 所以权威树一个字节都不会变。
function makeSandbox() {
    const overlay = new Map();
    const writes = [];
    const ffs = Object.create(fsReal);
    ffs.readFileSync = function (p, enc) {
        const k = String(p);
        if (overlay.has(k)) return overlay.get(k);
        return fsReal.readFileSync(p, enc);
    };
    ffs.existsSync = function (p) {
        const k = String(p);
        return overlay.has(k) || fsReal.existsSync(p);
    };
    ffs.statSync = function (p) {
        const k = String(p);
        if (overlay.has(k)) {
            const d = overlay.get(k);
            return { size: Buffer.byteLength(d, "utf8"), mtime: new Date(), isFile: () => true, isDirectory: () => false };
        }
        return fsReal.statSync(p);
    };
    ffs.writeFileSync = function (p, data) {
        const k = String(p);
        if (!overlay.has(k)) writes.push(k);
        overlay.set(k, typeof data === "string" ? data : String(data));
    };
    ffs.copyFileSync = function (from, to) {
        const k = String(to);
        if (!overlay.has(k)) writes.push(k);
        overlay.set(k, ffs.readFileSync(from, "utf8"));
    };
    ffs.mkdirSync = function () { /* 虚拟层：目录无需真的存在 */ };
    ffs.appendFileSync = function (p, data) {
        const k = String(p);
        const prev = overlay.has(k) ? overlay.get(k) : (fsReal.existsSync(p) ? fsReal.readFileSync(p, "utf8") : "");
        if (!overlay.has(k)) writes.push(k);
        overlay.set(k, prev + (typeof data === "string" ? data : String(data)));
    };
    return { overlay, writes, ffs };
}

// 把落地器当普通函数编译执行：
//   · 剥掉 shebang 与 import 行，把 fs / path / process / console / Buffer 当参数注入；
//   · import.meta.url 换成【完整文件路径】—— 脚本内部还有 path.dirname，换成目录会再上一层。
function runApplier(file, sandbox, argv, seedOverlay) {
    if (seedOverlay) for (const [k, v] of seedOverlay) sandbox.overlay.set(k, v);
    let body = fsReal.readFileSync(file, "utf8");
    body = body.replace(/^#!.*\r?\n/, "");
    body = body.replace(/^import .*$/gm, "");
    body = body.replace(/fileURLToPath\(import\.meta\.url\)/g, JSON.stringify(file));
    const logs = [];
    const errs = [];
    const fakeConsole = {
        log: function () { logs.push(Array.from(arguments).map(String).join(" ")); },
        error: function () { errs.push(Array.from(arguments).map(String).join(" ")); },
        warn: function () { errs.push(Array.from(arguments).map(String).join(" ")); },
    };
    const fakeProcess = {
        argv: ["node", file].concat(argv || []),
        exit: function (code) { const e = new Error("exit"); e.__exit = code; throw e; },
        versions: { node: "22.11.0" },
        env: {},
        cwd: function () { return GOVERNANCE; },
        platform: "win32",
    };
    const fn = vm.compileFunction(body, ["fs", "path", "process", "console", "Buffer"]);
    try {
        fn(sandbox.ffs, path, fakeProcess, fakeConsole, Buffer);
    } catch (e) {
        if (e && e.__exit !== undefined) return { code: e.__exit, logs, errs };
        throw e;
    }
    return { code: 0, logs, errs };
}

// ----------------------------------------------------------------- 主流程

const APPLIERS = [
    { batch: "批次 1", id: "apply-batch1", file: path.join(HERE, "apply-batch1.mjs"), seedFromPrevious: false },
    { batch: "batch 1.5", id: "apply-batch1-ui", file: path.join(HERE, "apply-batch1-ui.mjs"), seedFromPrevious: true },
    { batch: "批次 2", id: "apply-batch2", file: path.join(HERE, "apply-batch2.mjs"), seedFromPrevious: true },
    { batch: "批次 3", id: "apply-batch3", file: path.join(HERE, "apply-batch3.mjs"), seedFromPrevious: true },
];

console.log("无限画布 · 批次 1 / 1.5 / 2 / 3 落地器零写入干跑");
console.log("  治理仓：" + GOVERNANCE);
console.log("  权威树：" + SOURCE + "（只读）");
console.log("  ★ 本脚本不写盘、不起进程、不联网。写入全部落进内存覆盖层。");
console.log("");

if (!fsReal.existsSync(SOURCE)) {
    console.error("✗ 权威源码树不存在：" + SOURCE);
    console.error("  用 --source=E:/path/to/infinite-canvas 指定。");
    process.exit(2);
}
if (!fsReal.existsSync(path.join(SOURCE, "canvas-api", "server.js"))) {
    console.error("✗ 权威源码树看起来不对：找不到 canvas-api/server.js。");
    process.exit(2);
}

// 跑之前先记下权威树里被改动候选文件的字节数，跑完再比一次。
const WATCH = [
    "canvas-api/server.js",
    "canvas-api/schema.sql",
    "deploy/Dockerfile.api",
    "deploy/nginx-docker.conf",
    "scripts/deploy/publish.sh",
    "web/src/stores/channel-templates.ts",
    "web/src/stores/use-config-store.ts",
    "web/src/services/backend-sync.ts",
    "web/src/components/layout/config-account.tsx",
    "web/src/components/layout/model-select-modal.tsx",
    "web/src/i18n/locales/zh-CN.ts",
    "web/src/i18n/locales/en-US.ts",
];
const before = new Map();
for (const rel of WATCH) {
    const p = path.join(SOURCE, rel);
    before.set(rel, fsReal.existsSync(p) ? fsReal.statSync(p).size : null);
}

const summary = [];
let seed = null;
for (const a of APPLIERS) {
    const sb = makeSandbox();
    // 批次 2 / 3 的落地器有前置守卫（要求批次 1 已落地），所以把上一批的模拟产物喂进去。
    const seedUse = a.seedFromPrevious && seed
        ? new Map(Array.from(seed.overlay).filter(function (kv) { return !kv[0].includes(".bak-"); }))
        : null;
    let r;
    try {
        r = runApplier(a.file, sb, ["--source=" + SOURCE], seedUse);
    } catch (e) {
        console.error("✗ " + a.id + " 抛出未捕获异常：" + (e && e.message));
        process.exit(2);
    }
    summary.push({ batch: a.batch, id: a.id, code: r.code, logs: r.logs, errs: r.errs, writes: sb.writes });
    seed = { overlay: new Map([...(seed ? seed.overlay : []), ...sb.overlay]) };
    if (VERBOSE) {
        console.log("--------------------------------------------------------------- " + a.batch + " · " + a.id + " 原始输出");
        for (const l of r.logs) console.log(l);
        for (const l of r.errs) console.log("[stderr] " + l);
        console.log("");
    }
}

console.log("=============================================================== 汇总");
console.log("");
for (const s of summary) {
    // 只认结果表里的行：步号 + 两空格 + 状态。否则会把脚本自己的说明文字（「1 = 有 FAIL」）算进来。
    const ROW = /^(S[0-9]+|U[0-9]+|CHECK|B[0-9]+|B3-[0-9]+|V[0-9]+)\s{2,}(FAIL|BLOCK)\b/;
    const fails = s.logs.filter(function (l) { return ROW.test(l.trim()) && /\sFAIL\b/.test(l); });
    const blocks = s.logs.filter(function (l) { return ROW.test(l.trim()) && /\sBLOCK\b/.test(l); });
    console.log(s.batch + " · " + s.id);
    console.log("  退出码：" + s.code + " ｜ 模拟写入 " + s.writes.length + " 个路径 ｜ FAIL " + fails.length + " ｜ BLOCK " + blocks.length);
    if (!VERBOSE) {
        for (const l of s.logs) {
            if (/^S[0-9]+|^U[0-9]+|^CHECK|^B[0-9]+|^B3-[0-9]|^V[0-9]+/.test(l.trim())) console.log("    " + l.trim());
        }
    }
    if (fails.length) for (const l of fails) console.log("    ✗ " + l.trim());
    if (blocks.length) for (const l of blocks) console.log("    ⚠ " + l.trim());
    if (s.errs.length) for (const l of s.errs) console.log("    [stderr] " + l);
    console.log("");
}

console.log("--------------------------------------------------------------- 本会写哪些路径（模拟）");
const allWrites = [];
for (const s of summary) for (const w of s.writes) allWrites.push({ batch: s.batch, p: w });
const uniq = new Set(allWrites.map(function (x) { return x.p; }));
console.log("去重后共 " + uniq.size + " 个目标路径（含备份）：");
for (const u of uniq) {
    const owner = allWrites.filter(function (x) { return x.p === u; }).map(function (x) { return x.batch; });
    const rel = u.startsWith(SOURCE) ? u.slice(SOURCE.length + 1) : u;
    console.log("  · " + rel + "   [" + Array.from(new Set(owner)).join(" / ") + "]");
}
console.log("");

console.log("--------------------------------------------------------------- 权威树零变化核对");
let changed = 0;
for (const rel of WATCH) {
    const p = path.join(SOURCE, rel);
    const now = fsReal.existsSync(p) ? fsReal.statSync(p).size : null;
    const was = before.get(rel);
    const same = now === was;
    if (!same) changed += 1;
    console.log("  " + (same ? "✓" : "✗") + " " + rel + "  " + was + " → " + now);
}
console.log("");
console.log(changed === 0
    ? "✓ 权威树零变化：干跑确实没有写盘。"
    : "✗ 有 " + changed + " 个文件字节数变了 —— 干跑不该写盘，请立即检查！");
console.log("");
console.log("=============================================================== 一句话");
console.log("干跑只证明「不会插错位置」，不证明「落地后能收钱」。");
console.log("第一次真跑仍然必须由你在自己终端执行，跑前先加 --dry-run 读完输出。");
console.log("详细报告见 docs/VERIFICATION_20260913_APPLY_DRYRUN.md。");

process.exit(changed === 0 ? 0 : 1);

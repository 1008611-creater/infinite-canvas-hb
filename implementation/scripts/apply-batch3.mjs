#!/usr/bin/env node
// ============================================================================
// 无限画布 · 批次 3 落地器（apply-batch3.mjs）
// ----------------------------------------------------------------------------
// ★★ 本脚本与前两批的形态完全不同，先读这一段 ★★
//
//   批次 1 / 批次 2 的落地器是「改源码树」—— 它们真的往权威树里写文件。
//   批次 3 的落地器是「**不改源码树**」—— 它一个字节都不写。
//
//   为什么：批次 3 的交付件不是「新代码」，而是「把已经存在的东西接起来」：
//     · canvas-agent 已构建（dist/ 2026-08-27，34 个工具）
//     · tools/omniroute-guard 已存在（零依赖纯 Node，不需要 npm install）
//     · 天宫漫剧的节点是**画布上的数据**，不是代码
//   真正的动作（起进程、开隧道、加防火墙规则、在画布上连节点）
//   **必须由你在自己机器上做** —— 本脚本没有凭据，也不该有。
//
//   所以本脚本只做三件事：
//     1. 前置校验（源码树 / 批次 1 是否已落地 / canvas-agent 是否已构建 / 治理仓四件套）
//     2. 打印「待执行清单」，用四态标注：PASS / TODO / BLOCK / FAIL
//     3. 打印你该在自己终端里跑的命令原文，以及该在画布上做的操作
//
// 有意不做的事（延续批次 1 / 批次 2 的「有意不做」传统）：
//   任何 ssh / docker / netsh / cloudflared / 画布操作，一律不代做。
//   本脚本**只读本地文件系统**：不发网络请求、不启动进程、不改任何文件、不写备份。
//
// 与批次 1 / 批次 2 的关键差异：**批次 3 的 TODO 是常态，不是异常。**
//   看到一堆 TODO 是设计如此，不是脚本没写完。
//
// 用法见 implementation/APPLY-RUNBOOK.md 与 implementation/deploy/batch3-ops.md。
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GOVERNANCE = path.resolve(HERE, "..", "..");
const DEFAULT_SOURCE = "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas";

// ---------------------------------------------------------------- 参数

function parseArgs(argv) {
    const out = { _: [] };
    for (let i = 0; i < argv.length; i += 1) {
        const a = argv[i];
        if (a === "--dry-run") { out["dry-run"] = true; continue; }
        if (a === "--ack-agent-auth") { out["ack-agent-auth"] = true; continue; }
        if (a === "--strict") { out["strict"] = true; continue; }
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
const ACK_AGENT_AUTH = Boolean(args["ack-agent-auth"]);
const STRICT = Boolean(args.strict);
const ONLY = args.only
    ? new Set(String(args.only).split(",").map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean))
    : null;

// ---------------------------------------------------------------- 记账
// 四态口径来自 implementation/deploy/batch3-ops.md §7。

const results = [];
const fails = [];
const blocks = [];
const todos = [];
const hints = [];

function pass(id, detail) { results.push({ id, status: "PASS", detail }); }
function todo(id, detail) { results.push({ id, status: "TODO", detail }); todos.push(id + " · " + detail); }
function block(id, detail) { results.push({ id, status: "BLOCK", detail }); blocks.push(id + " · " + detail); }
function fail(id, detail) { results.push({ id, status: "FAIL", detail }); fails.push(id + " · " + detail); }
function hint(detail) { hints.push(detail); }
function want(id) { return !ONLY || ONLY.has(id); }

// ---------------------------------------------------------------- 工具

const LF = String.fromCharCode(10);

function rel(p) { return path.join(SOURCE, p); }
function has(p) { return fs.existsSync(rel(p)); }

/** 只读文本；不存在返回 null。不做任何写入。 */
function peek(p) {
    try { return fs.readFileSync(rel(p), "utf8"); } catch { return null; }
}

function sizeOf(p) {
    try { return fs.statSync(rel(p)).size; } catch { return -1; }
}

function mtimeOf(p) {
    try { return fs.statSync(rel(p)).mtime.toISOString().slice(0, 10); } catch { return "?"; }
}

/** 数一段文本里出现了几个给定的标记（用 indexOf，不写正则字面量）。 */
function countMarkers(text, markers) {
    const found = [];
    const missing = [];
    for (const m of markers) {
        if (text.indexOf(m) >= 0) found.push(m); else missing.push(m);
    }
    return { found, missing };
}

// ---------------------------------------------------------------- 文件头

function printHeader() {
    console.log("无限画布 · 批次 3 落地器（apply-batch3）");
    console.log("  治理仓：" + GOVERNANCE);
    console.log("  权威树：" + SOURCE);
    console.log("  模式：" + (ONLY ? "仅检查 " + Array.from(ONLY).join(",") : "全部") +
        (ACK_AGENT_AUTH ? " ｜ 已声明 D-agent-auth 已裁决" : "") +
        (STRICT ? " ｜ 严格模式（BLOCK 也算失败）" : ""));
    console.log("");
    console.log("  ★ 本脚本不改源码树：零写入、零进程、零网络请求。");
    console.log("  ★ 看到一堆 TODO 是设计如此 —— 批次 3 的动作都要你在自己机器上做。");
    console.log("");
}

// ============================================================================
// 一、前置校验
// ============================================================================

function preflight() {
    // V1 / V2 / V3 属「路径或前置不满足」→ exit 2，与 ops §8 一致。
    if (!fs.existsSync(SOURCE)) {
        console.error("✗ 找不到权威源码树：" + SOURCE);
        console.error("  用 --source=<路径> 指定，或改脚本顶部的 DEFAULT_SOURCE。");
        process.exit(2);
    }
    pass("V1", "权威源码树存在");

    if (!has("canvas-api/server.js")) {
        console.error("✗ 这个路径看起来不是无限画布的源码树（缺少 canvas-api/server.js）：" + SOURCE);
        process.exit(2);
    }
    pass("V2", "canvas-api/server.js 存在");

    if (!has("canvas-api/routes-credits.js")) {
        console.error("✗ 缺少 canvas-api/routes-credits.js —— 批次 1 还没落地。");
        console.error("  先跑：node implementation/scripts/apply-batch1.mjs --source=<权威树路径>");
        console.error("  原因：批次 3 的 B3-6 对账接口 /api/admin/credits/reconcile 由批次 1 提供；");
        console.error("        批次 1 未落地时对账无意义，本脚本不再往下走。");
        process.exit(2);
    }
    pass("V3", "批次 1 已落地（canvas-api/routes-credits.js 存在）");

    // V4 起属「文件缺失」→ FAIL（exit 1），不阻断后续检查。
    if (has("canvas-agent/dist/index.js")) {
        pass("V4", "canvas-agent 已构建（dist/index.js，" + sizeOf("canvas-agent/dist/index.js") + " B，" + mtimeOf("canvas-agent/dist/index.js") + "）");
    } else {
        fail("V4", "缺少 canvas-agent/dist/index.js —— canvas-agent 还没构建（在 canvas-agent/ 里跑一次构建）");
    }

    if (has("tools/omniroute-guard/server.js")) {
        pass("V5", "omniroute-guard 存在（tools/omniroute-guard/server.js，" + sizeOf("tools/omniroute-guard/server.js") + " B）");
    } else {
        fail("V5", "缺少 tools/omniroute-guard/server.js —— B3-2 的守卫反代不在");
    }

    if (has("canvas-agent/dist/canvas/schemas.js")) {
        pass("V6", "canvas-agent/dist/canvas/schemas.js 存在（工具清单可核对）");
        hint("工具数请自己跑一次确认（本脚本不执行外部命令）：");
        hint("  node -e \"import('./canvas-agent/dist/canvas/schemas.js').then(m=>console.log('tools =', m.toolNames.length))\"");
        hint("  期望 tools = 34。旧文档写的「6 个」「25 个」都不对。");
    } else {
        fail("V6", "缺少 canvas-agent/dist/canvas/schemas.js —— dist 不完整，重新构建一次");
    }

    if (has("canvas-agent/src/server/http.ts")) {
        const http = peek("canvas-agent/src/server/http.ts") || "";
        const danger = ["/agent/codex/turn", "/agent/claude/turn", "/agent/local-file/reveal", "/api/tools", "/agent/codex/approval"];
        const r = countMarkers(http, danger);
        if (r.missing.length === 0) {
            pass("V7", "五条危险路由都在（" + r.found.length + "/5）—— 对外暴露前务必读完 batch3-ops.md §4.2");
        } else {
            fail("V7", "有五条危险路由没找到（缺 " + r.missing.join(" / ") + "）—— 源码可能已变动，先人工核对再暴露");
        }
        const tokenAccept = http.indexOf("searchParams.get(\"token\")");
        if (tokenAccept >= 0) {
            hint("已确认：validToken() 接受 ?token= 查询参数 —— 这是选项 (a) 的直接代价（会进浏览器历史 / 代理日志 / Referer）。");
        }
        const cors = http.indexOf("function setCors");
        if (cors >= 0) {
            hint("已确认：setCors() 存在 —— CORS 白名单会写进 ~/.infinite-canvas/canvas-agent.json，回滚时记得一起清。");
        }
    } else {
        fail("V7", "缺少 canvas-agent/src/server/http.ts —— 无法核对危险路由");
    }

    const four = [
        "implementation/deploy/batch3-ops.md",
        "implementation/deploy/batch3-acceptance.md",
        "implementation/deploy/batch3-rollback.md",
        "implementation/scripts/apply-batch3.mjs",
    ];
    const missFour = four.filter(function (p) { return !fs.existsSync(path.join(GOVERNANCE, p)); });
    if (missFour.length === 0) {
        pass("V8", "治理仓批次 3 四件套齐全（ops / acceptance / rollback / 本脚本）");
    } else {
        fail("V8", "治理仓缺 " + missFour.length + " 件：" + missFour.join(" / "));
    }

    const major = Number(String(process.versions.node).split(".")[0]);
    if (major >= 20) {
        pass("V9", "Node 版本 " + process.versions.node + "（≥ 20）");
    } else {
        fail("V9", "Node 版本 " + process.versions.node + " 低于 20 —— 先升级 Node");
    }
}

// ============================================================================
// 二、待执行清单（B3-1 ~ B3-7）
// ----------------------------------------------------------------------------
// 编号对照见 implementation/deploy/batch3-ops.md §9：
//   B3-1 = A-19 canvas-agent 对外可达 + 有鉴权（★ 卡 D-agent-auth）
//   B3-2 = A-20 LLM 中转跨设备可用（omniroute-guard 20129）
//   B3-3 = A-20 风险 20128 限本机 + quick tunnel 保持关闭
//   B3-4 = A-21 天宫漫剧三集跑通流程
//   B3-5 = A-22 事实分层四类标注
//   B3-6 = A-23 对账可用
//   B3-7 = A-24 异常告警与失败日志
// ============================================================================

function checklist() {
    // ---------------------------------------------------------------- B3-1
    if (want("B3-1")) {
        if (!ACK_AGENT_AUTH) {
            block("B3-1", "canvas-agent 对外暴露被 D-agent-auth 阻塞 —— 鉴权形态未裁决，先裁决再动手");
            hint("★ B3-1 是硬阻塞。裁决项在 docs/DECISIONS.md D4（L60 / L68）与 ACCEPTANCE.md 附录 A（L568-570）。");
            hint("  三个选项：");
            hint("   (a) 沿用现有 token  —— 改动最小，但 ?token= 会进日志 / 浏览器历史；token 泄露 = 整机 agent 可被驱动");
            hint("   (b) 另发凭据 + 守卫反代 —— 照 omniroute-guard 模式新增 canvas-agent-guard，只绑本机 + 具名隧道");
            hint("   (c) 不对外暴露，只在本机用 —— 风险最小，但「对外能力」这条不算交付");
            hint("  裁决完成后，用 --ack-agent-auth 重跑本脚本：B3-1 会从 BLOCK 降为 TODO。");
            hint("  ⚠️ --ack-agent-auth 的含义是「决策已定」，**不是「跳过鉴权」**。");
        } else {
            todo("B3-1", "canvas-agent 对外暴露：起守卫 + 开具名隧道（见 batch3-ops.md §4.2）");
        }
    }

    // ---------------------------------------------------------------- B3-2
    if (want("B3-2")) {
        todo("B3-2", "起 omniroute-guard（20129）：GUARD_TOKEN 必填，别把启动日志外贴");
    }

    // ---------------------------------------------------------------- B3-3
    if (want("B3-3")) {
        todo("B3-3", "把 20128 收到本机：加防火墙规则 + 双端自测（有 WSL 需求就别加）");
    }

    // ---------------------------------------------------------------- B3-4
    if (want("B3-4")) {
        todo("B3-4", "天宫漫剧上/中/下三集：在画布上串通流程（★ 不许写成「三集已产出」）");
    }

    // ---------------------------------------------------------------- B3-5
    if (want("B3-5")) {
        todo("B3-5", "事实分层四类标注落到节点上：source_fact / adaptation / 影视化补强 / unverified");
        hint("⚠️ B3-5 若要改前端代码，批次 3 就不再是「不改源码树」的批次 —— 停下来先回报，拆独立批次。");
    }

    // ---------------------------------------------------------------- B3-6
    if (want("B3-6")) {
        todo("B3-6", "对账：GET /api/admin/credits/reconcile?days=1 对紫域 GET /api/v1/jobs?limit=50（★ 先只读）");
    }

    // ---------------------------------------------------------------- B3-7
    if (want("B3-7")) {
        todo("B3-7", "异常留痕：余额差异 / 兑换失败 / 紫域异常状态码，各造一次看是否留痕");
        hint("⚠️ 「告警」目前只有留痕，没有主动推送通道。本项验收的是留痕，不是「手机收到通知」。");
    }
}

// ============================================================================
// 三、输出
// ============================================================================

function printTable() {
    console.log("");
    console.log("步骤  结果    说明");
    console.log("----  ------  ------------------------------------------------------------------");
    for (const r of results) {
        const id = String(r.id).padEnd(4);
        const st = String(r.status).padEnd(6);
        console.log(id + "  " + st + "  " + r.detail);
    }
}

function printCommands() {
    console.log("");
    console.log("--------------------------------------------------------------- 待执行命令原文");
    console.log("★ 下面这些命令要你在自己机器的终端里跑。本脚本不代做、也不验证结果。");
    console.log("");
    console.log("1) 先核对现状（只读，不改任何东西）—— batch3-ops.md §4.1");
    console.log("     dir " + path.join(SOURCE, "canvas-agent", "dist", "index.js"));
    console.log("     node -e \"import('./canvas-agent/dist/canvas/schemas.js').then(m=>console.log('tools =', m.toolNames.length))\"");
    console.log("   期望：文件存在；tools = 34。");
    console.log("");
    console.log("2) B3-2 · 起守卫（batch3-ops.md §4.3）—— 20129");
    console.log("   PowerShell:");
    console.log("     $env:GUARD_TOKEN = \"<你自己生成的长随机串>\"");
    console.log("     node " + path.join(SOURCE, "tools", "omniroute-guard", "server.js"));
    console.log("   bash / WSL:");
    console.log("     GUARD_TOKEN=\"<你自己生成的长随机串>\" node tools/omniroute-guard/server.js");
    console.log("   ★ 启动日志会打印 token 前 4 / 后 4 位 —— 不要把日志贴到任何公开处。");
    console.log("   ★ 不要为了图快把 GUARD_TOKEN 留空或改成弱口令：它挡在 20128 前面，是唯一那道门。");
    console.log("");
    console.log("3) B3-3 · 把 20128 收到本机（batch3-ops.md §4.4）—— 管理员 PowerShell");
    console.log("     netsh advfirewall firewall add rule name=\"omniroute-20128-block-remote\" dir=in action=block protocol=TCP localport=20128");
    console.log("   撤销（回滚用）：");
    console.log("     netsh advfirewall firewall delete rule name=\"omniroute-20128-block-remote\"");
    console.log("   ★ 有从 WSL 访问 20128 的需求就**不要加**（WSL2 走 NAT，会被一起挡掉）。");
    console.log("   ★ 加完要双端自测：本机 curl 127.0.0.1:20128 应通；另一台设备 curl <本机IP>:20128 应超时。");
    console.log("");
    console.log("4) B3-1 / B3-2 · 具名隧道（batch3-ops.md §4.5）—— 三条硬约束");
    console.log("   · 不要用 cloudflared service install（会抢服务名，见 AGENTS.md §4）");
    console.log("   · quick tunnel 必须保持关闭（无鉴权公网入口）");
    console.log("   · 不用 Cloudflare Access（交互式登录页与前端 fetch 不兼容）");
    console.log("   范例见权威树 deploy/cloudflared-canvas.service 与 cloudflared-canvas.yml.example。");
    console.log("   新服务名 + 新 token 目录 + 新 hostname，三个都要新。");
    console.log("");
    console.log("5) B3-4 / B3-5 · 画布上的操作（batch3-ops.md §5）—— 没有命令行");
    console.log("   · 三集节点链串通 + canvas_export_snapshot 导出快照 + 截图 + 时间戳");
    console.log("   · 事实分层四类各一个节点 + 截图 + 快照 JSON");
    console.log("");
    console.log("6) B3-6 / B3-7 · 对账与异常留痕（batch3-ops.md §6）");
    console.log("   · GET /api/admin/credits/reconcile?days=1（本地，需管理员）");
    console.log("   · GET /api/v1/jobs?limit=50（紫域官方对账入口）");
    console.log("   ★ 一律先只读。修账走 POST /api/admin/credits/adjust（会写 credit_adjustments 留痕）。");
}

function printHints() {
    if (!hints.length) return;
    console.log("");
    console.log("--------------------------------------------------------------- 提示");
    for (const h of hints) console.log("  " + h);
}

function printFooter() {
    console.log("");
    console.log("--------------------------------------------------------------- 收尾");
    console.log("本脚本不改源码树，所以：没有 .bak 备份、没有「写盘 N 处」、没有回退动作。");
    console.log("要撤销批次 3 的动作，见 implementation/deploy/batch3-rollback.md（两个陷阱：");
    console.log("  撤防火墙规则必须早于把 baseUrl 改回 20128；关隧道要一起清 CORS 白名单）。");
    console.log("");
    console.log("逐条打勾请照 implementation/deploy/batch3-acceptance.md 的 B3-1 ~ B3-7。");
    console.log("★ 顺序风险：批次 3 是在批次 1 的计费层之上做内容；");
    console.log("  若 L2 画布交互的真机验证还没补完（缩放 / 节点链真实执行 / 插件安装三项缺证据），");
    console.log("  那么 B3-4 的「链路走得通」这句本身就无法证明 —— 节点连起来不等于节点链能执行。");
}

// ============================================================================
// 主流程
// ============================================================================

printHeader();
preflight();
checklist();
printTable();
printHints();
printCommands();
printFooter();

console.log("");
if (fails.length) {
    console.error("✗ 有 " + fails.length + " 处 FAIL（文件缺失或路径不对）：");
    for (const f of fails) console.error("  · " + f);
    console.error("  按上面的提示修好再重跑。本脚本只读，重跑安全。");
    process.exit(1);
}

if (blocks.length) {
    console.log("⚠ 有 " + blocks.length + " 处 BLOCK（硬阻塞，必须先裁决）：");
    for (const b of blocks) console.log("  · " + b);
    if (STRICT) {
        console.error("✗ --strict：BLOCK 也计为失败。");
        process.exit(1);
    }
}

console.log("✓ 前置校验通过。剩余 " + todos.length + " 项 TODO 都要你在自己机器上做（这是设计如此）。");
console.log("  退出码 0 = 校验全过（可能仍有 TODO / BLOCK）；1 = 有 FAIL；2 = 路径或前置不满足。");
console.log("  BLOCK 不影响退出码，但它是硬阻塞 —— 不要带着它往下做。");

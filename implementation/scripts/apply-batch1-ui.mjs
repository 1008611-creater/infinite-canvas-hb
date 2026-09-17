#!/usr/bin/env node
// ============================================================================
// 无限画布 · 批次 1.5 前端落地器（apply-batch1-ui.mjs）
// ----------------------------------------------------------------------------
// 作用：把批次 1 的用户侧额度入口与紫域实时模型目录接进权威源码树。
//
// 本脚本属于治理仓：默认只读治理文件、改写权威源码树中的前端文件，
// 不连接服务器、不读取密钥、不构建、不发布。正式写入前可先 --dry-run。
// 所有改动按 U1–U4 分步、幂等、写前留 .bak-YYYYMMDD 备份；任一锚点失败
// 都不会写盘，避免产生半成品。
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GOVERNANCE = path.resolve(HERE, "..", "..");
const DEFAULT_SOURCE = "E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas";

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
const TYPECHECK = Boolean(args.typecheck);
const ONLY = args.only ? new Set(String(args.only).split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)) : null;
const STAMP = new Date().toISOString().slice(0, 10).replace(/-/g, "");

const results = [];
const fails = [];
const pending = [];

function ok(id, detail) { results.push({ id, status: "OK", detail }); }
function skip(id, detail) { results.push({ id, status: "SKIP", detail }); }
function fail(id, detail) { results.push({ id, status: "FAIL", detail }); fails.push(id + " · " + detail); }
function want(id) { return !ONLY || ONLY.has(id); }

function readText(p) {
    const raw = fs.readFileSync(p, "utf8");
    return { eol: raw.includes("\r\n") ? "\r\n" : "\n", text: raw.split("\r\n").join("\n") };
}

function backupOf(p) { return p + ".bak-" + STAMP; }

function queueWrite(target, text, eol) {
    const existing = pending.find((item) => item.target === target);
    if (existing) {
        existing.text = text;
        existing.eol = eol;
        return;
    }
    pending.push({ target, text, eol });
}

function flush() {
    for (const item of pending) {
        if (fs.existsSync(item.target)) {
            const backup = backupOf(item.target);
            if (!fs.existsSync(backup)) fs.copyFileSync(item.target, backup);
        }
        const output = item.eol === "\r\n" ? item.text.split("\n").join("\r\n") : item.text;
        fs.writeFileSync(item.target, output, "utf8");
    }
    return pending.length;
}

/** transform(text) -> null（已完成）| {text, detail}|{error} */
function patch(id, rel, transform) {
    if (!want(id)) return;
    const target = path.join(SOURCE, rel);
    if (!fs.existsSync(target)) { fail(id, "目标文件不存在：" + rel); return; }
    let current;
    try {
        const queued = pending.find((item) => item.target === target);
        current = queued ? { eol: queued.eol, text: queued.text } : readText(target);
    } catch (error) {
        fail(id, "读取 " + rel + " 失败：" + (error && error.message));
        return;
    }
    let result;
    try { result = transform(current.text); } catch (error) {
        fail(id, "处理 " + rel + " 时抛错：" + (error && error.message));
        return;
    }
    if (!result) { skip(id, rel + " 已是最新（幂等跳过）"); return; }
    if (result.error) { fail(id, rel + " · " + result.error); return; }
    queueWrite(target, result.text, current.eol);
    ok(id, rel + " · " + result.detail);
}

function replaceOnce(text, anchor, replacement) {
    const first = text.indexOf(anchor);
    if (first < 0) return null;
    if (text.indexOf(anchor, first + anchor.length) >= 0) return { error: "锚点出现多次，拒绝盲改" };
    return text.slice(0, first) + replacement + text.slice(first + anchor.length);
}

function insertBefore(text, anchor, block) {
    const i = text.indexOf(anchor);
    if (i < 0) return null;
    return text.slice(0, i) + block + text.slice(i);
}

const LF = String.fromCharCode(10);

// ============================================================================
// U1 · 服务端额度 API 类型与请求函数
// ============================================================================

function u1() {
    const types = [
        "/** 额度定价只用于展示服务端返回的目录，不在前端计算扣费。 */",
        "export type CreditPricing = {",
        "    cnyPerCredit: number;",
        "    multiplier: number;",
        "    denominations: number[];",
        "};",
        "",
        "export type CreditLedgerItem = {",
        "    amount: number;",
        "    balance_after: number;",
        "    reason: string;",
        "    task_id: string | null;",
        "    metadata: Record<string, unknown> | null;",
        "    created_at: string;",
        "};",
        "",
        "export type FreeTrialStatus = { period: string; limit: number; used: number; remaining: number };",
        "",
        "export type CreditSummary = {",
        "    balance: number;",
        "    pricing: CreditPricing;",
        "    ledger: CreditLedgerItem[];",
        "    freeTrial: FreeTrialStatus;",
        "};",
        "",
        "export type CreditRedemption = { credits: number; redeemed_at: string };",
        "",
        "export type ZiyuModelInfo = {",
        "    id: string; name?: string; type?: string; modes?: string[]; enabled?: boolean;",
        "    cost?: number | null; costPerSecond?: number | null; allowedDurations?: Array<string | number>;",
        "};",
        "export type ZiyuCostGroup = { tier: number; models: ZiyuModelInfo[] };",
        "export type ZiyuModelGroups = { video: ZiyuModelInfo[]; image: ZiyuModelInfo[]; byCost: ZiyuCostGroup[] };",
        "export type ZiyuModelCatalog = { models: ZiyuModelInfo[]; groups?: ZiyuModelGroups };",
        "",
    ].join(LF);

    const functions = [
        "/** 读取当前账号的余额、流水和免费试拍状态。 */",
        "export async function fetchCreditSummary(): Promise<CreditSummary> {",
        "    const response = await backendFetch(\"/credits/me\");",
        "    if (!response.ok) throw await readError(response, \"读取额度失败\");",
        "    return (await response.json()) as CreditSummary;",
        "}",
        "",
        "/** 粘贴兑换码后交给服务端做签名校验与一次性抢占。 */",
        "export async function redeemCreditCode(code: string): Promise<{ ok: true; redeemedCredits: number; balance: number }> {",
        "    const response = await backendFetch(\"/credits/redeem\", {",
        "        method: \"POST\",",
        "        headers: { \"Content-Type\": \"application/json\" },",
        "        body: JSON.stringify({ code }),",
        "    });",
        "    if (!response.ok) throw await readError(response, \"兑换失败\");",
        "    return (await response.json()) as { ok: true; redeemedCredits: number; balance: number };",
        "}",
        "",
        "export async function generateCreditCodes(credits: number, count = 1): Promise<{ credits: number; count: number; codes: string[] }> {",
        "    const response = await backendFetch(\"/admin/credits/generate\", {",
        "        method: \"POST\",",
        "        headers: { \"Content-Type\": \"application/json\" },",
        "        body: JSON.stringify({ credits, count }),",
        "    });",
        "    if (!response.ok) throw await readError(response, \"生成兑换码失败\");",
        "    return (await response.json()) as { credits: number; count: number; codes: string[] };",
        "}",
        "",
        "export async function listCreditRedemptions(): Promise<CreditRedemption[]> {",
        "    const response = await backendFetch(\"/credits/redemptions\");",
        "    if (!response.ok) throw await readError(response, \"读取兑换记录失败\");",
        "    const payload = (await response.json()) as { items?: CreditRedemption[] };",
        "    return payload.items || [];",
        "}",
        "",
        "export async function fetchFreeTrialStatus(): Promise<FreeTrialStatus> {",
        "    const response = await backendFetch(\"/credits/free-trial\");",
        "    if (!response.ok) throw await readError(response, \"读取免费试拍状态失败\");",
        "    return (await response.json()) as FreeTrialStatus;",
        "}",
        "",
        "/** 紫域目录只经过服务端代理，响应中不应包含任何密钥字段。 */",
        "export async function fetchZiyuModelCatalog(): Promise<ZiyuModelCatalog> {",
        "    const response = await backendFetch(\"/ziyu/models\");",
        "    if (!response.ok) throw await readError(response, \"读取紫域模型目录失败\");",
        "    return (await response.json()) as ZiyuModelCatalog;",
        "}",
        "",
    ].join(LF);

    patch("U1", "web/src/services/backend-sync.ts", (text) => {
        let t = text;
        const changes = [];
        if (!t.includes("export type CreditSummary =")) {
            const anchor = "export class BackendError extends Error {";
            const next = insertBefore(t, anchor, types);
            if (next === null) return { error: "找不到 BackendError 类型锚点" };
            t = next;
            changes.push("额度与紫域目录类型");
        }
        if (!t.includes("export async function fetchCreditSummary()")) {
            const anchor = "export async function importExternalUrl(";
            const next = insertBefore(t, anchor, functions);
            if (next === null) return { error: "找不到 importExternalUrl 函数锚点" };
            t = next;
            changes.push("额度、兑换码、试拍与紫域目录请求函数");
        }
        if (!t.includes("export async function generateCreditCodes(")) {
            const anchor = "export async function listCreditRedemptions(): Promise<CreditRedemption[]> {";
            const next = insertBefore(t, anchor, functions.slice(functions.indexOf("export async function generateCreditCodes("), functions.indexOf("export async function listCreditRedemptions(")));
            if (next === null) return { error: "找不到 listCreditRedemptions 函数锚点" };
            t = next;
            changes.push("管理员发卡 API");
        }
        return changes.length ? { text: t, detail: changes.join("；") } : null;
    });
}

// ============================================================================
// U2 · 账号面板余额与兑换码入口
// ============================================================================

function u2() {
    patch("U2", "web/src/components/layout/config-account.tsx", (text) => {
        let t = text;
        const changes = [];

        if (!t.includes("fetchCreditSummary,")) {
            const anchor = "    createBackendTransport,\n";
            const next = replaceOnce(t, anchor, anchor + "    fetchCreditSummary,\n    generateCreditCodes,\n    redeemCreditCode,\n");
            if (!next || next.error) return { error: "找不到 backend-sync import 锚点" };
            t = next;
            changes.push("接入额度 API");
        }

        if (!t.includes("Ticket, Wallet")) {
            const anchor = "import { CloudDownload, LogIn, LogOut, RefreshCw, UserRound } from \"lucide-react\";";
            const next = replaceOnce(t, anchor, "import { CloudDownload, Copy, LogIn, LogOut, RefreshCw, Ticket, UserRound, Wallet } from \"lucide-react\";");
            if (!next || next.error) return { error: "找不到 lucide-react import 锚点" };
            t = next;
            changes.push("增加余额与兑换图标");
        }

        if (!t.includes("const [creditSummary, setCreditSummary]")) {
            const anchor = "    const [checkingUsage, setCheckingUsage] = useState(false);\n";
            const block = anchor +
                "    const [creditSummary, setCreditSummary] = useState<import(\"@/services/backend-sync\").CreditSummary | null>(null);\n" +
                "    const [creditCode, setCreditCode] = useState(\"\");\n" +
                "    const [checkingCredits, setCheckingCredits] = useState(false);\n" +
                "    const [redeeming, setRedeeming] = useState(false);\n" +
                "    const [codeCredits, setCodeCredits] = useState(\"100\");\n" +
                "    const [codeCount, setCodeCount] = useState(\"1\");\n" +
                "    const [generatingCodes, setGeneratingCodes] = useState(false);\n" +
                "    const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);\n";
            const next = replaceOnce(t, anchor, block);
            if (!next || next.error) return { error: "找不到 checkingUsage 状态锚点" };
            t = next;
            changes.push("增加余额与兑换码状态");
        }

        if (!t.includes("const refreshCredits = async")) {
            const anchor = "    const submit = async () => {";
            const block = [
                "    const refreshCredits = async (quiet = false) => {",
                "        if (!user) return;",
                "        setCheckingCredits(true);",
                "        try {",
                "            setCreditSummary(await fetchCreditSummary());",
                "        } catch (error) {",
                "            if (!quiet) message.error(error instanceof Error ? error.message : t(\"config.account.creditLoadFailed\"));",
                "        } finally {",
                "            setCheckingCredits(false);",
                "        }",
                "    };",
                "",
                "    useEffect(() => {",
                "        if (user) void refreshCredits(true);",
                "        else setCreditSummary(null);",
                "    }, [user]);",
                "",
                anchor,
            ].join(LF);
            const next = replaceOnce(t, anchor, block);
            if (!next || next.error) return { error: "找不到 submit 函数锚点" };
            t = next;
            changes.push("登录后自动读取余额");
        }

        if (!t.includes("const redeemCredits = async")) {
            const anchor = "    const importExternal = async () => {";
            const block = [
                "    const redeemCredits = async () => {",
                "        const code = creditCode.trim();",
                "        if (!code) return;",
                "        setRedeeming(true);",
                "        try {",
                "            const result = await redeemCreditCode(code);",
                "            setCreditCode(\"\");",
                "            message.success(t(\"config.account.redeemSuccess\", { credits: result.redeemedCredits }));",
                "            await refreshCredits(true);",
                "        } catch (error) {",
                "            message.error(error instanceof Error ? error.message : t(\"config.account.redeemFailed\"));",
                "        } finally {",
                "            setRedeeming(false);",
                "        }",
                "    };",
                "",
                anchor,
            ].join(LF);
            const next = replaceOnce(t, anchor, block);
            if (!next || next.error) return { error: "找不到 importExternal 函数锚点" };
            t = next;
            changes.push("接入粘贴兑换码动作");
        }

        if (!t.includes("const generateCodes = async")) {
            const anchor = "    const importExternal = async () => {";
            const block = [
                "    const copyGeneratedCodes = async () => {",
                "        if (!generatedCodes.length) return;",
                "        try {",
                "            await navigator.clipboard.writeText(generatedCodes.join(\"\\n\"));",
                "            message.success(t(\"config.account.adminCopyDone\"));",
                "        } catch {",
                "            message.error(t(\"config.account.adminCopyFailed\"));",
                "        }",
                "    };",
                "",
                "    const generateCodes = async () => {",
                "        const credits = Math.trunc(Number(codeCredits));",
                "        const count = Math.trunc(Number(codeCount));",
                "        if (!Number.isFinite(credits) || !Number.isFinite(count) || credits <= 0 || count <= 0) {",
                "            message.error(t(\"config.account.adminGenerateFailed\"));",
                "            return;",
                "        }",
                "        setGeneratingCodes(true);",
                "        try {",
                "            const result = await generateCreditCodes(credits, count);",
                "            setGeneratedCodes(result.codes || []);",
                "            message.success(t(\"config.account.adminCodesGenerated\", { count: result.codes?.length || 0 }));",
                "        } catch (error) {",
                "            message.error(error instanceof Error ? error.message : t(\"config.account.adminGenerateFailed\"));",
                "        } finally {",
                "            setGeneratingCodes(false);",
                "        }",
                "    };",
                "",
                anchor,
            ].join(LF);
            const next = replaceOnce(t, anchor, block);
            if (!next || next.error) return { error: "找不到 importExternal 函数锚点（管理员发卡）" };
            t = next;
            changes.push("管理员在线发卡动作");
        }

        if (!t.includes("        setUsage(null);\n        setCreditSummary(null);")) {
            const anchor = "        setUsage(null);\n";
            const next = replaceOnce(t, anchor, anchor + "        setCreditSummary(null);\n        setCreditCode(\"\");\n        setGeneratedCodes([]);\n");
            if (!next || next.error) return { error: "找不到 logout 清理锚点" };
            t = next;
            changes.push("退出时清理额度状态");
        }

        if (!t.includes("config.account.creditsTitle")) {
            const anchor = "                        {syncStatus ? <span className=\"text-xs text-stone-500\">{syncStatus}</span> : null}\n";
            const block = anchor + [
                "                        <div className=\"mt-2 basis-full border-t border-stone-200 pt-3 dark:border-stone-800\">",
                "                            <div className=\"mb-2 flex flex-wrap items-center gap-2 text-xs\">",
                "                                <span className=\"flex items-center gap-1 font-medium\"><Wallet className=\"size-4\" />{t(\"config.account.creditsTitle\")}</span>",
                "                                <span className=\"text-sm font-semibold text-stone-800 dark:text-stone-100\">{creditSummary ? `${creditSummary.balance} ${t(\"config.account.creditsUnit\")}` : \"—\"}</span>",
                "                                <Button type=\"link\" size=\"small\" loading={checkingCredits} onClick={() => void refreshCredits()}>{t(\"config.account.refreshCredits\")}</Button>",
                "                            </div>",
                "                            <Space.Compact className=\"w-full\">",
                "                                <Input value={creditCode} placeholder={t(\"config.account.creditCodePlaceholder\")} onChange={(event) => setCreditCode(event.target.value)} onPressEnter={() => void redeemCredits()} />",
                "                                <Button icon={<Ticket className=\"size-4\" />} loading={redeeming} disabled={!creditCode.trim()} onClick={() => void redeemCredits()}>{t(\"config.account.redeemCreditCode\")}</Button>",
                "                            </Space.Compact>",
                "                            <div className=\"mt-2 text-xs text-stone-500\">{t(\"config.account.creditBuyHint\")}</div>",
                "                            {creditSummary?.freeTrial ? <div className=\"mt-1 text-xs text-stone-500\">{t(\"config.account.freeTrialRemaining\", { remaining: creditSummary.freeTrial.remaining })}</div> : null}",
                "                            {user.role === \"admin\" ? (",
                "                                <div className=\"mt-3 border-t border-dashed border-stone-200 pt-3 dark:border-stone-800\">",
                "                                    <div className=\"mb-2 text-xs font-medium\">{t(\"config.account.adminCodesTitle\")}</div>",
                "                                    <div className=\"flex flex-wrap items-center gap-2\">",
                "                                        <Input className=\"w-28\" value={codeCredits} onChange={(event) => setCodeCredits(event.target.value)} placeholder={t(\"config.account.adminCredits\")} />",
                "                                        <Input className=\"w-20\" value={codeCount} onChange={(event) => setCodeCount(event.target.value)} placeholder={t(\"config.account.adminCodeCount\")} />",
                "                                        <Button loading={generatingCodes} onClick={() => void generateCodes()}>{t(\"config.account.adminGenerate\")}</Button>",
                "                                    </div>",
                "                                    {generatedCodes.length ? <div className=\"mt-2 flex flex-wrap items-start gap-2\"><Input.TextArea className=\"min-w-[260px] flex-1 font-mono text-xs\" value={generatedCodes.join(\"\\n\")} readOnly autoSize={{ minRows: 3, maxRows: 8 }} /><Button icon={<Copy className=\"size-4\" />} onClick={() => void copyGeneratedCodes()}>{t(\"config.account.adminCopy\")}</Button></div> : null}",
                "                                </div>",
                "                            ) : null}",
                "                        </div>",
            ].join(LF) + LF;
            const next = replaceOnce(t, anchor, block);
            if (!next || next.error) return { error: "找不到账号面板额度插入锚点" };
            t = next;
            changes.push("余额显示与粘贴兑换码入口");
        }

        return changes.length ? { text: t, detail: changes.join("；") } : null;
    });
}

// ============================================================================
// U3 · 中英文文案
// ============================================================================

function u3() {
    const additions = {
        zh: [
            '            creditsTitle: "额度余额",',
            '            creditsUnit: "点",',
            '            refreshCredits: "刷新余额",',
            '            creditCodePlaceholder: "粘贴兑换码",',
            '            redeemCreditCode: "兑换",',
            '            redeemSuccess: "兑换成功，已到账 {{credits}} 点",',
            '            redeemFailed: "兑换失败",',
            '            creditLoadFailed: "读取额度失败",',
            '            creditBuyHint: "需要更多额度？先购买兑换码，再粘贴到这里。",',
            '            freeTrialRemaining: "免费试拍本月剩余 {{remaining}} 次",',
            '            adminCodesTitle: "管理员发卡",',
            '            adminCredits: "面额（点）",',
            '            adminCodeCount: "数量",',
            '            adminGenerate: "生成兑换码",',
            '            adminCodesGenerated: "已生成 {{count}} 张兑换码",',
            '            adminGenerateFailed: "生成兑换码失败，请检查面额与数量",',
            '            adminCopy: "复制",',
            '            adminCopyDone: "兑换码已复制",',
            '            adminCopyFailed: "复制失败，请手动选择复制",',
        ].join(LF),
        en: [
            '            creditsTitle: "Credit balance",',
            '            creditsUnit: "credits",',
            '            refreshCredits: "Refresh balance",',
            '            creditCodePlaceholder: "Paste redemption code",',
            '            redeemCreditCode: "Redeem",',
            '            redeemSuccess: "Redeemed {{credits}} credits",',
            '            redeemFailed: "Redemption failed",',
            '            creditLoadFailed: "Could not load credit balance",',
            '            creditBuyHint: "Need more capacity? Purchase a redemption code, then paste it here.",',
            '            freeTrialRemaining: "Free trials remaining this month: {{remaining}}",',
            '            adminCodesTitle: "Admin code generator",',
            '            adminCredits: "Denomination (credits)",',
            '            adminCodeCount: "Count",',
            '            adminGenerate: "Generate codes",',
            '            adminCodesGenerated: "Generated {{count}} redemption codes",',
            '            adminGenerateFailed: "Could not generate codes; check denomination and count",',
            '            adminCopy: "Copy",',
            '            adminCopyDone: "Redemption codes copied",',
            '            adminCopyFailed: "Copy failed; select the codes manually",',
        ].join(LF),
    };

    patch("U3", "web/src/i18n/locales/zh-CN.ts", (text) => {
        if (text.includes("creditsTitle:")) return null;
        const anchor = '            registrationClosed: "本站已关闭公开注册，请联系管理员开号",';
        const next = replaceOnce(text, anchor, additions.zh + LF + anchor);
        return next && !next.error ? { text: next, detail: "新增额度与兑换码中文文案" } : { error: "找不到中文 registrationClosed 文案锚点" };
    });

    patch("U3", "web/src/i18n/locales/en-US.ts", (text) => {
        if (text.includes("creditsTitle:")) return null;
        const anchor = '            registrationClosed: "Public registration is closed. Ask an admin to create an account.",';
        const next = replaceOnce(text, anchor, additions.en + LF + anchor);
        return next && !next.error ? { text: next, detail: "新增额度与兑换码英文文案" } : { error: "找不到英文 registrationClosed 文案锚点" };
    });
}

// ============================================================================
// U4 · 紫域模型目录实时拉取与用途/积分档位分组
// ============================================================================

function u4() {
    patch("U4", "web/src/components/layout/model-select-modal.tsx", (text) => {
        let t = text;
        const changes = [];

        if (!t.includes("fetchZiyuModelCatalog")) {
            const anchor = 'import { fetchChannelModels } from "@/services/api/image";\n';
            const next = replaceOnce(t, anchor, anchor + 'import { fetchZiyuModelCatalog } from "@/services/backend-sync";\n');
            if (!next || next.error) return { error: "找不到 fetchChannelModels import 锚点" };
            t = next;
            changes.push("接入紫域实时目录 API");
        }

        if (!t.includes("type ZiyuDisplayGroup")) {
            const anchor = "import type { ModelChannel } from \"@/stores/use-config-store\";\n";
            const block = anchor + "\ntype ZiyuDisplayGroup = { label: string; names: string[] };\n";
            const next = replaceOnce(t, anchor, block);
            if (!next || next.error) return { error: "找不到 ModelChannel import 锚点" };
            t = next;
            changes.push("增加目录分组类型");
        }

        if (!t.includes("const [fetchedGroups, setFetchedGroups]")) {
            const anchor = "    const [fetched, setFetched] = useState<string[]>([]);\n";
            const next = replaceOnce(t, anchor, anchor + "    const [fetchedGroups, setFetchedGroups] = useState<ZiyuDisplayGroup[]>([]);\n");
            if (!next || next.error) return { error: "找不到 fetched 状态锚点" };
            t = next;
            changes.push("增加目录分组状态");
        }

        if (!t.includes("setFetchedGroups([]);")) {
            const anchor = "        setFetched([]);\n";
            const next = replaceOnce(t, anchor, anchor + "        setFetchedGroups([]);\n");
            if (!next || next.error) return { error: "找不到弹层重置锚点" };
            t = next;
            changes.push("打开弹层时清理旧分组");
        }

        if (!t.includes("channel.id === \"ziyu\"")) {
            const old = [
                "        if (!channel.baseUrl.trim() || !channel.apiKey.trim()) {",
                "            message.error(t(\"config.modelSelect.missingConfig\"));",
                "            return;",
                "        }",
                "        setLoading(true);",
                "        try {",
                "            const models = await fetchChannelModels(channel);",
                "            setFetched(models);",
                "            setActiveTab(\"new\");",
                "            message.success(t(\"config.modelSelect.fetched\", { count: models.length }));",
                "        } catch (error) {",
                "            message.error(error instanceof Error ? error.message : t(\"config.modelSelect.fetchFailed\"));",
                "        } finally {",
                "            setLoading(false);",
                "        }",
            ].join(LF);
            const replacement = [
                "        if (channel.id !== \"ziyu\" && (!channel.baseUrl.trim() || !channel.apiKey.trim())) {",
                "            message.error(t(\"config.modelSelect.missingConfig\"));",
                "            return;",
                "        }",
                "        setLoading(true);",
                "        try {",
                "            if (channel.id === \"ziyu\") {",
                "                const catalog = await fetchZiyuModelCatalog();",
                "                const source = Array.isArray(catalog.models) ? catalog.models : [];",
                "                const nameOf = (model: { name?: string; id?: string }) => String(model.name || model.id || \"\").trim();",
                "                const groups: ZiyuDisplayGroup[] = [];",
                "                const byCost = catalog.groups?.byCost || [];",
                "                for (const costGroup of byCost) {",
                "                    const video = costGroup.models.filter((model) => model.type === \"video\").map(nameOf).filter(Boolean);",
                "                    const image = costGroup.models.filter((model) => model.type !== \"video\").map(nameOf).filter(Boolean);",
                "                    if (video.length) groups.push({ label: `${t(\"config.modelSelect.ziyuVideo\")} · ${costGroup.tier} ${t(\"config.modelSelect.ziyuCredits\")}`, names: video });",
                "                    if (image.length) groups.push({ label: `${t(\"config.modelSelect.ziyuImage\")} · ${costGroup.tier} ${t(\"config.modelSelect.ziyuCredits\")}`, names: image });",
                "                }",
                "                if (!groups.length) {",
                "                    const video = (catalog.groups?.video || []).map(nameOf).filter(Boolean);",
                "                    const image = (catalog.groups?.image || []).map(nameOf).filter(Boolean);",
                "                    if (video.length) groups.push({ label: t(\"config.modelSelect.ziyuVideo\"), names: video });",
                "                    if (image.length) groups.push({ label: t(\"config.modelSelect.ziyuImage\"), names: image });",
                "                }",
                "                const names = source.map(nameOf).filter((name, index, list) => name && list.indexOf(name) === index);",
                "                setFetched(names);",
                "                setFetchedGroups(groups);",
                "                setActiveTab(\"new\");",
                "                message.success(t(\"config.modelSelect.fetched\", { count: names.length }));",
                "            } else {",
                "                const models = await fetchChannelModels(channel);",
                "                setFetched(models);",
                "                setFetchedGroups([]);",
                "                setActiveTab(\"new\");",
                "                message.success(t(\"config.modelSelect.fetched\", { count: models.length }));",
                "            }",
                "        } catch (error) {",
                "            message.error(error instanceof Error ? error.message : t(\"config.modelSelect.fetchFailed\"));",
                "        } finally {",
                "            setLoading(false);",
                "        }",
            ].join(LF);
            const next = replaceOnce(t, old, replacement);
            if (!next || next.error) return { error: "找不到 fetchModels 函数主体锚点" };
            t = next;
            changes.push("紫域目录按用途与积分档位展示");
        }

        if (!t.includes("fetchedGroups.map((group)")) {
            const old = [
                "            {visibleList.length ? (",
                "                <div className=\"grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2\">",
                "                    {visibleList.map((name) => (",
                "                        <Checkbox key={name} checked={selected.has(name)} onChange={(event) => toggle(name, event.target.checked)}>",
                "                            <span className=\"truncate\" title={name}>",
                "                                {name}",
                "                            </span>",
                "                        </Checkbox>",
                "                    ))}",
                "                </div>",
                "            ) : (",
                "                <div className=\"py-8 text-center text-sm text-stone-500\">{t(activeTab === \"new\" ? \"config.modelSelect.fetchedEmpty\" : \"config.modelSelect.existingEmpty\")}</div>",
                "            )}",
            ].join(LF);
            const replacement = [
                "            {visibleList.length ? (",
                "                activeTab === \"new\" && fetchedGroups.length ? (",
                "                    <div className=\"space-y-4\">",
                "                        {fetchedGroups.map((group) => {",
                "                            const names = group.names.filter((name) => visibleList.includes(name));",
                "                            if (!names.length) return null;",
                "                            return (",
                "                                <div key={group.label}>",
                "                                    <div className=\"mb-2 text-xs font-semibold text-stone-500\">{group.label}</div>",
                "                                    <div className=\"grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2\">",
                "                                        {names.map((name) => (",
                "                                            <Checkbox key={name} checked={selected.has(name)} onChange={(event) => toggle(name, event.target.checked)}>",
                "                                                <span className=\"truncate\" title={name}>{name}</span>",
                "                                            </Checkbox>",
                "                                        ))}",
                "                                    </div>",
                "                                </div>",
                "                            );",
                "                        })}",
                "                    </div>",
                "                ) : (",
                "                    <div className=\"grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2\">",
                "                        {visibleList.map((name) => (",
                "                            <Checkbox key={name} checked={selected.has(name)} onChange={(event) => toggle(name, event.target.checked)}>",
                "                                <span className=\"truncate\" title={name}>{name}</span>",
                "                            </Checkbox>",
                "                        ))}",
                "                    </div>",
                "                )",
                "            ) : (",
                "                <div className=\"py-8 text-center text-sm text-stone-500\">{t(activeTab === \"new\" ? \"config.modelSelect.fetchedEmpty\" : \"config.modelSelect.existingEmpty\")}</div>",
                "            )}",
            ].join(LF);
            const next = replaceOnce(t, old, replacement);
            if (!next || next.error) return { error: "找不到模型列表渲染锚点" };
            t = next;
            changes.push("模型列表按实时分组渲染");
        }

        return changes.length ? { text: t, detail: changes.join("；") } : null;
    });

    const zh = '            ziyuVideo: "视频",\n            ziyuImage: "图片",\n            ziyuCredits: "点档位",';
    const en = '            ziyuVideo: "Video",\n            ziyuImage: "Image",\n            ziyuCredits: "credits",';
    patch("U4", "web/src/i18n/locales/zh-CN.ts", (text) => {
        if (text.includes("ziyuVideo:")) return null;
        const anchor = '            fetchedEmpty: "点击「拉取模型列表」获取上游模型，或手动增加模型名称。",';
        const next = replaceOnce(text, anchor, anchor + "\n" + zh);
        return next && !next.error ? { text: next, detail: "新增紫域模型分组中文文案" } : { error: "找不到中文模型空列表文案锚点" };
    });
    patch("U4", "web/src/i18n/locales/en-US.ts", (text) => {
        if (text.includes("ziyuVideo:")) return null;
        const anchor = '            fetchedEmpty: "Fetch models from the provider or add a model name manually.",';
        const next = replaceOnce(text, anchor, anchor + "\n" + en);
        return next && !next.error ? { text: next, detail: "新增紫域模型分组英文文案" } : { error: "找不到英文模型空列表文案锚点" };
    });
}

/**
 * 在内存里的待写文本上跑一次 web/tsconfig.json 类型检查。
 * 不改源码树；没有依赖时只把缺失依赖报告为失败，不偷偷联网安装。
 */
function typecheckPending() {
    const id = "CHECK";
    const webRoot = path.join(SOURCE, "web");
    const configPath = path.join(webRoot, "tsconfig.json");
    try {
        const require = createRequire(path.join(HERE, "apply-batch1-ui.mjs"));
        const ts = require(path.join(webRoot, "node_modules", "typescript"));
        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        if (configFile.error) return { error: ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n") };
        const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, webRoot, undefined, configPath);
        if (parsed.errors.length) return { error: ts.flattenDiagnosticMessageText(parsed.errors[0].messageText, "\n") };
        const options = { ...parsed.options, noEmit: true, incremental: false };
        const host = ts.createCompilerHost(options, true);
        const originalRead = host.readFile.bind(host);
        const originalFileExists = host.fileExists.bind(host);
        host.readFile = (fileName) => {
            const normalized = path.resolve(fileName);
            const item = pending.find((entry) => path.resolve(entry.target) === normalized);
            return item ? item.text : originalRead(fileName);
        };
        host.fileExists = (fileName) => {
            const normalized = path.resolve(fileName);
            if (pending.some((entry) => path.resolve(entry.target) === normalized)) return true;
            return originalFileExists(fileName);
        };
        const program = ts.createProgram(parsed.fileNames, options, host);
        const diagnostics = ts.getPreEmitDiagnostics(program);
        if (diagnostics.length) {
            const lines = diagnostics.slice(0, 12).map((diagnostic) => {
                const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
                if (!diagnostic.file || diagnostic.start == null) return message;
                const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                return `${path.relative(SOURCE, diagnostic.file.fileName)}:${pos.line + 1}:${pos.character + 1} ${message}`;
            });
            return { error: `${diagnostics.length} 个 TypeScript 诊断：\n${lines.join("\n")}` };
        }
        return { ok: true, detail: "内存待写版本通过 web/tsconfig.json 类型检查" };
    } catch (error) {
        return { error: "无法运行 TypeScript 检查：" + (error && error.message) };
    }
}

function print() {
    console.log("无限画布 · 批次 1.5 前端落地器");
    console.log("  治理仓：" + GOVERNANCE);
    console.log("  权威树：" + SOURCE);
    console.log("  模式：" + (DRY ? "试运行（只读不写）" : "正式写入") + (ONLY ? " ｜ 仅执行 " + Array.from(ONLY).join(",") : " ｜ U1–U4"));
    console.log("\n步骤  结果    说明\n----  ------  ------------------------------------------------------------------");
    for (const r of results) console.log(String(r.id).padEnd(4) + "  " + String(r.status).padEnd(6) + "  " + r.detail);
    if (pending.length) {
        console.log("\n待写盘 " + pending.length + " 处：");
        for (const item of pending) console.log("  · " + item.target);
    }
}

if (!fs.existsSync(SOURCE) || !fs.existsSync(path.join(SOURCE, "canvas-api", "server.js"))) {
    console.error("✗ 不是有效的无限画布权威源码树：" + SOURCE);
    process.exit(2);
}

u1(); u2(); u3(); u4();
if (TYPECHECK) {
    const check = typecheckPending();
    if (check.ok) ok("CHECK", check.detail);
    else fail("CHECK", check.error);
}
print();

if (fails.length) {
    console.error("\n✗ 有 " + fails.length + " 处失败，本次未写盘：");
    for (const item of fails) console.error("  · " + item);
    process.exit(1);
}
if (DRY) {
    console.log("\n（--dry-run：未写盘。）");
    process.exit(0);
}
const written = flush();
console.log("\n✓ 已写盘 " + written + " 处；每处改动前均留有 .bak-" + STAMP + " 备份。");

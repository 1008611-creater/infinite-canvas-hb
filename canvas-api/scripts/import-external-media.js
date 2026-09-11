/**
 * 外链抢救：把画布 manifest 里指向别人家 CDN 的媒体，批量抓回自己的服务端。
 *
 * 为什么需要它：画布里的视频/图片有时只是存了个 URL（Agnes 平台返回的临时地址，
 * Cache-Control 只有 max-age=3600），源站一过期画布里就变 404。同步引擎只认
 * image:/video: 这类本地标记，外链它根本看不见 —— 等于「备份里没有它」。
 *
 * 这个脚本扫一遍 manifest，把所有 http(s) 外链挑出来，交给服务端的
 * POST /api/media/import-url 抓回本地，并把原始出处记进 media_files.source_url。
 *
 * 用法：
 *   node import-external-media.js \
 *     --manifest ./canvas/manifest.json \
 *     --manifest ./assets/manifest.json \
 *     --base https://hb.cauai.fun \
 *     --email admin@hb.cauai.fun --password <密码> \
 *     [--dry] [--only video,image] [--skip-host hb.cauai.fun]
 *
 * 产物：一份 JSON 报告（外链 -> storageKey 的映射），供后续把画布节点改成
 * 本地 storageKey 时使用；--dry 只扫描不写入。
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
    const args = { manifest: [], skipHost: [], only: [] };
    for (let i = 0; i < argv.length; i += 1) {
        const key = argv[i];
        const value = argv[i + 1];
        switch (key) {
            case "--manifest":
                args.manifest.push(value);
                i += 1;
                break;
            case "--base":
                args.base = value;
                i += 1;
                break;
            case "--email":
                args.email = value;
                i += 1;
                break;
            case "--password":
                args.password = value;
                i += 1;
                break;
            case "--dry":
                args.dry = true;
                break;
            case "--skip-host":
                args.skipHost.push(...String(value).split(",").map((s) => s.trim()).filter(Boolean));
                i += 1;
                break;
            case "--only":
                args.only = String(value).split(",").map((s) => s.trim()).filter(Boolean);
                i += 1;
                break;
            case "--out":
                args.out = value;
                i += 1;
                break;
            default:
                break;
        }
    }
    return args;
}

/** 递归收集 JSON 里所有 http(s) 字符串，并记录它所在的字段路径，便于人工核对 */
function collectUrls(value, found = new Map(), trail = "") {
    if (typeof value === "string") {
        if (/^https?:\/\//i.test(value.trim())) {
            if (!found.has(value)) found.set(value, []);
            found.get(value).push(trail);
        }
        return found;
    }
    if (Array.isArray(value)) {
        value.forEach((item, index) => collectUrls(item, found, `${trail}[${index}]`));
        return found;
    }
    if (value && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) {
            collectUrls(child, found, trail ? `${trail}.${key}` : key);
        }
    }
    return found;
}

function guessKind(url, mimeHint) {
    if (/\.(mp4|webm|mov|m4v|avi)(\?|$)/i.test(url)) return "video";
    if (/\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|$)/i.test(url)) return "image";
    if (/\.(mp3|wav|m4a|aac|ogg|flac)(\?|$)/i.test(url)) return "audio";
    if (mimeHint) return mimeHint.startsWith("video/") ? "video" : "image";
    return "file";
}

async function login(base, email, password) {
    const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`登录失败 ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const cookie = (res.headers.getSetCookie?.() || [])
        .map((entry) => entry.split(";")[0])
        .join("; ");
    if (!cookie) throw new Error("登录后没拿到 cookie");
    return cookie;
}

async function importUrl(base, cookie, url, kind) {
    const res = await fetch(`${base}/api/media/import-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ url, kind }),
    });
    const text = await res.text();
    let payload = null;
    try {
        payload = JSON.parse(text);
    } catch {
        /* 非 JSON 响应按失败处理 */
    }
    if (!res.ok) return { ok: false, status: res.status, error: payload?.error || text.slice(0, 200) };
    return { ok: true, status: res.status, storageKey: payload.storageKey, bytes: payload.bytes };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const base = (args.base || "https://hb.cauai.fun").replace(/\/+$/, "");
    const manifests = args.manifest.length ? args.manifest : [];
    if (!manifests.length) {
        console.error("✗ 至少给一个 --manifest <path>");
        process.exit(1);
    }

    const skipHosts = args.skipHost.length ? args.skipHost : ["hb.cauai.fun"];
    const found = new Map();
    for (const file of manifests) {
        const abs = path.resolve(file);
        if (!fs.existsSync(abs)) {
            console.error(`✗ 找不到 manifest: ${abs}`);
            continue;
        }
        const json = JSON.parse(fs.readFileSync(abs, "utf8"));
        const urls = collectUrls(json);
        for (const [url, trails] of urls) {
            if (!found.has(url)) found.set(url, []);
            for (const trail of trails) found.get(url).push(`${path.basename(file)}:${trail}`);
        }
    }

    const candidates = [...found.entries()].filter(([url]) => {
        try {
            const host = new URL(url).host;
            return !skipHosts.some((skip) => host === skip || host.endsWith(`.${skip}`));
        } catch {
            return false;
        }
    });

    console.log(`扫描 ${manifests.length} 份 manifest，外链 ${candidates.length} 条${args.dry ? "（--dry 只扫描）" : ""}`);
    if (!candidates.length) {
        console.log("没有需要抢救的外链。");
        return;
    }

    const report = { scannedAt: new Date().toISOString(), base, items: [] };
    if (args.dry) {
        for (const [url, trails] of candidates) {
            console.log(`  [${guessKind(url)}] ${url}`);
            console.log(`      出现在 ${trails.slice(0, 3).join(", ")}${trails.length > 3 ? ` …共 ${trails.length} 处` : ""}`);
            report.items.push({ url, kind: guessKind(url), trails, status: "dry" });
        }
    } else {
        if (!args.email || !args.password) {
            console.error("✗ 非 --dry 模式需要 --email 和 --password");
            process.exit(1);
        }
        const cookie = await login(base, args.email, args.password);
        console.log("✓ 已登录");
        for (const [url, trails] of candidates) {
            const kind = guessKind(url);
            if (args.only.length && !args.only.includes(kind)) {
                report.items.push({ url, kind, trails, status: "skipped" });
                continue;
            }
            const result = await importUrl(base, cookie, url, kind);
            const line = result.ok
                ? `  ✓ ${kind} ${result.bytes} 字节 -> ${result.storageKey}`
                : `  ✗ ${kind} ${result.status} ${result.error}`;
            console.log(line);
            console.log(`      ${url}`);
            report.items.push({ url, kind, trails, ...result });
        }
    }

    const out = args.out || path.resolve("external-media-report.json");
    fs.writeFileSync(out, JSON.stringify(report, null, 2));
    const ok = report.items.filter((item) => item.ok).length;
    const failed = report.items.filter((item) => item.status !== "dry" && item.status !== "skipped" && !item.ok).length;
    console.log(`\n报告: ${out}`);
    console.log(`成功 ${ok} / 失败 ${failed} / 跳过 ${report.items.length - ok - failed}`);
}

main().catch((error) => {
    console.error("✗", error && error.message);
    process.exit(1);
});

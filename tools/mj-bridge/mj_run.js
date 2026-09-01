/**
 * MJ 单次生图的命令行入口。
 *
 * 被 FastAPI 服务以子进程方式调用，stdout 只输出一行 JSON 结果，
 * 供 Python 侧解析。所有过程日志走 stderr，避免污染结果通道。
 *
 * 用法：
 *   node mj_run.js --prompt "..." --aspect 9:16 --out-dir <dir> [--version v8.2] [--timeout 300000]
 *
 * 输出（stdout，单行 JSON）：
 *   {"ok":true,"images":["C:\\path\\to\\img.png"],"recordId":"..."}
 *   {"ok":false,"error":"...","needLogin":true}
 */

const path = require("path");
const fs = require("fs");

// 适配器内部大量使用 console.log，必须在加载它之前把日志改道到 stderr，
// 否则 stdout 上除了结果 JSON 还会混入日志，Python 侧解析会失败。
const toStderr = (...args) =>
    process.stderr.write(args.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join(" ") + "\n");
console.log = toStderr;

// 适配器不随仓库分发（依赖 playwright 与登录态，属于本机资产），
// 默认指向技能包安装位置，可用 MXAI_ADAPTER_PATH 覆盖。
// 从 adapter 自身所在目录解析依赖，因此它的 node_modules 能被正常找到。
const ADAPTER_PATH =
    process.env.MXAI_ADAPTER_PATH ||
    path.join(process.env.USERPROFILE || process.env.HOME || "", ".workbuddy", "skills", "mxai-rpa-mcp", "scripts", "mxai_adapter.js");

let MxaiAdapter = null;
let adapterError = "";
try {
    MxaiAdapter = require(ADAPTER_PATH);
} catch (error) {
    adapterError = `找不到 MJ 适配器（${ADAPTER_PATH}）：${error && error.message}。请安装 mxai-rpa-mcp 技能包，或用 MXAI_ADAPTER_PATH 指定 mxai_adapter.js 的位置。`;
}

function parseArgs(argv) {
    const args = {};
    for (let index = 0; index < argv.length; index += 1) {
        const key = argv[index];
        if (!key.startsWith("--")) continue;
        const name = key.slice(2);
        const next = argv[index + 1];
        if (!next || next.startsWith("--")) {
            args[name] = "true";
            continue;
        }
        args[name] = next;
        index += 1;
    }
    return args;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const prompt = String(args.prompt || "").trim();
    if (adapterError) {
        process.stdout.write(JSON.stringify({ ok: false, error: adapterError }));
        process.exitCode = 4;
        return;
    }
    if (!prompt) {
        process.stdout.write(JSON.stringify({ ok: false, error: "prompt 不能为空" }));
        process.exitCode = 1;
        return;
    }

    const outputDir = path.resolve(args["out-dir"] || path.join(__dirname, ".results"));
    fs.mkdirSync(outputDir, { recursive: true });

    const adapter = new MxaiAdapter({});
    try {
        await adapter.launch();
        await adapter.navigate();
        const loggedIn = await adapter.isLoggedIn();
        if (!loggedIn) {
            process.stdout.write(JSON.stringify({ ok: false, error: "MXAI 未登录，请在弹出的浏览器窗口里登录后重试", needLogin: true }));
            process.exitCode = 2;
            return;
        }
        const result = await adapter.generate(prompt, {
            version: args.version || "v8.2",
            aspect: args.aspect || "9:16",
            mode: args.mode || "normal",
            outputDir,
            filePrefix: args.prefix || `mj_${Date.now()}`,
            timeout: Number(args.timeout) || 300000,
        });
        const images = Array.isArray(result && result.images) ? result.images.filter((file) => file && fs.existsSync(file)) : [];
        process.stdout.write(
            JSON.stringify({
                ok: Boolean(result && result.success) && images.length > 0,
                images,
                recordId: (result && result.recordId) || null,
                error: result && result.success ? undefined : (result && result.message) || "生成失败，没有拿到图片文件",
            }),
        );
    } catch (error) {
        process.stdout.write(JSON.stringify({ ok: false, error: (error && error.message) || String(error) }));
        process.exitCode = 3;
    } finally {
        // 必须显式关掉浏览器。Playwright 的子进程会让 node 挂住不退出，
        // 那样 Python 侧的 subprocess 会一直干等到超时。
        // 登录态存在 profile 目录里，关浏览器不会掉登录。
        try {
            if (adapter && typeof adapter.close === "function") await adapter.close();
        } catch (_) {
            /* ignore */
        }
    }
}

// 不要用 process.exit()：stdout 是管道时写入是异步的，立刻退出会截断结果，
// Python 侧就会拿到空输出。交给 node 自然退出，再用一个 unref 定时器兜底
// —— 它不阻止正常退出，只在真有句柄把进程挂住 5 秒后才强制收尾。
setTimeout(() => process.exit(process.exitCode ?? 0), 5000).unref();

// main 内部已经按情况设过 exitCode（1/2/3/4），这里不能无条件覆盖成 0，
// 否则 Python 侧拿到的 returncode 永远是 0，判断不出「未登录」这类分支。
main().then(
    () => {
        if (process.exitCode === undefined) process.exitCode = 0;
    },
    () => {
        if (process.exitCode === undefined) process.exitCode = 1;
    },
);

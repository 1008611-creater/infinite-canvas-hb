/**
 * 从 agnes-video-proxy/.env 读出 AGNES_API_KEY 并打印到 stdout。
 *
 * 供 start.bat 调用，把密钥注入成 VITE_AGNES_API_KEY 交给前端，
 * 这样画布开箱就有可用的 Agnes 渠道，而密钥本身不会进 git（.env* 已忽略）。
 * 读不到就安静退出，前端退化成「在配置面板手填」。
 */
const fs = require("node:fs");
const path = require("node:path");

const envPath = path.resolve(__dirname, "..", "..", "agnes-video-proxy", ".env");

if (!fs.existsSync(envPath)) process.exit(0);

const matched = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((line) => /^\s*AGNES_API_KEY\s*=/.test(line));

if (!matched) process.exit(0);

const value = matched
    .slice(matched.indexOf("=") + 1)
    .trim()
    .replace(/^["']|["']$/g, "");

if (value) process.stdout.write(value);

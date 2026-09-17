#!/usr/bin/env node
// ============================================================================
// 无限画布 · 卡密批量生成器（批次 1 · 收得到钱）
// 文件：scripts/generate-ldxp-credit-codes.mjs
// ============================================================================
//
// 默认发码方式。码在本地生成、本地落文件，**不经过服务器**。
//
// 用法：
//   LDXP_REDEEM_SECRET='<>=32 字符的密钥>' \
//     node scripts/generate-ldxp-credit-codes.mjs --credits=100 --count=100 --output=./codes-100.txt
//
// 参数：
//   --credits  面额，必须是 100 / 300 / 500 / 1000 之一
//   --count    数量，1–5000（默认 100）
//   --output   输出文件路径（必填）
//
// 安全约定（逐条都要保留，不要"顺手"改掉）
//   1. 文件权限 0600。
//   2. 用 flag:'wx' —— 目标文件已存在则直接失败，绝不覆盖已有卡密。
//   3. **不向控制台打印任何一张码**，只打印数量与路径。
//   4. 密钥从环境变量读，绝不写进命令行历史之外的任何文件。
//
// 与服务器端的对应关系：
//   payload   = `NN-${credits}-${nonce}`
//   signature = HMAC-SHA256(LDXP_REDEEM_SECRET, payload) 取前 32 位 hex 大写
//   code      = `${payload}-${signature}`
//   服务端 canvas-api/ldxp-redeem.js 的 verifyCode() 用同一段逻辑校验。
//   ⚠️ 两边任何一处改动都必须同步另一处，否则已发出的码全部失效。
// ============================================================================

import { createHmac, randomBytes } from 'node:crypto';
import { chmod, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ALLOWED_DENOMINATIONS = new Set([100, 300, 500, 1000]);
const MIN_SECRET_LENGTH = 32;
const MAX_COUNT = 5000;

const args = Object.fromEntries(
    process.argv.slice(2).map((item) => {
        const [key, ...rest] = item.replace(/^--/, '').split('=');
        return [key, rest.join('=')];
    })
);

const credits = Number(args.credits);
const count = Number(args.count ?? 100);
const output = args.output ? path.resolve(args.output) : null;
const secret = process.env.LDXP_REDEEM_SECRET;

if (!ALLOWED_DENOMINATIONS.has(credits)) {
    console.error('LDXP_PACKAGE_INVALID：--credits 必须是 100 / 300 / 500 / 1000 之一');
    process.exit(1);
}
if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    console.error(`LDXP_CODE_COUNT_INVALID：--count 必须是 1–${MAX_COUNT} 的整数`);
    process.exit(1);
}
if (!output) {
    console.error('LDXP_OUTPUT_PATH_REQUIRED：必须指定 --output');
    process.exit(1);
}
if (!secret || secret.length < MIN_SECRET_LENGTH) {
    console.error(`LDXP_REDEEM_SECRET_REQUIRED：环境变量 LDXP_REDEEM_SECRET 必须存在且 >= ${MIN_SECRET_LENGTH} 字符`);
    process.exit(1);
}

const codes = new Set();
while (codes.size < count) {
    const nonce = randomBytes(12).toString('hex').toUpperCase();
    const payload = `NN-${credits}-${nonce}`;
    const signature = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32).toUpperCase();
    codes.add(`${payload}-${signature}`);
}

// flag:'wx' —— 已存在则失败，绝不覆盖
await writeFile(output, `${[...codes].join('\r\n')}\r\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
if (process.platform !== 'win32') await chmod(output, 0o600);

// 只报数量与路径，绝不打印码本身
console.log(JSON.stringify({ output, credits, count: codes.size }));

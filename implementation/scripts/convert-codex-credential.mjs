#!/usr/bin/env node
/**
 * convert-codex-credential.mjs
 *
 * 用途：把 ChatGPT / Codex 登录态导出的 OAuth JSON（camelCase、嵌套）
 *       转换成 New API「ChatGPT Subscription (Codex)」渠道期望的结构
 *       （顶层 snake_case：access_token + account_id）。
 *
 * 为什么需要它：New API 的 Codex 渠道只校验顶层 access_token 与 account_id，
 *   而从 chatgpt.com/api/auth/session 之类端点取到的是 accessToken（驼峰），
 *   且 account_id 藏在 account.id 里。直接粘贴会报：
 *   「Codex 凭据必须是包含 access_token 和 account_id 的 JSON 对象」。
 *
 * 纪律（必须遵守）：
 *   1. 输入与输出文件都放在仓库之外的 secrets 目录，绝不进治理仓。
 *   2. 脚本不把任何字段值打印到 stdout，只打印长度等元数据。
 *   3. 转换结果只填进 New API 后台界面，不贴进聊天、不写进任何文档。
 *
 * 用法：
 *   node convert-codex-credential.mjs <源JSON路径> <目标JSON路径>
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [srcArg, dstArg] = process.argv.slice(2)

if (!srcArg || !dstArg) {
  console.error('用法: node convert-codex-credential.mjs <源JSON路径> <目标JSON路径>')
  process.exit(1)
}

const srcPath = resolve(srcArg)
const dstPath = resolve(dstArg)

// 遥测/环境噪音：不是凭据，但含 IP、设备指纹、地区，一并剔除，减少扩散面
const DROP_KEYS = new Set(['statsigContext', 'statsig', 'telemetry'])

let raw
try {
  raw = JSON.parse(await readFile(srcPath, 'utf8'))
} catch (err) {
  console.error(`读取或解析源 JSON 失败: ${err.message}`)
  process.exit(1)
}

if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
  console.error('源 JSON 必须是对象')
  process.exit(1)
}

// 兼容不同导出来源的字段命名
const accessToken = raw.access_token ?? raw.accessToken
const accountId =
  raw.account_id ??
  raw.accountId ??
  raw.chatgpt_account_id ??
  raw.chat_gpt_account_id ??
  raw.account?.id
const refreshToken = raw.refresh_token ?? raw.refreshToken ?? raw.refresh ?? raw.sessionToken

const missing = []
if (!accessToken) missing.push('access_token / accessToken')
if (!accountId) missing.push('account_id / account.id')

if (missing.length > 0) {
  console.error(`源 JSON 缺少必需字段: ${missing.join(', ')}`)
  console.error('请确认导出的是 Codex / ChatGPT 登录态 JSON，而不是别的凭据。')
  process.exit(2)
}

// 输出策略：保留原始字段（最大化兼容 New API 可能读取的其他字段），
// 剔除遥测噪音，再补齐顶层 snake_case 必需字段。
const out = {}
for (const [key, value] of Object.entries(raw)) {
  if (DROP_KEYS.has(key)) continue
  out[key] = value
}

out.access_token = accessToken
out.account_id = accountId
if (refreshToken && !out.refresh_token) {
  out.refresh_token = refreshToken
}

await writeFile(dstPath, `${JSON.stringify(out, null, 2)}\n`)

// 只输出元数据，绝不输出字段值
const summary = {
  输出文件: dstPath,
  顶层字段数: Object.keys(out).length,
  access_token长度: String(accessToken).length,
  account_id长度: String(accountId).length,
  含refresh_token: Boolean(out.refresh_token),
  已剔除字段: [...DROP_KEYS].filter((k) => k in raw),
}

console.log('转换完成（未打印任何凭据值）')
for (const [k, v] of Object.entries(summary)) {
  console.log(`  ${k}: ${Array.isArray(v) ? v.join(', ') || '(无)' : v}`)
}
console.log('')
console.log('下一步：把输出文件的内容填进 New API 后台「API 密钥」框。')
console.log('不要把它贴进聊天、文档或任何仓库。')

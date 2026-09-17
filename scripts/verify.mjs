#!/usr/bin/env node
/**
 * 统一质量门 · 无限画布治理仓 (E:\codex\huabu)
 *
 *   node scripts/verify.mjs            # 常规
 *   node scripts/verify.mjs --strict   # warning 也判失败
 *   node scripts/verify.mjs --no-dry   # 跳过落地器干跑（快）
 *
 * 退出码：
 *   0  通过（可能有 warning）
 *   1  存在 error（或 --strict 下存在 warning）
 *   2  前置不满足（源码树不可达 / Node 版本过低）
 *
 * 覆盖 CONSTRAINTS.md 的：C1.1 密钥  C5.4 链接  C5.5 残留  C5.6 索引
 *                        C2.4 不造假完成（口径一致性）  C4.1 统一入口
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.CANVAS_SRC || 'E:/codex/niannianai/zhuanhuiyuangong/infinite-canvas';

const argv = new Set(process.argv.slice(2));
const STRICT = argv.has('--strict');
const NO_DRY = argv.has('--no-dry');

const SKIP_DIRS = new Set(['.git', 'node_modules', '.workbuddy-ai', 'dist', 'logs']);
const TEXT_EXT = new Set(['.md', '.mjs', '.js', '.json', '.sh', '.sql', '.conf', '.snippet', '.yml', '.yaml', '.txt']);

const results = [];
const add = (level, title, details = []) => results.push({ level, title, details });

/* ---------------------------------- 工具 ---------------------------------- */

function walk(dir, out = [], skip = SKIP_DIRS) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (skip.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out, skip);
    else if (e.isFile()) out.push(p);
  }
  return out;
}

/** 只跳 node_modules/.git；用于按文件名兜底查找（含 dist 产物） */
const walkDeep = (dir) => walk(dir, [], new Set(['node_modules', '.git']));

/** 行内路径里"合法但本仓/源码树都找不到"的引用，不算坏链 */
const LOOSE_SKIP = [
  /^\//,                              // 服务器绝对路径
  /ziyuai-out/i,                      // 外部工作区
  /^index-[A-Za-z0-9_-]{4,}\.js$/,    // 构建产物指纹
  /^app-\d{8}-.+\.js$/,
  /^mxai_mcp_server\.js$/,
  /^PROJECT_INDEX\.md$/,
];
/** 源码树内的已知别名（文档写的是相对 canvas-agent 的路径） */
const LOOSE_ALIAS = {
  'dist/canvas/schemas.js': ['canvas-agent/dist/canvas/schemas.js'],
  'default.conf': ['canvas-webdav/default.conf', 'deploy/nginx-docker.conf'],
  'manifest.json': ['canvas-webdav/manifest.json'],
};

const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');
const isText = (p) => TEXT_EXT.has(extname(p).toLowerCase());

function readLines(p) {
  try { return readFileSync(p, 'utf8').split(/\r?\n/); } catch { return []; }
}

/** 只匹配"带值"的凭据，避免把文档里的变量名当泄露 */
const SECRET_PATTERNS = [
  { name: 'sk-* 密钥', re: /sk-[A-Za-z0-9]{16,}/g },
  { name: 'Bearer 令牌', re: /Bearer\s+[A-Za-z0-9._\-]{16,}/g },
  { name: 'JWT', re: /eyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}/g },
  { name: '凭据赋值', re: /\b(?:api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*["']?[A-Za-z0-9_\-]{16,}["']?/gi },
  { name: '兑换码 NN-*', re: /NN-\d+-[A-Za-z0-9]{6,}-[A-Za-z0-9]{6,}/g },
];
/** 命中这些词的行视为示例/测试，不算泄露 */
const SAFE_CONTEXT = /(示例|测试|样例|占位|example|test|dummy|placeholder|mock|REDACTED|xxxx)/i;

function mask(s) {
  const t = String(s).trim();
  return t.length <= 8 ? t : `${t.slice(0, 4)}…${t.slice(-2)}(len=${t.length})`;
}

/* ------------------------------- 1. 前置 -------------------------------- */

function checkPrereq() {
  const d = [];
  if (!existsSync(SRC)) d.push(`权威源码树不可达：${SRC}（可用 CANVAS_SRC 环境变量覆盖）`);
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor < 18) d.push(`Node 版本过低：${process.versions.node}（需 >= 18）`);
  add(d.length ? 'fail' : 'pass', `前置检查（源码树 / Node ${process.versions.node}）`, d);
  if (d.length) { report(); process.exit(2); }
}

/* --------------------------- 2. 密钥与敏感串 ---------------------------- */

function checkSecrets() {
  const hits = [];
  for (const f of walk(ROOT).filter(isText)) {
    if (rel(f).endsWith('.bak') || rel(f).includes('.bak-')) continue;
    readLines(f).forEach((line, i) => {
      if (SAFE_CONTEXT.test(line)) return;
      if (/^\s*[>|*-]?\s*(`|-|\|)?\s*$/.test(line)) return;
      for (const { name, re } of SECRET_PATTERNS) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(line)) !== null) {
          hits.push(`${rel(f)}:${i + 1}  [${name}]  ${mask(m[0])}`);
          break; // 同一行同类型只报一次
        }
      }
    });
  }
  add(hits.length ? 'fail' : 'pass', 'C1.1 密钥 / 敏感串扫描（治理仓全量文本）',
    hits.length ? hits : ['未发现疑似凭据']);
}

/* ----------------------------- 3. 文档链接 ------------------------------ */

function checkLinks() {
  const mdFiles = walk(ROOT).filter((p) => extname(p) === '.md' && !rel(p).includes('.bak-'));
  const broken = [];
  const brokenLoose = [];
  let linkCount = 0;

  const tryResolve = (base, target) => {
    const t = target.replace(/\\/g, '/');
    const cands = [
      resolve(base, t),
      resolve(ROOT, t),
      resolve(SRC, t),
      ...(LOOSE_ALIAS[t] || []).map((a) => resolve(SRC, a)),
    ];
    for (const c of cands) if (existsSync(c) && statSync(c).isFile()) return c;
    // 兜底：按文件名在治理仓与源码树里找（含 dist）
    const bn = basename(t);
    for (const c of [ROOT, SRC]) {
      const found = walkDeep(c).find((p) => basename(p) === bn);
      if (found) return found;
    }
    return null;
  };
  const skippable = (t) => LOOSE_SKIP.some((re) => re.test(t.replace(/\\/g, '/')));

  for (const f of mdFiles) {
    const base = dirname(f);
    const lines = readLines(f);

    // 严格：Markdown 链接
    for (const line of lines) {
      for (const m of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        const t = m[1];
        if (/^(https?:|mailto:|#)/.test(t)) continue;
        linkCount++;
        if (!tryResolve(base, t)) broken.push(`${rel(f)} → ${t}`);
      }
    }
    // 宽松：反引号里的文件路径（可能是源码树引用）
    for (const line of lines) {
      for (const m of line.matchAll(/`([A-Za-z0-9_\-./\\]+\.(?:md|mjs|js|json|sh|sql|conf|snippet))`/g)) {
        const t = m[1];
        if (skippable(t)) continue;
        // inventory/ 是外部文档的归档副本，里面的路径指向原仓，不在本仓解析范围内
        if (rel(f).startsWith('inventory/')) continue;
        if (!tryResolve(base, t)) brokenLoose.push(`${rel(f)} → ${t}`);
      }
    }
  }

  add(broken.length ? 'fail' : 'pass', `C5.4 文档链接可达性（${linkCount} 条 Markdown 链接）`,
    broken.length ? broken : ['全部可达']);
  if (brokenLoose.length) {
    add('warn', `C5.4 行内路径引用（${brokenLoose.length} 处无法解析，可能是源码树相对路径）`,
      [...new Set(brokenLoose)].slice(0, 20));
  }
}

/* --------------------------- 4. 遗留 .bak 文件 -------------------------- */

function checkBak() {
  const baks = walk(ROOT).filter((p) => /\.bak(-|$)/.test(basename(p)));
  const details = baks.map(rel);
  const referenced = [];
  if (baks.length) {
    const names = baks.map((b) => basename(b));
    for (const f of walk(ROOT).filter((p) => extname(p) === '.md')) {
      for (const line of readLines(f)) {
        for (const n of names) if (line.includes(n)) referenced.push(`${rel(f)} 引用了 ${n}`);
      }
    }
  }
  const uniq = [...new Set(referenced)];
  // C5.5 的要求是「可保留后缀、但不得被引用」，所以未被引用的残留算合规
  add(uniq.length ? 'fail' : 'pass',
    `C5.5 废弃文件（${baks.length} 份 .bak 残留）`,
    [...(details.length ? [...details, '—'] : ['无 .bak 残留']),
      ...(uniq.length ? ['✗ 被现行文档引用（违反 C5.5）：', ...uniq] : ['未被任何文档引用 ✓'])]);
}

/* ------------------------- 5. 口径一致性（不造假） ---------------------- */

function countRoutes() {
  const p = join(SRC, 'canvas-api/server.js');
  if (!existsSync(p)) return null;
  return (readFileSync(p, 'utf8').match(/^\s*(?:app|router)\.(?:get|post|put|patch|delete)\(/gm) || []).length;
}

function checkConsistency() {
  const d = [];

  // 5.1 路由数（只认 canvas-api/server.js 的；前端路由 8/8 与 routes-credits.js 的 17 条是不同对象）
  const routes = countRoutes();
  if (routes === null) d.push('无法读取 canvas-api/server.js');
  else {
    const claims = new Set();
    for (const f of walk(ROOT).filter((p) => extname(p) === '.md' && !rel(p).includes('.bak-'))) {
      for (const line of readLines(f)) {
        if (!/server\.js/.test(line)) continue; // 限定同一对象，避免误并
        for (const m of line.matchAll(/(\d+)\s*(?:条|个)\s*路由/g)) claims.add(`${m[1]}（${rel(f)}）`);
      }
    }
    const nums = [...claims].map((c) => Number(c.match(/^(\d+)/)[1]));
    const wrong = [...claims].filter((c) => Number(c.match(/^(\d+)/)[1]) !== routes);
    if (wrong.length) d.push(`✗ 实测 ${routes} 条路由（不含 app.use），文档声称：${wrong.join('、')}`);
    else d.push(`✓ 路由数 ${routes}（文档 ${nums.length ? [...new Set(nums)].join('/') : '未引用'}，一致）`);
  }

  // 5.2 批次 1 落地状态
  const markers = ['ziyu', 'ZIYU', 'credit_ledger', 'user_credits', 'LDXP', 'redeem'];
  let landed = 0;
  if (existsSync(SRC)) {
    const files = walk(SRC);
    for (const f of files) {
      if (!isText(f)) continue;
      const t = readFileSync(f, 'utf8');
      if (markers.some((m) => t.includes(m))) landed++;
    }
  }
  // 期望值随落地进度推进。改这个常量前先看 docs/DECISIONS.md D12，并同步 ROADMAP/LIFECYCLE/BACKLOG。
  const BATCH1_LANDED = true;
  if (BATCH1_LANDED && landed > 0) {
    d.push(`✓ 批次 1 已落地（权威树关键词命中 ${landed} 个文件），与 D12 口径一致`);
  } else if (!BATCH1_LANDED && landed === 0) {
    d.push('✓ 批次 1 未落地（权威树 6 关键词零命中），与治理文档口径一致');
  } else {
    d.push(`✗ 实测与文档口径矛盾：期望「${BATCH1_LANDED ? '已落地' : '未落地'}」，实测命中 ${landed} 个文件。请更新 ROADMAP/DECISIONS/LIFECYCLE（或本常量）。`);
  }

  // 5.3 canvas-agent 工具数
  const schemaPath = join(SRC, 'canvas-agent/src/canvas/schemas.ts');
  if (existsSync(schemaPath)) {
    const t = readFileSync(schemaPath, 'utf8');
    const m = t.match(/toolNames\s*=\s*\[([\s\S]*?)\]/);
    const n = m ? (m[1].match(/["'`][^"'`]+["'`]/g) || []).length : null;
    if (n === null) d.push('⚠ 无法解析 canvas-agent 工具数');
    else {
      const ok = [...walk(ROOT).filter((p) => extname(p) === '.md')]
        .some((f) => readFileSync(f, 'utf8').includes(`${n} 个`));
      d.push(n === 34
        ? `✓ canvas-agent 工具数 ${n}（与 D10.1 定稿一致）`
        : `⚠ canvas-agent 工具数实测 ${n}，与已定稿的 34 不一致${ok ? '' : '，且文档未出现该数字'}`);
    }
  }

  // 5.4 状态口径重复分布（R1）
  const STATUS_MARK = '权威树未落地';
  const spread = walk(ROOT)
    .filter((p) => extname(p) === '.md' && !rel(p).includes('.bak-'))
    .filter((p) => readFileSync(p, 'utf8').includes(STATUS_MARK))
    .map(rel);
  if (spread.length > 5) {
    d.push(`⚠ 状态标记「${STATUS_MARK}」出现在 ${spread.length} 份文档（>5，R1 多源重复风险）：${spread.join('、')}`);
  } else {
    d.push(`✓ 状态标记分布在 ${spread.length} 份文档（阈值 ≤5）：${spread.join('、') || '无'}`);
  }

  const level = d.some((x) => x.startsWith('✗')) ? 'fail' : (d.some((x) => x.startsWith('⚠')) ? 'warn' : 'pass');
  add(level, 'C2.4 口径一致性（实测 vs 文档声称）', d);
}

/* ------------------------- 6. 索引完整性 / 孤儿文档 --------------------- */

function checkIndex() {
  const d = [];
  const indexPath = join(ROOT, 'docs/INDEX.md');
  if (!existsSync(indexPath)) { add('fail', 'C5.6 索引完整性', ['docs/INDEX.md 不存在']); return; }

  const mdFiles = walk(ROOT)
    .filter((p) => extname(p) === '.md')
    .filter((p) => !rel(p).includes('.bak-'))
    .filter((p) => !rel(p).startsWith('inventory/'))
    .filter((p) => rel(p) !== 'docs/INDEX.md');

  // INDEX 本身也算"提及者"，否则新登记进索引的文档会永远显示为孤儿
  const allText = [...mdFiles.map((p) => readFileSync(p, 'utf8')), readFileSync(indexPath, 'utf8')].join('\n');
  const orphans = mdFiles.filter((p) => !allText.includes(rel(p)) && !allText.includes(basename(p)));

  add(orphans.length ? 'warn' : 'pass', `C5.6 索引完整性（${mdFiles.length} 份文档）`,
    orphans.length ? [`未被任何文档提及（可能是孤儿）：`, ...orphans.map(rel)] : ['每份文档都至少被提及一次']);
}

/* ------------------------------ 7. 落地器干跑 --------------------------- */

function checkDryRun() {
  if (NO_DRY) { add('pass', '落地器零写入干跑', ['已用 --no-dry 跳过']); return; }
  const script = join(ROOT, 'implementation/scripts/dry-run-all.mjs');
  if (!existsSync(script)) { add('warn', '落地器零写入干跑', ['dry-run-all.mjs 不存在']); return; }

  const r = spawnSync(process.execPath, [script], { cwd: ROOT, encoding: 'utf8', timeout: 300000 });
  const code = r.status ?? -1;
  const tail = (r.stdout || '').trim().split(/\r?\n/).slice(-12);
  const ok = code === 0;
  add(ok ? 'pass' : 'fail', `落地器零写入干跑（exit ${code}）`,
    [...tail, ...(r.stderr ? ['stderr:', ...r.stderr.trim().split(/\r?\n/).slice(-5)] : [])]);
}

/* -------------------------------- 报告 ---------------------------------- */

const ICON = { pass: '✓', warn: '!', fail: '✗' };
const LABEL = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' };

function report() {
  const order = { fail: 0, warn: 1, pass: 2 };
  const sorted = [...results].sort((a, b) => order[a.level] - order[b.level]);
  const w = process.stdout.columns ? Math.min(process.stdout.columns, 100) : 100;

  console.log('');
  console.log('═'.repeat(w));
  console.log('  统一质量门 · 无限画布治理仓');
  console.log(`  根目录 ${ROOT}`);
  console.log('═'.repeat(w));

  for (const r of sorted) {
    console.log(`\n[${LABEL[r.level]}] ${ICON[r.level]} ${r.title}`);
    for (const line of r.details) console.log(`        ${line}`);
  }

  const fails = results.filter((r) => r.level === 'fail').length;
  const warns = results.filter((r) => r.level === 'warn').length;
  const passes = results.filter((r) => r.level === 'pass').length;

  console.log('\n' + '─'.repeat(w));
  console.log(`  合计：${passes} PASS / ${warns} WARN / ${fails} FAIL${STRICT ? '（--strict：warn 计为失败）' : ''}`);
  console.log('─'.repeat(w) + '\n');
  return fails || (STRICT && warns) ? 1 : 0;
}

/* -------------------------------- 主流程 -------------------------------- */

checkPrereq();
checkSecrets();
checkLinks();
checkBak();
checkConsistency();
checkIndex();
checkDryRun();

process.exit(report());

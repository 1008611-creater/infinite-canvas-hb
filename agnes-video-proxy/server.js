#!/usr/bin/env node
'use strict';
/*
 * Agnes OpenAI 兼容视频代理
 * ------------------------------------------------------------
 * 对外暴露标准 OpenAI 视频接口：
 *   POST /v1/videos        提交生成任务（文生视频 / 首帧 / 尾帧 / 参考图）
 *   GET  /v1/videos/:id    轮询任务状态（OpenAI 兼容形状）
 *   GET  /v1/models        列出可用模型（供 OpenAI 兼容客户端枚举）
 *   GET  /agnesapi         原样透传 Agnes 查询接口（兼容性兜底）
 *   GET  /health           健康检查
 *
 * 内部把请求翻译给 Agnes AI（真实端点 /v1/videos + /agnesapi）。
 * Agnes 轮询端点非标准（/agnesapi?video_id=&model_name=），
 * 所以不能直接当 OpenAI 兼容渠道填进 infinite-canvas，必须经本代理翻译。
 *
 * 后续扩展：minimax H3 / Seedance 2 / 2.5 同构加在 providers 段即可，
 * infinite-canvas 侧零改动（只认这个 Base URL）。
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { execFile } = require('child_process');
const { createIdempotencyStore } = require('./idempotency-store');
const { multipartFingerprint, requestFingerprint } = require('./request-fingerprint');

// ---------------------------------------------------------------- 日志落盘
// 代理通常由 start.bat 以后台窗口拉起，终端输出会随窗口消失，一旦出图床这类
// 远端故障就只能靠猜。这里把 console 输出同步追加到 proxy.log，方便事后自查。
// 用 AGENT_LOG_FILE 可改路径，设为 none 则关闭落盘。
const LOG_FILE = process.env.AGENT_LOG_FILE || path.join(__dirname, 'proxy.log');
function serializeArg(arg) {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.stack || arg.message;
    try { return JSON.stringify(arg); } catch { return String(arg); }
}
if (LOG_FILE.toLowerCase() !== 'none') {
    for (const level of ['log', 'warn', 'error']) {
        const original = console[level].bind(console);
        console[level] = (...args) => {
            original(...args);
            try {
                fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${level.toUpperCase()} ${args.map(serializeArg).join(' ')}\n`);
            } catch {}
        };
    }
}

// ---------------------------------------------------------------- .env 加载（零依赖）
function loadEnv() {
  const p = path.join(__dirname, '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

// ---------------------------------------------------------------- 配置
const CONFIG = {
  PORT: parseInt(process.env.PROXY_PORT || '8787', 10),
  AGNES_API_KEY: process.env.AGNES_API_KEY || '',
  AGNES_BASE: (process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com').replace(/\/$/, ''),
  UPLOAD: (process.env.AGENT_UPLOAD || 'auto').toLowerCase(),   // auto（多图床回退）| litterbox | uguu | tmpfiles | catbox | custom | none
  UPLOAD_ENDPOINT: process.env.UPLOAD_ENDPOINT || '',           // 自定义图床 URL，配合 UPLOAD=custom 优先使用
  UPLOAD_FILE_FIELD: process.env.UPLOAD_FILE_FIELD || 'fileToUpload',
  UPLOAD_FIELDS: process.env.UPLOAD_FIELDS || '',               // 自定义图床的额外表单字段，JSON 字符串
  DEFAULT_AR: process.env.DEFAULT_AR || '9:16',                 // 天宫漫剧默认竖屏
  DEFAULT_SECONDS: parseInt(process.env.DEFAULT_SECONDS || '12', 10), // 拉满 12 秒
  // 公网部署必填：浏览器要带 Bearer <PROXY_ACCESS_TOKEN> 才给用，否则任何人都能白嫖你的 Agnes 额度。
  // 不填 = 不校验（本机开发保持原样）。前端由 VITE_AGNES_API_KEY 注入同一个值。
  ACCESS_TOKEN: (process.env.PROXY_ACCESS_TOKEN || '').trim(),
  // 站点门禁密码（替代 Basic Auth，做到「只输密码、不要用户名」）。
  // 登录页把密码 POST 到 /auth，校验通过才下发 cookie；密码只存在服务端，前端拿不到。
  SITE_PASSWORD: (process.env.SITE_PASSWORD || '').trim(),
  // 登录成功后写入浏览器的 cookie 值。nginx 只做字符串比对，不解析密码。
  // 必须是随机串：它等同于「已进入」的凭证。
  AUTH_COOKIE: (process.env.AUTH_COOKIE || '').trim(),
};

// Agnes 模型表：当前产品只开放免费的 flash 模型
const AGNES_MODELS = {
  'agnes-video-2.5-flash': { flash: true, sizes: ['720P'] },
};
const ASPECTS = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'];

// 进程内记录 video_id -> 真实 model（Agnes 轮询必须带 model_name）
const taskModel = new Map();
const idempotencyStore = createIdempotencyStore({ ttlMs: Number(process.env.IDEMPOTENCY_TTL_MS || 10 * 60 * 1000) });

// ---------------------------------------------------------------- 工具
function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(new Error('请求体不是合法 JSON')); }
    });
    req.on('error', reject);
  });
}
function requestIdempotencyKey(req) {
  const value = String(req.headers['idempotency-key'] || '').trim();
  if (value.length > 200) {
    const error = new Error('idempotency_key_too_long');
    error.status = 400;
    throw error;
  }
  return value;
}
// 上游失败时给用户看的人话。以前只把 Agnes HTTP 503 原样透出去，页面和
// proxy.log 里都只有这一句，既看不懂也查不出原因（2026-09-21 实测）。
// 上游原文仍完整保留在响应体的 detail 字段，并落进 proxy.log，供事后排查。
const UPSTREAM_STATUS_HINTS = {
  429: '上游视频服务限流，请稍后重试',
  500: '上游视频服务内部错误，请稍后重试',
  502: '上游视频服务网关错误（502），请稍后重试',
  503: '上游视频通道暂时不可用（503），请稍后重试',
  504: '上游视频服务响应超时（504），请稍后重试',
};

// 上游（new-api 风格）把原因放在 message / error.message 里。
// 末尾的 request id 对用户是噪音，去掉后再截断。
function upstreamReason(detail) {
  const raw =
    detail && typeof detail === 'object'
      ? detail.message || (detail.error && (detail.error.message || detail.error)) || detail.msg || detail.raw
      : detail;
  if (typeof raw !== 'string') return '';
  return raw.replace(/\s*\(request id:[^)]*\)\s*$/i, '').trim().slice(0, 200);
}

function agnesRequest(method, relPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.AGNES_BASE + relPath);
    const payload = body ? JSON.stringify(body) : null;
    const transport = url.protocol === 'http:' ? http : https;
    const req = transport.request(
      {
        method,
        hostname: url.hostname,
        ...(url.port ? { port: Number(url.port) } : {}),
        path: url.pathname + url.search,
        headers: {
          Authorization: 'Bearer ' + CONFIG.AGNES_API_KEY,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (resp) => {
        let d = '';
        resp.on('data', (c) => (d += c));
        resp.on('end', () => {
          let json;
          try { json = d ? JSON.parse(d) : {}; }
          catch { json = { raw: d.slice(0, 500) }; }
          if (resp.statusCode >= 400) {
            reject(Object.assign(new Error('Agnes HTTP ' + resp.statusCode), { status: resp.statusCode, detail: json }));
          } else resolve(json);
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function resolveModel(alias) {
  const m = (alias || '').toLowerCase();
  if (m.includes('2.5') && !m.includes('flash')) throw new Error('当前仅开放免费的 agnes-video-2.5-flash 模型');
  return 'agnes-video-2.5-flash';
}

function mapStatus(s) {
  s = String(s || '').toLowerCase();
  if (s === 'completed' || s === 'succeeded' || s === 'success') return 'completed';
  if (s === 'failed' || s === 'error') return 'failed';
  if (s === 'processing' || s === 'running') return 'in_progress';
  return 'queued';
}

// ---- 本地图片 -> 公网 URL（Agnes 要求素材公网可访问）----
function tryCompress(localPath) {
  // 参考图 >1.5MB 时尝试用 ffmpeg 压成长边1280 JPEG（避免 Agnes 提交卡死）
  try {
    const stat = fs.statSync(localPath);
    if (stat.size <= 1_500_000) return null;
    const ffmpeg = require('child_process').execSync('where ffmpeg').toString().trim().split('\n')[0];
    if (!ffmpeg) return null;
    const out = localPath.replace(/\.[^.]+$/, '') + '_proxy.jpg';
    require('child_process').execSync(
      `"${ffmpeg}" -y -loglevel error -i "${localPath}" -vf "scale='if(gt(iw,ih),1280,-2)':'if(gt(iw,ih),-2,1280)'" -q:v 3 "${out}"`
    );
    return fs.existsSync(out) ? out : null;
  } catch {
    return null;
  }
}
// ---------------------------------------------------------------- 图床（参考图必须先变公网 URL）
// Agnes 侧只接受公网可下载的图片 URL，机身本地文件必须走图床。
// 实测（2026-08-28）：catbox.moe 匿名上传已被封（返回 "Invalid uploader"），
// 0x0.st 关闭上传，因此默认顺序改为 litterbox（catbox 的临时通道，返回真直链）。
// 所有上传都走 curl 子进程：node 原生 https 直连图床经常 socket hang up，
// curl 能复用系统代理，稳定性明显更好。
const UPLOADERS = {
  litterbox: {
    url: 'https://litterbox.catbox.moe/resources/internals/api.php',
    fields: { reqtype: 'fileupload', time: '72h' },
    fileField: 'fileToUpload',
    note: '直链，72 小时有效',
  },
  uguu: {
    url: 'https://uguu.se/upload',
    fields: {},
    fileField: 'files[]',
    note: '24 小时有效',
  },
  tmpfiles: {
    url: 'https://tmpfiles.org/api/v1/upload',
    fields: {},
    fileField: 'file',
    note: '1 小时有效；返回页面地址需转成 /dl/ 直链',
    map(text) {
      // {"data":{"url":"http://tmpfiles.org/123456/name.jpg"}} -> https://tmpfiles.org/dl/123456/name.jpg
      try {
        const j = JSON.parse(text);
        const u = j && j.data && j.data.url;
        if (u) return String(u).replace(/^https?:\/\/tmpfiles\.org\//, 'https://tmpfiles.org/dl/');
      } catch {}
      return text;
    },
  },
  catbox: {
    url: 'https://catbox.moe/user/api.php',
    fields: { reqtype: 'fileupload' },
    fileField: 'fileToUpload',
    note: '永久直链，但匿名上传常被拒（Invalid uploader）',
  },
};
const AUTO_UPLOAD_ORDER = ['litterbox', 'uguu', 'tmpfiles', 'catbox'];

function parseUploadFields(raw) {
  if (!raw) return {};
  try {
    const j = JSON.parse(raw);
    return j && typeof j === 'object' ? j : {};
  } catch {
    return {};
  }
}
// 决定尝试顺序：custom 端点优先，其余按 AUTO_UPLOAD_ORDER 兜底
function uploaderOrder() {
  const u = CONFIG.UPLOAD;
  if (u === 'none') return [];
  const custom = CONFIG.UPLOAD_ENDPOINT
    ? [{
        name: 'custom',
        url: CONFIG.UPLOAD_ENDPOINT,
        fields: parseUploadFields(CONFIG.UPLOAD_FIELDS),
        fileField: CONFIG.UPLOAD_FILE_FIELD || 'fileToUpload',
        note: '自定义图床（UPLOAD_ENDPOINT）',
      }]
    : [];
  if (!u || u === 'auto' || u === 'custom') return [...custom, ...AUTO_UPLOAD_ORDER];
  return [...custom, u, ...AUTO_UPLOAD_ORDER.filter((x) => x !== u)];
}
// Windows 版 curl 读取含非 ASCII 字符的路径会静默失败（实测 curl 8.13：退出码 26，
// stdout 为空），而参考图的原始文件名常常是中文。这里把临时文件名强制收敛成
// 纯 ASCII，只保留扩展名，避免整条上传链路被文件名拖垮。
function safeTempName(filename) {
    const ext = path.extname(String(filename || '')).replace(/[^a-zA-Z0-9.]/g, '');
    return `ag_upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext || '.png'}`;
}
function uploadWithCurl(buffer, filename, uploader) {
  return new Promise((resolve, reject) => {
    const tmpDir = process.env.TEMP || require('os').tmpdir();
    const tmpPath = path.join(tmpDir, safeTempName(filename));
    try { fs.writeFileSync(tmpPath, buffer); } catch (e) { return reject(e); }
    const args = ['-s', '--max-time', '60'];
    for (const [k, v] of Object.entries(uploader.fields || {})) {
      args.push('-F', `${k}=${v}`);
    }
    args.push('-F', `${uploader.fileField || 'fileToUpload'}=@${tmpPath}`);
    args.push(uploader.url);
    execFile('curl', args, { timeout: 70000 }, (err, stdout, stderr) => {
      try { fs.unlinkSync(tmpPath); } catch {}
      if (err) return reject(err);
      let url = stdout.trim();
      if (typeof uploader.map === 'function') url = uploader.map(url);
      if (typeof url === 'string' && url.startsWith('http')) return resolve(url);
      reject(new Error('curl 未返回有效 URL: ' + (stderr || url).slice(0, 160)));
    });
  });
}
async function uploadPublic(buffer, filename, kind) {
  const order = uploaderOrder();
  if (!order.length) throw new Error(`${kind} 是本地文件但 AGENT_UPLOAD=none，请先上传为公网 URL`);
  const errs = [];
  for (const key of order) {
    const up = typeof key === 'string' ? UPLOADERS[key] : key;
    if (!up || !up.url) continue;
    try {
      const url = await uploadWithCurl(buffer, filename, up);
      console.log(`[upload] ${kind} 上传成功（${up.name || key}）：${url}`);
      return url;
    } catch (e) {
      const msg = String((e && e.message) || e).slice(0, 120);
      console.warn(`[upload] ${kind} 经 ${up.name || key} 上传失败：${msg}`);
      errs.push(`${up.name || key}: ${msg}`);
    }
  }
  throw new Error(`${kind} 上传失败，已尝试 ${errs.length} 个图床 -> ${errs.join(' | ')}`);
}
function multipart(buffer, filename, fields, fileFieldName = 'fileToUpload') {
  const boundary = '----AgnesProxy' + Date.now();
  let chunks = [];
  for (const [k, v] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fileFieldName}"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
  chunks.push(buffer);
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(chunks) };
}
function uploadTo(host, relPath, buffer, filename, fields, fileFieldName = 'fileToUpload') {
  return new Promise((resolve, reject) => {
    const { boundary, body } = multipart(buffer, filename, fields, fileFieldName);
    const req = https.request(
      { hostname: host, path: relPath, method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'User-Agent': 'Mozilla/5.0', 'Content-Length': body.length } },
      (resp) => {
        let d = '';
        resp.on('data', (c) => (d += c));
        resp.on('end', () => {
          const txt = d.trim();
          if (resp.statusCode >= 400) return reject(new Error(host + ' HTTP ' + resp.statusCode));
          if (txt.startsWith('http')) return resolve(txt);
          try {
            const j = JSON.parse(txt);
            if (j.success && j.data && j.data.url) return resolve(j.data.url);
            if (j.url) return resolve(j.url);
            // uguu.se: { success:true, files:[{ url:"..." }] }
            if (j.success && Array.isArray(j.files) && j.files[0] && j.files[0].url) return resolve(j.files[0].url);
          } catch {}
          reject(new Error(host + ' 未返回有效 URL: ' + txt.slice(0, 160)));
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
async function resolveMedia(value, kind) {
  if (/^https?:\/\//.test(value)) return value; // 已是公网 URL
  if (CONFIG.UPLOAD === 'none') throw new Error(`${kind} 是本地文件但 AGENT_UPLOAD=none，请先上传为公网 URL`);
  let buf = fs.readFileSync(value);
  let name = path.basename(value);
  const c = tryCompress(value);
  if (c) { buf = fs.readFileSync(c); name = path.basename(c); }
  return await uploadPublic(buf, name, kind);
}

// ---- 解析画布发来的 multipart/form-data（与 JSON 双通道）----
function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function parseMultipart(buffer, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!m) throw new Error('multipart 缺少 boundary');
  const boundary = '--' + (m[1] || m[2]).trim();
  const delim = Buffer.from(boundary);
  const fields = {};
  const files = [];
  let pos = buffer.indexOf(delim);
  if (pos === -1) return { fields, files };
  pos += delim.length;
  while (true) {
    // 结束分隔符为 "--boundary--"
    if (buffer[pos] === 0x2d && buffer[pos + 1] === 0x2d) break;
    // 跳过分隔符后的 \r\n
    if (buffer[pos] === 0x0d && buffer[pos + 1] === 0x0a) pos += 2;
    const next = buffer.indexOf(delim, pos);
    const partEnd = next === -1 ? buffer.length : next;
    let part = buffer.slice(pos, partEnd);
    // 去掉末尾 \r\n（下一分隔符前的换行）
    if (part.length >= 2 && part[part.length - 2] === 0x0d && part[part.length - 1] === 0x0a) part = part.slice(0, part.length - 2);
    const sep = part.indexOf('\r\n\r\n');
    if (sep !== -1) {
      const head = part.slice(0, sep).toString('utf-8');
      const bodyBuf = part.slice(sep + 4);
      const cd = /Content-Disposition:[^\r\n]*/i.exec(head);
      if (cd) {
        const nameM = /name="([^"]*)"/i.exec(cd[0]);
        const fileM = /filename="([^"]*)"/i.exec(cd[0]);
        const ctM = /Content-Type:\s*([^\r\n]+)/i.exec(head);
        if (nameM) {
          const name = nameM[1];
          if (fileM) {
            files.push({ name, filename: fileM[1], contentType: ctM ? ctM[1].trim() : 'application/octet-stream', buffer: bodyBuf });
          } else {
            fields[name] = bodyBuf.toString('utf-8');
          }
        }
      }
    }
    if (next === -1) break;
    pos = next + delim.length;
  }
  return { fields, files };
}
function sizeToAspect(size) {
  const mm = /^(\d+)x(\d+)$/.exec((size || '').trim());
  if (!mm) return null;
  const w = +mm[1], h = +mm[2];
  if (h > w) return '9:16';
  if (w > h) return '16:9';
  return '1:1';
}
function clampSeconds(s) {
  const n = Math.floor(Number(s) || CONFIG.DEFAULT_SECONDS);
  return String(Math.max(4, Math.min(12, n || 5)));
}
function mimeOfBuffer(buf) {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf.length >= 4 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp';
  return 'image/png';
}
function toDataUri(buf) {
  return `data:${mimeOfBuffer(buf)};base64,${buf.toString('base64')}`;
}
async function uploadBuffer(buffer, filename) {
  return await uploadPublic(buffer, filename || 'ref.png', '图片');
}
// 画布走 OpenAI 视频路径时发的是 FormData（无 mode/aspect_ratio），这里翻译给 Agnes
async function handleCreateForm(fields, files) {
  if (!CONFIG.AGNES_API_KEY) throw new Error('缺少 AGNES_API_KEY');
  const model = resolveModel(fields.model);
  const meta = AGNES_MODELS[model];
  const prompt = fields.prompt;
  if (!prompt) throw new Error('缺少 prompt');
  const mode = fields.mode || 'text';
  if (!['text', 'keyframe', 'reference'].includes(mode)) throw new Error('mode 必须是 text / keyframe / reference');
  const aspect_ratio = sizeToAspect(fields.size) || CONFIG.DEFAULT_AR;
  const seconds = clampSeconds(fields.seconds);
  const size = meta.flash ? '720P' : (meta.sizes.includes(fields.size) ? fields.size : '720P');
  const payload = { model, prompt, seconds, size, aspect_ratio, mode };
  const firstFrame = files.find((f) => f.name === 'first_frame');
  const lastFrame = files.find((f) => f.name === 'last_frame');
  const refs = files.filter((f) => f.name === 'images[]' || f.name.startsWith('input_reference'));
  if (mode === 'text' && (firstFrame || lastFrame || refs.length)) throw new Error('text 模式不能携带参考图片');
  if (mode === 'keyframe') {
    if (!firstFrame && !lastFrame) throw new Error('keyframe 模式至少需要首帧或尾帧');
    if (refs.length) throw new Error('keyframe 模式不能携带全能参考图');
    if (firstFrame) payload.first_frame = await uploadBuffer(firstFrame.buffer, firstFrame.filename || 'first-frame.png');
    if (lastFrame) payload.last_frame = await uploadBuffer(lastFrame.buffer, lastFrame.filename || 'last-frame.png');
  } else if (mode === 'reference') {
    if (!refs.length) throw new Error('reference 模式至少需要一张参考图');
    if (firstFrame || lastFrame) throw new Error('reference 模式不能携带首尾帧');
    if (refs.length > 5) throw new Error('参考图最多 5 张（Agnes 免费额度内）');
    payload.images = await Promise.all(refs.map((f) => uploadBuffer(f.buffer, f.filename || 'ref.png')));
  }
  console.log('[提交-form]', model, payload.mode, size, aspect_ratio, seconds + 's', 'refs=' + refs.length);
  const result = await agnesRequest('POST', '/v1/videos', payload);
  const videoId = result.video_id || result.id;
  if (!videoId) throw new Error('Agnes 未返回 video_id: ' + JSON.stringify(result).slice(0, 300));
  taskModel.set(videoId, model);
  return rememberPoll(videoId, { id: videoId, object: 'video.generation', model, status: 'queued', created: Date.now() });
}

// ---------------------------------------------------------------- 处理器
async function handleCreate(body) {
  if (!CONFIG.AGNES_API_KEY) throw new Error('缺少 AGNES_API_KEY（写入 .env 或环境变量）');
  const model = resolveModel(body.model);
  const meta = AGNES_MODELS[model];
  const prompt = body.prompt;
  if (!prompt) throw new Error('缺少 prompt');

  const seconds = Math.min(12, Math.max(4, parseInt(body.seconds || CONFIG.DEFAULT_SECONDS, 10) || 5));
  const aspect_ratio = ASPECTS.includes(body.aspect_ratio) ? body.aspect_ratio : CONFIG.DEFAULT_AR;
  // flash 强制 720P；标准版按请求或默认 720P
  const size = meta.flash ? '720P' : (meta.sizes.includes(body.size) ? body.size : '720P');

  let mode = body.mode;
  if (!mode) {
    if (body.first_frame || body.last_frame) mode = 'keyframe';
    else if (body.images && body.images.length) mode = 'reference';
    else mode = 'text';
  }
  if (!['text', 'keyframe', 'reference'].includes(mode)) throw new Error('mode 必须是 text / keyframe / reference');
  const payload = { model, prompt, seconds: String(seconds), size, aspect_ratio, mode };
  if (mode === 'text' && (body.first_frame || body.last_frame || (body.images && body.images.length))) throw new Error('text 模式不能携带参考图片');

  if (mode === 'keyframe') {
    if (!body.first_frame && !body.last_frame) throw new Error('keyframe 模式至少需要 first_frame 或 last_frame');
    if (body.images && body.images.length) throw new Error('keyframe 模式不能携带全能参考图');
    if (body.first_frame) payload.first_frame = await resolveMedia(body.first_frame, '首帧');
    if (body.last_frame) payload.last_frame = await resolveMedia(body.last_frame, '尾帧');
  } else if (mode === 'reference') {
    const imgs = body.images || [];
    if (!imgs.length) throw new Error('reference 模式至少需要一张 images');
    if (body.first_frame || body.last_frame) throw new Error('reference 模式不能携带首尾帧');
    if (imgs.length > 5) throw new Error('参考图最多 5 张（Agnes 免费额度内）');
    payload.images = await Promise.all(imgs.map((x, i) => resolveMedia(x, '参考图' + (i + 1))));
  }
  console.log('[提交]', model, mode, size, aspect_ratio, seconds + 's');
  const result = await agnesRequest('POST', '/v1/videos', payload);
  const videoId = result.video_id || result.id;
  if (!videoId) throw new Error('Agnes 未返回 video_id: ' + JSON.stringify(result).slice(0, 300));
  taskModel.set(videoId, model);
  console.log('[提交] 成功 video_id =', videoId);
  return rememberPoll(videoId, { id: videoId, object: 'video.generation', model, status: 'queued', created: Date.now() });
}

// Agnes 免费额度限流极严（约 1 次/分钟），而画布前端默认 2.5 秒轮询一次。
// 不加节流的话任务刚提交就会被轮询打出 429，前端随即判成「生成失败」——
// 任务其实还在 Agnes 那边跑。这里做两件事：
//   1) 同一 video_id 在缓存窗口内复用上次结果，不重复打 Agnes；
//   2) 真去请求时若撞上 429/5xx，兜底返回上次已知状态（无缓存则当 queued），
//      让前端继续等，而不是直接判死。
const POLL_CACHE_MS = Number(process.env.AGENT_POLL_CACHE_MS || 20000);
const pollCache = new Map(); // video_id -> { at, payload }

function rememberPoll(id, payload) {
    pollCache.set(id, { at: Date.now(), payload });
    return payload;
}

async function handlePoll(id) {
  const model = taskModel.get(id) || 'agnes-video-2.5-flash';
  const cached = pollCache.get(id);
  if (cached && Date.now() - cached.at < POLL_CACHE_MS) return cached.payload;
  let data;
  try {
    data = await agnesRequest('GET', `/agnesapi?video_id=${encodeURIComponent(id)}&model_name=${encodeURIComponent(model)}`);
  } catch (e) {
    const msg = String((e && e.message) || e).slice(0, 120);
    console.warn(`[poll] 查询 ${id} 失败（多为限流），沿用上次状态：${msg}`);
    return cached ? cached.payload : { id, object: 'video.generation', status: 'queued', model };
  }
  const status = mapStatus(data.status);
  const meta = data.metadata || {};
  const videoUrl = meta.url || data.url || data.video_url || null;
  const out = { id, object: 'video.generation', status, model };
  if (videoUrl) out.video_url = videoUrl;
  if (status === 'completed') out.data = [{ url: videoUrl }];
  return rememberPoll(id, out);
}

function modelsList() {
  return Object.keys(AGNES_MODELS).map((id) => ({
    id, object: 'model', created: 0, owned_by: 'agnes-ai',
    supported_sizes: AGNES_MODELS[id].sizes, flash: AGNES_MODELS[id].flash,
  }));
}

// ---------------------------------------------------------------- 站点登录
// 公网暴露时密码会被暴力试，这里做最轻的兜底：同一来源连续失败 5 次锁 5 分钟。
const AUTH_FAILS = new Map();          // ip -> { count, until }
const AUTH_MAX_FAIL = 5;
const AUTH_LOCK_MS = 5 * 60 * 1000;

function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || (req.socket && req.socket.remoteAddress) || 'unknown';
}

// POST /auth { password } —— 校验站点密码，通过后下发门禁 cookie。
// 密码只存在于服务端环境变量：前端登录页拿不到它，只能拿到「通过/不通过」的结果。
function handleAuth(req, res) {
  const ip = clientIp(req);
  const prev = AUTH_FAILS.get(ip) || { count: 0, until: 0 };
  if (prev.until > Date.now()) {
    const mins = Math.ceil((prev.until - Date.now()) / 60000);
    return send(res, 429, { error: 'too_many_attempts', detail: `错误次数过多，请 ${mins} 分钟后再试` });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  readJson(req).then((body) => {
    if (!CONFIG.SITE_PASSWORD) {
      console.error('[auth] 未配置 SITE_PASSWORD，拒绝所有登录');
      return send(res, 500, { error: 'site_password_not_configured' });
    }
    if (!CONFIG.AUTH_COOKIE) {
      console.error('[auth] 未配置 AUTH_COOKIE，无法下发门禁 cookie');
      return send(res, 500, { error: 'auth_cookie_not_configured' });
    }
    if (String(body.password || '') !== CONFIG.SITE_PASSWORD) {
      const expired = prev.until && prev.until < Date.now();
      const count = expired ? 1 : prev.count + 1;
      AUTH_FAILS.set(ip, { count, until: count >= AUTH_MAX_FAIL ? Date.now() + AUTH_LOCK_MS : 0 });
      console.warn(`[auth] 登录失败 ip=${ip} 连续失败=${count}`);
      return send(res, 401, { error: 'invalid_password', detail: `密码不正确（连续失败 ${count} 次）` });
    }
    AUTH_FAILS.delete(ip);
    const maxAge = 30 * 24 * 3600;   // 登录状态保持 30 天
    res.setHeader('Set-Cookie', `canvas_auth=${CONFIG.AUTH_COOKIE}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`);
    console.log(`[auth] 登录成功 ip=${ip}`);
    send(res, 200, { ok: true });
  }).catch((e) => send(res, 400, { error: 'bad_request', detail: e.message }));
}

// ---------------------------------------------------------------- 路由
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const u = new URL(req.url, 'http://localhost');

  // 站点登录 / 登出：必须放在令牌锁之前——用户此刻还没有令牌。
  // 安全由密码本身兜底（/auth 校验密码，/auth/logout 只是清 cookie，无敏感信息）。
  if (u.pathname === '/auth') return handleAuth(req, res);
  if (u.pathname === '/auth/logout') {
    res.setHeader('Set-Cookie', 'canvas_auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    return send(res, 200, { ok: true });
  }

  // 公网部署时校验访问令牌：/health 用于探活，保持开放。
  if (CONFIG.ACCESS_TOKEN && u.pathname !== '/health') {
    const auth = String(req.headers['authorization'] || '');
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    if (token !== CONFIG.ACCESS_TOKEN) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="agnes-video-proxy"');
      return send(res, 401, { error: 'unauthorized', detail: 'missing or invalid PROXY_ACCESS_TOKEN' });
    }
  }
  try {
    if (req.method === 'GET' && u.pathname === '/health') return send(res, 200, { ok: true, base: CONFIG.AGNES_BASE });
    if (req.method === 'GET' && u.pathname === '/v1/models') return send(res, 200, { object: 'list', data: modelsList() });
    if (req.method === 'POST' && u.pathname === '/v1/videos') {
      const ct = req.headers['content-type'] || req.headers['Content-Type'] || '';
      const idempotencyKey = requestIdempotencyKey(req);
      if (ct.includes('multipart/form-data')) {
        const raw = await readRaw(req);
        const { fields, files } = parseMultipart(raw, ct);
        const fingerprint = requestFingerprint(ct, raw, multipartFingerprint(fields, files));
        return send(res, 200, await idempotencyStore.run(idempotencyKey, fingerprint, () => handleCreateForm(fields, files)));
      }
      const raw = await readRaw(req);
      let body;
      try {
        body = raw.length ? JSON.parse(raw.toString('utf8')) : {};
      } catch {
        const error = new Error('请求体不是合法 JSON');
        error.status = 400;
        throw error;
      }
      const fingerprint = requestFingerprint(ct, raw, body);
      return send(res, 200, await idempotencyStore.run(idempotencyKey, fingerprint, () => handleCreate(body)));
    }
    if (req.method === 'GET' && u.pathname.startsWith('/v1/videos/')) {
      const id = u.pathname.split('/').pop();
      return send(res, 200, await handlePoll(id));
    }
    if (req.method === 'GET' && u.pathname === '/agnesapi') {
      return send(res, 200, await agnesRequest('GET', '/agnesapi' + u.search));
    }
    return send(res, 404, { error: 'not found', path: u.pathname });
  } catch (e) {
    const detail = e && e.detail ? e.detail : String(e && e.message || e);
    const status = e && e.status ? e.status : 500;
    const reason = upstreamReason(e && e.detail);
    // 上游原文必须落日志：只记 Agnes HTTP 503 的话，分不清是通道耗尽、
    // 限流还是参数被拒，运维只能靠猜。
    if (e && e.detail) {
      console.error('[错误]', String(e && e.message || e).slice(0, 200), '上游原文:', JSON.stringify(e.detail).slice(0, 500));
    } else {
      console.error('[错误]', String(e && e.message || e).slice(0, 200));
    }
    const message = UPSTREAM_STATUS_HINTS[status] || (reason ? String(e && e.message || e) + '：' + reason : String(e && e.message || e));
    send(res, status, { error: message, detail });
  }
});

server.listen(CONFIG.PORT, () => {
  console.log(`[代理] Agnes OpenAI 兼容视频代理已启动: http://localhost:${CONFIG.PORT}`);
  console.log(`[代理] Agnes Base: ${CONFIG.AGNES_BASE}  默认画幅: ${CONFIG.DEFAULT_AR}  默认时长: ${CONFIG.DEFAULT_SECONDS}s`);
  if (!CONFIG.AGNES_API_KEY) console.warn('[代理] 警告：未检测到 AGNES_API_KEY，提交会失败，请检查 .env');
});

// ---------------------------------------------------------------- 云端同步（WebDAV）
// infinite-canvas 前端自带一套完整的云同步引擎（web/src/services/app-sync.ts +
// webdav-sync.ts），同步「画布 / 我的素材 / 生成记录 / 本地媒体文件」，但仓库里一直
// 没有配套的服务端，所以数据只能活在浏览器 IndexedDB 里，换设备或清站点数据就没了。
//
// 这里把同步服务作为同进程的第二个监听端口挂上（8789），由 nginx 反代 /dav/：
//   - 不新增容器：本栈里只有这个镜像带 Node，且它已经在跑、卷和网络都现成；
//   - 独立端口：视频代理的 /v1/videos 链路完全不受影响；
//   - webdav.js 内部对每个请求都做了 try/catch，异常不会冒到进程层。
// 没配 WEBDAV_PASSWORD 时它不会启动监听（失败关闭），不会开出一个匿名可写的目录。
function loadWebdav() {
    // 容器里 webdav.js 与 server.js 同目录（publish.sh 把 canvas-webdav/server.js 改名放进去）；
    // 在本机仓库里直接跑时它在 ../canvas-webdav/。两个位置都试一次。
    for (const candidate of ['./webdav', '../canvas-webdav/server']) {
        try {
            return require(candidate);
        } catch (error) {
            if (!error || error.code !== 'MODULE_NOT_FOUND') throw error;
        }
    }
    return null;
}

const webdavModule = loadWebdav();
if (webdavModule) {
    webdavModule.startWebdav(process.env, console).catch((error) => console.error('[webdav] 启动失败：', (error && error.message) || error));
} else {
    console.warn('[webdav] 未找到 webdav.js，云端同步不可用');
}

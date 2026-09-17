// ============================================================================
// 无限画布 · 紫域（ziyuai.vip）接入（批次 1 · 收得到钱）
// 文件：canvas-api/ziyu.js
// 模块制式：**ESM**（与 canvas-api/package.json 的 "type": "module" 一致）
// 依赖：node:crypto（fetch / Buffer / AbortController 由 Node 22 原生提供，无需引入）
// ============================================================================
//
// ⚠️ 密钥纪律（本计划最硬的一条）
//   紫域 API Key **只允许存在于服务器环境变量 ZIYU_API_KEY**。
//   绝不进仓库、不进前端、不进模板、不进构建产物。
//   紫域官方文档也明确要求：API Key 只能放对接方服务器。
//
// 两条访问路径（不要混用）
//
//   路径 1 · 前端直连（出片主链路）
//       前端渠道的 baseUrl 填 /ziyu/api，由 nginx 反向代理到紫域，
//       并在服务端注入 Authorization: Bearer __ZIYU_KEY__。
//       ⚠️ 前端模板里的 apiKey 必须填**非密钥占位串**（如 "ziyu-proxy"），
//          不能留空字符串。原因（实测，非推测）：
//            - web/src/services/api/video.ts L84-85（createPluginVideoTask）与
//              L193-194（assertVideoConfig）都会 `if (!config.apiKey.trim()) throw`，
//              空 key 直接抛错，任务根本不会发出；
//            - 真正的密钥在 nginx 侧注入，前端这个串只是占位，不是密钥。
//          同时 channel-templates.ts 的 ChannelTemplate 类型原本没有
//          apiKey / script 字段，createChannelFromTemplate() 不透传，
//          必须一并补上（详见 implementation/canvas-api/APPLY.md 必改点 ⑫）。
//
//   路径 2 · 服务端代理（模型目录 / 对账 / 落盘）
//       本文件用 ZIYU_API_BASE + ZIYU_API_KEY 直接访问紫域，
//       供 /api/ziyu/models 这类"前端不该拿到 key"的接口使用。
//   ⚠️ 计费口径（costPerSecond 优先）
//       紫域 models 目录里的 cost 只是**起步价**，真实价 = costPerSecond × 秒数。
//       实测 1：zy_model_2db335ab16705b6ffb21 提交 30 秒实际扣 1500，
//               而目录里 cost=200、costPerSecond=50 → 1500 = 50 × 30。
//       实测 2：495df357d12e52dd490d 目录 cost=392、cps=98 → 98 × 秒数。
//       统一公式：costPerSecond > 0 ? costPerSecond × 秒数 : cost。
//       因此预扣估算必须用这个公式；
//       最终对账一律以 job 返回的 cost 字段为准。
//
// 紫域接口事实（2026-09-13 实测口径，必须以线上为准）
//   GET  /api/v1/me            → { ok, user:{ username, credits } }
//   GET  /api/v1/models        → { ok, activeModelId, models:[...] }
//   POST /api/v1/uploads       → JSON body（**不是 multipart**）：
//                                { files:[{ type, name, data:"data:image/png;base64,..." }] }
//                                一次 ≤10 个；仅 JPG / PNG / WebP；**不支持 GIF**
//   POST /api/v1/jobs          → 提交任务，**必须带 Idempotency-Key**（或 body clientRequestId），
//                                提交即扣额度；返回 HTTP 202
//   GET  /api/v1/jobs/{jobId}  → 轮询，3–5 秒
//   GET  /api/v1/jobs?limit=50 → 任务列表，limit 上限 100
//   认证：Authorization: Bearer zyai_xxx（也兼容 X-API-Key）
//   错误码：400 / 401 / 402 / 403 / 404 / 429 / 500 / 502 / 503
//
// ★ 响应形状（实测，推翻早期设计稿的"扁平/嵌套兼容"猜测）
//   提交（202）：{ ok, job:{...}, user:{credits,...}, billing, submitPending, credits }
//   轮询（200）：{ ok:true, job:{...} }
//   → job **始终嵌套在 .job 下**，没有扁平形式。
//
// ★ 结果字段（2026-09-13 实测订正 —— 旧结论写反了，已作废）
//   真实产出在**顶层字段** job.resultUrl（previewUrl / preview 与它同值）。
//     实测 7c03ade8（视频，cost=50）→ resultUrl = https://…/hermes_video_*.mp4
//     实测 802b8c52（图片，cost=10）→ resultUrl = https://…/generated_image_*.png
//     两条的 assets 都是**空的**（assetCounts 全 0）。
//
//   ⚠️ job.assets **不是产出，而是输入参考素材**：
//     job.assets = { image:[...], video:[...], audio:[...] }
//     每项 = { id, type, name, url, size, mime, uploadedAt, external }
//     实测 0046e0d8 的 assets.image 3 条 = 上传的参考图（uploadedAt 早于任务创建）；
//          195f4a3a 的 assets.video 1 条 = 输入参考视频（带 compressed / originalSize）。
//     assetCounts 与实际条数逐任务一致 → 它统计的就是**输入素材数**。
//   → 落盘一律取顶层 resultUrl / previewUrl / preview；
//     **绝不能把 assets 当产出**，否则会把用户上传的参考图当成出片结果交给用户。
//   → 旧结论"completed 没有 resultUrl、结果在 assets"是**错的**，已作废。
//   见本文件 extractResultUrls() / resolveResultUrls()。
//
// ★ job 字段全集（实测）：
//   id, user, mode, modeLabel, prompt, ratio, duration, assetCounts, status, statusLabel,
//   progress, cost, createdAt, completedAt, message, failureReason,
//   refunded, refundAmount, refundedAt, modelId, modelLabel, assets,
//   resultUrl, previewUrl, preview   ← 产出地址（实测三字段同值）
//
// ⚠️ 结果 URL 24 小时后清理 —— 完成后必须立即落盘到 MEDIA_ROOT。
//    （实测样本 message：「生成结果已保留 24 小时并自动清理…」）
//
// ★ 失败退款口径（2026-09-13 全量 19/19 复核订正）
//   19 条 failed **全部 refunded:true 且 refundAmount == cost**（含 3 条 cost=0 的提交前失败）；
//   19 条 cost 合计 3430，退款合计 3430 → **净支出 0**。
//   （旧文档写的"名义 9370 / 退款 3430 / 净支出 5940"是**算错的**，已作废。）
//   → 对账一律读 refunded / refundAmount 字段，**不要**假设"失败必退"：
//     全退是**观测事实，不是契约**，代码必须按字段对账。
// ============================================================================

import { createHash } from 'node:crypto';

/** 紫域 API 根地址，例如 https://ziyuai.vip 。由服务器环境变量提供。 */
function apiBase() {
    const base = (process.env.ZIYU_API_BASE || '').trim().replace(/\/+$/, '');
    if (!base) {
        const err = new Error('ZIYU_NOT_CONFIGURED');
        err.code = 'ZIYU_NOT_CONFIGURED';
        throw err;
    }
    return base;
}

/** 紫域 API Key（只存服务器）。 */
function apiKey() {
    const key = (process.env.ZIYU_API_KEY || '').trim();
    if (!key) {
        const err = new Error('ZIYU_NOT_CONFIGURED');
        err.code = 'ZIYU_NOT_CONFIGURED';
        throw err;
    }
    return key;
}

function isConfigured() {
    return Boolean((process.env.ZIYU_API_BASE || '').trim() && (process.env.ZIYU_API_KEY || '').trim());
}

/**
 * 服务端调用紫域。
 * 只在本文件内部使用；前端永远拿不到 key。
 */
async function callZiyu(path, { method = 'GET', body, headers = {}, timeoutMs = 60000 } = {}) {
    const url = apiBase() + path;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            method,
            headers: {
                Authorization: 'Bearer ' + apiKey(),
                ...(body ? { 'Content-Type': 'application/json' } : {}),
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
        const text = await res.text();
        let parsed = null;
        try { parsed = text ? JSON.parse(text) : null; } catch (_) { parsed = { raw: text }; }
        if (!res.ok) {
            const err = new Error('ZIYU_HTTP_' + res.status);
            err.code = 'ZIYU_HTTP_' + res.status;
            err.status = res.status;
            err.payload = parsed;
            throw err;
        }
        return parsed;
    } finally {
        clearTimeout(timer);
    }
}

// ---------------------------------------------------------------------------
// 模型目录
// ---------------------------------------------------------------------------

/**
 * 拉取实时模型目录。
 *
 * ⚠️ 紫域模型目录**动态变化**，必须实时拉，不要在本地写死清单。
 *    本地只缓存"用途分组"与"展示名"。
 *
 * 2026-09-13 实测快照：共 44 个模型（39 video + 5 image）
 *   - activeModelId = zy_model_bcb64b317b3d8edc06d5（2.0 满血 480p，cost=300）
 *   - **目录内没有任何 cost ≥ 1000 的档位**；当前最高 950（满血2.0 4K 933参考，cps=190）
 *   - 用户点名的 `zy_model_8ca86ee8119ded45fe00`（官转满血 2.5，720p，6 分钟）
 *     **本轮已不在目录中（下架）** —— 这正是"不要写死模型 ID"的实证。
 *   - 图片 5 个：image-2-1k cost=5 / image-2-2k cost=10 / 另 3 个 cost=10~20
 *   - durationCosts 实测**全部为空 {}** → 不要依赖它，用 costPerSecond。
 *
 * 模型字段全集（实测）：
 *   id, name, type, modes, enabled, cost, costPerSecond, durationCosts,
 *   allowedDurations, allowedRatios, allowedAssetTypes, assetLimits,
 *   resolution, promptMaxLength
 *
 * 典型按秒计费：495df357d12e52dd490d（满血2.5 720p，cost=392，cps=98，dur=[4..30]）
 * 典型按次计费：470346a7b94a0605d6f6（2.5 720p 30秒 30图，cost=500，cps=0，dur=[30]）
 */
async function fetchModelCatalog() {
    const payload = await callZiyu('/api/v1/models', { timeoutMs: 30000 });
    const models = Array.isArray(payload && payload.models) ? payload.models : [];
    return {
        ok: true,
        activeModelId: payload ? payload.activeModelId : null,
        models: models.map(normalizeModel),
    };
}

/** 只取前端需要的字段，且**绝不透出任何密钥类字段**。 */
function normalizeModel(m) {
    if (!m || typeof m !== 'object') return null;
    return {
        id: m.id,
        name: m.name,
        type: m.type,                 // video / image
        modes: m.modes || [],         // i2v / t2v / t2i
        enabled: m.enabled !== false,
        cost: m.cost ?? null,
        costPerSecond: m.costPerSecond ?? null,
        durationCosts: m.durationCosts || null,
        allowedDurations: m.allowedDurations || [],
        allowedRatios: m.allowedRatios || [],
    };
}

/**
 * 按用途分组，供前端下拉展示。
 * 分组只影响展示顺序，不影响可选项 —— 真正的合法性以紫域实时目录为准。
 *
 * 返回：{ video: [...], image: [...], byCost: [{ tier, models:[...] }] }
 */
function groupModels(models) {
    const list = (models || []).filter(Boolean);
    const video = list.filter((m) => m.type === 'video');
    const image = list.filter((m) => m.type !== 'video');

    const tiers = new Map();
    for (const m of list) {
        const tier = m.cost ?? 0;
        if (!tiers.has(tier)) tiers.set(tier, []);
        tiers.get(tier).push(m);
    }
    const byCost = [...tiers.entries()]
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([tier, ms]) => ({ tier: Number(tier), models: ms }));

    return { video, image, byCost };
}

/**
 * duration 归一化。
 * ⚠️ 紫域各模型的 allowedDurations 格式不统一（"30秒" / "15" / "5秒"），
 *    必须按目标模型的 allowedDurations 归一化，不能直接透传用户输入。
 *
 * @returns {string|number|null} 归一化后的值；null 表示该模型不接受任何时长
 */
function normalizeDuration(requested, allowedDurations) {
    const allowed = Array.isArray(allowedDurations) ? allowedDurations.filter((x) => x != null) : [];
    if (allowed.length === 0) return null;

    const num = (v) => {
        const m = String(v).match(/(\d+(?:\.\d+)?)/);
        return m ? Number(m[1]) : NaN;
    };

    const wanted = Number(requested);
    if (Number.isFinite(wanted)) {
        // 精确命中（含 "5" / "5秒" 这类）
        const exact = allowed.find((a) => num(a) === wanted);
        if (exact !== undefined) return exact;
        // 取不超过请求值里最大的一个
        const le = allowed
            .map((a) => ({ raw: a, n: num(a) }))
            .filter((x) => Number.isFinite(x.n) && x.n <= wanted)
            .sort((a, b) => b.n - a.n)[0];
        if (le) return le.raw;
        // 都比请求值大 → 取最小的
        const ge = allowed
            .map((a) => ({ raw: a, n: num(a) }))
            .filter((x) => Number.isFinite(x.n))
            .sort((a, b) => a.n - b.n)[0];
        if (ge) return ge.raw;
    }
    // 没给请求值 → 取最短的
    return allowed
        .map((a) => ({ raw: a, n: num(a) }))
        .filter((x) => Number.isFinite(x.n))
        .sort((a, b) => a.n - b.n)
        .map((x) => x.raw)[0] ?? allowed[0];
}

// ---------------------------------------------------------------------------
// 结果落盘（24 小时清理的应对）
// ---------------------------------------------------------------------------

/**
 * 从紫域任务对象里取出全部**产出**结果 URL。
 *
 * ★ 实测（2026-09-13，全量 38 条任务复核，推翻旧结论）
 *   真实产出在**顶层**字段：job.resultUrl（previewUrl / preview 与它同值）。
 *     · 7c03ade8（视频 cost=50）→ resultUrl = …/hermes_video_*.mp4，assets 全空
 *     · 802b8c52（图片 cost=10）→ resultUrl = …/generated_image_*.png，assets 全空
 *   ⚠️ job.assets **不是产出，是输入参考素材**（上传的参考图 / 参考视频）：
 *     · 0046e0d8 的 assets.image 3 条，uploadedAt 早于任务创建 → 输入图
 *     · 195f4a3a 的 assets.video 1 条，带 compressed / originalSize → 输入视频
 *     · assetCounts 与实际条数逐任务一致 → 统计的是**输入素材数**
 *   → 本函数**只认顶层产出字段**，一个都不回看 assets。
 *     把 assets 当产出落盘，会把用户自己上传的参考素材当成出片结果交付给用户。
 *     （实测反例 195f4a3a：结果已过 24 小时清理、assets 里只剩输入参考视频；
 *      若拿 assets 兜底，用户会收到一条「自己的输入」当成品。）
 *
 * @param {object} job  轮询返回的 payload.job（或 payload 本身，做一层兜底）
 * @param {string} [kind]  'video' | 'image' | 'audio'；不传则按 URL 后缀推断
 * @returns {Array<{url:string, kind:string, mime:string, size:number|null, name:string|null, source:string}>}
 */
function extractResultUrls(job, kind) {
    const j = job && job.job && typeof job.job === 'object' ? job.job : job;
    if (!j || typeof j !== 'object') return [];

    const out = [];
    const seen = new Set();
    const push = (rawUrl) => {
        const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
        if (!url || seen.has(url)) return;
        seen.add(url);
        const inferred = inferMediaType(url, kind === 'image' ? 'image/png' : 'video/mp4');
        const guessed = inferred.mimeType.startsWith('image/')
            ? 'image'
            : (inferred.mimeType.startsWith('audio/') ? 'audio' : 'video');
        out.push({
            url,
            kind: kind || guessed,
            mime: inferred.mimeType,
            size: null,
            name: null,
            source: 'result',
        });
    };

    // 实测口径：产出只在顶层；三字段同值，去重后通常只留一条。
    push(j.resultUrl);
    push(j.previewUrl);
    push(j.preview);
    return out;
}

/**
 * 取出任务里挂的**输入参考素材**（不是产出）。
 *
 * 用途：留档 / 对账 / 排查「用户以为没出片、其实是参考图没上传成功」这类问题。
 * ⚠️ **绝不可**把它当结果返回给用户 —— 它是用户自己上传的东西。
 *
 * @returns {Array<{url:string, kind:string, mime:string|null, size:number|null, name:string|null, uploadedAt:string|null}>}
 */
function extractInputAssets(job) {
    const j = job && job.job && typeof job.job === 'object' ? job.job : job;
    if (!j || typeof j !== 'object') return [];
    const assets = j.assets;
    if (!assets || typeof assets !== 'object') return [];

    const out = [];
    const seen = new Set();
    for (const k of ['image', 'video', 'audio']) {
        const list = Array.isArray(assets[k]) ? assets[k] : [];
        for (const a of list) {
            if (!a || typeof a !== 'object') continue;
            const url = typeof a.url === 'string' ? a.url.trim() : '';
            if (!url || seen.has(url)) continue;
            seen.add(url);
            out.push({
                url,
                kind: a.type || k,
                mime: a.mime || null,
                size: typeof a.size === 'number' ? a.size : null,
                name: a.name || null,
                uploadedAt: a.uploadedAt || null,
            });
        }
    }
    return out;
}

/**
 * 任务是否真的产出了**可落盘**的结果。
 *
 * ★ 落盘调用方必须走这个判断：
 *   completed 但 0 个产出 URL → 记 warning + **不标成功**（实测成因：结果 URL 已过
 *   24 小时被紫域清理，样本 1b70d64f / 0046e0d8：status=completed、无 resultUrl）。
 *   直接标成功 = 用户拿到一个永远播不了的空记录。
 *
 * @returns {{ok:boolean, urls:Array, warning:string|null}}
 */
function resolveResultUrls(job, kind) {
    const j = job && job.job && typeof job.job === 'object' ? job.job : job;
    const urls = extractResultUrls(j, kind);
    const status = j && typeof j === 'object' ? j.status : null;
    if (urls.length > 0) return { ok: true, urls, warning: null };
    const warning = status === 'completed'
        ? 'RESULT_URL_MISSING：任务已完成但没有产出地址（多半是结果 URL 已过 24 小时被紫域清理），不要标记为成功'
        : 'RESULT_URL_MISSING：任务尚未产出可落盘的结果';
    return { ok: false, urls: [], warning };
}
/** 从 URL 推断扩展名与 mimeType。 */
function inferMediaType(url, fallbackMime = 'video/mp4') {
    const clean = String(url).split('?')[0].toLowerCase();
    const m = clean.match(/\.([a-z0-9]{2,5})$/);
    const ext = m ? m[1] : '';
    const map = {
        mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        webp: 'image/webp', gif: 'image/gif', mp3: 'audio/mpeg', wav: 'audio/wav',
    };
    return { ext: ext || (fallbackMime.startsWith('image/') ? 'png' : 'mp4'), mimeType: map[ext] || fallbackMime };
}

/**
 * 把紫域结果 URL 立即下载并落盘到 MEDIA_ROOT。
 *
 * 为什么必须做：紫域结果 URL **24 小时后清理**，不落盘 = 用户第二天看不到自己的片子。
 *
 * ★ 调用方写法（2026-09-13 实测订正）：
 *     const resolved = resolveResultUrls(payload.job, 'video');
 *     if (!resolved.ok) throw new Error(resolved.warning);   // 别标成功
 *     for (const item of resolved.urls) {
 *         await persistRemoteMedia({ userId, taskId, url: item.url, registerMedia, kind: item.kind });
 *     }
 *   产出在顶层 resultUrl（previewUrl / preview 同值），**不是** assets；
 *   assets 是用户上传的输入参考素材，拿它落盘 = 把参考图当出片结果交付。
 *   一个任务可能返回多个产出（多图任务），必须逐个落盘，不能只取第一个。
 *
 * @param {object} deps  { registerMedia, ensureDir } —— 由 server.js 注入，避免循环依赖
 * @returns {{ok:boolean, storageKey?:string, bytes?:number, checksum?:string}}
 */
async function persistRemoteMedia({ userId, taskId, url, registerMedia, kind = 'video' }, { timeoutMs = 300000 } = {}) {
    if (!url || typeof url !== 'string') return { ok: false, code: 'NO_RESULT_URL' };
    if (typeof registerMedia !== 'function') throw new Error('persistRemoteMedia: registerMedia dependency is required');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let buffer;
    let contentType;
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return { ok: false, code: 'DOWNLOAD_FAILED', status: res.status };
        contentType = res.headers.get('content-type') || '';
        buffer = Buffer.from(await res.arrayBuffer());
    } catch (err) {
        return { ok: false, code: 'DOWNLOAD_FAILED', message: String(err && err.message || err) };
    } finally {
        clearTimeout(timer);
    }
    if (!buffer.length) return { ok: false, code: 'EMPTY_RESULT' };

    const inferred = inferMediaType(url, contentType.startsWith('image/') ? contentType : (kind === 'image' ? 'image/png' : 'video/mp4'));
    // storageKey 用内容 sha256 前 16 位，天然去重、天然稳定
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const storageKey = 'ziyu/' + userId + '/' + (taskId || checksum.slice(0, 16)) + '.' + inferred.ext;
    const objectKey = storageKey;

    await registerMedia(userId, storageKey, objectKey, buffer, {
        mimeType: inferred.mimeType,
        sourceUrl: url,          // ← 留档原址，media_files.source_url
    });

    return { ok: true, storageKey, bytes: buffer.length, checksum, mimeType: inferred.mimeType };
}

export {
    isConfigured,
    apiBase,
    apiKey,
    callZiyu,
    fetchModelCatalog,
    normalizeModel,
    groupModels,
    normalizeDuration,
    extractResultUrls,
    extractInputAssets,
    resolveResultUrls,
    inferMediaType,
    persistRemoteMedia,
};

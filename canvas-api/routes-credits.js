// ============================================================================
// 无限画布 · 计费相关路由（批次 1 · 收得到钱）
// 文件：canvas-api/routes-credits.js
// 模块制式：**ESM**（与 canvas-api/package.json 的 "type": "module" 一致）
//   ⚠️ 本目录全部是 ESM。import 路径必须带 .js 扩展名；
//      运行时 require() 在 ESM 里不可用，所有依赖必须提到文件顶部。
// ============================================================================
//
// 用法：本文件是一个"挂载函数"，不改 server.js 的路由风格，也不自己造一套。
// 在 canvas-api/server.js 里按下面【6 处必改】接进去即可。
// 完整接线说明见同目录 APPLY.md。
//
// ---------------------------------------------------------------------------
// 【必改 1】顶部 import（放在 server.js 现有 import 区）
// ---------------------------------------------------------------------------
//     import { mountCreditRoutes } from './routes-credits.js';
//
// ---------------------------------------------------------------------------
// 【必改 2】CORS 允许头白名单 —— 必须加 Idempotency-Key
// ---------------------------------------------------------------------------
//   现状（server.js 约 L52–55）只允许：
//     Content-Type, Authorization, Content-Range, X-Upload-Offset
//   ⚠️ 紫域提交要求带 Idempotency-Key。如果前端要跨域发这个头，
//      预检请求会因为不在白名单里而失败（浏览器侧表现为 CORS 报错，
//      服务端日志里什么都看不到）。改成：
//
//     const ALLOWED_HEADERS = [
//       'Content-Type', 'Authorization', 'Content-Range',
//       'X-Upload-Offset', 'Idempotency-Key',
//     ].join(', ');
//
// ---------------------------------------------------------------------------
// 【必改 3】isBinaryUpload 白名单 —— 本批新增路由不需要改
// ---------------------------------------------------------------------------
//   现状（server.js 约 L41–43）：
//     const isBinaryUpload = (req) =>
//       (req.method === 'PUT' || req.method === 'PATCH') &&
//       (req.path.startsWith('/api/media/') || req.path.startsWith('/api/sync/'));
//
//   本批新增的接口全部是 GET / POST + JSON body，**没有二进制上传**，
//   因此这一行**不需要改**。但请注意：
//   - 若将来新增"用户直接上传素材到紫域"这类二进制 PUT/PATCH 路由，
//     必须把该路径加进 isBinaryUpload 的判定，否则 body 会被 JSON parser 吃掉，
//     表现为"上传成功但文件是空的"。
//
// ---------------------------------------------------------------------------
// 【必改 4】注册路由（放在 /api/auth/* 之后、/api/media/* 之前）
// ---------------------------------------------------------------------------
//     mountCreditRoutes(app, {
//       requireAuth,
//       requireAdmin,        // ← 需要新增这个中间件，见下
//       registerMedia,       // server.js 里已有的函数
//       query,               // db.js 里的 query
//     });
//
// ---------------------------------------------------------------------------
// 【必改 5】requireAdmin 中间件（server.js 里目前没有）
// ---------------------------------------------------------------------------
//   在 requireAuth 定义之后加：
//
//     function requireAdmin(req, res, next) {
//       if (!req.user) return res.status(401).json({ error: 'unauthorized' });
//       if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
//       next();
//     }
//
//   ⚠️ 这是"新用户拿不到管理员"的防线之一。
//      users.role 的 CHECK 约束是 ('user','admin')，
//      promoteToAdminIfFirst() 只对第一个注册者生效，两者配合才安全。
// ============================================================================

import { randomBytes } from 'node:crypto';
import {
    getCreditSummary,
    reserveTaskCredits,
    settleTaskCredits,
    refundTaskCredits,
    getFreeTrialStatus,
    consumeFreeTrial,
    adminAdjustBalance,
    adminCreditOverview,
    reconcileChannelUsage,
    customerCost,
    REDEEM_DENOMINATIONS,
} from './credits.js';
import { readUnifiedQuota } from './unified-quota.js';
import { redeemCode, listRedemptions, signPayload } from './ldxp-redeem.js';
import * as ziyu from './ziyu.js';

/** 免费试拍每月次数（可配置）。默认 3。 */
function freeTrialLimit() {
    const n = Number(process.env.FREE_TRIAL_MONTHLY_LIMIT);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 3;
}

/** 统一的错误应答：不要把内部异常原文透给前端。 */
function fail(res, err, status = 500) {
    const code = (err && err.code) || 'INTERNAL_ERROR';
    if (status >= 500) console.error('[credits]', code, err && err.message);
    return res.status(status).json({ error: code });
}

// ---------------------------------------------------------------------------
// SQL 片段：落盘成功后把结果登记回 channel_usage（对账用）。
//
// 为什么用 TICK 拼字符串而不是直接写模板字符串：
//   本文件会被落地器整体搬运，历史上模板字符串里嵌套反引号会被工具链截断。
//   用 String.fromCharCode(96) 拼出来，语义完全一样，但不会被工具链吃掉。
// ---------------------------------------------------------------------------
const TICK = String.fromCharCode(96);

const SQL_MARK_ZIYU_RESULT = TICK +
    'UPDATE channel_usage ' +
    '   SET result_url = $3, local_media_key = $4, updated_at = NOW() ' +
    " WHERE channel = 'ziyu' AND task_id = $1 AND user_id = $2" +
    TICK;

/**
 * 挂载计费路由。
 * @param {import('express').Express} app
 * @param {object} deps { requireAuth, requireAdmin, registerMedia, query }
 */
function mountCreditRoutes(app, deps) {
    const { requireAuth, requireAdmin, registerMedia, query } = deps;
    if (typeof requireAuth !== 'function') throw new Error('mountCreditRoutes: requireAuth is required');
    if (typeof requireAdmin !== 'function') throw new Error('mountCreditRoutes: requireAdmin is required');

    // -----------------------------------------------------------------------
    // 余额与流水
    // -----------------------------------------------------------------------

    // GET /api/credits/me → { balance, pricing, ledger, freeTrial }
    app.get('/api/credits/me', requireAuth, async (req, res) => {
        try {
            const unified = await readUnifiedQuota(req.user.email);
            if (unified) return res.json({ ...unified, ledger: [], pricing: null, freeTrial: null });
            const summary = await getCreditSummary(req.user.id);
            const freeTrial = await getFreeTrialStatus(req.user.id, freeTrialLimit());
            res.json({ ...summary, freeTrial });
        } catch (err) {
            if (String(err?.message || '').startsWith('UNIFIED_QUOTA_')) return res.status(503).json({ error: err.message });
            fail(res, err);
        }
    });

    // POST /api/credits/redeem  body: { code }
    // 文案纪律：前端提示用"粘贴兑换码"，不要出现固定积分人民币比例。
    app.post('/api/credits/redeem', requireAuth, async (req, res) => {
        try {
            const code = req.body && req.body.code;
            if (!code) return res.status(400).json({ error: 'LDXP_REDEEM_CODE_INVALID' });
            const result = await redeemCode({ userId: req.user.id, code });
            if (!result.ok) {
                // 码被用过 / 非法 都返回 400，不泄露"这张码是否存在"
                return res.status(400).json({ error: result.code });
            }
            res.json({
                ok: true,
                redeemedCredits: result.redeemedCredits,
                balance: result.balance,
            });
        } catch (err) {
            if (err && err.code === 'LDXP_PAYMENT_CHANNEL_UNAVAILABLE') {
                return res.status(503).json({ error: 'LDXP_PAYMENT_CHANNEL_UNAVAILABLE' });
            }
            fail(res, err);
        }
    });

    // GET /api/credits/redemptions
    app.get('/api/credits/redemptions', requireAuth, async (req, res) => {
        try { res.json({ items: await listRedemptions(req.user.id) }); }
        catch (err) { fail(res, err); }
    });

    // -----------------------------------------------------------------------
    // 扣费：预扣 / 结算 / 退款
    // 前端出片链路在提交前调用 reserve，任务结束后调用 settle。
    // -----------------------------------------------------------------------

    // POST /api/credits/reserve  body: { taskId, credits, metadata? }
    app.post('/api/credits/reserve', requireAuth, async (req, res) => {
        try {
            const { taskId, credits, metadata } = req.body || {};
            if (!taskId) return res.status(400).json({ error: 'TASK_ID_REQUIRED' });
            const result = await reserveTaskCredits({
                userId: req.user.id, taskId, credits, metadata: metadata || {},
            });
            if (!result.ok) return res.status(402).json({ error: result.code, balance: result.balance });
            res.json(result);
        } catch (err) { fail(res, err); }
    });

    // POST /api/credits/settle  body: { taskId, ziyuCost, status? }
    // ⚠️ ziyuCost 必须来自紫域返回的 cost 字段，不要本地推算。
    //    cost = 0 → 不退款（按差额退）；cost > 0 → 按 ×1.5 向上取整结算。
    app.post('/api/credits/settle', requireAuth, async (req, res) => {
        try {
            const { taskId, ziyuCost, status, metadata } = req.body || {};
            if (!taskId) return res.status(400).json({ error: 'TASK_ID_REQUIRED' });
            if (ziyuCost === undefined || ziyuCost === null) {
                return res.status(400).json({ error: 'ZIYU_COST_REQUIRED' });
            }
            const result = await settleTaskCredits({
                userId: req.user.id, taskId, ziyuCost,
                status: status || 'completed', metadata: metadata || {},
            });
            res.json(result);
        } catch (err) { fail(res, err); }
    });

    // POST /api/credits/refund  body: { taskId, reason? }
    // 只用于"任务根本没建立起来"这类确定要退的场景。失败任务不要无脑退，走 settle。
    app.post('/api/credits/refund', requireAuth, async (req, res) => {
        try {
            const { taskId, reason } = req.body || {};
            if (!taskId) return res.status(400).json({ error: 'TASK_ID_REQUIRED' });
            const result = await refundTaskCredits({ userId: req.user.id, taskId, reason: reason || undefined });
            // 已结算过的任务不允许再退（结算本身已含"多退少补"），返回 409 让前端能区分
            // "退成功了" 与 "这笔不该退"。
            if (!result.ok) return res.status(409).json(result);
            res.json(result);
        } catch (err) { fail(res, err); }
    });

    // 报价工具：前端拿到紫域 cost 后可先换算给用户看
    app.get('/api/credits/quote', requireAuth, (req, res) => {
        const ziyuCost = Number(req.query.ziyuCost);
        if (!Number.isFinite(ziyuCost)) return res.status(400).json({ error: 'INVALID_COST' });
        res.json({ ziyuCost, credits: customerCost(ziyuCost) });
    });

    // -----------------------------------------------------------------------
    // 免费试拍（Agnes flash）：必须登录 + 每月限次
    // -----------------------------------------------------------------------

    // GET /api/credits/free-trial
    app.get('/api/credits/free-trial', requireAuth, async (req, res) => {
        try { res.json(await getFreeTrialStatus(req.user.id, freeTrialLimit())); }
        catch (err) { fail(res, err); }
    });

    // POST /api/credits/free-trial/consume
    // ⚠️ 调用 Agnes flash 之前必须先过这一关。未登录 → 401（requireAuth 挡住）。
    app.post('/api/credits/free-trial/consume', requireAuth, async (req, res) => {
        try {
            const result = await consumeFreeTrial(req.user.id, freeTrialLimit());
            if (!result.ok) {
                return res.status(429).json({
                    error: result.code,
                    status: result.status,
                    hint: '免费试拍次数已用完，购买兑换码可获得更多额度',
                });
            }
            res.json(result);
        } catch (err) { fail(res, err); }
    });

    // POST/GET /api/credits/free-trial/check
    // -----------------------------------------------------------------------
    // 给 nginx 的 auth_request 子请求用（见 deploy/batch2-nginx.conf.snippet）。
    //
    // 为什么需要它：撤掉 /agnes/ 的 cookie 门禁之后，免费试拍端点就变成公开的，
    // 必须在服务端限次。nginx 的 auth_request 只会发 GET 子请求、$request_method
    // 拿不到原始方法，所以这里**只看 URI 不看方法**——能走到这条路由就说明
    // 请求命中的是 location = /agnes/v1/videos（唯一消耗端点）。
    //
    // 约定：2xx = 放行（auth_request 只认 2xx），401/403 = 拦截。
    //   - 未登录            → requireAuth 直接 401
    //   - 次数用尽 / 已关闭 → 403（FREE_TRIAL_EXHAUSTED / FREE_TRIAL_DISABLED）
    //   - 扣次成功          → 204（无正文，避免子请求响应体被误当页面返回）
    //
    // ⚠️ 代价：一次提交消耗一次，即使上游随后拒绝也不退。这是 auth_request
    //    只能"先放行后转发"的固有取舍，已在验收文档中如实标注。
    app.all('/api/credits/free-trial/check', requireAuth, async (req, res) => {
        try {
            const result = await consumeFreeTrial(req.user.id, freeTrialLimit());
            if (!result.ok) {
                return res.status(403).json({
                    error: result.code,
                    status: result.status,
                    hint: '免费试拍次数已用完，购买兑换码可获得更多额度',
                });
            }
            return res.status(204).end();
        } catch (err) { fail(res, err); }
    });

    // -----------------------------------------------------------------------
    // 紫域模型目录（服务端代理，前端拿不到 key）
    // -----------------------------------------------------------------------

    // GET /api/ziyu/models → { ok, models, groups }
    app.get('/api/ziyu/models', requireAuth, async (req, res) => {
        try {
            if (!ziyu.isConfigured()) return res.status(503).json({ error: 'ZIYU_NOT_CONFIGURED' });
            const catalog = await ziyu.fetchModelCatalog();
            res.json({ ...catalog, groups: ziyu.groupModels(catalog.models) });
        } catch (err) { fail(res, err, err && err.status ? 502 : 500); }
    });

    // GET /api/ziyu/me → 紫域侧账号信息（积分余额），用于人工对账
    app.get('/api/ziyu/me', requireAuth, requireAdmin, async (req, res) => {
        try {
            if (!ziyu.isConfigured()) return res.status(503).json({ error: 'ZIYU_NOT_CONFIGURED' });
            res.json(await ziyu.callZiyu('/api/v1/me', { timeoutMs: 15000 }));
        } catch (err) { fail(res, err, err && err.status ? 502 : 500); }
    });

    // POST /api/ziyu/persist  body: { taskId, url?, kind? }
    // 紫域结果 URL 24 小时后清理 → 任务完成后必须立即落盘。
    //
    // ★ 2026-09-13 实测订正：产出在**顶层 resultUrl**，不要回看 assets
    //   （assets 是用户上传的输入参考素材，拿它落盘 = 把参考图当成品交付）。
    //   旧实现直接拿 body.url 落盘，且只看第一个 URL，两个后果：
    //   ① 前端漏传 url 就落不了盘；② 多图任务只存第一张。
    app.post('/api/ziyu/persist', requireAuth, async (req, res) => {
        try {
            const { taskId, url, kind } = req.body || {};
            const mediaKind = kind || 'video';

            let resolved = null;
            if (taskId) {
                if (!ziyu.isConfigured()) return res.status(503).json({ error: 'ZIYU_NOT_CONFIGURED' });
                const job = await ziyu.callZiyu('/api/v1/jobs/' + encodeURIComponent(taskId), { timeoutMs: 30000 });
                const j = job && job.job && typeof job.job === 'object' ? job.job : job;
                const status = j && typeof j === 'object' ? j.status : null;
                if (status !== 'completed') {
                    return res.status(409).json({ error: 'TASK_NOT_COMPLETED', status: status || null, progress: (j && j.progress) || null });
                }
                resolved = ziyu.resolveResultUrls(job, mediaKind);
                if (!resolved.ok) {
                    console.warn('[credits] RESULT_URL_MISSING taskId=' + taskId + ' kind=' + mediaKind);
                    return res.status(422).json({ error: 'RESULT_URL_MISSING', warning: resolved.warning, taskId });
                }
            } else if (!url) {
                return res.status(400).json({ error: 'URL_REQUIRED' });
            }

            if (typeof registerMedia !== 'function') return res.status(500).json({ error: 'MEDIA_NOT_READY' });

            const items = resolved && resolved.urls.length ? resolved.urls : [{ url, kind: mediaKind }];
            const saved = [];
            for (const item of items) {
                const one = await ziyu.persistRemoteMedia({
                    userId: req.user.id, taskId, url: item.url, registerMedia, kind: item.kind || mediaKind,
                });
                if (!one.ok) {
                    // 已知取舍：部分成功会中断，已落盘的那几个不回滚（它们本身可用）。
                    return res.status(502).json({ error: one.code, url: item.url, savedCount: saved.length });
                }
                saved.push({ ...one, url: item.url, kind: item.kind || mediaKind });
            }

            const first = saved[0];
            if (typeof query === 'function' && taskId) {
                await query(SQL_MARK_ZIYU_RESULT, [taskId, req.user.id, first.url, first.storageKey])
                    .catch(() => { /* 登记失败不影响落盘结果 */ });
            }

            // 向后兼容：顶层仍带 storageKey/bytes/checksum/mimeType（老前端只读这几个）。
            res.json({
                ...first,
                ok: true,
                count: saved.length,
                items: saved.map((s) => ({ url: s.url, storageKey: s.storageKey, bytes: s.bytes, mimeType: s.mimeType, kind: s.kind })),
            });
        } catch (err) { fail(res, err, err && err.status ? 502 : 500); }
    });

    // -----------------------------------------------------------------------
    // 管理员
    // -----------------------------------------------------------------------

    // GET /api/admin/credits/overview
    app.get('/api/admin/credits/overview', requireAuth, requireAdmin, async (req, res) => {
        try { res.json(await adminCreditOverview()); } catch (err) { fail(res, err); }
    });

    // POST /api/admin/credits/adjust  body: { userId, amount, note? }
    app.post('/api/admin/credits/adjust', requireAuth, requireAdmin, async (req, res) => {
        try {
            const { userId, amount, note } = req.body || {};
            if (!userId || amount === undefined) return res.status(400).json({ error: 'INVALID_INPUT' });
            res.json(await adminAdjustBalance({ userId, adminId: req.user.id, amount, note: note || '' }));
        } catch (err) { fail(res, err, 400); }
    });

    // GET /api/admin/credits/reconcile?days=1
    app.get('/api/admin/credits/reconcile', requireAuth, requireAdmin, async (req, res) => {
        try { res.json({ diffs: await reconcileChannelUsage({ days: req.query.days }) }); }
        catch (err) { fail(res, err); }
    });

    // GET /api/admin/credits/denominations
    app.get('/api/admin/credits/denominations', requireAuth, requireAdmin, (req, res) => {
        res.json({ denominations: REDEEM_DENOMINATIONS });
    });

    // POST /api/admin/credits/generate  body: { credits, count }
    // ⚠️ 在线生成只是"临时补货"。默认方式仍然是本地脚本批量生成（码不经过服务器）。
    //    在线生成会把明文码经 HTTP 返回给管理员 —— 这是可接受的风险，
    //    但不要把它做成批量几千张的常规通道。
    app.post('/api/admin/credits/generate', requireAuth, requireAdmin, (req, res) => {
        try {
            const { credits, count } = req.body || {};
            const denom = Number(credits);
            const n = Number(count);
            if (!REDEEM_DENOMINATIONS.includes(denom)) return res.status(400).json({ error: 'INVALID_DENOMINATION' });
            if (!Number.isFinite(n) || n < 1 || n > 200) return res.status(400).json({ error: 'INVALID_COUNT' });

            const secret = process.env.LDXP_REDEEM_SECRET;
            if (!secret || secret.length < 32) return res.status(503).json({ error: 'LDXP_PAYMENT_CHANNEL_UNAVAILABLE' });

            const codes = [];
            for (let i = 0; i < n; i += 1) {
                const nonce = randomBytes(12).toString('hex').toUpperCase();
                const payload = 'NN-' + denom + '-' + nonce;
                codes.push(payload + '-' + signPayload(payload, secret));
            }
            // 只返回这一次，不落库、不记日志。
            res.json({ credits: denom, count: codes.length, codes });
        } catch (err) { fail(res, err); }
    });
}

export { mountCreditRoutes, freeTrialLimit };

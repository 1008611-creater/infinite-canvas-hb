#!/usr/bin/env node
'use strict';
/*
 * canvas-webdav —— 无限画布的云端同步后端（极简 WebDAV）
 * ------------------------------------------------------------
 * 背景：画布前端早就内置了完整的云同步引擎（web/src/services/app-sync.ts +
 * webdav-sync.ts），会同步「画布 / 我的素材 / 生成记录 / 本地媒体文件」四块数据，
 * 媒体文件是二进制直传。但它一直缺一个可用的服务端，所以数据和素材实际上只活在
 * 浏览器 IndexedDB 里，换台设备或清一次站点数据就没了。
 *
 * 这个服务就是补上那一半：一个够用的 WebDAV 端点。
 *
 * 只实现画布用到的动作，外加原生客户端（访达 / 资源管理器 / 手机文件 App）需要的
 * 最小集合：
 *   OPTIONS / PROPFIND / PROPPATCH / MKCOL / GET / HEAD / PUT / DELETE / MOVE / COPY / LOCK / UNLOCK
 *
 * 刻意做到的三件事：
 *   1. **流式写盘**：视频动辄几十上百 MB，绝不能先读进内存再落盘。
 *      先写同目录临时文件再原子改名，避免中断时把 manifest.json 写成半截 JSON。
 *   2. **绝不让异常冒出去**：本模块跑在 Agnes 视频代理同一个 node 进程里，
 *      一个未捕获异常会连带把视频生成打死。所以每个请求都包在 try/catch 里，
 *      连 req/res 的 error 事件都单独兜住。
 *   3. **默认失败关闭**：没配 WEBDAV_PASSWORD 就压根不启动监听，而不是开一个匿名可写的洞。
 *
 * 环境变量：
 *   WEBDAV_ROOT      数据目录，默认 /data
 *   WEBDAV_USER      用户名，默认 canvas
 *   WEBDAV_PASSWORD  密码，未设置则不启动
 *   WEBDAV_PORT      监听端口，默认 8789（仅 compose 内网，由 nginx 反代 /dav/）
 *   WEBDAV_MAX_BYTES 单文件上限，默认 0 表示不限
 */

const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const path = require('path');

const MIME_TYPES = {
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.m4v': 'video/x-m4v',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.webp': 'image/webp',
    '.zip': 'application/zip',
};

const DAV_ALLOW = 'OPTIONS, GET, HEAD, PUT, DELETE, MKCOL, PROPFIND, PROPPATCH, MOVE, COPY, LOCK, UNLOCK';
const CORS_HEADERS = 'Authorization, Content-Type, Depth, Destination, Overwrite, If, Lock-Token, Timeout, X-Requested-With';

/** XML 文本转义，用于 PROPFIND 响应。 */
function xmlEscape(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
}

/** HTML 文本转义，用于目录浏览页。 */
function htmlEscape(value) {
    return xmlEscape(value);
}

/** 定长比较，避免用 === 比密码时泄漏长度/前缀信息。 */
function safeEqual(a, b) {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));
    if (!left.length || left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
}

function contentTypeOf(filePath) {
    return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

/** 把 URL 路径按段编码成 href（集合要以 / 结尾）。 */
function toHref(urlPath, isCollection) {
    const segments = String(urlPath).split('/').filter(Boolean).map(encodeURIComponent);
    const href = `/${segments.join('/')}`;
    return isCollection ? `${href}/` : href;
}

function httpDate(date) {
    return new Date(date).toUTCString();
}

/**
 * 创建一个 WebDAV 服务实例。返回 null 表示配置不全（没设密码），调用方应当跳过启动。
 */
function createWebdavServer(env = process.env) {
    const root = path.resolve(env.WEBDAV_ROOT || '/data');
    const username = env.WEBDAV_USER || 'canvas';
    const password = env.WEBDAV_PASSWORD || '';
    const port = Number(env.WEBDAV_PORT) || 8789;
    const maxBytes = Number(env.WEBDAV_MAX_BYTES) || 0;

    if (!password) return null;

    /** URL 路径 → 真实文件路径。任何越界（.. / 绝对路径 / 空字节）都直接拒绝。 */
    function resolveFsPath(urlPath) {
        let decoded;
        try {
            decoded = decodeURIComponent(urlPath);
        } catch {
            throw Object.assign(new Error('bad path encoding'), { status: 400 });
        }
        if (decoded.includes('\0')) throw Object.assign(new Error('bad path'), { status: 400 });
        const segments = decoded.split('/').filter((segment) => segment && segment !== '.');
        if (segments.some((segment) => segment === '..')) throw Object.assign(new Error('path traversal'), { status: 403 });
        const target = path.join(root, ...segments);
        if (target !== root && !target.startsWith(root + path.sep)) throw Object.assign(new Error('path escape'), { status: 403 });
        return target;
    }

    /** URL 路径（去掉尾部斜杠后的规范形式），用于 PROPFIND 的 href。 */
    function normalizeUrlPath(urlPath) {
        const segments = urlPath.split('/').filter(Boolean);
        return `/${segments.join('/')}`;
    }

    function send(res, status, body, headers = {}) {
        const payload = body === undefined || body === null ? '' : String(body);
        res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(payload), ...headers });
        if (payload) res.end(payload);
        else res.end();
    }

    function checkAuth(req, res) {
        const header = String(req.headers.authorization || '');
        const [scheme, encoded] = header.split(' ');
        if (scheme && scheme.toLowerCase() === 'basic' && encoded) {
            let decoded = '';
            try {
                decoded = Buffer.from(encoded, 'base64').toString('utf8');
            } catch {
                decoded = '';
            }
            const index = decoded.indexOf(':');
            const user = index >= 0 ? decoded.slice(0, index) : decoded;
            const pass = index >= 0 ? decoded.slice(index + 1) : '';
            if (safeEqual(user, username) && safeEqual(pass, password)) return true;
        }
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="infinite-canvas"', 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Unauthorized');
        return false;
    }

    async function statOrNull(fsPath) {
        try {
            return await fsp.stat(fsPath);
        } catch (error) {
            if (error && error.code === 'ENOENT') return null;
            throw error;
        }
    }

    /** 单个资源的 <D:response> 片段。 */
    function responseXml(urlPath, stats, name) {
        const isCollection = stats.isDirectory();
        const properties = [
            `<D:displayname>${xmlEscape(name || '')}</D:displayname>`,
            `<D:getlastmodified>${httpDate(stats.mtime)}</D:getlastmodified>`,
            `<D:creationdate>${new Date(stats.birthtime || stats.mtime).toISOString()}</D:creationdate>`,
            `<D:resourcetype>${isCollection ? '<D:collection/>' : ''}</D:resourcetype>`,
            `<D:supportedlock><D:lockentry><D:lockscope><D:exclusive/></D:lockscope><D:locktype><D:write/></D:locktype></D:lockentry></D:supportedlock>`,
        ];
        if (!isCollection) {
            properties.push(`<D:getcontentlength>${stats.size}</D:getcontentlength>`);
            properties.push(`<D:getcontenttype>${xmlEscape(contentTypeOf(urlPath))}</D:getcontenttype>`);
        }
        return `<D:response><D:href>${xmlEscape(toHref(urlPath, isCollection))}</D:href><D:propstat><D:prop>${properties.join('')}</D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`;
    }

    async function handlePropfind(req, res, fsPath, urlPath) {
        const stats = await statOrNull(fsPath);
        if (!stats) return send(res, 404, 'Not Found');
        const depth = String(req.headers.depth ?? '1').toLowerCase();
        const parts = [responseXml(urlPath, stats, path.basename(fsPath))];
        if (stats.isDirectory() && depth !== '0') {
            // 目录里塞大文件时读数可能上千，但画布的目录结构很浅，这里不做分页。
            const entries = await fsp.readdir(fsPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.startsWith('.')) continue; // 跳过上传中的 .tmp-* 临时文件
                const childFsPath = path.join(fsPath, entry.name);
                try {
                    const childStats = await fsp.stat(childFsPath);
                    parts.push(responseXml(`${urlPath}/${entry.name}`, childStats, entry.name));
                } catch {
                    // 并发删除等竞态：跳过这一条即可，不该让整个 PROPFIND 失败
                }
            }
        }
        const body = `<?xml version="1.0" encoding="utf-8"?>\n<D:multistatus xmlns:D="DAV:">${parts.join('')}</D:multistatus>`;
        res.writeHead(207, { 'Content-Type': 'application/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
        res.end(body);
    }

    async function handleGet(req, res, fsPath, urlPath, headOnly) {
        const stats = await statOrNull(fsPath);
        if (!stats) return send(res, 404, 'Not Found');
        if (stats.isDirectory()) return sendDirectoryListing(res, fsPath, urlPath, headOnly);

        const headers = {
            'Content-Type': contentTypeOf(fsPath),
            'Last-Modified': httpDate(stats.mtime),
            'Accept-Ranges': 'bytes',
            ETag: `"${stats.size.toString(16)}-${Math.round(stats.mtimeMs).toString(16)}"`,
        };
        const range = String(req.headers.range || '');
        const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
        if (match && (match[1] || match[2])) {
            // 视频拖动进度条必需：不带 Range 支持的原生播放器会整段重下
            let start = match[1] ? Number(match[1]) : Math.max(0, stats.size - Number(match[2]));
            let end = match[1] && match[2] ? Number(match[2]) : stats.size - 1;
            if (!Number.isFinite(start) || start < 0) start = 0;
            if (!Number.isFinite(end) || end > stats.size - 1) end = stats.size - 1;
            if (start > end) {
                res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` });
                return res.end();
            }
            res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stats.size}`, 'Content-Length': end - start + 1 });
            if (headOnly) return res.end();
            return streamFile(fsPath, res, { start, end });
        }
        res.writeHead(200, { ...headers, 'Content-Length': stats.size });
        if (headOnly) return res.end();
        return streamFile(fsPath, res, null);
    }

    function streamFile(fsPath, res, range) {
        const stream = range ? fs.createReadStream(fsPath, { start: range.start, end: range.end }) : fs.createReadStream(fsPath);
        stream.on('error', (error) => {
            console.error('[webdav] 读文件失败', fsPath, error && error.message);
            if (!res.headersSent) res.writeHead(500);
            res.destroy();
        });
        res.on('close', () => stream.destroy());
        stream.pipe(res);
    }

    /** GET 一个目录时给个人类可读的列表页，方便手机浏览器直接翻文件。 */
    async function sendDirectoryListing(res, fsPath, urlPath, headOnly) {
        let entries = [];
        try {
            entries = await fsp.readdir(fsPath, { withFileTypes: true });
        } catch {
            entries = [];
        }
        const rows = [];
        const base = toHref(urlPath, true);
        if (normalizeUrlPath(urlPath) !== '/') rows.push('<li><a href="../">../</a></li>');
        for (const entry of entries.filter((item) => !item.name.startsWith('.')).sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))) {
            const suffix = entry.isDirectory() ? '/' : '';
            rows.push(`<li><a href="${encodeURIComponent(entry.name)}${suffix}">${htmlEscape(entry.name)}${suffix}</a></li>`);
        }
        const body = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${htmlEscape(base)}</title><style>body{font:14px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:24px;color:#1c1917}code{color:#57534e}ul{list-style:none;padding:0}li{padding:2px 0}a{color:#1d4ed8;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><h2>${htmlEscape(base)}</h2><p><code>infinite-canvas WebDAV</code></p><ul>${rows.join('') || '<li>（空目录）</li>'}</ul></body></html>`;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
        if (headOnly) return res.end();
        res.end(body);
    }

    async function handlePut(req, res, fsPath) {
        const existing = await statOrNull(fsPath);
        if (existing && existing.isDirectory()) return send(res, 405, 'Target is a collection');
        await fsp.mkdir(path.dirname(fsPath), { recursive: true });

        const tempPath = path.join(path.dirname(fsPath), `.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`);
        const cleanup = () => fsp.rm(tempPath, { force: true }).catch(() => {});
        const out = fs.createWriteStream(tempPath);
        let bytes = 0;
        let aborted = false;

        try {
            await new Promise((resolve, reject) => {
                req.on('data', (chunk) => {
                    bytes += chunk.length;
                    if (maxBytes && bytes > maxBytes) {
                        aborted = true;
                        reject(Object.assign(new Error('payload too large'), { status: 413 }));
                        req.destroy();
                    }
                });
                req.on('error', reject);
                out.on('error', reject);
                out.on('finish', resolve);
                req.pipe(out);
            });
            if (aborted) return;
            await fsp.rename(tempPath, fsPath); // 原子替换：读端永远看不到半截文件
            return send(res, existing ? 204 : 201, null, { 'Content-Length': '0' });
        } catch (error) {
            out.destroy();
            await cleanup();
            throw error;
        }
    }

    async function handleMkcol(req, res, fsPath) {
        const existing = await statOrNull(fsPath);
        if (existing) return send(res, 405, 'Already exists');
        await fsp.mkdir(fsPath, { recursive: true });
        return send(res, 201, null, { 'Content-Length': '0' });
    }

    async function handleDelete(req, res, fsPath) {
        const stats = await statOrNull(fsPath);
        if (!stats) return send(res, 404, 'Not Found');
        if (fsPath === root) return send(res, 403, 'Refusing to delete the root collection');
        await fsp.rm(fsPath, { recursive: true, force: true });
        return send(res, 204, null, { 'Content-Length': '0' });
    }

    /** 取 Destination 头里的路径（可能是绝对 URL，也可能是绝对路径）。 */
    function destinationPath(req) {
        const raw = String(req.headers.destination || '');
        if (!raw) throw Object.assign(new Error('missing Destination header'), { status: 400 });
        let pathname = raw;
        try {
            pathname = new URL(raw).pathname;
        } catch {
            pathname = raw.split('?')[0];
        }
        return pathname;
    }

    async function handleMoveOrCopy(req, res, fsPath, isMove) {
        const from = await statOrNull(fsPath);
        if (!from) return send(res, 404, 'Not Found');
        const toFsPath = resolveFsPath(destinationPath(req));
        const to = await statOrNull(toFsPath);
        const overwrite = String(req.headers.overwrite ?? 'T').toUpperCase() !== 'F';
        if (to && !overwrite) return send(res, 412, 'Destination exists');
        if (to) await fsp.rm(toFsPath, { recursive: true, force: true });
        await fsp.mkdir(path.dirname(toFsPath), { recursive: true });
        if (isMove) await fsp.rename(fsPath, toFsPath);
        else await fsp.cp(fsPath, toFsPath, { recursive: true });
        return send(res, to ? 204 : 201, null, { 'Content-Length': '0' });
    }

    function handleLock(res) {
        // 不做真正的锁：原生客户端（访达 / 资源管理器 / Office）只要求拿到一个 token 才肯写，
        // 单人使用的同步目录不需要并发写保护。
        const token = `opaquelocktoken:${crypto.randomUUID()}`;
        const body = `<?xml version="1.0" encoding="utf-8"?>\n<D:prop xmlns:D="DAV:"><D:lockdiscovery><D:activelock><D:locktype><D:write/></D:locktype><D:lockscope><D:exclusive/></D:lockscope><D:depth>infinity</D:depth><D:timeout>Second-3600</D:timeout><D:locktoken><D:href>${token}</D:href></D:locktoken></D:activelock></D:lockdiscovery></D:prop>`;
        res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Lock-Token': `<${token}>`, 'Content-Length': Buffer.byteLength(body) });
        res.end(body);
    }

    async function handle(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', CORS_HEADERS);
        res.setHeader('Access-Control-Allow-Methods', DAV_ALLOW);
        res.setHeader('Access-Control-Expose-Headers', 'DAV, Content-Length, Content-Range, Accept-Ranges, ETag, Last-Modified, Lock-Token');
        res.setHeader('DAV', '1, 2');
        res.setHeader('MS-Author-Via', 'DAV');

        const method = String(req.method || 'GET').toUpperCase();
        if (method === 'OPTIONS') {
            res.writeHead(204, { Allow: DAV_ALLOW, 'Content-Length': '0' });
            return res.end();
        }
        if (!checkAuth(req, res)) return;

        const urlPath = normalizeUrlPath((req.url || '/').split('?')[0]);
        const fsPath = resolveFsPath(urlPath);

        switch (method) {
            case 'PROPFIND':
                return handlePropfind(req, res, fsPath, urlPath);
            case 'PROPPATCH':
                // 声明所有属性都改不了，客户端就会认为「同步即可」，不会卡在写入属性上
                res.writeHead(207, { 'Content-Type': 'application/xml; charset=utf-8' });
                return res.end('<?xml version="1.0" encoding="utf-8"?>\n<D:multistatus xmlns:D="DAV:"/>');
            case 'GET':
                return handleGet(req, res, fsPath, urlPath, false);
            case 'HEAD':
                return handleGet(req, res, fsPath, urlPath, true);
            case 'PUT':
                return handlePut(req, res, fsPath);
            case 'MKCOL':
                return handleMkcol(req, res, fsPath);
            case 'DELETE':
                return handleDelete(req, res, fsPath);
            case 'MOVE':
                return handleMoveOrCopy(req, res, fsPath, true);
            case 'COPY':
                return handleMoveOrCopy(req, res, fsPath, false);
            case 'LOCK':
                return handleLock(res);
            case 'UNLOCK':
                return send(res, 204, null, { 'Content-Length': '0' });
            default:
                return send(res, 405, 'Method Not Allowed', { Allow: DAV_ALLOW });
        }
    }

    const server = http.createServer((req, res) => {
        // 请求级兜底：绝不让异常冒到进程层（否则会连带打死同进程的视频代理）
        Promise.resolve()
            .then(() => handle(req, res))
            .catch((error) => {
                const status = (error && error.status) || 500;
                if (status >= 500) console.error('[webdav] 请求失败', req.method, req.url, error && (error.stack || error.message));
                if (!res.headersSent) send(res, status, status === 500 ? 'Internal Server Error' : String((error && error.message) || 'error'));
                else res.destroy();
            });
    });
    server.on('clientError', (error, socket) => {
        try {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        } catch {
            /* 忽略 */
        }
        if (error && error.code !== 'ECONNRESET') console.error('[webdav] 客户端连接异常', error.message);
    });
    server.on('error', (error) => console.error('[webdav] 服务错误', error && error.message));
    // 大文件上传可能要几十分钟，不能有请求超时把连接掐掉
    server.requestTimeout = 0;
    server.headersTimeout = 120000;
    server.timeout = 0;

    return { server, root, port, username };
}

/**
 * 启动 WebDAV 监听。返回 false 表示未启动（配置不全），调用方可以据此打日志。
 */
async function startWebdav(env = process.env, logger = console) {
    const instance = createWebdavServer(env);
    if (!instance) {
        logger.warn('[webdav] 未配置 WEBDAV_PASSWORD，跳过启动（避免开出一个匿名可写的同步目录）');
        return false;
    }
    await fsp.mkdir(instance.root, { recursive: true });
    await new Promise((resolve, reject) => {
        instance.server.once('error', reject);
        instance.server.listen(instance.port, () => {
            instance.server.removeListener('error', reject);
            resolve();
        });
    });
    logger.log(`[webdav] 云端同步已启动: http://0.0.0.0:${instance.port}  数据目录 ${instance.root}  用户 ${instance.username}`);
    return true;
}

module.exports = { createWebdavServer, startWebdav, MIME_TYPES };

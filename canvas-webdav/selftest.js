#!/usr/bin/env node
'use strict';
/*
 * canvas-webdav 自测脚本 —— 不依赖任何第三方库，直接复刻画布前端的调用序列。
 *
 * 为什么要有它：画布的同步引擎（web/src/services/webdav-sync.ts + app-sync.ts）
 * 会按固定顺序发 MKCOL / PROPFIND / PUT / GET，并且对状态码有硬要求
 * （MKCOL 已存在必须回 405、PROPFIND 必须回 207、缺文件必须回 404 才会当成「远端为空」）。
 * 这些约定写错一处，前端只会笼统地报「同步失败」，很难定位。
 *
 * 用法：node canvas-webdav/selftest.js
 */

const assert = require('assert');
const crypto = require('crypto');
const fsp = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');

const { createWebdavServer, sweepStaleParts, PART_DIR_NAME } = require('./server');

const USER = 'canvas';
const PASSWORD = 'selftest-password';

let passed = 0;
let failed = 0;

function check(name, fn) {
    try {
        fn();
        passed += 1;
        console.log(`  ✓ ${name}`);
    } catch (error) {
        failed += 1;
        console.log(`  ✗ ${name}\n      ${error && error.message}`);
    }
}

/** 极简 HTTP 请求，能任意设置方法/请求头（fetch 对部分头有限制）。 */
function request(port, method, urlPath, { headers = {}, body, auth } = {}) {
    return new Promise((resolve, reject) => {
        const finalHeaders = { ...headers };
        if (auth !== null) {
            const value = auth || `${USER}:${PASSWORD}`;
            finalHeaders.Authorization = `Basic ${Buffer.from(value).toString('base64')}`;
        }
        if (body !== undefined) finalHeaders['Content-Length'] = Buffer.byteLength(body);
        const req = http.request({ host: '127.0.0.1', port, method, path: urlPath, headers: finalHeaders }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
        });
        req.on('error', reject);
        if (body !== undefined) req.write(body);
        req.end();
    });
}

async function main() {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'canvas-webdav-'));
    const env = { WEBDAV_ROOT: root, WEBDAV_USER: USER, WEBDAV_PASSWORD: PASSWORD, WEBDAV_PORT: '0' };
    const instance = createWebdavServer(env);
    await new Promise((resolve) => instance.server.listen(0, '127.0.0.1', resolve));
    const port = instance.server.address().port;

    const base = 'infinite-canvas';
    const rel = (suffix) => `/${base}/${suffix}`;

    try {
        console.log('\n[1] 鉴权');
        const noAuth = await request(port, 'PROPFIND', '/', { headers: { Depth: '0' }, auth: null });
        check('未带凭据 → 401', () => assert.strictEqual(noAuth.status, 401));
        check('401 带 WWW-Authenticate', () => assert.match(String(noAuth.headers['www-authenticate']), /^Basic realm=/));
        const badAuth = await request(port, 'PROPFIND', '/', { headers: { Depth: '0' }, auth: 'canvas:wrong' });
        check('密码错误 → 401', () => assert.strictEqual(badAuth.status, 401));
        const options = await request(port, 'OPTIONS', '/', { auth: null });
        check('OPTIONS 免鉴权 → 204 且带 DAV 头', () => {
            assert.strictEqual(options.status, 204);
            assert.strictEqual(options.headers.dav, '1, 2');
        });

        console.log('\n[2] 建目录（前端 ensureWebdavDirectory 的行为）');
        const mkdir1 = await request(port, 'MKCOL', `/${base}`);
        check('首次 MKCOL → 201', () => assert.strictEqual(mkdir1.status, 201));
        const mkdir2 = await request(port, 'MKCOL', `/${base}`);
        check('重复 MKCOL → 405（前端靠这个判断已存在）', () => assert.strictEqual(mkdir2.status, 405));
        const propfindExists = await request(port, 'PROPFIND', `/${base}`, { headers: { Depth: '0' } });
        check('已存在目录 PROPFIND → 207', () => assert.strictEqual(propfindExists.status, 207));
        const rootPropfind = await request(port, 'PROPFIND', '/', { headers: { Depth: '0' } });
        check('根目录 PROPFIND → 207（连接测试走这一步）', () => assert.strictEqual(rootPropfind.status, 207));
        check('PROPFIND 返回 multistatus XML', () => assert.match(rootPropfind.body.toString('utf8'), /<D:multistatus xmlns:D="DAV:">/));

        console.log('\n[3] 清单读写');
        const manifest = JSON.stringify({ app: 'infinite-canvas', version: 1, domain: 'canvas', data: { projects: [] }, files: [] }, null, 2);
        const mkSub = await request(port, 'MKCOL', rel('canvas'));
        check('MKCOL 子目录 → 201', () => assert.strictEqual(mkSub.status, 201));
        const putManifest = await request(port, 'PUT', rel('canvas/manifest.json'), { headers: { 'Content-Type': 'application/json' }, body: manifest });
        check('PUT manifest → 201', () => assert.strictEqual(putManifest.status, 201));
        const overwrite = await request(port, 'PUT', rel('canvas/manifest.json'), { headers: { 'Content-Type': 'application/json' }, body: manifest });
        check('覆盖 PUT → 204', () => assert.strictEqual(overwrite.status, 204));
        const gotManifest = await request(port, 'GET', rel('canvas/manifest.json'));
        check('GET manifest → 200 且内容一致', () => {
            assert.strictEqual(gotManifest.status, 200);
            assert.strictEqual(gotManifest.body.toString('utf8'), manifest);
        });
        check('GET manifest Content-Type 正确', () => assert.match(String(gotManifest.headers['content-type']), /application\/json/));
        const missing = await request(port, 'GET', rel('canvas/nope.json'));
        check('缺文件 → 404（前端据此判断远端为空）', () => assert.strictEqual(missing.status, 404));

        console.log('\n[4] 大文件流式上传与 Range');
        const mkFiles = await request(port, 'MKCOL', rel('canvas/files'));
        check('MKCOL files 目录 → 201', () => assert.strictEqual(mkFiles.status, 201));
        const big = crypto.randomBytes(6 * 1024 * 1024);
        const putBig = await request(port, 'PUT', rel('canvas/files/movie.mp4'), { headers: { 'Content-Type': 'video/mp4' }, body: big });
        check('上传 6MB 视频 → 201', () => assert.strictEqual(putBig.status, 201));
        const statBig = await fsp.stat(path.join(root, base, 'canvas', 'files', 'movie.mp4'));
        check('落盘字节数一致', () => assert.strictEqual(statBig.size, big.length));
        const headBig = await request(port, 'HEAD', rel('canvas/files/movie.mp4'));
        check('HEAD → 200 且带 Content-Length / Accept-Ranges', () => {
            assert.strictEqual(headBig.status, 200);
            assert.strictEqual(Number(headBig.headers['content-length']), big.length);
            assert.strictEqual(headBig.headers['accept-ranges'], 'bytes');
        });
        const ranged = await request(port, 'GET', rel('canvas/files/movie.mp4'), { headers: { Range: 'bytes=100-199' } });
        check('Range 请求 → 206 且内容正确', () => {
            assert.strictEqual(ranged.status, 206);
            assert.strictEqual(Number(ranged.headers['content-length']), 100);
            assert.strictEqual(ranged.headers['content-range'], `bytes 100-199/${big.length}`);
            assert.ok(ranged.body.equals(big.subarray(100, 200)));
        });
        const badRange = await request(port, 'GET', rel('canvas/files/movie.mp4'), { headers: { Range: 'bytes=999999999-' } });
        check('越界 Range → 416', () => assert.strictEqual(badRange.status, 416));

        console.log('\n[5] 目录列举与编码');
        const propfindDepth1 = await request(port, 'PROPFIND', rel('canvas/files'), { headers: { Depth: '1' } });
        check('Depth:1 → 207 且列出子项', () => {
            assert.strictEqual(propfindDepth1.status, 207);
            assert.match(propfindDepth1.body.toString('utf8'), /movie\.mp4/);
        });
        const putChinese = await request(port, 'PUT', rel(`canvas/files/${encodeURIComponent('中文 文件名.mp4')}`), { headers: { 'Content-Type': 'video/mp4' }, body: 'x' });
        check('中文文件名 PUT → 201', () => assert.strictEqual(putChinese.status, 201));
        const getChinese = await request(port, 'GET', rel(`canvas/files/${encodeURIComponent('中文 文件名.mp4')}`));
        check('中文文件名 GET → 200', () => assert.strictEqual(getChinese.status, 200));
        const listDir = await request(port, 'GET', rel('canvas/files'));
        check('浏览器 GET 目录 → 200 HTML', () => {
            assert.strictEqual(listDir.status, 200);
            assert.match(String(listDir.headers['content-type']), /text\/html/);
        });

        console.log('\n[6] 安全边界');
        const traversal = await request(port, 'GET', `/${base}/../../../../etc/passwd`);
        check('路径穿越 → 403', () => assert.strictEqual(traversal.status, 403));
        const traversalPut = await request(port, 'PUT', `/../outside.txt`, { body: 'nope' });
        check('越界 PUT → 403', () => assert.strictEqual(traversalPut.status, 403));
        const outside = await fsp.stat(path.join(root, '..', 'outside.txt')).catch(() => null);
        check('越界写没有真的落盘', () => assert.strictEqual(outside, null));

        console.log('\n[7] 移动与删除');
        const move = await request(port, 'MOVE', rel('canvas/files/movie.mp4'), { headers: { Destination: rel('canvas/files/movie2.mp4') } });
        check('MOVE → 201', () => assert.strictEqual(move.status, 201));
        const afterMove = await request(port, 'GET', rel('canvas/files/movie2.mp4'));
        check('MOVE 后新路径可读', () => assert.strictEqual(afterMove.status, 200));
        const remove = await request(port, 'DELETE', rel('canvas/files/movie2.mp4'));
        check('DELETE → 204', () => assert.strictEqual(remove.status, 204));
        const afterRemove = await request(port, 'GET', rel('canvas/files/movie2.mp4'));
        check('DELETE 后 → 404', () => assert.strictEqual(afterRemove.status, 404));

        console.log('\n[8] 原生客户端兼容');
        const lock = await request(port, 'LOCK', rel('canvas/manifest.json'), { headers: { Timeout: 'Second-3600' } });
        check('LOCK → 200 且带 Lock-Token（访达/资源管理器写前要）', () => {
            assert.strictEqual(lock.status, 200);
            assert.match(String(lock.headers['lock-token']), /^<opaquelocktoken:/);
        });
        const unlock = await request(port, 'UNLOCK', rel('canvas/manifest.json'), { headers: { 'Lock-Token': String(lock.headers['lock-token']) } });
        check('UNLOCK → 204', () => assert.strictEqual(unlock.status, 204));
        const propfind = await request(port, 'PROPFIND', rel('canvas/manifest.json'), { headers: { Depth: '0' } });
        check('PROPFIND 单文件包含 getcontentlength', () => assert.match(propfind.body.toString('utf8'), /<D:getcontentlength>/));

        console.log('\n[9] 落盘整洁');
        const leftover = (await fsp.readdir(path.join(root, base, 'canvas', 'files'))).filter((name) => name.startsWith('.tmp-'));
        check('没有残留临时文件', () => assert.deepStrictEqual(leftover, []));

        console.log('\n[10] 分片上传（大文件走 Content-Range）');
        const chunkBytes = 4 * 1024 * 1024;
        const chunkTotal = chunkBytes * 2 + 12345; // 末片故意不是整片，覆盖这个边界
        const chunkPayload = crypto.randomBytes(chunkTotal);
        const chunkPath = rel(`canvas/files/${encodeURIComponent('分段视频.mp4')}`);
        const chunkFsPath = path.join(root, base, 'canvas', 'files', '分段视频.mp4');
        const partFsPath = path.join(root, base, 'canvas', 'files', PART_DIR_NAME, `分段视频.mp4.${chunkTotal}.part`);
        const putPart = (start, end, body) =>
            request(port, 'PUT', chunkPath, {
                headers: { 'Content-Type': 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${chunkTotal}` },
                body,
            });

        const firstPart = await putPart(0, chunkBytes - 1, chunkPayload.subarray(0, chunkBytes));
        check('第 1 片 → 204 且回报已持久化位置', () => {
            assert.strictEqual(firstPart.status, 204);
            assert.strictEqual(Number(firstPart.headers['x-upload-offset']), chunkBytes);
            assert.strictEqual(Number(firstPart.headers['x-upload-total']), chunkTotal);
            assert.strictEqual(firstPart.headers['x-upload-complete'], undefined);
        });
        const partStatsAfterFirst = await fsp.stat(partFsPath).catch(() => null);
        check('分片写进 .parts 暂存区，长度正确', () => assert.ok(partStatsAfterFirst && partStatsAfterFirst.size === chunkBytes));
        const whileUploading = await request(port, 'GET', chunkPath);
        check('未传完时正式路径仍是 404（不露半截视频）', () => assert.strictEqual(whileUploading.status, 404));

        const outOfOrder = await putPart(chunkBytes * 2, chunkTotal - 1, chunkPayload.subarray(chunkBytes * 2));
        check('乱序片 → 409 且回报真实进度（前端据此续传）', () => {
            assert.strictEqual(outOfOrder.status, 409);
            assert.strictEqual(Number(outOfOrder.headers['x-upload-offset']), chunkBytes);
        });

        const shortBody = await putPart(chunkBytes, chunkBytes * 2 - 1, chunkPayload.subarray(chunkBytes, chunkBytes * 2 - 1024));
        check('声明长度与实际不符 → 400', () => assert.strictEqual(shortBody.status, 400));
        const partStatsAfterShort = await fsp.stat(partFsPath).catch(() => null);
        check('失败片回滚到片首，重试是干净的', () => assert.ok(partStatsAfterShort && partStatsAfterShort.size === chunkBytes));

        const secondPart = await putPart(chunkBytes, chunkBytes * 2 - 1, chunkPayload.subarray(chunkBytes, chunkBytes * 2));
        check('第 2 片 → 204', () => {
            assert.strictEqual(secondPart.status, 204);
            assert.strictEqual(Number(secondPart.headers['x-upload-offset']), chunkBytes * 2);
        });
        const lastPart = await putPart(chunkBytes * 2, chunkTotal - 1, chunkPayload.subarray(chunkBytes * 2));
        check('末片 → 201 且带 X-Upload-Complete', () => {
            assert.strictEqual(lastPart.status, 201);
            assert.strictEqual(lastPart.headers['x-upload-complete'], '1');
            assert.strictEqual(Number(lastPart.headers['x-upload-offset']), chunkTotal);
        });
        const chunkFsBody = await fsp.readFile(chunkFsPath).catch(() => null);
        check('拼装结果与源逐字节一致', () => {
            assert.ok(chunkFsBody);
            assert.strictEqual(chunkFsBody.length, chunkTotal);
            assert.strictEqual(crypto.createHash('sha256').update(chunkFsBody).digest('hex'), crypto.createHash('sha256').update(chunkPayload).digest('hex'));
        });
        const dirAfterAssemble = await fsp.readdir(path.join(root, base, 'canvas', 'files'));
        check('传完不留分片痕迹', () => assert.deepStrictEqual(dirAfterAssemble.filter((name) => name.startsWith('.')), []));
        const replay = await putPart(chunkBytes * 2, chunkTotal - 1, chunkPayload.subarray(chunkBytes * 2));
        check('文件已落地后重发末片 → 409 且指向 0（提示从头开始）', () => {
            assert.strictEqual(replay.status, 409);
            assert.strictEqual(Number(replay.headers['x-upload-offset']), 0);
        });

        const tinyBody = Buffer.from('hello-chunk');
        const putTiny = () => request(port, 'PUT', rel('canvas/files/tiny.bin'), { headers: { 'Content-Range': `bytes 0-${tinyBody.length - 1}/${tinyBody.length}` }, body: tinyBody });
        const tinyFirst = await putTiny();
        const tinyAgain = await putTiny();
        check('整文件只有一片时 → 首次 201、覆盖 204', () => {
            assert.strictEqual(tinyFirst.status, 201);
            assert.strictEqual(tinyAgain.status, 204);
        });
        const tinyRead = await request(port, 'GET', rel('canvas/files/tiny.bin'));
        check('单片上传内容正确', () => assert.strictEqual(tinyRead.body.toString('utf8'), 'hello-chunk'));

        console.log('\n[11] 分片上传的安全与清理');
        const badRanges = ['bytes 0-100', 'bytes 5-0/100', 'bytes 0-200/100', 'bytes abc/100', 'items 0-1/2'];
        const badStatuses = [];
        for (const value of badRanges) badStatuses.push((await request(port, 'PUT', rel('canvas/files/bad.bin'), { headers: { 'Content-Range': value }, body: 'x' })).status);
        check('非法 Content-Range 一律 400', () => assert.deepStrictEqual(badStatuses, [400, 400, 400, 400, 400]));
        const partDirPut = await request(port, 'PUT', rel(`canvas/files/${PART_DIR_NAME}/evil.part`), { body: 'x' });
        check('直接写 .parts → 403', () => assert.strictEqual(partDirPut.status, 403));
        const partDirGet = await request(port, 'GET', rel(`canvas/files/${PART_DIR_NAME}/evil.part`));
        check('直接读 .parts → 403', () => assert.strictEqual(partDirGet.status, 403));
        const tmpPut = await request(port, 'PUT', rel('canvas/files/.tmp-inject'), { body: 'x' });
        check('写内部临时路径 → 403', () => assert.strictEqual(tmpPut.status, 403));
        const listingAfter = await request(port, 'PROPFIND', rel('canvas/files'), { headers: { Depth: '1' } });
        check('PROPFIND 不暴露 .parts', () => assert.doesNotMatch(listingAfter.body.toString('utf8'), /\.parts/));

        const staleDir = path.join(root, base, 'canvas', 'files', PART_DIR_NAME);
        await fsp.mkdir(staleDir, { recursive: true });
        const staleFile = path.join(staleDir, 'old.mp4.100.part');
        const freshFile = path.join(staleDir, 'new.mp4.100.part');
        await fsp.writeFile(staleFile, 'stale');
        await fsp.writeFile(freshFile, 'fresh');
        const oldTime = new Date(Date.now() - 30 * 3600 * 1000);
        await fsp.utimes(staleFile, oldTime, oldTime);
        const swept = await sweepStaleParts(root, 24 * 3600 * 1000);
        const staleExists = await fsp.stat(staleFile).catch(() => null);
        const freshExists = await fsp.stat(freshFile).catch(() => null);
        check('过期分片被清理、新分片保留', () => {
            assert.strictEqual(swept, 1);
            assert.strictEqual(staleExists, null);
            assert.ok(freshExists);
        });

        console.log('\n[12] 单文件体积上限');
        const limited = createWebdavServer({ WEBDAV_ROOT: root, WEBDAV_USER: USER, WEBDAV_PASSWORD: PASSWORD, WEBDAV_PORT: '0', WEBDAV_MAX_BYTES: '2048' });
        await new Promise((resolve) => limited.server.listen(0, '127.0.0.1', resolve));
        const limitedPort = limited.server.address().port;
        const overChunk = await request(limitedPort, 'PUT', rel('canvas/files/huge.mp4'), { headers: { 'Content-Range': 'bytes 0-1023/4096' }, body: Buffer.alloc(1024) });
        const overWhole = await request(limitedPort, 'PUT', rel('canvas/files/huge2.mp4'), { body: Buffer.alloc(4096) });
        limited.server.close();
        check('分片总长超限 → 413', () => assert.strictEqual(overChunk.status, 413));
        check('整包超限 → 413（不是连接重置）', () => assert.strictEqual(overWhole.status, 413));
    } finally {
        instance.server.close();
        await fsp.rm(root, { recursive: true, force: true });
    }

    console.log(`\n结果：通过 ${passed} 项，失败 ${failed} 项`);
    process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
    console.error('自测脚本自身异常：', error);
    process.exitCode = 1;
});

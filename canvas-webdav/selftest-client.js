#!/usr/bin/env node
'use strict';
/*
 * 客户端分片逻辑自测 —— 纯逻辑 + 对着真实服务端跑一次真上传。
 *
 * 为什么要有它：真实场景里最贵的一次失败是「传了 20 分钟，最后一秒断了，然后又从头来」。
 * 分片上传的价值全在边界条件上——第几片断了、远端进度对不上、服务端只收了一半——
 * 这些在浏览器里手动试一遍要半小时，还不一定复现。这里用假服务端把每种失败都造出来，
 * 最后再用真 fetch 打一次真实服务端，确认协议两端对得上。
 *
 * 只依赖 node 内置模块（fetch / Blob 用 node 自带的，18+ 即可）。
 * 用法：node canvas-webdav/selftest-client.js
 */

const assert = require('assert');
const crypto = require('crypto');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const { createWebdavServer } = require('./server');

const PLAN_FILE = path.join(__dirname, '..', 'web', 'src', 'services', 'webdav-transfer-plan.js');
const USER = 'canvas';
const PASSWORD = 'selftest-password';
const CHUNK = 4 * 1024 * 1024;

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

async function checkAsync(name, fn) {
    try {
        await fn();
        passed += 1;
        console.log(`  ✓ ${name}`);
    } catch (error) {
        failed += 1;
        console.log(`  ✗ ${name}\n      ${error && error.message}`);
    }
}

/** 假服务端：按偏移量收片，只回状态码和位置，不碰网络。 */
function createFakeServer(preseeded = 0) {
    return {
        buffer: Buffer.alloc(preseeded),
        ranges: [],
        async putChunk(start, end, total) {
            this.ranges.push(start);
            if (this.buffer.length !== start) return { status: 409, ok: false, complete: false, nextOffset: this.buffer.length };
            if (end - start + 1 > total) return { status: 400, ok: false, complete: false, nextOffset: this.buffer.length };
            this.buffer = Buffer.concat([this.buffer, Buffer.alloc(end - start + 1)]);
            const complete = this.buffer.length === total;
            return { status: complete ? 201 : 204, ok: true, complete, nextOffset: this.buffer.length };
        },
    };
}

async function main() {
    const plan = await import(pathToFileURL(PLAN_FILE).href);
    const total = CHUNK * 2 + 12345;

    console.log('\n[1] 超时估算（这才是撞墙的真正原因）');
    check('1MB 小文件保持 120 秒下限', () => assert.strictEqual(plan.computeTransferTimeoutMs(1024 * 1024), 120000));
    check('0 字节也走下限', () => assert.strictEqual(plan.computeTransferTimeoutMs(0), 120000));
    check('30MB → 300 秒（按 128KB/s 保守估算）', () => assert.strictEqual(plan.computeTransferTimeoutMs(30 * 1024 * 1024), 300000));
    check('100MB → 860 秒', () => assert.strictEqual(plan.computeTransferTimeoutMs(100 * 1024 * 1024), 860000));
    check('超大文件封顶 30 分钟', () => assert.strictEqual(plan.computeTransferTimeoutMs(50 * 1024 * 1024 * 1024), 1800000));
    check('非法输入按 0 处理', () => assert.strictEqual(plan.computeTransferTimeoutMs(Number.NaN), 120000));

    console.log('\n[2] 重试判定与协议常量');
    check('退避 0.5 / 1 / 2 秒，封顶 8 秒', () => assert.deepStrictEqual([1, 2, 3, 4, 5, 6, 7].map((n) => plan.retryDelayMs(n)), [500, 1000, 2000, 4000, 8000, 8000, 8000]));
    check('408/425/429/5xx 值得重试', () => assert.deepStrictEqual([408, 425, 429, 500, 502, 503].map((s) => plan.isRetryableStatus(s)), Array(6).fill(true)));
    check('400/401/403/404/409/413 不值得重试', () => assert.deepStrictEqual([400, 401, 403, 404, 409, 413].map((s) => plan.isRetryableStatus(s)), Array(6).fill(false)));
    check('未标记的错误默认可重试', () => assert.strictEqual(plan.defaultIsRetryableError(new Error('boom')), true));
    check('标记 retryable:false 的错误不重试', () => assert.strictEqual(plan.defaultIsRetryableError(Object.assign(new Error('auth'), { retryable: false })), false));
    check('Content-Range 拼装', () => assert.strictEqual(plan.formatContentRange(4194304, 8388607, 26214400), 'bytes 4194304-8388607/26214400'));
    check('位置响应头解析：非法值一律 null', () => assert.deepStrictEqual([null, '', 'abc', '-1', 'NaN'].map((v) => plan.readOffsetHeader(v)), [null, null, null, null, null]));
    check('位置响应头解析：正常值', () => assert.strictEqual(plan.readOffsetHeader('8388608'), 8388608));
    check('分片阈值小于等于片大小（否则等于没切）', () => assert.ok(plan.WEBDAV_CHUNK_THRESHOLD_BYTES <= plan.WEBDAV_CHUNK_BYTES));
    check('单次请求时长离 100 秒的墙有余量', () => assert.ok(plan.computeTransferTimeoutMs(plan.WEBDAV_CHUNK_BYTES) >= 120000 && plan.WEBDAV_CHUNK_BYTES / plan.WEBDAV_ASSUMED_MIN_BYTES_PER_SECOND <= 40));

    console.log('\n[3] 分片主循环（假服务端造各种失败）');
    const normal = createFakeServer();
    const normalStats = await plan.uploadBlobInChunks({ totalBytes: total, putChunk: normal.putChunk.bind(normal) });
    check('10MB（非整片长度）→ 3 片', () => assert.strictEqual(normalStats.chunks, 3));
    check('三片首尾相接，无缝隙无重叠', () => assert.deepStrictEqual(normal.ranges, [0, CHUNK, CHUNK * 2]));
    check('拼满到最后一个字节', () => assert.strictEqual(normal.buffer.length, total));

    const tiny = createFakeServer();
    const tinyStats = await plan.uploadBlobInChunks({ totalBytes: 1024, putChunk: tiny.putChunk.bind(tiny) });
    check('小文件只发一次请求（行为与老版本一致）', () => {
        assert.strictEqual(tinyStats.chunks, 1);
        assert.deepStrictEqual(tiny.ranges, [0]);
    });

    const flakyFake = createFakeServer();
    const retryEvents = [];
    let flakeOnce = true;
    const flakyStats = await plan.uploadBlobInChunks({
        totalBytes: total,
        sleep: async () => {},
        onRetry: (attempt, start) => retryEvents.push([attempt, start]),
        putChunk: async (start, end, totalBytes) => {
            if (start === CHUNK && flakeOnce) {
                flakeOnce = false;
                throw Object.assign(new Error('网络抖了一下'), { retryable: true });
            }
            return flakyFake.putChunk(start, end, totalBytes);
        },
    });
    check('第 2 片抖动一次后自动重试成功', () => {
        assert.strictEqual(flakyStats.attempts, 4);
        assert.strictEqual(flakyStats.chunks, 3);
        assert.strictEqual(flakyFake.buffer.length, total);
    });
    check('重试回调报出次数与位置（前端据此显示「重试中」）', () => assert.deepStrictEqual(retryEvents, [[1, CHUNK]]));

    let authAttempts = 0;
    await checkAsync('认证类错误不重试，立刻抛出', async () => {
        await assert.rejects(
            () =>
                plan.uploadBlobInChunks({
                    totalBytes: total,
                    sleep: async () => {},
                    putChunk: async () => {
                        authAttempts += 1;
                        throw Object.assign(new Error('认证失败'), { retryable: false });
                    },
                }),
            /认证失败/,
        );
        assert.strictEqual(authAttempts, 1);
    });

    let flakyAttempts = 0;
    await checkAsync('一直失败时正好试 3 次就放弃', async () => {
        await assert.rejects(
            () =>
                plan.uploadBlobInChunks({
                    totalBytes: total,
                    sleep: async () => {},
                    putChunk: async () => {
                        flakyAttempts += 1;
                        throw new Error('请求超时');
                    },
                }),
            /请求超时/,
        );
        assert.strictEqual(flakyAttempts, 3);
    });

    // 断点续传：远端已经有第一片了，客户端还傻乎乎地从 0 开始
    const resumed = createFakeServer(CHUNK);
    const resumedStats = await plan.uploadBlobInChunks({ totalBytes: total, putChunk: resumed.putChunk.bind(resumed), sleep: async () => {} });
    check('远端已有进度时按远端位置续传，不重传开头', () => {
        assert.deepStrictEqual(resumed.ranges, [0, CHUNK, CHUNK * 2]);
        assert.strictEqual(resumedStats.restarts, 1);
        assert.strictEqual(resumed.buffer.length, total);
    });

    await checkAsync('远端给不出可用位置时报错，不死循环', async () => {
        await assert.rejects(() => plan.uploadBlobInChunks({ totalBytes: total, sleep: async () => {}, putChunk: async () => ({ status: 409, ok: false, complete: false, nextOffset: null }) }), /位置冲突/);
    });

    let conflictCalls = 0;
    await checkAsync('反复对不上位置时最多重启一次就报错', async () => {
        await assert.rejects(
            () =>
                plan.uploadBlobInChunks({
                    totalBytes: total,
                    sleep: async () => {},
                    putChunk: async (start) => {
                        conflictCalls += 1;
                        return { status: 409, ok: false, complete: false, nextOffset: start + 1024 };
                    },
                }),
            /位置冲突/,
        );
        assert.strictEqual(conflictCalls, 2);
    });

    console.log('\n[4] 真实服务端集成（真 fetch + 真分片 + 真落盘）');
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'canvas-webdav-client-'));
    const instance = createWebdavServer({ WEBDAV_ROOT: root, WEBDAV_USER: USER, WEBDAV_PASSWORD: PASSWORD, WEBDAV_PORT: '0' });
    await new Promise((resolve) => instance.server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${instance.server.address().port}`;
    const auth = `Basic ${Buffer.from(`${USER}:${PASSWORD}`).toString('base64')}`;
    const remotePath = '/integration/files/大视频.mp4';
    const payload = crypto.randomBytes(CHUNK * 2 + 999);

    const makePutChunk = (sink) => async (start, end, totalBytes) => {
        const response = await fetch(`${baseUrl}${remotePath}`, {
            method: 'PUT',
            headers: { Authorization: auth, 'Content-Type': 'video/mp4', 'Content-Range': plan.formatContentRange(start, end, totalBytes) },
            body: payload.subarray(start, end + 1),
        });
        sink.push(response.status);
        return {
            status: response.status,
            ok: response.ok,
            complete: response.headers.get('x-upload-complete') === '1',
            nextOffset: plan.readOffsetHeader(response.headers.get('x-upload-offset')),
        };
    };

    try {
        // 上游建目录（等同前端 ensureWebdavDirectory）
        await fetch(`${baseUrl}/integration`, { method: 'MKCOL', headers: { Authorization: auth } });
        // 模拟「上次上传传了一半就断了」：先手工塞进去 1MB，故意不是整片
        const seed = await fetch(`${baseUrl}${remotePath}`, {
            method: 'PUT',
            headers: { Authorization: auth, 'Content-Range': plan.formatContentRange(0, 1048576 - 1, payload.length) },
            body: payload.subarray(0, 1048576),
        });
        check('预置半截上传 → 204', () => assert.strictEqual(seed.status, 204));

        const firstStatuses = [];
        const firstStats = await plan.uploadBlobInChunks({ totalBytes: payload.length, putChunk: makePutChunk(firstStatuses) });
        check('重传时把旧暂存丢掉重来（不会把新旧内容接在一起）', () => {
            assert.strictEqual(firstStats.restarts, 0);
            assert.deepStrictEqual(firstStatuses, [204, 204, 201]);
        });

        const onDisk = await fsp.readFile(path.join(root, 'integration', 'files', '大视频.mp4')).catch(() => null);
        check('丢掉脏进度后拼出来的文件与源逐字节一致', () => {
            assert.ok(onDisk);
            assert.strictEqual(onDisk.length, payload.length);
            assert.strictEqual(crypto.createHash('sha256').update(onDisk).digest('hex'), crypto.createHash('sha256').update(payload).digest('hex'));
        });
        const leftovers = await fsp.readdir(path.join(root, 'integration', 'files'));
        check('不留 .parts 与内部临时文件', () => assert.deepStrictEqual(leftovers.filter((name) => name.startsWith('.')), []));

        // 同一个文件重传一遍（覆盖场景）：应当全部 2xx，最后一片带 complete
        const secondStatuses = [];
        const secondStats = await plan.uploadBlobInChunks({ totalBytes: payload.length, putChunk: makePutChunk(secondStatuses) });
        check('整份重传 → 三片全通，末片仍带 complete', () => {
            assert.strictEqual(secondStats.chunks, 3);
            assert.deepStrictEqual(secondStatuses, [204, 204, 204]);
        });
        const afterOverwrite = await fsp.readFile(path.join(root, 'integration', 'files', '大视频.mp4')).catch(() => null);
        check('覆盖后内容依然一致', () => {
            assert.ok(afterOverwrite);
            assert.strictEqual(crypto.createHash('sha256').update(afterOverwrite).digest('hex'), crypto.createHash('sha256').update(payload).digest('hex'));
        });
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

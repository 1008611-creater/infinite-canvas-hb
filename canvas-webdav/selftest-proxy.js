#!/usr/bin/env node
'use strict';
/*
 * 「视频代理 + 云端同步」同进程自测。
 *
 * 为什么必须单独测这个：
 *   webdav.js 和 Agnes 视频代理跑在同一个 node 进程里（见 agnes-video-proxy/server.js 末尾
 *   与 deploy/docker-compose.yml）。也就是说 webdav 的模块加载或监听一旦出错，
 *   连带后果是「线上视频生成整体挂掉」——这是本次改动唯一的高危面，必须有测试兜住。
 *
 * 做法：直接 require 真实代理（它的 server.listen 会同时拉起 8787 与 8789 两个监听），
 * 然后对两个端口各打一次真实请求。
 * 刻意不 spawn 子进程：本机这套 shell/沙箱下 spawn 的管道输出不可信
 * （实测抓到过不属于子进程的日志），require 才是确定性的。
 *
 * 用法：node canvas-webdav/selftest-proxy.js
 */

const assert = require('assert');
const fsp = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');

const { createWebdavServer, startWebdav } = require('./server');

const PROXY_PORT = 18787;
const WEBDAV_PORT = 18789;
const USER = 'canvas';
const PASSWORD = 'int-password';

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

function request(port, method, urlPath, { headers = {}, body, auth } = {}) {
    return new Promise((resolve, reject) => {
        const finalHeaders = { ...headers };
        if (auth) finalHeaders.Authorization = `Basic ${Buffer.from(auth).toString('base64')}`;
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

async function waitFor(probe, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    let lastError;
    while (Date.now() < deadline) {
        try {
            return await probe();
        } catch (error) {
            lastError = error;
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }
    throw lastError || new Error('等待超时');
}

async function main() {
    console.log('\n[1] 失败关闭：没配密码就不启动监听');
    check('createWebdavServer 返回 null', () => assert.strictEqual(createWebdavServer({ WEBDAV_PASSWORD: '' }), null));
    const warnings = [];
    const silentLogger = { log() {}, warn: (message) => warnings.push(String(message)), error() {} };
    const started = await startWebdav({ WEBDAV_PASSWORD: '' }, silentLogger);
    check('startWebdav 返回 false（不会开出匿名可写目录）', () => assert.strictEqual(started, false));
    check('日志说明了跳过原因', () => assert.match(warnings.join(''), /未配置 WEBDAV_PASSWORD/));

    console.log('\n[2] 真实代理进程里同时拉起代理与云端同步');
    const dataRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'canvas-webdav-proxy-'));
    process.env.AGENT_LOG_FILE = 'none';
    process.env.PROXY_PORT = String(PROXY_PORT);
    process.env.PROXY_ACCESS_TOKEN = '';
    process.env.WEBDAV_ROOT = dataRoot;
    process.env.WEBDAV_USER = USER;
    process.env.WEBDAV_PASSWORD = PASSWORD;
    process.env.WEBDAV_PORT = String(WEBDAV_PORT);

    require('../agnes-video-proxy/server.js'); // 副作用：代理监听 + 云端同步监听

    const health = await waitFor(() => request(PROXY_PORT, 'GET', '/health'));
    check('代理 /health → 200（引入云端同步后代理照常工作）', () => assert.strictEqual(health.status, 200));

    const propfind = await waitFor(() => request(WEBDAV_PORT, 'PROPFIND', '/', { headers: { Depth: '0' }, auth: `${USER}:${PASSWORD}` }));
    check('同步端口 PROPFIND → 207', () => assert.strictEqual(propfind.status, 207));

    const mkcol = await request(WEBDAV_PORT, 'MKCOL', '/infinite-canvas', { auth: `${USER}:${PASSWORD}` });
    check('MKCOL → 201', () => assert.strictEqual(mkcol.status, 201));
    const put = await request(WEBDAV_PORT, 'PUT', '/infinite-canvas/probe.txt', { body: 'hello dav', auth: `${USER}:${PASSWORD}` });
    check('PUT → 201', () => assert.strictEqual(put.status, 201));
    const get = await request(WEBDAV_PORT, 'GET', '/infinite-canvas/probe.txt', { auth: `${USER}:${PASSWORD}` });
    check('GET 往返内容一致', () => {
        assert.strictEqual(get.status, 200);
        assert.strictEqual(get.body.toString('utf8'), 'hello dav');
    });
    const onDisk = await fsp.readFile(path.join(dataRoot, 'infinite-canvas', 'probe.txt'), 'utf8').catch(() => null);
    check('数据确实落在 WEBDAV_ROOT 上', () => assert.strictEqual(onDisk, 'hello dav'));

    await fsp.rm(dataRoot, { recursive: true, force: true });

    console.log(`\n结果：通过 ${passed} 项，失败 ${failed} 项`);
    // 代理进程里有常驻监听，必须显式退出
    process.exit(failed ? 1 : 0);
}

main().catch((error) => {
    console.error('自测脚本自身异常：', error);
    process.exit(1);
});

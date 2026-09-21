"use strict";

const assert = require("node:assert/strict");
const { mkdtemp, readFile, rm } = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");

async function freePort() {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForHealth(port) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("proxy did not become ready");
}

test("proxy merges concurrent identical create requests against an HTTP upstream", async () => {
  const upstreamPort = await freePort();
  const proxyPort = await freePort();
  let upstreamCalls = 0;
  const upstream = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/v1/videos") {
      res.writeHead(404);
      res.end();
      return;
    }
    upstreamCalls += 1;
    req.resume();
    req.on("end", () => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: "task-integration-test" }));
    });
  });
  await new Promise((resolve) =>
    upstream.listen(upstreamPort, "127.0.0.1", resolve),
  );
  const proxy = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    stdio: "ignore",
    env: {
      ...process.env,
      PROXY_PORT: String(proxyPort),
      AGNES_BASE_URL: `http://127.0.0.1:${upstreamPort}`,
      AGNES_API_KEY: "integration-test-key",
      AGENT_LOG_FILE: "none",
      PROXY_ACCESS_TOKEN: "",
    },
  });

  try {
    await waitForHealth(proxyPort);
    const body = JSON.stringify({
      model: "agnes-video-2.5-flash",
      prompt: "integration",
      seconds: 4,
      mode: "text",
    });
    const init = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "integration-test-key",
      },
      body,
    };
    const [first, second] = await Promise.all([
      fetch(`http://127.0.0.1:${proxyPort}/v1/videos`, init),
      fetch(`http://127.0.0.1:${proxyPort}/v1/videos`, init),
    ]);
    const firstJson = await first.json();
    const secondJson = await second.json();
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(firstJson.id, "task-integration-test");
    assert.deepEqual(secondJson, firstJson);
    assert.equal(upstreamCalls, 1);

    const conflict = await fetch(`http://127.0.0.1:${proxyPort}/v1/videos`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "integration-test-key",
      },
      body: JSON.stringify({
        model: "agnes-video-2.5-flash",
        prompt: "different",
        seconds: 4,
        mode: "text",
      }),
    });
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).error, "idempotency_key_reused");
    assert.equal(upstreamCalls, 1);

    const malformed = await fetch(`http://127.0.0.1:${proxyPort}/v1/videos`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "malformed-json-key",
      },
      body: "{not-json",
    });
    assert.equal(malformed.status, 400);

    const preflight = await fetch(`http://127.0.0.1:${proxyPort}/v1/videos`, {
      method: "OPTIONS",
      headers: {
        "access-control-request-headers": "Content-Type, Idempotency-Key",
      },
    });
    assert.equal(preflight.status, 204);
    assert.match(
      preflight.headers.get("access-control-allow-headers") || "",
      /Idempotency-Key/,
    );

    const makeFormRequest = () => {
      const form = new FormData();
      form.set("model", "agnes-video-2.5-flash");
      form.set("prompt", "multipart integration");
      form.set("seconds", "4");
      form.set("mode", "text");
      return fetch(`http://127.0.0.1:${proxyPort}/v1/videos`, {
        method: "POST",
        headers: { "idempotency-key": "multipart-integration-key" },
        body: form,
      });
    };
    const [formFirst, formSecond] = await Promise.all([
      makeFormRequest(),
      makeFormRequest(),
    ]);
    const formFirstJson = await formFirst.json();
    const formSecondJson = await formSecond.json();
    assert.equal(formFirst.status, 200);
    assert.equal(formSecond.status, 200);
    assert.deepEqual(formSecondJson, formFirstJson);
    assert.equal(upstreamCalls, 2);
  } finally {
    proxy.kill();
    await new Promise((resolve) => upstream.close(resolve));
  }
});

test("proxy surfaces and logs the upstream reason when the upstream rejects a create", async () => {
  const upstreamPort = await freePort();
  const proxyPort = await freePort();
  const logFile = path.join(
    await mkdtemp(path.join(os.tmpdir(), "agnes-proxy-log-")),
    "proxy.log",
  );
  const upstreamReason =
    "No available channel for model agnes-video-2.5-flash under group default (distributor) (request id: 20260921062941abcdefghijklmnopqrst)";
  const upstream = http.createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      res.writeHead(503, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: upstreamReason }));
    });
  });
  await new Promise((resolve) =>
    upstream.listen(upstreamPort, "127.0.0.1", resolve),
  );
  const proxy = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    stdio: "ignore",
    env: {
      ...process.env,
      PROXY_PORT: String(proxyPort),
      AGNES_BASE_URL: `http://127.0.0.1:${upstreamPort}`,
      AGNES_API_KEY: "integration-test-key",
      AGENT_LOG_FILE: logFile,
      PROXY_ACCESS_TOKEN: "",
    },
  });

  try {
    await waitForHealth(proxyPort);
    const response = await fetch(`http://127.0.0.1:${proxyPort}/v1/videos`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "upstream-503-key",
      },
      body: JSON.stringify({
        model: "agnes-video-2.5-flash",
        prompt: "integration",
        seconds: 4,
        mode: "text",
      }),
    });
    assert.equal(response.status, 503);
    const payload = await response.json();
    // 上游原文必须原样带回给客户端，供页面和排查使用。
    assert.equal(payload.detail.message, upstreamReason);
    // 直接给用户看的 error 必须是人话，而不是 Agnes HTTP 503 这种内部措辞。
    assert.match(payload.error, /503/);
    assert.doesNotMatch(payload.error, /^Agnes HTTP/);

    const log = await readFile(logFile, "utf8");
    // 日志必须含上游原文，否则线上只能看到 Agnes HTTP 503，无从判断原因。
    assert.match(log, /Agnes HTTP 503/);
    assert.match(log, /No available channel for model agnes-video-2.5-flash/);
  } finally {
    proxy.kill();
    await new Promise((resolve) => upstream.close(resolve));
    await rm(path.dirname(logFile), { recursive: true, force: true });
  }
});

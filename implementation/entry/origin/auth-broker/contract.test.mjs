import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import net from "node:net";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const bridgeKey = "contract-only-bridge-key-shared-secret-for-integration";
const calls = { login: [], register: [], logout: [], bridges: [], supabase: [] };
const tickets = new Map();
const revokedSessions = new Set();
const upstreamSessions = new Map();
let failingBridge = "";
let failNewApiLogout = false;
let failSupabase = false;

function parseBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      resolve(request.headers["content-type"]?.includes("application/json") ? JSON.parse(raw || "{}") : Object.fromEntries(new URLSearchParams(raw)));
    });
  });
}

const mock = http.createServer(async (request, response) => {
  const body = request.method === "POST" ? await parseBody(request) : {};
  if (request.url?.startsWith("/rest/v1/rpc/")) {
    const rpc = request.url.split("/").pop();
    calls.supabase.push({ rpc, headers: request.headers, body });
    response.setHeader("content-type", "application/json");
    if (failSupabase) { response.statusCode = 503; response.end(JSON.stringify({ message: "unavailable" })); return; }
    let value = null;
    if (rpc === "one_auth_create_login_ticket") {
      if (tickets.has(body.p_ticket_hash)) value = false;
      else { tickets.set(body.p_ticket_hash, { ...body, consumed: false }); value = true; }
    } else if (rpc === "one_auth_consume_login_ticket") {
      const ticket = tickets.get(body.p_ticket_hash);
      if (ticket && !ticket.consumed && ticket.p_target === body.p_target && Date.parse(ticket.p_expires_at) > Date.now()) {
        ticket.consumed = true;
        value = [{ subject: ticket.p_subject, email: ticket.p_email }];
      } else value = [];
    } else if (rpc === "one_auth_is_session_revoked") value = revokedSessions.has(body.p_jti);
    else if (rpc === "one_auth_revoke_session") { revokedSessions.add(body.p_jti); value = true; }
    else if (rpc === "one_auth_save_upstream_session") { upstreamSessions.set(body.p_jti, body.p_encrypted_refresh_token); value = true; }
    else if (rpc === "one_auth_consume_upstream_session") { value = upstreamSessions.get(body.p_jti) || null; upstreamSessions.delete(body.p_jti); }
    else if (rpc === "one_auth_consume_assertion") value = true;
    response.end(JSON.stringify(value));
    return;
  }
  if (request.url === "/api/user/login") {
    calls.login.push(body);
    if (body.password === "wrong-password") {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ success: false, message: "invalid credentials" }));
      return;
    }
    response.setHeader("set-cookie", "new_api_refresh=mock-refresh; Path=/api/user/auth");
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ success: true, data: { user: { id: 42, username: "owner@example.com" } } }));
    return;
  }
  if (request.url === "/api/user/register") {
    calls.register.push(body);
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ success: true }));
    return;
  }
  if (request.url === "/api/user/auth/logout") {
    calls.logout.push({ headers: request.headers, body });
    response.setHeader("content-type", "application/json");
    if (failNewApiLogout) {
      response.statusCode = 503;
      response.end(JSON.stringify({ success: false }));
      return;
    }
    response.end(JSON.stringify({ success: true }));
    return;
  }
  if (request.url?.startsWith("/bridge/")) {
    calls.bridges.push({ path: request.url, body });
    response.setHeader("content-type", "application/json");
    if (request.url === failingBridge) {
      response.statusCode = 503;
      response.end(JSON.stringify({ ok: false }));
      return;
    }
    response.end(JSON.stringify({ ok: true }));
    return;
  }
  response.statusCode = 404;
  response.end();
});
await new Promise((resolve) => mock.listen(0, "127.0.0.1", resolve));
const mockPort = mock.address().port;
const mockBase = `http://127.0.0.1:${mockPort}`;
async function reservePort() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const port = 20000 + Math.floor(Math.random() * 20000);
    const probe = net.createServer();
    try {
      await new Promise((resolve, reject) => {
        probe.once("error", reject);
        probe.listen(port, "127.0.0.1", resolve);
      });
      await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
      return port;
    } catch {}
  }
  throw new Error("could not reserve a local test port");
}
const brokerPort = await reservePort();
const peerBrokerPort = await reservePort();
let broker;
let peerBroker;
function startBroker(port = brokerPort) {
  const processHandle = spawn(process.execPath, ["server.js"], {
    cwd: new URL(".", import.meta.url),
    env: {
    ...process.env,
    PORT: String(port),
    UNIFIED_AUTH_SECRET: `${bridgeKey}-shared-secret-for-integration`,
    SUPABASE_URL: mockBase,
    SUPABASE_SECRET_KEY: "sb_secret_server-only-test-key-never-for-production",
    SUPABASE_SERVICE_ROLE_KEY: "",
    ENTRY_ORIGIN: `http://127.0.0.1:${port}`,
    NEW_API_LOGIN_URL: `${mockBase}/api/user/login`,
    NEW_API_REGISTER_URL: `${mockBase}/api/user/register`,
    NEW_API_LOGOUT_URL: `${mockBase}/api/user/auth/logout`,
    HB_BRIDGE_URL: `${mockBase}/bridge/hb`,
    SD2_BRIDGE_URL: `${mockBase}/bridge/sd2`,
    APIC_BRIDGE_URL: `${mockBase}/bridge/apic`,
    HB_LOGOUT_URL: `${mockBase}/bridge/hb/logout`,
    SD2_LOGOUT_URL: `${mockBase}/bridge/sd2/logout`,
    APIC_LOGOUT_URL: `${mockBase}/bridge/apic/logout`,
  },
    stdio: ["ignore", "pipe", "pipe"],
  });
  processHandle.stdout.on("data", (chunk) => { output += chunk; });
  processHandle.stderr.on("data", (chunk) => { output += chunk; });
  processHandle.on("error", (error) => { output += String(error); });
  processHandle.on("exit", (code) => { if (code !== 0 && code !== null) output += `broker exited: ${code}`; });
  return processHandle;
}
let output = "";

async function waitForBroker(port = brokerPort) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  throw new Error(`broker did not start: ${output}`);
}

try {
  broker = startBroker();
  await waitForBroker();
  for (const target of ["hb", "sd2", "apic"]) {
    const response = await fetch(`http://127.0.0.1:${brokerPort}/auth/start?target=${target}`, { redirect: "manual" });
    assert.equal(response.status, 302, `${target} entry must exist`);
  }

  const registration = await fetch(`http://127.0.0.1:${brokerPort}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ target: "apic", email: "owner@example.com", username: "owner@example.com", password: "secret-password", verification_code: "123456" }),
    redirect: "manual",
  });
  assert.equal(registration.status, 303);
  assert.equal(calls.register.length, 1);
  assert.equal(calls.register[0].password, "secret-password");

  const login = await fetch(`http://127.0.0.1:${brokerPort}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ target: "apic", email: "owner@example.com", password: "secret-password" }),
    redirect: "manual",
  });
  assert.equal(login.status, 302);
  assert.equal(calls.login.length, 1);
  assert.equal(calls.login[0].password, "secret-password");
  const cookie = login.headers.get("set-cookie").split(";", 1)[0];
  const location = new URL(login.headers.get("location"), `http://127.0.0.1:${brokerPort}`);
  assert.equal(location.pathname, "/auth/consume");
  assert.match(location.search, /ticket=/);
  assert.doesNotMatch(location.search, /secret-password/);
  assert.equal(calls.supabase.some((call) => call.rpc === "one_auth_create_login_ticket"), true);
  assert.match(tickets.values().next().value.p_ticket_hash, /^[a-f0-9]{64}$/);
  assert.equal(calls.supabase.some((call) => call.headers.apikey === "sb_secret_server-only-test-key-never-for-production"), true);
  assert.equal(calls.supabase.some((call) => call.headers.authorization), false, "Supabase secret API keys are apikey values, not bearer JWTs");

  peerBroker = startBroker(peerBrokerPort);
  await waitForBroker(peerBrokerPort);
  const peerLocation = new URL(`${location.pathname}${location.search}`, `http://127.0.0.1:${peerBrokerPort}`);
  const concurrentConsumes = await Promise.all([
    fetch(location, { headers: { cookie }, redirect: "manual" }),
    fetch(peerLocation, { headers: { cookie }, redirect: "manual" }),
  ]);
  assert.deepEqual(concurrentConsumes.map((response) => response.status).sort(), [200, 401], "concurrent instances must allow exactly one ticket consumer");
  const consume = concurrentConsumes.find((response) => response.status === 200);
  const consumeHtml = await consume.text();
  assert.match(consumeHtml, /bridge\/apic/);
  assert.match(consumeHtml, /\u6b63\u5728\u5b89\u5168\u8df3\u8f6c/);
  assert.doesNotMatch(consumeHtml, /\?{3,}|\\u[0-9a-f]{4}/i);
  assert.doesNotMatch(consumeHtml, /secret-password/);
  const replay = await fetch(location, { headers: { cookie }, redirect: "manual" });
  assert.equal(replay.status, 401, "one-time ticket must not replay after a service restart or across instances");
  broker.kill();
  await once(broker, "exit");
  broker = startBroker();
  await waitForBroker();

  const sessionBeforeLogout = await fetch(`http://127.0.0.1:${brokerPort}/api/session`, { headers: { cookie } });
  assert.equal(sessionBeforeLogout.status, 200);
  assert.deepEqual((await sessionBeforeLogout.json()).user, { id: "42", email: "owner@example.com" });

  const logout = await fetch(`http://127.0.0.1:${brokerPort}/auth/logout`, { headers: { cookie }, redirect: "manual" });
  assert.equal(logout.status, 302);
  assert.equal(calls.bridges.filter((entry) => entry.path.endsWith("/logout")).length, 3);
  assert.equal(calls.logout.length, 1, "upstream New API session is revoked on logout");
  assert.equal(calls.supabase.filter((call) => call.rpc === "one_auth_revoke_session").length, 1);
  assert.equal(calls.supabase.filter((call) => call.rpc === "one_auth_consume_upstream_session").length, 1);
  const sessionAfterLogout = await fetch(`http://127.0.0.1:${brokerPort}/api/session`, { headers: { cookie } });
  assert.deepEqual(await sessionAfterLogout.json(), { authenticated: false, products: ["hb", "sd2", "apic"] });
  assert.doesNotMatch(output, /secret-password/);

  const secondLogin = await fetch(`http://127.0.0.1:${brokerPort}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ target: "hb", email: "owner@example.com", password: "secret-password" }),
    redirect: "manual",
  });
  assert.equal(secondLogin.status, 302);
  const secondCookie = secondLogin.headers.get("set-cookie").split(";", 1)[0];
  failingBridge = "/bridge/sd2/logout";
  const partialLogout = await fetch(`http://127.0.0.1:${brokerPort}/auth/logout`, { headers: { cookie: secondCookie }, redirect: "manual" });
  assert.equal(partialLogout.status, 502, "logout must report a product logout failure");
  assert.ok((await partialLogout.text()).length > 0, "partial logout must show a message");
  assert.match(partialLogout.headers.get("set-cookie") || "", /^one_session=;/);
  const sessionAfterPartialLogout = await fetch(`http://127.0.0.1:${brokerPort}/api/session`, { headers: { cookie: secondCookie } });
  assert.deepEqual(await sessionAfterPartialLogout.json(), { authenticated: false, products: ["hb", "sd2", "apic"] });
  assert.equal(calls.bridges.filter((entry) => entry.path.endsWith("/logout")).length, 6, "all product logout calls are attempted");
  failingBridge = "";

  const thirdLogin = await fetch(`http://127.0.0.1:${brokerPort}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ target: "hb", email: "owner@example.com", password: "secret-password" }),
    redirect: "manual",
  });
  assert.equal(thirdLogin.status, 302);
  const thirdCookie = thirdLogin.headers.get("set-cookie").split(";", 1)[0];
  failNewApiLogout = true;
  const accountPartialLogout = await fetch(`http://127.0.0.1:${brokerPort}/auth/logout`, { headers: { cookie: thirdCookie }, redirect: "manual" });
  assert.equal(accountPartialLogout.status, 502, "logout must report a New API logout failure");
  assert.ok((await accountPartialLogout.text()).length > 0, "account logout failure must show a message");
  failNewApiLogout = false;

  failSupabase = true;
  const unavailableLogin = await fetch(`http://127.0.0.1:${brokerPort}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ target: "apic", email: "owner@example.com", password: "secret-password" }),
    redirect: "manual",
  });
  assert.equal(unavailableLogin.status, 503, "shared-state failure must fail closed before creating a product session");
  assert.equal(unavailableLogin.headers.get("set-cookie"), null);
  failSupabase = false;

  const page = await fetch(`http://127.0.0.1:${brokerPort}/auth/hb.html`);
  const pageHtml = await page.text();
  assert.match(pageHtml, /CAUAI ONE \/ SIGN IN/);
  assert.doesNotMatch(pageHtml, /\?{3,}/);
  assert.doesNotMatch(pageHtml, /sb_secret_server-only-test-key/);

  const invalidLogin = await fetch(`http://127.0.0.1:${brokerPort}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ target: "apic", email: "owner@example.com", password: "wrong-password" }),
    redirect: "manual",
  });
  assert.equal(invalidLogin.status, 401, "New API success=false must be treated as invalid credentials");

  const hbSource = await readFile(new URL("../../../../../niannianai/zhuanhuiyuangong/infinite-canvas/canvas-api/server.js", import.meta.url), "utf8");
  assert.doesNotMatch(hbSource, /app\.get\("\/api\/auth\/unified"/);
  assert.doesNotMatch(hbSource, /req\.query\?\.assertion/);
  const sd2Source = await readFile(new URL("../../../../../niannianai/zhuanhuiyuangong/sd2/app/api/auth/unified/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(sd2Source, /export async function GET/);
  const apicRoot = new URL("../../../../../apic-ldxp-redeem/", import.meta.url);
  const apicRouter = await readFile(new URL("router/api-router.go", apicRoot), "utf8");
  assert.match(apicRouter, /POST\("\/auth\/unified\/logout"[^\n]*UnifiedLogout/);
  const apicController = await readFile(new URL("controller/auth_unified.go", apicRoot), "utf8");
  assert.match(apicController, /func UnifiedLogout\(c \*gin\.Context\) \{[\s\S]*?consumeUnifiedAssertion\(input\.Assertion,\s*"apic",\s*"logout"\)/);
  assert.match(apicController, /UNIFIED_REPLAYED/);
  assert.match(apicController, /ClearRefreshCookie/);
  console.log("unified-auth contract: PASS (mock-only, no real site writes)");
} finally {
  if (broker && broker.exitCode === null) { broker.kill(); await once(broker, "exit").catch(() => {}); }
  if (peerBroker && peerBroker.exitCode === null) { peerBroker.kill(); await once(peerBroker, "exit").catch(() => {}); }
  mock.close();
}



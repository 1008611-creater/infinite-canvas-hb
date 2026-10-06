import crypto from "node:crypto";
import http from "node:http";
import jwt from "jsonwebtoken";

const PORT = Number(process.env.PORT || 8080);
const SECRET = process.env.UNIFIED_AUTH_SECRET || "";
const NEW_API_BASE_URL = (process.env.NEW_API_BASE_URL || "http://new-api:3000").replace(/\/$/, "");
const NEW_API_LOGIN_URL = process.env.NEW_API_LOGIN_URL || `${NEW_API_BASE_URL}/api/user/login`;
const NEW_API_REGISTER_URL = process.env.NEW_API_REGISTER_URL || `${NEW_API_BASE_URL}/api/user/register`;
const NEW_API_LOGOUT_URL = process.env.NEW_API_LOGOUT_URL || `${NEW_API_BASE_URL}/api/user/auth/logout`;
const ENTRY_ORIGIN = process.env.ENTRY_ORIGIN || "https://one.cauai.fun";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const COOKIE_NAME = "one_session";
const SESSION_TTL = 14 * 24 * 60 * 60;
const TICKET_TTL_MS = 60_000;
const products = {
  hb: { key: "hb", name: "\u65e0\u9650\u753b\u5e03", shortName: "\u65e0\u9650\u753b\u5e03", kicker: "\u521b\u4f5c\u5de5\u4f5c\u53f0", description: "\u628a\u7075\u611f\u3001\u7d20\u6750\u4e0e\u89c6\u9891\u8282\u70b9\u7f16\u6392\u6210\u53ef\u590d\u7528\u7684\u521b\u4f5c\u6d41\u7a0b\u3002", mark: "01" },
  sd2: { key: "sd2", name: "\u5ff5\u5ff5 AI \u89c6\u9891", shortName: "AI \u89c6\u9891", kicker: "\u89c6\u9891\u5de5\u4f5c\u53f0", description: "\u4ece\u811a\u672c\u5230\u6210\u7247\uff0c\u96c6\u4e2d\u7ba1\u7406\u521b\u4f5c\u4efb\u52a1\u4e0e\u8fdb\u5ea6\u3002", mark: "02" },
  apic: { key: "apic", name: "New API \u6a21\u578b\u7f51\u5173", shortName: "New API", kicker: "\u6a21\u578b\u670d\u52a1", description: "\u7edf\u4e00\u7ba1\u7406\u6a21\u578b\u63a5\u5165\u3001\u5bc6\u94a5\u4e0e\u7528\u91cf\u3002", mark: "03" },
};
const targets = {
  hb: process.env.HB_BRIDGE_URL || "https://hb.one.cauai.fun/api/auth/unified",
  sd2: process.env.SD2_BRIDGE_URL || "https://sd2.one.cauai.fun/api/auth/unified",
  apic: process.env.APIC_BRIDGE_URL || "https://apic.one.cauai.fun/api/user/auth/unified",
};
const logoutTargets = {
  hb: process.env.HB_LOGOUT_URL || "https://hb.one.cauai.fun/api/auth/unified/logout",
  sd2: process.env.SD2_LOGOUT_URL || "https://sd2.one.cauai.fun/api/auth/unified/logout",
  apic: process.env.APIC_LOGOUT_URL || "https://apic.one.cauai.fun/api/user/auth/unified/logout",
};
const SESSION_TTL_MS = SESSION_TTL * 1000;

function enabled() {
  return SECRET.length >= 32 && Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
}

async function supabaseRpc(name, payload) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("shared_state_unavailable");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      ...(SUPABASE_SECRET_KEY.startsWith("sb_secret_") ? {} : { authorization: `Bearer ${SUPABASE_SECRET_KEY}` }),
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw new Error("shared_state_unavailable");
  return response.json().catch(() => null);
}

function ticketHash(ticket) {
  return crypto.createHash("sha256").update(ticket).digest("hex");
}

function encryptRefreshToken(token) {
  const key = crypto.createHash("sha256").update(SECRET).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

function decryptRefreshToken(value) {
  const [ivValue, tagValue, ciphertextValue] = String(value || "").split(".");
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error("shared_state_unavailable");
  const key = crypto.createHash("sha256").update(SECRET).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
}

async function isSessionRevoked(jti) {
  return Boolean(await supabaseRpc("one_auth_is_session_revoked", { p_jti: jti }));
}

async function revokeSession(jti, expiresAt) {
  await supabaseRpc("one_auth_revoke_session", { p_jti: jti, p_expires_at: new Date(expiresAt).toISOString() });
}

async function saveUpstreamSession(jti, refreshToken) {
  await supabaseRpc("one_auth_save_upstream_session", {
    p_jti: jti,
    p_encrypted_refresh_token: encryptRefreshToken(refreshToken),
    p_expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  });
}

async function consumeUpstreamSession(jti) {
  const encrypted = await supabaseRpc("one_auth_consume_upstream_session", { p_jti: jti });
  return encrypted ? decryptRefreshToken(encrypted) : "";
}
function json(res, status, body, headers = {}) {
  const data = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(data), ...headers });
  res.end(data);
}
function html(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...headers });
  res.end(body);
}
function escape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function parseCookies(value) {
  return Object.fromEntries(String(value || "").split(";").map((part) => part.trim().split("=")).filter(([key, val]) => key && val).map(([key, ...rest]) => [key, decodeURIComponent(rest.join("="))]));
}
function parseSessionCookie(req) {
  if (!enabled()) return null;
  try {
    const payload = jwt.verify(parseCookies(req.headers.cookie)[COOKIE_NAME] || "", SECRET, { algorithms: ["HS256"], audience: "one-session" });
    const jti = String(payload.jti || "");
    return jti && payload?.email ? { id: String(payload.sub || ""), email: String(payload.email).toLowerCase(), jti } : null;
  } catch {
    return null;
  }
}
async function sessionFromCookie(req) {
  const session = parseSessionCookie(req);
  if (!session) return null;
  return await isSessionRevoked(session.jti) ? null : session;
}
async function makeTicket(identity, target) {
  const ticket = crypto.randomBytes(24).toString("base64url");
  const created = await supabaseRpc("one_auth_create_login_ticket", {
    p_ticket_hash: ticketHash(ticket),
    p_subject: identity.id,
    p_email: identity.email,
    p_target: target,
    p_expires_at: new Date(Date.now() + TICKET_TTL_MS).toISOString(),
  });
  if (!created) throw new Error("shared_state_unavailable");
  return ticket;
}
function makeAssertion(identity, target, purpose = "login") {
  return jwt.sign({ sub: identity.id, email: identity.email, aud: target, purpose, jti: crypto.randomUUID() }, SECRET, { algorithm: "HS256", expiresIn: 60 });
}
async function consumeTicket(ticket, target) {
  if (!ticket) return null;
  const rows = await supabaseRpc("one_auth_consume_login_ticket", { p_ticket_hash: ticketHash(ticket), p_target: target });
  const identity = Array.isArray(rows) ? rows[0] : null;
  if (!identity?.subject || !identity?.email) return null;
  return makeAssertion({ id: String(identity.subject), email: String(identity.email).toLowerCase() }, target);
}
function productMeta(target) {
  return products[target] || products.hb;
}
function noticePage(title, text) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5f2eb"><link rel="icon" href="data:,"><title>${escape(title)} &middot; CAUAI One</title><style>:root{color-scheme:light;--ink:#1f2a26;--paper:#f5f2eb;--muted:#69736e;--line:#d9ded7;--accent:#b6482d}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--paper);color:var(--ink);font:16px/1.7 Georgia,"Songti SC","Noto Serif SC",serif}.card{width:min(520px,100%);padding:clamp(30px,7vw,56px);border:1px solid var(--line);background:#fbfaf6;box-shadow:12px 12px 0 #e4e5dd}.index{color:var(--accent);font:12px/1.4 ui-monospace,monospace;letter-spacing:.16em}h1{margin:20px 0 12px;font-size:clamp(28px,6vw,42px);font-weight:500;line-height:1.15}p{color:var(--muted)}a{display:inline-flex;margin-top:16px;color:var(--accent);font:600 14px/1.4 system-ui,sans-serif;text-decoration:none}a:focus-visible{outline:2px solid currentColor;outline-offset:4px}</style></head><body><main class="card"><div class="index">CAUAI ONE &middot; ACCOUNT</div><h1>${escape(title)}</h1><p>${escape(text)}</p><a href="${escape(ENTRY_ORIGIN)}/">\u8fd4\u56de CAUAI One <span aria-hidden="true">&larr;</span></a></main></body></html>`;
}
function loginPage(target, message = "") {
  const product = productMeta(target);
  const switchTargets = Object.values(products).filter((item) => item.key !== target);
  const visibleMessage = message ? humanizeAuthError(message) : "";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5f2eb"><link rel="icon" href="data:,"><title>\u767b\u5f55 &middot; CAUAI One &middot; ${escape(product.shortName)}</title><style>
:root{color-scheme:light;--ink:#1f2a26;--paper:#f5f2eb;--card:#fbfaf6;--muted:#69736e;--quiet:#87908a;--line:#d9ded7;--accent:#b6482d;--accent-soft:#f5e2d8;--olive:#65745a;--serif:Georgia,"Songti SC","Noto Serif SC","STSong",serif;--sans:"PingFang SC","Microsoft YaHei",sans-serif}*{box-sizing:border-box}body{margin:0;min-width:320px;min-height:100vh;background:var(--paper);color:var(--ink);font:15px/1.65 var(--sans);-webkit-font-smoothing:antialiased}.page{width:min(1180px,calc(100% - 48px));min-height:100vh;margin:auto;display:grid;grid-template-rows:auto 1fr auto}.masthead{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px 0;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:12px;color:inherit;text-decoration:none}.brand-mark{display:grid;place-items:center;width:34px;height:34px;background:var(--accent);color:white;font:700 14px var(--serif);transform:rotate(-4deg)}.brand-name{font:600 12px/1 ui-monospace,monospace;letter-spacing:.2em}.brand-caption{display:block;margin-top:6px;color:var(--quiet);font:10px/1 ui-monospace,monospace;letter-spacing:.14em}.top-link,.footer a{color:var(--muted);font-size:12px;text-decoration:none}.main{display:grid;place-items:center;padding:clamp(46px,8vw,92px) 0}.layout{width:min(100%,1040px);display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,440px);align-items:center;gap:clamp(40px,9vw,120px)}.intro{position:relative}.kicker,.card-kicker{font:11px/1.4 ui-monospace,monospace;letter-spacing:.17em;text-transform:uppercase}.kicker{color:var(--accent)}.intro h1{max-width:570px;margin:23px 0 19px;font:500 clamp(40px,6vw,72px)/1.04 var(--serif);letter-spacing:-.045em}.intro-text{max-width:390px;color:var(--muted);font-size:15px;line-height:1.9}.product-note{display:grid;grid-template-columns:42px 1fr;gap:14px;align-items:start;margin-top:38px;padding-top:18px;border-top:1px solid var(--line);max-width:420px}.product-number{color:var(--accent);font:12px ui-monospace,monospace}.product-note strong{display:block;margin-bottom:5px;font-size:14px;font-weight:600}.product-note span{color:var(--muted);font-size:12px}.card{position:relative;padding:clamp(28px,4vw,42px);background:var(--card);border:1px solid var(--line);box-shadow:12px 12px 0 #e4e5dd}.card::before{content:"";position:absolute;top:0;left:0;width:64px;height:4px;background:var(--accent)}.card-head{display:flex;align-items:start;justify-content:space-between;gap:20px;margin-bottom:28px}.card-kicker{color:var(--quiet)}.card h2{margin:9px 0 0;font:500 25px/1.3 var(--serif)}.secure{display:flex;align-items:center;gap:7px;color:var(--olive);font:10px ui-monospace,monospace}.secure::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}form{display:grid;gap:17px}label{display:grid;gap:7px;color:var(--muted);font-size:12px}input{width:100%;min-height:48px;padding:12px 13px;border:1px solid #c8cec6;border-radius:0;background:#fffefa;color:var(--ink);font:15px var(--sans)}input:focus{outline:2px solid var(--accent);outline-offset:1px}button{min-height:48px;flex-shrink:0;white-space:nowrap;border:0;padding:12px 17px;background:var(--accent);color:#fff;font:600 14px var(--sans);cursor:pointer;transition:background .2s,transform .2s}button:hover{background:#963921;transform:translateY(-1px)}button:focus-visible{outline:2px solid var(--ink);outline-offset:3px}.error{margin:0;padding:11px 12px;border-left:3px solid var(--accent);background:var(--accent-soft);color:#752d1d;font-size:12px}.submit{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:3px}.hint{max-width:180px;color:var(--quiet);font-size:11px;line-height:1.6}.switch{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px;padding-top:15px;border-top:1px solid var(--line);color:var(--muted);font-size:11px}.switch a{color:var(--accent);font-weight:600;text-decoration:none}.footer{display:flex;justify-content:space-between;gap:18px;padding:17px 0 22px;border-top:1px solid var(--line);color:var(--quiet);font:10px ui-monospace,monospace;letter-spacing:.04em}.footer-links{display:flex;gap:18px}.footer a:hover,.switch a:hover,.top-link:hover{text-decoration:underline;text-underline-offset:3px}@media(max-width:760px){.page{width:min(calc(100% - 32px),520px)}.layout{grid-template-columns:1fr;gap:28px}.main{padding:42px 0}.intro h1{font-size:clamp(40px,12vw,60px)}.product-note{margin-top:23px}.card{padding:27px 22px;box-shadow:7px 7px 0 #e4e5dd}.footer{align-items:flex-start;flex-direction:column;gap:10px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important}}
</style></head><body><div class="page"><header class="masthead"><a class="brand" href="${escape(ENTRY_ORIGIN)}/"><span class="brand-mark" aria-hidden="true">C</span><span><span class="brand-name">CAUAI ONE</span><span class="brand-caption">ONE ACCOUNT &middot; THREE WORKSPACES</span></span></a><a class="top-link" href="${escape(ENTRY_ORIGIN)}/">\u4ea7\u54c1\u603b\u89c8 &#8599;</a></header><main class="main"><div class="layout"><section class="intro"><div class="kicker">${escape(product.mark)} / ${escape(product.kicker)}</div><h1>\u628a\u521b\u4f5c<br>\u4ece\u8fd9\u91cc\u5f00\u59cb\u3002</h1><p class="intro-text">\u4e00\u4e2a\u8d26\u53f7\uff0c\u8fdb\u5165 CAUAI \u7684\u521b\u4f5c\u5de5\u4f5c\u53f0\u3002\u767b\u5f55\u540e\u53ef\u5728\u4ea7\u54c1\u4e4b\u95f4\u5207\u6362\u3002</p><div class="product-note"><span class="product-number">${escape(product.mark)}</span><div><strong>\u6b63\u5728\u8fdb\u5165 &middot; ${escape(product.name)}</strong><span>${escape(product.description)}</span></div></div></section><section class="card" aria-labelledby="login-title"><div class="card-head"><div><div class="card-kicker">CAUAI ONE / SIGN IN</div><h2 id="login-title">\u6b22\u8fce\u56de\u6765</h2></div><div class="secure">\u5b89\u5168\u8fde\u63a5</div></div>${visibleMessage ? `<p class="error" role="alert">${escape(visibleMessage)}</p>` : ""}<form method="post" action="/auth/login"><input type="hidden" name="target" value="${escape(target)}"><label for="email">\u90ae\u7bb1<input id="email" name="email" type="email" autocomplete="username" inputmode="email" required></label><label for="password">\u5bc6\u7801<input id="password" name="password" type="password" autocomplete="current-password" required></label><div class="submit"><span class="hint">\u8d26\u53f7\u4e0e\u767b\u5f55\u72b6\u6001\u7531 CAUAI One \u7edf\u4e00\u7ba1\u7406\u3002</span><button type="submit">\u767b\u5f55\u5e76\u7ee7\u7eed <span aria-hidden="true">&rarr;</span></button></div></form><div class="switch"><span>\u8fd8\u6ca1\u6709 One \u8d26\u53f7\uff1f</span><a href="/auth/register.html?target=${escape(target)}">\u521b\u5efa\u8d26\u53f7</a></div><div class="switch"><span>\u5207\u6362\u5de5\u4f5c\u53f0</span><span>${switchTargets.map((item) => `<a href="/auth/${item.key}.html">${escape(item.shortName)}</a>`).join(" &middot; ")}</span></div></section></div></main><footer class="footer"><span>CAUAI ONE &middot; UNIFIED WORKSPACE</span><span class="footer-links"><a href="${escape(ENTRY_ORIGIN)}/">\u5e2e\u52a9\u4e0e\u4ea7\u54c1\u603b\u89c8</a><a href="/auth/logout">\u9000\u51fa\u767b\u5f55</a></span></footer></div></body></html>`;
}
function registerPage(target, message = "") {
  const product = productMeta(target);
  const visibleMessage = message ? humanizeAuthError(message) : "";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5f2eb"><link rel="icon" href="data:,"><title>\u521b\u5efa\u8d26\u53f7 &middot; CAUAI One</title><style>:root{color-scheme:light;--ink:#1f2a26;--paper:#f5f2eb;--card:#fbfaf6;--muted:#69736e;--quiet:#87908a;--line:#d9ded7;--accent:#b6482d;--accent-soft:#f5e2d8;--serif:Georgia,"Songti SC","Noto Serif SC",serif;--sans:"PingFang SC","Microsoft YaHei",sans-serif}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:var(--paper);color:var(--ink);font:15px/1.65 var(--sans)}.page{width:min(1120px,calc(100% - 40px));min-height:100vh;margin:auto;display:grid;grid-template-columns:1fr minmax(340px,470px);align-items:center;gap:clamp(36px,9vw,120px);padding:40px 0}.editorial{align-self:center}.kicker,.meta{color:var(--accent);font:11px ui-monospace,monospace;letter-spacing:.16em}.editorial h1{max-width:520px;margin:22px 0;font:500 clamp(42px,6vw,70px)/1.04 var(--serif);letter-spacing:-.04em}.editorial p{max-width:400px;color:var(--muted);line-height:1.9}.card{position:relative;padding:clamp(26px,4vw,42px);border:1px solid var(--line);background:var(--card);box-shadow:12px 12px 0 #e4e5dd}.card::before{content:"";position:absolute;left:0;top:0;width:64px;height:4px;background:var(--accent)}h2{margin:10px 0 24px;font:500 25px var(--serif)}form{display:grid;gap:14px}label{display:grid;gap:6px;color:var(--muted);font-size:12px}input{width:100%;min-height:46px;padding:11px 12px;border:1px solid #c8cec6;border-radius:0;background:#fffefa;color:var(--ink);font:15px var(--sans)}input:focus{outline:2px solid var(--accent);outline-offset:1px}button{min-height:48px;margin-top:4px;border:0;background:var(--accent);color:white;font-weight:600;font-size:14px;cursor:pointer}.error{padding:10px 12px;border-left:3px solid var(--accent);background:var(--accent-soft);color:#752d1d;font-size:12px}.links{display:flex;justify-content:space-between;gap:12px;margin-top:18px;padding-top:15px;border-top:1px solid var(--line);font-size:12px}.links a{color:var(--accent);text-decoration:none;font-weight:600}.note{margin:18px 0 0;color:var(--quiet);font-size:11px;line-height:1.7}@media(max-width:760px){.page{width:min(calc(100% - 32px),500px);grid-template-columns:1fr;align-content:center;gap:24px;padding:26px 0}.editorial h1{margin:14px 0;font-size:42px}.card{padding:25px 21px;box-shadow:7px 7px 0 #e4e5dd}}</style></head><body><main class="page"><section class="editorial"><div class="kicker">CAUAI ONE / NEW ACCOUNT</div><h1>\u5f00\u542f\u4f60\u7684<br>\u521b\u4f5c\u5de5\u4f5c\u53f0\u3002</h1><p>\u4f7f\u7528\u4e00\u4e2a\u8d26\u53f7\u8fdb\u5165 CAUAI \u7684\u4ea7\u54c1\u3002\u5f53\u524d\u5c06\u4ece\u300c${escape(product.shortName)}\u300d\u5f00\u59cb\u3002</p></section><section class="card" aria-labelledby="register-title"><div class="meta">ONE ACCOUNT &middot; PRIVATE BY DESIGN</div><h2 id="register-title">\u521b\u5efa CAUAI One \u8d26\u53f7</h2>${visibleMessage ? `<p class="error" role="alert">${escape(visibleMessage)}</p>` : ""}<form method="post" action="/auth/register"><input type="hidden" name="target" value="${escape(target)}"><label for="email">\u90ae\u7bb1<input id="email" name="email" type="email" autocomplete="email" inputmode="email" required></label><label for="username">\u7528\u6237\u540d<input id="username" name="username" autocomplete="username"></label><label for="password">\u5bc6\u7801<input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required></label><label for="verification_code">\u90ae\u7bb1\u9a8c\u8bc1\u7801\uff08\u5982\u9700\uff09<input id="verification_code" name="verification_code" inputmode="numeric" autocomplete="one-time-code"></label><button type="submit">\u521b\u5efa\u8d26\u53f7\u5e76\u8fd4\u56de\u767b\u5f55</button></form><p class="note">\u8d26\u53f7\u6ce8\u518c\u4e0e\u9a8c\u8bc1\u7531 New API \u8d26\u53f7\u670d\u52a1\u5904\u7406\u3002\u8bf7\u4f7f\u7528\u4f60\u80fd\u63a5\u6536\u90ae\u4ef6\u7684\u90ae\u7bb1\u3002</p><div class="links"><a href="/auth/${escape(target)}.html">\u5df2\u6709\u8d26\u53f7\uff1f\u767b\u5f55</a><a href="${escape(ENTRY_ORIGIN)}/">\u8fd4\u56de\u4ea7\u54c1\u603b\u89c8</a></div></section></main></body></html>`;
}
function humanizeAuthError(code) {
  const messages = {
    invalid_credentials: "\u90ae\u7bb1\u6216\u5bc6\u7801\u4e0d\u6b63\u786e\uff0c\u8bf7\u68c0\u67e5\u540e\u91cd\u8bd5\u3002",
    login_service_unavailable: "\u767b\u5f55\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002",
    register_service_unavailable: "\u6ce8\u518c\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002",
    register_failed: "\u8d26\u53f7\u6682\u65f6\u65e0\u6cd5\u521b\u5efa\uff0c\u8bf7\u68c0\u67e5\u4fe1\u606f\u6216\u7a0d\u540e\u91cd\u8bd5\u3002",
    shared_state_unavailable: "\u767b\u5f55\u72b6\u6001\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\u3002\u8bf7\u7a0d\u540e\u91cd\u8bd5\uff0c\u6682\u65f6\u4e0d\u4f1a\u5f00\u59cb\u4ea7\u54c1\u4f1a\u8bdd\u3002",
  };
  return messages[code] || "\u64cd\u4f5c\u6682\u65f6\u672a\u5b8c\u6210\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002";
}
async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
function formData(value) {
  return Object.fromEntries(new URLSearchParams(value));
}
function cookieValue(setCookieHeaders, name) {
  const line = (setCookieHeaders || []).find((item) => item.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).split(";", 1)[0] : "";
}
async function newApiLogin(email, password) {
  const response = await fetch(NEW_API_LOGIN_URL, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ username: email, password }) });
  const data = await response.json().catch(() => ({}));
  const user = data.data?.user || data.user;
  const identityEmail = String(user?.email || user?.username || "").trim().toLowerCase();
  if (!response.ok || data.success === false || !user?.id || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identityEmail)) return { error: data.code || data.error || "invalid_credentials", status: response.ok ? 401 : (response.status || 502) };
  const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  return { identity: { id: String(user.id), email: identityEmail }, refreshToken: cookieValue(setCookies, "new_api_refresh") };
}
async function newApiRegister(values) {
  const email = String(values.email || "").trim().toLowerCase();
  const username = String(values.username || email).trim();
  const password = String(values.password || "");
  const verificationCode = String(values.verification_code || "").trim();
  const requestBody = { username, email, password };
  if (values.display_name) requestBody.display_name = String(values.display_name).trim();
  if (verificationCode) requestBody.verification_code = verificationCode;
  const response = await fetch(NEW_API_REGISTER_URL, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(requestBody) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) return { error: data.code || data.error || data.message || "register_failed", status: response.ok ? 400 : (response.status || 502) };
  return { ok: true };
}
async function newApiLogout(refreshToken) {
  if (!refreshToken) return { attempted: false, ok: true };
  try {
    const response = await fetch(NEW_API_LOGOUT_URL, { method: "POST", headers: { cookie: `new_api_refresh=${refreshToken}`, accept: "application/json" } });
    return { attempted: true, ok: response.ok, status: response.status };
  } catch (error) {
    return { attempted: true, ok: false, error: error?.message || "request_failed" };
  }
}
async function productLogout(target, endpoint, session) {
  const assertion = makeAssertion(session, target, "logout");
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: new URLSearchParams({ assertion }).toString() });
    return { target, ok: response.ok, status: response.status };
  } catch (error) {
    return { target, ok: false, error: error?.message || "request_failed" };
  }
}
async function handler(req, res) {
  if (!enabled()) return json(res, 503, { error: "unified_auth_disabled" });
  const url = new URL(req.url, ENTRY_ORIGIN);
  if (req.method === "GET" && url.pathname === "/healthz") return json(res, 200, { ok: true });
  if (req.method === "GET" && url.pathname === "/api/session") {
    let session;
    try { session = await sessionFromCookie(req); } catch { return json(res, 503, { authenticated: false, error: "shared_state_unavailable" }); }
    return json(res, 200, session ? { authenticated: true, user: { id: session.id, email: session.email }, products: Object.keys(products) } : { authenticated: false, products: Object.keys(products) });
  }
  if (req.method === "GET" && url.pathname === "/auth/start") {
    const target = url.searchParams.get("target");
    if (!targets[target]) return json(res, 400, { error: "invalid_target" });
    res.writeHead(302, { location: `/auth/${target}.html` });
    return res.end();
  }
  if (req.method === "GET" && /^\/auth\/(hb|sd2|apic)\.html$/.test(url.pathname)) {
    const target = url.pathname.split("/").pop().replace(/\.html$/, "");
    url.searchParams.set("target", target);
  }
  if (req.method === "GET" && (url.pathname === "/auth/login" || /^\/auth\/(hb|sd2|apic)\.html$/.test(url.pathname))) {
    const target = url.searchParams.get("target");
    if (!targets[target]) return json(res, 400, { error: "invalid_target" });
    let session;
    try { session = await sessionFromCookie(req); } catch { return html(res, 503, noticePage("\u767b\u5f55\u6682\u4e0d\u53ef\u7528", humanizeAuthError("shared_state_unavailable"))); }
    if (session) {
      let ticket;
      try { ticket = await makeTicket(session, target); } catch { return html(res, 503, noticePage("\u767b\u5f55\u6682\u4e0d\u53ef\u7528", humanizeAuthError("shared_state_unavailable"))); }
      res.writeHead(302, { location: `/auth/consume?ticket=${encodeURIComponent(ticket)}&target=${target}` });
      return res.end();
    }
    return html(res, 200, loginPage(target, url.searchParams.get("error") || ""));
  }
  if (req.method === "GET" && url.pathname === "/auth/register.html") {
    const target = url.searchParams.get("target") || "hb";
    if (!targets[target]) return json(res, 400, { error: "invalid_target" });
    return html(res, 200, registerPage(target));
  }
  if (req.method === "POST" && url.pathname === "/auth/register") {
    const raw = await body(req);
    const values = req.headers["content-type"]?.includes("application/json") ? JSON.parse(raw || "{}") : formData(raw);
    const target = String(values.target || "hb");
    if (!targets[target]) return json(res, 400, { error: "invalid_target" });
    const result = await newApiRegister(values).catch(() => ({ error: "register_service_unavailable", status: 503 }));
    if (!result.ok) return html(res, result.status === 409 ? 409 : 503, registerPage(target, result.error));
    res.writeHead(303, { location: `/auth/${target}.html?registered=1` });
    return res.end();
  }
  if (req.method === "POST" && url.pathname === "/auth/login") {
    const raw = await body(req);
    const values = req.headers["content-type"]?.includes("application/json") ? JSON.parse(raw || "{}") : formData(raw);
    const target = String(values.target || "");
    if (!targets[target]) return json(res, 400, { error: "invalid_target" });
    const email = String(values.email || "").trim().toLowerCase();
    const password = String(values.password || "");
    if (!email || !password) return html(res, 400, loginPage(target, "invalid_credentials"));
    const result = await newApiLogin(email, password).catch(() => ({ error: "login_service_unavailable", status: 503 }));
    if (!result.identity) return html(res, result.status === 401 ? 401 : 503, loginPage(target, result.error));
    const sessionId = crypto.randomUUID();
    const session = jwt.sign({ sub: result.identity.id, email: result.identity.email }, SECRET, { algorithm: "HS256", audience: "one-session", expiresIn: SESSION_TTL, jwtid: sessionId });
    let ticket;
    try {
      if (result.refreshToken) await saveUpstreamSession(sessionId, result.refreshToken);
      ticket = await makeTicket(result.identity, target);
    } catch {
      return html(res, 503, loginPage(target, "shared_state_unavailable"));
    }
    res.writeHead(302, { "set-cookie": `${COOKIE_NAME}=${encodeURIComponent(session)}; Max-Age=${SESSION_TTL}; Path=/; HttpOnly; Secure; SameSite=Lax`, location: `/auth/consume?ticket=${encodeURIComponent(ticket)}&target=${target}` });
    return res.end();
  }
  if (req.method === "GET" && url.pathname === "/auth/consume") {
    const target = url.searchParams.get("target");
    if (!targets[target]) return json(res, 400, { error: "invalid_target" });
    let assertion;
    try { assertion = await consumeTicket(url.searchParams.get("ticket"), target); } catch { return html(res, 503, noticePage("\u6b63\u5728\u7ef4\u62a4\u767b\u5f55\u670d\u52a1", humanizeAuthError("shared_state_unavailable"))); }
    if (!assertion) return html(res, 401, noticePage("\u767b\u5f55\u94fe\u63a5\u5df2\u5931\u6548", "\u8bf7\u8fd4\u56de CAUAI One \u91cd\u65b0\u767b\u5f55\uff0c\u518d\u6b21\u8fdb\u5165\u5de5\u4f5c\u53f0\u3002"));
    return html(res, 200, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>\u6b63\u5728\u8fdb\u5165 &middot; CAUAI One</title><body><main><p>\u6b63\u5728\u5b89\u5168\u8df3\u8f6c &middot; ${escape(productMeta(target).name)}</p></main><form id="f" method="post" action="${targets[target]}"><input type="hidden" name="assertion" value="${escape(assertion)}"><input type="hidden" name="redirect" value="1"></form><script>document.getElementById("f").submit()</script></body></html>`);
  }
  if ((req.method === "POST" || req.method === "GET") && url.pathname === "/auth/logout") {
    const session = parseSessionCookie(req);
    if (session) {
      let refreshToken = "";
      let storeFailed = false;
      try {
        await revokeSession(session.jti, Date.now() + SESSION_TTL_MS);
      } catch {
        return html(res, 503, noticePage("\u6682\u65f6\u65e0\u6cd5\u5b89\u5168\u9000\u51fa", "\u4f1a\u8bdd\u64a4\u9500\u670d\u52a1\u4e0d\u53ef\u7528\u3002\u8bf7\u4fdd\u6301\u9875\u9762\u5e76\u7a0d\u540e\u91cd\u8bd5\uff0c\u7cfb\u7edf\u6ca1\u6709\u786e\u8ba4\u9000\u51fa\u5b8c\u6210\u3002"));
      }
      try { refreshToken = await consumeUpstreamSession(session.jti); } catch { storeFailed = true; }
      const productResults = await Promise.all(Object.entries(logoutTargets).map(([target, endpoint]) => productLogout(target, endpoint, session)));
      const newApiResult = storeFailed ? { attempted: false, ok: false, error: "shared_state_unavailable" } : await newApiLogout(refreshToken);
      const failedProducts = productResults.filter((result) => !result.ok).map((result) => result.target);
      const newApiFailed = !newApiResult.ok;
      const clearCookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
      if (failedProducts.length || newApiFailed) {
        console.warn("[auth-broker] logout incomplete", { products: failedProducts, newApi: newApiFailed });
        const failedNames = failedProducts.map((target) => productMeta(target).shortName).join("\u3001");
        const suffix = newApiFailed ? `${failedNames ? "\u3001" : ""}\u8d26\u53f7\u670d\u52a1` : "";
        const title = "\u5df2\u9000\u51fa CAUAI One\uff0c\u4f46\u90e8\u5206\u670d\u52a1\u9000\u51fa\u5931\u8d25";
        const message = `\u672c\u5730\u4f1a\u8bdd\u5df2\u64a4\u9500\u3002${failedNames}${suffix} \u5c1a\u672a\u786e\u8ba4\u9000\u51fa\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002`;
        return html(res, 502, noticePage(title, message), { "set-cookie": clearCookie });
      }
    }
    res.writeHead(302, { "set-cookie": `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`, location: ENTRY_ORIGIN });
    return res.end();
  }
  return json(res, 404, { error: "not_found" });
}

if (SUPABASE_URL && SUPABASE_SECRET_KEY) {
  const cleanup = () => supabaseRpc("one_auth_cleanup_expired", {}).catch(() => {});
  setInterval(cleanup, 30 * 60 * 1000).unref();
}
http.createServer((req, res) => {
  if (req.method === "GET" && new URL(req.url, ENTRY_ORIGIN).pathname === "/healthz") return json(res, 200, { ok: true, ready: enabled() });
  if (!enabled()) return json(res, 503, { error: "unified_auth_disabled" });
  handler(req, res).catch((error) => { console.error("[auth-broker] request failed"); json(res, 500, { error: "auth_broker_failed" }); });
}).listen(PORT, "0.0.0.0");

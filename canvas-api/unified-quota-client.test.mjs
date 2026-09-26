import test from "node:test";
import assert from "node:assert/strict";
import { createUnifiedQuotaClient } from "./unified-quota-client.mjs";

test("same reference charges once and refunds once", async () => {
  const calls = [];
  const client = createUnifiedQuotaClient({
    endpoint: "https://ledger.example/quota",
    token: "test-token",
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), body: JSON.parse(options.body) });
      return { ok: true, status: 200, json: async () => ({ quota: calls.length === 1 ? 90 : 100 }) };
    },
  });

  const first = await client.apply({ email: "User@Example.com", amount: -10, reference: "task-1:reserve" });
  const repeat = await client.apply({ email: "user@example.com", amount: -10, reference: "task-1:reserve" });
  const refund = await client.apply({ email: "user@example.com", amount: 10, reference: "task-1:refund" });

  assert.equal(first.balance, 90);
  assert.equal(repeat.duplicate, true);
  assert.equal(refund.balance, 100);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].body.email, "user@example.com");
  assert.equal(calls[0].body.reference, "task-1:reserve");
});

test("concurrent identical charges share one upstream write", async () => {
  let writes = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const client = createUnifiedQuotaClient({
    endpoint: "https://ledger.example/quota",
    token: "test-token",
    fetchImpl: async () => {
      writes += 1;
      await gate;
      return { ok: true, status: 200, json: async () => ({ quota: 80 }) };
    },
  });

  const pending = Promise.all([
    client.apply({ email: "a@example.com", amount: -20, reference: "same" }),
    client.apply({ email: "a@example.com", amount: -20, reference: "same" }),
  ]);
  await new Promise((resolve) => setTimeout(resolve, 20));
  release();
  const [left, right] = await pending;
  assert.equal(writes, 1);
  assert.equal(left.duplicate || right.duplicate, true);
});

test("upstream rejection does not become a successful charge", async () => {
  const client = createUnifiedQuotaClient({
    endpoint: "https://ledger.example/quota",
    token: "test-token",
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "insufficient" }) }),
  });
  await assert.rejects(
    () => client.apply({ email: "a@example.com", amount: -5, reference: "reject" }),
    /UNIFIED_QUOTA_409/,
  );
});

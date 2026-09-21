"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { createIdempotencyStore } = require("./idempotency-store");

test("shares one operation for concurrent retries with the same fingerprint", async () => {
  const store = createIdempotencyStore();
  let calls = 0;
  const operation = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 1));
    return { id: "task-1" };
  };

  const [first, second] = await Promise.all([
    store.run("request-1", "digest-a", operation),
    store.run("request-1", "digest-a", operation),
  ]);
  assert.deepEqual(first, { id: "task-1" });
  assert.deepEqual(second, first);
  assert.equal(calls, 1);
});

test("rejects reuse with a different request fingerprint", async () => {
  const store = createIdempotencyStore();
  const first = await store.run("request-1", "digest-a", async () => ({
    id: "task-1",
  }));
  assert.deepEqual(first, { id: "task-1" });
  await assert.rejects(
    store.run("request-1", "digest-b", async () => ({ id: "task-2" })),
    (error) =>
      error?.status === 409 && error?.message === "idempotency_key_reused",
  );
});

test("removes failed operations so a later retry can recover", async () => {
  const store = createIdempotencyStore();
  await assert.rejects(
    store.run("request-1", "digest-a", async () => {
      throw new Error("upstream unavailable");
    }),
  );
  const result = await store.run("request-1", "digest-a", async () => ({
    id: "task-recovered",
  }));
  assert.deepEqual(result, { id: "task-recovered" });
});

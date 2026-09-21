import assert from "node:assert/strict";
import test from "node:test";

import { buildVideoRequestHeaders } from "./video-request-headers.ts";

test("adds the business idempotency key to video creation headers", () => {
    assert.deepEqual(buildVideoRequestHeaders("test-key", "request-123"), {
        Authorization: "Bearer test-key",
        "Idempotency-Key": "request-123",
    });
});

test("does not send an empty idempotency key", () => {
    assert.deepEqual(buildVideoRequestHeaders("test-key", ""), { Authorization: "Bearer test-key" });
});

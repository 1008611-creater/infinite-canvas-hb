import assert from "node:assert/strict";
import { test } from "node:test";

import { markGenerationCanceled, markGenerationInterrupted } from "./canvas-generation-status.ts";

test("marks queued generation as failed after a refresh", () => {
    const metadata = markGenerationInterrupted({ status: "loading", generationStatus: "queued", generationRequestId: "request-1" }, "generation interrupted");
    assert.equal(metadata?.status, "error");
    assert.equal(metadata?.generationStatus, "failed");
    assert.equal(metadata?.generationRequestId, "request-1");
    assert.equal(metadata?.errorDetails, "generation interrupted");
});

test("does not rewrite completed generation state", () => {
    const metadata = { status: "success" as const, generationStatus: "completed" as const, content: "stored-video" };
    assert.deepEqual(markGenerationInterrupted(metadata, "ignored"), metadata);
});

test("marks an actively running video as failed when the user cancels it", () => {
    const metadata = markGenerationCanceled({ status: "loading", generationStatus: "running", generationTaskId: "task-1" }, "request canceled");
    assert.equal(metadata?.status, "idle");
    assert.equal(metadata?.generationStatus, "failed");
    assert.equal(metadata?.generationTaskId, "task-1");
    assert.equal(metadata?.errorDetails, "request canceled");
    assert.ok(metadata?.generationCompletedAt);
});

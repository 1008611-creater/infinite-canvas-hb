import assert from "node:assert/strict";
import test from "node:test";

import { generationStatusLabelKey } from "./canvas-status-labels.ts";

test("maps every persisted generation status to a visible label key", () => {
    assert.equal(generationStatusLabelKey("queued"), "queued");
    assert.equal(generationStatusLabelKey("running"), "running");
    assert.equal(generationStatusLabelKey("completed"), "completed");
    assert.equal(generationStatusLabelKey("failed"), "failed");
    assert.equal(generationStatusLabelKey(undefined), "generating");
});

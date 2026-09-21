import assert from "node:assert/strict";
import test from "node:test";

import { isPlayableVideoContentType, isSuccessfulVideoResponse, looksLikeErrorPayload } from "./video-result-validation.ts";

test("accepts video and generic binary response types", () => {
    assert.equal(isPlayableVideoContentType("video/mp4; charset=binary"), true);
    assert.equal(isPlayableVideoContentType("application/octet-stream"), true);
    assert.equal(isPlayableVideoContentType(""), true);
});

test("rejects HTML and JSON error response types", () => {
    assert.equal(isPlayableVideoContentType("text/html"), false);
    assert.equal(isPlayableVideoContentType("application/json"), false);
});

test("only successful HTTP responses can be stored", () => {
    assert.equal(isSuccessfulVideoResponse(200), true);
    assert.equal(isSuccessfulVideoResponse(204), true);
    assert.equal(isSuccessfulVideoResponse(302), false);
    assert.equal(isSuccessfulVideoResponse(500), false);
});

test("detects structured error bodies even without a content type", () => {
    assert.equal(looksLikeErrorPayload("", "  <!doctype html><title>gateway error</title>"), true);
    assert.equal(looksLikeErrorPayload("", '{"error":"expired"}'), true);
    assert.equal(looksLikeErrorPayload("video/mp4", "....ftyp...."), false);
});

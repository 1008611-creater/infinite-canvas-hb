"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  multipartFingerprint,
  requestFingerprint,
} = require("./request-fingerprint");

test("canonicalizes JSON field order for retries", () => {
  const first = requestFingerprint(
    "application/json; charset=utf-8",
    Buffer.from("{}"),
    { prompt: "demo", model: "mock" },
  );
  const second = requestFingerprint("application/json", Buffer.from("{}"), {
    model: "mock",
    prompt: "demo",
  });
  assert.equal(first, second);
});

test("ignores multipart boundary changes but includes file content", () => {
  const first = requestFingerprint(
    "multipart/form-data; boundary=one",
    Buffer.from("wire-one"),
    multipartFingerprint({ prompt: "demo" }, [
      {
        name: "images[]",
        filename: "ref.png",
        contentType: "image/png",
        buffer: Buffer.from("image"),
      },
    ]),
  );
  const second = requestFingerprint(
    "multipart/form-data; boundary=two",
    Buffer.from("wire-two"),
    multipartFingerprint({ prompt: "demo" }, [
      {
        name: "images[]",
        filename: "ref.png",
        contentType: "image/png",
        buffer: Buffer.from("image"),
      },
    ]),
  );
  const changed = requestFingerprint(
    "multipart/form-data; boundary=three",
    Buffer.from("wire-three"),
    multipartFingerprint({ prompt: "demo" }, [
      {
        name: "images[]",
        filename: "ref.png",
        contentType: "image/png",
        buffer: Buffer.from("different"),
      },
    ]),
  );
  assert.equal(first, second);
  assert.notEqual(first, changed);
});

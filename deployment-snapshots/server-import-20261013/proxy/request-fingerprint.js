"use strict";

const { createHash } = require("crypto");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  return value;
}

function requestFingerprint(contentType, raw, semanticPayload) {
  const normalizedType = String(contentType || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  const canonicalPayload =
    semanticPayload === undefined
      ? raw
      : Buffer.from(JSON.stringify(canonicalize(semanticPayload)));
  return createHash("sha256")
    .update(normalizedType)
    .update("\0")
    .update(canonicalPayload)
    .digest("hex");
}

function multipartFingerprint(fields, files) {
  return {
    fields,
    files: files.map((file) => ({
      name: file.name,
      filename: file.filename,
      contentType: file.contentType,
      bytes: file.buffer.length,
      sha256: createHash("sha256").update(file.buffer).digest("hex"),
    })),
  };
}

module.exports = { canonicalize, requestFingerprint, multipartFingerprint };

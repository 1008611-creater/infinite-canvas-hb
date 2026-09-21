"use strict";

/**
 * Small in-memory idempotency store for the proxy's create-task boundary.
 * The promise is retained for the TTL so concurrent retries share one
 * upstream submission and completed retries receive the same task response.
 * Only a digest/fingerprint is retained; request bodies and credentials are
 * never stored here.
 */
function createIdempotencyStore({
  ttlMs = 10 * 60 * 1000,
  now = () => Date.now(),
} = {}) {
  const entries = new Map();
  const lifetime = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : 10 * 60 * 1000;

  function prune() {
    const cutoff = now() - lifetime;
    for (const [key, entry] of entries) {
      if (entry.createdAt < cutoff) entries.delete(key);
    }
  }

  function run(key, fingerprint, operation) {
    const normalizedKey = String(key || "").trim();
    if (!normalizedKey) return Promise.resolve().then(operation);
    prune();

    const existing = entries.get(normalizedKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        const error = new Error("idempotency_key_reused");
        error.status = 409;
        return Promise.reject(error);
      }
      return existing.promise;
    }

    const entry = { createdAt: now(), fingerprint, promise: null };
    entry.promise = Promise.resolve()
      .then(operation)
      .catch((error) => {
        if (entries.get(normalizedKey) === entry) entries.delete(normalizedKey);
        throw error;
      });
    entries.set(normalizedKey, entry);
    return entry.promise;
  }

  return { run, size: () => entries.size, prune };
}

module.exports = { createIdempotencyStore };

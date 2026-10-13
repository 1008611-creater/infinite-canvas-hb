const inflight = new Map();
const completed = new Map();

function normalizeEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!value.includes("@")) throw new Error("UNIFIED_QUOTA_EMAIL_INVALID");
  return value;
}

function normalizeAmount(amount) {
  const value = Number(amount);
  if (!Number.isInteger(value) || value === 0) throw new Error("UNIFIED_QUOTA_AMOUNT_INVALID");
  return value;
}

function normalizeReference(reference) {
  const value = String(reference || "").trim();
  if (!value || value.length > 180) throw new Error("UNIFIED_QUOTA_REFERENCE_INVALID");
  return value;
}

export function createUnifiedQuotaClient({ endpoint, token, fetchImpl = fetch }) {
  if (!endpoint || !token) throw new Error("UNIFIED_QUOTA_MISCONFIGURED");

  async function write(input) {
    const email = normalizeEmail(input.email);
    const amount = normalizeAmount(input.amount);
    const reference = normalizeReference(input.reference);
    const key = `${email}\n${reference}`;
    const cached = completed.get(key);
    if (cached) return { ...cached, duplicate: true };
    const pending = inflight.get(key);
    if (pending) return { ...(await pending), duplicate: true };

    const request = (async () => {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { accept: "application/json", authorization: `Bearer ${token}`, "content-type": "application/json", "idempotency-key": reference },
        body: JSON.stringify({ email, amount, reference, reason: input.reason || "unified_quota" }),
      });
      if (!response.ok) throw new Error(`UNIFIED_QUOTA_${response.status}`);
      const body = await response.json();
      const balance = Number(body.quota ?? body.balance);
      if (!Number.isFinite(balance)) throw new Error("UNIFIED_QUOTA_INVALID");
      return { balance, amount, reference, authority: "new-api" };
    })();

    inflight.set(key, request);
    try {
      const result = await request;
      completed.set(key, result);
      return result;
    } finally {
      inflight.delete(key);
    }
  }

  return { apply: write };
}

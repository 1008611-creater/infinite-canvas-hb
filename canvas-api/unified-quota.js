export async function readUnifiedQuota(email) {
    const endpoint = process.env.NEW_API_QUOTA_URL;
    const token = process.env.NEW_API_QUOTA_TOKEN;
    if (!endpoint && !token) return null;
    if (!endpoint || !token) throw new Error("UNIFIED_QUOTA_MISCONFIGURED");
    const url = new URL(endpoint);
    url.searchParams.set("email", String(email).trim().toLowerCase());
    const response = await fetch(url, {
        headers: { accept: "application/json", authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`UNIFIED_QUOTA_${response.status}`);
    const body = await response.json();
    const balance = Number(body.quota ?? body.balance);
    if (!Number.isFinite(balance)) throw new Error("UNIFIED_QUOTA_INVALID");
    return { balance, authority: "new-api", source: "new-api" };
}

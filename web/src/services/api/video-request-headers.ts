export function buildVideoRequestHeaders(apiKey: string, idempotencyKey?: string) {
    return {
        Authorization: `Bearer ${apiKey}`,
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    };
}

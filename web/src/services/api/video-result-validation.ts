export function isPlayableVideoContentType(contentType: string) {
    const normalized = contentType.split(";", 1)[0].trim().toLowerCase();
    return !normalized || normalized.startsWith("video/") || normalized === "application/octet-stream";
}

export function isSuccessfulVideoResponse(status: number) {
    return status >= 200 && status < 300;
}

export function looksLikeErrorPayload(contentType: string, prefix: string) {
    const normalized = contentType.split(";", 1)[0].trim().toLowerCase();
    const preview = prefix.trimStart().toLowerCase();
    return /json|html|text\/plain/.test(normalized) || /^(?:<!doctype html|<html|\{|\[)/.test(preview);
}

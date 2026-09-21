import type { CanvasNodeMetadata } from "@/types/canvas";

export function markGenerationInterrupted(metadata: CanvasNodeMetadata | undefined, message: string) {
    if (!metadata) return metadata;
    const active = metadata.status === "loading" || metadata.generationStatus === "queued" || metadata.generationStatus === "running";
    if (!active) return metadata;
    return {
        ...metadata,
        status: "error" as const,
        generationStatus: "failed" as const,
        generationCompletedAt: new Date().toISOString(),
        errorDetails: message,
    };
}

export function markGenerationCanceled(metadata: CanvasNodeMetadata | undefined, message: string) {
    if (!metadata) return metadata;
    const active = metadata.status === "loading" || metadata.generationStatus === "queued" || metadata.generationStatus === "running";
    if (!active) return metadata;
    return {
        ...metadata,
        status: "idle" as const,
        ...(metadata.generationStatus ? { generationStatus: "failed" as const, generationCompletedAt: new Date().toISOString() } : {}),
        errorDetails: message,
    };
}

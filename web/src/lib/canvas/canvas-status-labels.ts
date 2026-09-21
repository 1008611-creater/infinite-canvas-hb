import type { CanvasGenerationStatus } from "@/types/canvas";

export type CanvasGenerationStatusLabel = CanvasGenerationStatus | "generating";

export function generationStatusLabelKey(status?: CanvasGenerationStatus): CanvasGenerationStatusLabel {
    return status || "generating";
}

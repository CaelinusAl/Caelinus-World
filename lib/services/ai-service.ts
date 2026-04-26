import type {
  FaceUploadResult,
  FacePreviewResult,
  AvatarFaceMap,
  TryOnRequest,
  TryOnRenderResult,
} from "./ai-types";
import { runFacePreviewPipeline } from "./face-preview-pipeline";

export type FacePreviewInput = {
  uploadId: string;
  imageUrl: string;
};

export type AvatarFaceMapInput = {
  uploadId: string;
  imageUrl: string;
};

/**
 * AI Service Interface — provider-agnostic contract.
 *
 * Implementations:
 *  - MockAIService   (current — local pipeline + stubs)
 *  - FastAPIService  (future — Python backend)
 *  - CloudAIService  (future — Replicate / RunPod / etc.)
 */
export interface IAIService {
  uploadFaceImage(file: File): Promise<FaceUploadResult>;
  processFacePreview(input: FacePreviewInput): Promise<FacePreviewResult>;
  generateAvatarFaceMap(input: AvatarFaceMapInput): Promise<AvatarFaceMap>;
  requestTryOnRender(request: TryOnRequest): Promise<TryOnRenderResult>;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Mock: real client-side face crop via `runFacePreviewPipeline` when `imageUrl` is loadable.
 * Simulated delay keeps UX similar to future network calls.
 */
export class MockAIService implements IAIService {
  async uploadFaceImage(file: File): Promise<FaceUploadResult> {
    await delay(800);

    const url = URL.createObjectURL(file);

    return {
      id: `face-${uid()}`,
      url,
      thumbnailUrl: url,
      width: 512,
      height: 512,
      status: "uploaded",
      createdAt: new Date().toISOString(),
    };
  }

  async processFacePreview(input: FacePreviewInput): Promise<FacePreviewResult> {
    await delay(400);
    const result = await runFacePreviewPipeline(input.imageUrl);
    return {
      ...result,
      id: result.id || `preview-${uid()}`,
    };
  }

  async generateAvatarFaceMap(input: AvatarFaceMapInput): Promise<AvatarFaceMap> {
    await delay(500);
    const preview = await runFacePreviewPipeline(input.imageUrl);
    if (preview.status !== "success" || !preview.previewUrl) {
      return {
        id: `facemap-${uid()}`,
        textureUrl: "",
        status: "failed",
      };
    }
    return {
      id: `facemap-${uid()}`,
      textureUrl: preview.previewUrl,
      status: "ready",
    };
  }

  async requestTryOnRender(request: TryOnRequest): Promise<TryOnRenderResult> {
    await delay(1500);

    return {
      id: `render-${uid()}`,
      imageUrl: "",
      thumbnailUrl: "",
      status: "ready",
      metadata: {
        productId: request.productId,
        stageId: request.stageId,
        renderTimeMs: 1500,
      },
    };
  }
}

/** Singleton — swap implementation here when switching providers */
let instance: IAIService | null = null;

export function getAIService(): IAIService {
  if (!instance) {
    instance = new MockAIService();
  }
  return instance;
}

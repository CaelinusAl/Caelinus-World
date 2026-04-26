/**
 * Shared types for the AI Virtual Try-On service layer.
 * These types are provider-agnostic — swap the implementation,
 * keep the contract.
 */

export type FaceUploadResult = {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  status: "uploaded" | "processing" | "ready" | "failed";
  createdAt: string;
};

export type FaceAnalysis = {
  faceDetected: boolean;
  landmarks?: {
    leftEye: [number, number];
    rightEye: [number, number];
    nose: [number, number];
    mouthLeft: [number, number];
    mouthRight: [number, number];
  };
  /** Pixel coords in source image */
  boundingBox?: { x: number; y: number; w: number; h: number };
  /** 0–1 normalized — persisted for rehydrate without storing texture bytes */
  boundingBoxNorm?: { x: number; y: number; w: number; h: number };
  confidence: number;
};

export type FacePreviewResult = {
  id: string;
  previewUrl: string;
  analysis: FaceAnalysis;
  status: "success" | "no_face" | "multiple_faces" | "low_quality";
  message: string;
};

export type AvatarFaceMap = {
  id: string;
  textureUrl: string;
  uvMapUrl?: string;
  status: "generating" | "ready" | "failed";
};

export type TryOnRequest = {
  avatarConfigId?: string;
  productId: string;
  faceMapId?: string;
  stageId: string;
};

export type TryOnRenderResult = {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  status: "queued" | "rendering" | "ready" | "failed";
  metadata: {
    productId: string;
    stageId: string;
    renderTimeMs?: number;
  };
};

export type UploadValidation = {
  valid: boolean;
  error?: string;
};

export const UPLOAD_CONSTRAINTS = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxSizeMB: 10,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
  minWidth: 256,
  minHeight: 256,
  maxWidth: 4096,
  maxHeight: 4096,
} as const;

export function validateUploadFile(file: File): UploadValidation {
  if (!UPLOAD_CONSTRAINTS.allowedTypes.includes(file.type as never)) {
    return {
      valid: false,
      error: `Desteklenmeyen dosya tipi: ${file.type}. JPEG, PNG veya WebP yukleyin.`,
    };
  }

  if (file.size > UPLOAD_CONSTRAINTS.maxSizeBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Dosya cok buyuk (${sizeMB} MB). Maksimum ${UPLOAD_CONSTRAINTS.maxSizeMB} MB.`,
    };
  }

  return { valid: true };
}

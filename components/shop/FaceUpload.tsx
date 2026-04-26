"use client";

import { useState, useRef, useCallback, memo } from "react";
import { validateUploadFile, UPLOAD_CONSTRAINTS } from "@/lib/services";
import type { FaceUploadResult } from "@/lib/services";

type UploadStatus = "idle" | "validating" | "uploading" | "success" | "error";

type Props = {
  onUploaded?: (result: FaceUploadResult, localBlobUrl: string) => void;
};

function FaceUploadInner({ onUploaded }: Props) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<FaceUploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setStatus("validating");

      const validation = validateUploadFile(file);
      if (!validation.valid) {
        setError(validation.error ?? "Gecersiz dosya");
        setStatus("error");
        return;
      }

      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setStatus("uploading");

      try {
        const formData = new FormData();
        formData.append("face", file);

        const res = await fetch("/api/upload-face", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Yukleme basarisiz");
        }

        const result: FaceUploadResult = {
          id: data.upload.id,
          url: data.upload.url,
          thumbnailUrl: data.upload.thumbnailUrl,
          width: 0,
          height: 0,
          status: "uploaded",
          createdAt: data.upload.createdAt,
        };

        setUploadResult(result);
        setStatus("success");
        onUploaded?.(result, localUrl);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Yukleme sirasinda hata olustu";
        setError(message);
        setStatus("error");
      }
    },
    [onUploaded]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleReset = useCallback(() => {
    setStatus("idle");
    setPreview(null);
    setError(null);
    setUploadResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const allowedStr = UPLOAD_CONSTRAINTS.allowedExtensions.join(", ");

  return (
    <div className="face-upload">
      <div className="face-upload-header">
        <h3 className="face-upload-title">Selfie Yukle</h3>
        <p className="face-upload-desc">
          Yuzunu yukle, AI avatarina uygulayalim
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`face-upload-zone ${dragActive ? "drag-active" : ""} ${status === "success" ? "has-preview" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => status !== "uploading" && inputRef.current?.click()}
      >
        {preview ? (
          <div className="face-upload-preview-wrap">
            <img
              src={preview}
              alt="Yuklenen yuz"
              className="face-upload-preview-img"
            />
            {status === "uploading" && (
              <div className="face-upload-overlay-loading">
                <div className="face-upload-spinner" />
                <span>Yukleniyor...</span>
              </div>
            )}
            {status === "success" && (
              <div className="face-upload-overlay-success">
                Yuklendi
              </div>
            )}
          </div>
        ) : (
          <div className="face-upload-placeholder">
            <div className="face-upload-icon">
              {dragActive ? "+" : ""}
            </div>
            <span className="face-upload-cta">
              {dragActive
                ? "Birak — yuklenecek"
                : "Tikla veya suruklep birak"}
            </span>
            <span className="face-upload-hint">
              {allowedStr} — max {UPLOAD_CONSTRAINTS.maxSizeMB} MB
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD_CONSTRAINTS.allowedTypes.join(",")}
          onChange={handleFileSelect}
          className="face-upload-hidden-input"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="face-upload-error">
          <span>{error}</span>
          <button className="face-upload-retry-btn" onClick={handleReset}>
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Status info */}
      {uploadResult && status === "success" && (
        <div className="face-upload-status">
          <span className="face-upload-status-badge">Hazir</span>
          <span className="face-upload-status-text">
            AI islem icin hazir
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="face-upload-actions">
        {status === "success" && (
          <button className="face-upload-reset-btn" onClick={handleReset}>
            Yeni Fotograf
          </button>
        )}
      </div>
    </div>
  );
}

export const FaceUpload = memo(FaceUploadInner);

"use client";

/**
 * SelfieCapture — Caelinus AI'ın selfie giriş katmanı.
 *
 * İki yol:
 *   1. Drag-drop / dosya seç (Selfie Yükle butonu)
 *   2. Webcam capture (kamera erişimine izin verirse)
 *
 * Çıktı: SelfieInput { dataUrl, source, capturedAt }. Dosya
 * MAX_BYTES'ı aşıyorsa otomatik resize edilir (1024px max edge).
 *
 * Privacy: hiçbir şey sunucuya gönderilmez bu katmanda — analiz
 * tarayıcıda olur (MediaPipe). Kullanıcı tercihi.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import LuxButton from "./LuxButton";
import type { SelfieInput } from "@/lib/caelinus-ai";

const MAX_EDGE = 1024;
const ACCEPTED = "image/png,image/jpeg,image/webp";

/**
 * Resize/encode kalite eğrisi — iki kademe.
 *
 * Selfie iki yere gidiyor:
 *   1) Browser-side MediaPipe FaceLandmarker (tarayıcıda kalır)
 *   2) RunPod /runsync POST body (server → GPU container)
 *
 * (1) için 0.92 quality fazlasıyla yeterli (478 landmark için kalite
 * threshold'unu çoktan geçer). (2) için cold-start + bandwidth
 * önemli; payload ne kadar küçük olursa o kadar iyi.
 *
 * Adaptive strateji:
 *   • İlk encode 0.85 — tipik selfie ~120-200 KB.
 *   • Çıktı hâlâ TARGET_BYTES'i aşıyorsa (kompleks arka plan,
 *     yüksek detay), 0.78'de tekrar encode et.
 *   • İkinci pass yine yetmezse (nadiren), olduğu gibi taşı —
 *     server tarafında MAX_DATAURL_BYTES (3.5MB) cap'i hâlâ var.
 */
const PRIMARY_QUALITY = 0.85;
const FALLBACK_QUALITY = 0.78;
const TARGET_BYTES = 220 * 1024;

type Props = {
  initialDataUrl?: string | null;
  onCapture: (selfie: SelfieInput) => void;
  onClear?: () => void;
};

/** Base64 dataUrl'ün ham byte boyutunu hesapla (header çıkarılarak). */
function dataUrlByteSize(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx < 0) return dataUrl.length;
  const base64 = dataUrl.slice(commaIdx + 1);
  // Base64 → byte: ~3/4 * length, padding düzeltmesi
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

async function resizeImage(dataUrl: string): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
      const outW = Math.round(w * scale);
      const outH = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context yok"));
        return;
      }
      ctx.drawImage(img, 0, 0, outW, outH);

      // İlk encode — tipik durumda burada bırakırız.
      let out = canvas.toDataURL("image/jpeg", PRIMARY_QUALITY);

      // Adaptive fallback — eğer hâlâ büyükse daha agresif sıkıştır.
      // İkinci toDataURL aynı canvas üzerinde çalışır, ek render yok.
      if (dataUrlByteSize(out) > TARGET_BYTES) {
        const tighter = canvas.toDataURL("image/jpeg", FALLBACK_QUALITY);
        if (dataUrlByteSize(tighter) < dataUrlByteSize(out)) {
          out = tighter;
        }
      }

      resolve({
        dataUrl: out,
        width: outW,
        height: outH,
      });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SelfieCapture({
  initialDataUrl,
  onCapture,
  onClear,
}: Props) {
  const [preview, setPreview] = useState<string | null>(initialDataUrl ?? null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setPreview(initialDataUrl ?? null);
  }, [initialDataUrl]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Lütfen bir görsel dosyası seç (jpg, png, webp).");
        return;
      }
      setBusy(true);
      try {
        const raw = await fileToDataUrl(file);
        const { dataUrl, width, height } = await resizeImage(raw);
        setPreview(dataUrl);
        onCapture({
          dataUrl,
          source: "upload",
          capturedAt: new Date().toISOString(),
          width,
          height,
        });
      } catch (err) {
        console.warn("[selfie] handleFile failed:", err);
        setError("Görsel okunamadı.");
      } finally {
        setBusy(false);
      }
    },
    [onCapture],
  );

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) await handleFile(f);
      // input'u sıfırla — aynı dosyayı tekrar seçebilelim
      e.target.value = "";
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) await handleFile(f);
    },
    [handleFile],
  );

  const openWebcam = useCallback(async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("Bu cihazda kamera desteklenmiyor.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setWebcamOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => null);
        }
      });
    } catch (err) {
      console.warn("[selfie] webcam open failed:", err);
      setError("Kamera erişimi reddedildi veya başarısız.");
    }
  }, []);

  const closeWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setWebcamOpen(false);
  }, []);

  const captureFromWebcam = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const raw = canvas.toDataURL("image/jpeg", 0.92);
    const { dataUrl, width, height } = await resizeImage(raw);
    setPreview(dataUrl);
    onCapture({
      dataUrl,
      source: "webcam",
      capturedAt: new Date().toISOString(),
      width,
      height,
    });
    closeWebcam();
  }, [onCapture, closeWebcam]);

  const handleClear = useCallback(() => {
    setPreview(null);
    onClear?.();
  }, [onClear]);

  return (
    <div className="selfie-capture">
      {!webcamOpen && !preview && (
        <div
          className={`selfie-dropzone ${dragOver ? "is-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="selfie-dropzone-icon" aria-hidden="true">
            ✦
          </div>
          <p className="selfie-dropzone-title">
            Selfie&apos;ni bırak ya da seç
          </p>
          <p className="selfie-dropzone-sub">
            Yüzün burada kalır — analiz tarayıcında yapılır, hiçbir
            şey sunucuya gönderilmez.
          </p>
          <div className="selfie-dropzone-actions">
            <LuxButton
              variant="gold"
              onClick={() => fileRef.current?.click()}
              loading={busy}
            >
              Selfie Yükle
            </LuxButton>
            <LuxButton variant="ghost" onClick={openWebcam}>
              Kameradan Çek
            </LuxButton>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="selfie-file-input"
            onChange={handleInputChange}
          />
        </div>
      )}

      {webcamOpen && (
        <div className="selfie-webcam">
          <video
            ref={videoRef}
            playsInline
            muted
            className="selfie-webcam-video"
          />
          <div className="selfie-webcam-actions">
            <LuxButton variant="gold" onClick={captureFromWebcam}>
              Çek
            </LuxButton>
            <LuxButton variant="ghost" onClick={closeWebcam}>
              Vazgeç
            </LuxButton>
          </div>
        </div>
      )}

      {preview && !webcamOpen && (
        <div className="selfie-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Senin selfie'n"
            className="selfie-preview-img"
          />
          <div className="selfie-preview-actions">
            <LuxButton
              variant="nude"
              size="md"
              onClick={() => fileRef.current?.click()}
            >
              Yenile
            </LuxButton>
            <LuxButton variant="ghost" onClick={handleClear}>
              Kaldır
            </LuxButton>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="selfie-file-input"
            onChange={handleInputChange}
          />
        </div>
      )}

      {error && <div className="selfie-error">{error}</div>}
    </div>
  );
}

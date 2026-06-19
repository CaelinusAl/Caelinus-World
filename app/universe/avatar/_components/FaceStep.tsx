"use client";

/**
 * [1] YÜZ VERME — Experience Bible §2[1].
 *
 * MVP: aynı cihazda doğrudan kamera/galeri yükleme. Yüklenen görsel
 * `cropFaceFromUrl` ile temizlenir (MediaPipe + elips maske). Kullanıcı
 * zorlanmaz: "Şimdilik yüzsüz doğ" ile silüet akışına geçebilir.
 */

import { useRef, useState } from "react";

import { cropFaceFromUrl } from "@/lib/face-crop";

type Props = {
  initial: string | null;
  onNext: (faceDataUrl: string | null) => void;
};

export default function FaceStep({ initial, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setNote(null);
    const objectUrl = URL.createObjectURL(file);
    try {
      const cropped = await cropFaceFromUrl(objectUrl);
      if (cropped) {
        setPreview(cropped.dataUrl);
        if (!cropped.detection.detected) {
          setNote("Yüz net seçilemedi — yine de devam edebilirsin.");
        }
      } else {
        setNote("Bu görsel okunamadı. Daha net, yumuşak ışıklı bir kare dene.");
      }
    } catch {
      setNote("Bir şey ters gitti. Tekrar dene.");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setBusy(false);
    }
  }

  return (
    <div className="av-step av-step-face">
      <p className="av-kicker">EŞİK I · YÜZ VERME</p>
      <h2 className="av-step-title">Yüzünü ver</h2>
      <p className="av-step-lede">
        Net bir yüz, yumuşak ışık. Tanrıçan senin çizgilerinden doğacak.
      </p>

      <button
        type="button"
        className="av-face-drop"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Yüz görseli seç"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Verdiğin yüz" className="av-face-preview" />
        ) : (
          <span className="av-face-hint">
            {busy ? "Yüzün okunuyor…" : "Dokun · kamera ya da galeri"}
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      {note && <p className="av-step-note">{note}</p>}

      <div className="av-actions">
        <button
          type="button"
          className="av-btn av-btn-primary"
          disabled={busy || !preview}
          onClick={() => onNext(preview)}
        >
          Devam et
        </button>
        <button
          type="button"
          className="av-btn av-btn-ghost"
          disabled={busy}
          onClick={() => onNext(null)}
        >
          Şimdilik yüzsüz doğ
        </button>
      </div>
    </div>
  );
}

"use client";

/**
 * SelfieUploader — Faz 2.1 "kendi yüzünle dene" girişi.
 *
 * Akış:
 *   1. Kullanıcı bir foto seçer (drag-drop veya tıkla).
 *   2. Tarayıcıda 1024px sığacak şekilde resize edilir, JPEG'e
 *      sıkıştırılır (~0.85 quality). Bu hem network'ü ucuzlatır hem
 *      de sunucuya 4-5 MB selfie yüklenmesini engeller.
 *   3. Base64 data URI ve sha256 hash hesaplanır.
 *   4. Store'a `setSelfie(dataUri, hash)` ile yazılır.
 *
 * Dosya hiçbir yerde kalıcı saklanmaz — selfieDataUri sadece API
 * isteği inflight'iyle FASHN'a gider. Cache hit kontrolü `selfieHash`
 * üzerinden yapılır, yani hash'i bilen sunucu zaten daha önce render
 * ettiği selfieyi görür ama orijinal görsel servera ait değildir.
 *
 * Privacy notu: kullanıcı kontrolü tamamen açık tutmak için "kaldır"
 * butonu daima görünür ve store'dan da temizlenir.
 */

import { useCallback, useId, useRef, useState } from "react";

import { usePlayStore } from "@/stores/play-store";

/** Maks selfie boyutu (long edge). Daha fazlası FASHN'ın kabul ettiği
 *  ~3 MB body limitini zorlar; daha az detay kaybetir. */
const SELFIE_TARGET_PX = 1024;
/** JPEG quality. 0.85 — gözle ayırt edilemeyen sıkıştırma, ~250-400 KB
 *  selfie üretir. */
const SELFIE_JPEG_QUALITY = 0.85;
/** Kullanıcı tarafında kabul edilebilir maks dosya boyutu — UI hatası
 *  vermek için. Sunucuya zaten 1024px'e küçültülmüş hâli gider. */
const MAX_RAW_BYTES = 12 * 1024 * 1024; // 12 MB

type Props = {
  lang: "tr" | "en";
};

export default function SelfieUploader({ lang }: Props) {
  const selfieDataUri = usePlayStore((s) => s.selfieDataUri);
  const setSelfie = usePlayStore((s) => s.setSelfie);
  const clearSelfie = usePlayStore((s) => s.clearSelfie);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const T = {
    title: lang === "tr" ? "Kendi yüzünle dene" : "Try with your own face",
    sub:
      lang === "tr"
        ? "Selfie yükle, AI seni Caelinus tanrıçası olarak giydirsin."
        : "Upload a selfie, AI dresses you as a Caelinus goddess.",
    cta: lang === "tr" ? "Selfie seç" : "Choose a selfie",
    drop: lang === "tr" ? "veya buraya sürükle" : "or drop it here",
    busy: lang === "tr" ? "Hazırlanıyor..." : "Preparing...",
    privacy:
      lang === "tr"
        ? "Selfie depolanmaz; sadece bu render için kullanılır."
        : "Selfie isn't stored — used only for this render.",
    remove: lang === "tr" ? "Selfie'yi kaldır" : "Remove selfie",
    active: lang === "tr" ? "Selfie aktif" : "Selfie active",
    errTooLarge:
      lang === "tr" ? "Dosya çok büyük (maks 12 MB)." : "File too large (max 12 MB).",
    errType:
      lang === "tr"
        ? "Sadece JPG/PNG fotoğraflar destekleniyor."
        : "Only JPG/PNG images are supported.",
    errGeneric:
      lang === "tr" ? "Selfie yüklenemedi." : "Could not load the selfie.",
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError(T.errType);
        return;
      }
      if (file.size > MAX_RAW_BYTES) {
        setError(T.errTooLarge);
        return;
      }

      setBusy(true);
      try {
        const { dataUri, hash } = await processSelfie(file);
        setSelfie(dataUri, hash);
      } catch (err) {
        console.error("[SelfieUploader] processing failed", err);
        setError(T.errGeneric);
      } finally {
        setBusy(false);
      }
    },
    [setSelfie, T.errType, T.errTooLarge, T.errGeneric],
  );

  const onPick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
      // Aynı dosyayı tekrar yükleyebilmek için input'u sıfırla.
      e.target.value = "";
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const hasSelfie = !!selfieDataUri;

  return (
    <section
      className={
        "play-selfie" + (hasSelfie ? " has-selfie" : "") + (dragOver ? " is-drag" : "")
      }
      aria-labelledby={`${inputId}-h`}
    >
      <div className="play-selfie-head">
        <h3 id={`${inputId}-h`} className="play-selfie-title">
          {T.title}
        </h3>
        {hasSelfie ? (
          <span className="play-selfie-active" aria-live="polite">
            ◉ {T.active}
          </span>
        ) : null}
      </div>
      <p className="play-selfie-sub">{T.sub}</p>

      <div
        className="play-selfie-drop"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {hasSelfie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selfieDataUri ?? ""}
            alt=""
            aria-hidden="true"
            className="play-selfie-preview"
          />
        ) : (
          <span className="play-selfie-glyph" aria-hidden="true">
            ⌖
          </span>
        )}

        <div className="play-selfie-actions">
          <button
            type="button"
            className="play-selfie-btn"
            onClick={onPick}
            disabled={busy}
          >
            {busy ? T.busy : hasSelfie ? T.cta : T.cta}
          </button>
          {hasSelfie ? (
            <button
              type="button"
              className="play-selfie-btn play-selfie-btn--ghost"
              onClick={() => {
                clearSelfie();
                setError(null);
              }}
              disabled={busy}
            >
              {T.remove}
            </button>
          ) : (
            <span className="play-selfie-hint">{T.drop}</span>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        className="play-selfie-input"
        aria-hidden="true"
        tabIndex={-1}
        // Inline fallback: even if globals.css hasn't been bundled
        // yet (dev hot-reload glitch), the native file picker UI never
        // leaks into the panel. The CSS class still wins for accessibility
        // / focus styling once stylesheets are live.
        style={{ display: "none" }}
      />

      {error ? (
        <p className="play-selfie-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="play-selfie-privacy">{T.privacy}</p>
      )}
    </section>
  );
}

/* ── Selfie processing ──────────────────────────────────────────── */

/**
 * Selfie → 1024px JPEG data URI + sha256 hash.
 *
 * Tarayıcıda yapılır, sunucuya sadece sonuç gider. Resize+sıkıştırma
 * için off-screen `<canvas>` kullanır; portrait ya da landscape fark
 * etmez, uzun kenar `SELFIE_TARGET_PX`'e indirilir, oran korunur.
 */
async function processSelfie(
  file: File,
): Promise<{ dataUri: string; hash: string }> {
  const bitmap = await createBitmap(file);

  const long = Math.max(bitmap.width, bitmap.height);
  const scale = long > SELFIE_TARGET_PX ? SELFIE_TARGET_PX / long : 1;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const dataUri = canvas.toDataURL("image/jpeg", SELFIE_JPEG_QUALITY);

  const hash = await sha256Hex(dataUri);
  // Cache key'e dahil etmek için kısaltılmış prefix yeterli (collision
  // olasılığı 16 hex'de 2^64 — bizim için ihmal edilebilir).
  const shortHash = hash.slice(0, 16);

  return { dataUri, hash: shortHash };
}

async function createBitmap(file: File): Promise<ImageBitmap> {
  // ImageBitmap her tarayıcıda var ve EXIF orientation'ı otomatik
  // uyguluyor. iOS Safari < 17.4 EXIF'i yanlış işliyor — bu durumda
  // `imageOrientation: "from-image"` flag'i fix eder.
  return await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

"use client";

/**
 * AvaturnCreator — Avaturn web SDK'sini full-screen modal içinde
 * embed eder. Avaturn'ün ayırt edici özelliği selfie'den foto-gerçek
 * insan avatar üretimi (diğer "anime/cartoon" tarzlardan farklı).
 *
 * Akış:
 *   1. Modal açılır → SDK init'lenir → iframe Avaturn editor'ünü
 *      yükler. Kullanıcı selfie çeker, AI yüzü 3D mesh'e mapleyip
 *      saç/kıyafet seçimine geçer.
 *   2. "Next" butonuna basınca SDK `export` event'ini fırlatır,
 *      `ExportAvatarResult` döndürür: { url, urlType, avatarId,
 *      sessionId, bodyId, gender, ... }
 *   3. Biz bu sonucu `saveAvaturnAvatar()` ile kalıcı saklarız
 *      (httpURL→localStorage, dataURL→IndexedDB), sonra parent'in
 *      `onSuccess` callback'ini çağırır, modal kapanır.
 *
 * Subdomain: Avaturn `demo` subdomain'i ücretsiz herkese açık;
 * "some limitation" uyarısı dökümanda var (export limit, watermark
 * olabilir). Brand için developer.avaturn.me'de bedava kayıt sonrası
 * kendi subdomain'i (`caelinus.avaturn.dev`) açılır, env variable'a
 * yazılır.
 *
 * SDK iframe'i container'a ekler — biz `<div id="avaturn-sdk-container">`
 * sağlıyoruz; SDK ekrana iframe'i basar. CSS ile bu div'i full-modal
 * yapıyoruz.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExportAvatarResult } from "@avaturn/sdk";

import { saveAvaturnAvatar } from "@/lib/avaturn/storage";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (avatarUrl: string) => void;
};

const AVATURN_SUBDOMAIN =
  process.env.NEXT_PUBLIC_AVATURN_SUBDOMAIN || "demo";

export default function AvaturnCreator({ open, onClose, onSuccess }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<unknown>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "exporting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* SDK init — modal her açıldığında tekrar init etmek istemiyoruz,
     ama Avaturn SDK aynı container'a ikinci kez init'i destekliyor.
     Yine de open→true geçişinde bir defa yapıyoruz. */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus("loading");
    setErrorMsg(null);

    (async () => {
      try {
        const mod = await import("@avaturn/sdk");
        if (cancelled) return;
        if (!containerRef.current) {
          setErrorMsg("Container hazır değil — yeniden dene.");
          setStatus("error");
          return;
        }

        const sdk = new mod.AvaturnSDK();
        sdkRef.current = sdk;

        const url = `https://${AVATURN_SUBDOMAIN}.avaturn.dev`;

        await sdk.init(containerRef.current, {
          url,
          iframeClassName: "avaturn-modal-iframe",
        });

        if (cancelled) return;
        setStatus("ready");

        sdk.on("export", async (data: ExportAvatarResult) => {
          if (cancelled) return;
          setStatus("exporting");
          try {
            const saved = await saveAvaturnAvatar(data);
            if (!saved) {
              setErrorMsg("Avatar kaydedilemedi — tekrar dene.");
              setStatus("error");
              return;
            }
            onSuccess?.(saved.url);
            // 600ms küçük gecikme — başarılı animasyonu için
            setTimeout(() => {
              if (!cancelled) onClose();
            }, 500);
          } catch (err) {
            console.warn("[avaturn] save failed:", err);
            setErrorMsg("Kayıt sırasında hata oluştu.");
            setStatus("error");
          }
        });

        sdk.on("error", (err) => {
          if (cancelled) return;
          console.warn("[avaturn] sdk error:", err);
          setErrorMsg(err.message ?? "Avaturn beklenmeyen bir hata verdi.");
          setStatus("error");
        });
      } catch (err) {
        if (cancelled) return;
        console.error("[avaturn] init failed:", err);
        setErrorMsg(
          "Avatar yaratıcısı yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.",
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      // SDK destroy/teardown metodu sağlamıyor — iframe DOM'dan
      // çıktığında garbage collect oluyor. Container'ı manuel
      // temizleyip yeniden mount'a hazır bırakıyoruz.
      const el = containerRef.current;
      if (el) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
      }
      sdkRef.current = null;
    };
  }, [open, onClose, onSuccess]);

  /* ESC ile kapatma */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleBackdrop = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="avaturn-modal" role="dialog" aria-modal="true" aria-label="Avaturn avatar yaratıcı">
      <div className="avaturn-modal-backdrop" onClick={handleBackdrop} aria-hidden="true" />
      <div className="avaturn-modal-shell">
        <div className="avaturn-modal-header">
          <div className="avaturn-modal-kicker">✦ CAELINUS · FOTO-GERÇEK AVATAR</div>
          <h2 className="avaturn-modal-title">Selfie'nle gel — yüzün 3D bedeninde</h2>
          <p className="avaturn-modal-sub">
            Bir fotoğraf yükle, AI yüzünü 3D mesh'e map'lesin. Sonra
            saç · kıyafet · vücut ayarla. <em>Powered by Avaturn.</em>
          </p>
          <button
            type="button"
            className="avaturn-modal-close"
            onClick={onClose}
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <div className="avaturn-modal-frame-wrap">
          {/* SDK bu container'a iframe enjekte edecek */}
          <div
            ref={containerRef}
            id="avaturn-sdk-container"
            className="avaturn-modal-container"
          />

          {(status === "loading" || status === "exporting") && (
            <div className="avaturn-modal-loading">
              <div className="avaturn-modal-loading-pulse" />
              <span>
                {status === "loading"
                  ? "Avatar yaratıcısı yükleniyor…"
                  : "Avatarın hazırlanıyor — biraz büyük olabilir…"}
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="avaturn-modal-error">
            {errorMsg}
            <button
              type="button"
              className="avaturn-modal-error-retry"
              onClick={() => {
                setErrorMsg(null);
                setStatus("idle");
              }}
            >
              Anladım
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

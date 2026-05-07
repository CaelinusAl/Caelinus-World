"use client";

/**
 * /caelinus-avatar/m/[sessionId] — Mobile capture page.
 *
 * Telefonun QR'ı tarayıp açtığı sayfa. Burada:
 *   1. Session var mı kontrol et (GET /api/avatar/session/[id])
 *   2. Kullanıcıya kamera/upload sun (mevcut SelfieCapture component)
 *   3. Selfie yakalanınca POST /api/avatar/session/[id]/selfie
 *   4. Başarılıysa "Masaüstüne dön" mesajı + success state
 */

import { use, useCallback, useEffect, useState } from "react";

import LuxButton from "@/components/caelinus-ai/LuxButton";
import SelfieCapture from "@/components/caelinus-ai/SelfieCapture";
import type {
  AvatarSession,
  SelfieInput,
  SessionResponse,
} from "@/lib/caelinus-avatar-core";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default function CaelinusAvatarMobilePage({ params }: PageProps) {
  const { sessionId } = use(params);

  const [session, setSession] = useState<AvatarSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* Session fetch — geçerli mi? */
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/avatar/session/${sessionId}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          setError("Bu QR session'ı süresi doldu veya geçersiz.");
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as SessionResponse;
        setSession(data.session);
      } catch (err) {
        console.error("[mobile] session fetch failed:", err);
        setError("Backend'e bağlanılamadı.");
      } finally {
        setLoading(false);
      }
    };
    void fetchSession();
  }, [sessionId]);

  const handleCapture = useCallback(
    async (selfie: SelfieInput) => {
      setError(null);
      setUploading(true);
      try {
        const res = await fetch(
          `/api/avatar/session/${sessionId}/selfie`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              dataUrl: selfie.dataUrl,
              source: selfie.source,
              width: selfie.width,
              height: selfie.height,
            }),
          },
        );
        if (res.status === 404) {
          setError("Session süresi doldu. Masaüstünden yeni bir QR aç.");
          return;
        }
        if (res.status === 413) {
          setError("Selfie çok büyük — daha küçük bir görsel dene.");
          return;
        }
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(
            (j as { error?: string })?.error ?? `HTTP ${res.status}`,
          );
        }
        setSuccess(true);
      } catch (err) {
        console.error("[mobile] upload failed:", err);
        setError("Selfie yüklenemedi. Bağlantını kontrol et.");
      } finally {
        setUploading(false);
      }
    },
    [sessionId],
  );

  const handleReset = useCallback(() => {
    setSuccess(false);
    setError(null);
  }, []);

  if (loading) {
    return (
      <div className="cav-mobile-page">
        <div className="cav-mobile-card" style={{ alignItems: "center", textAlign: "center" }}>
          <span style={{ fontSize: 30, color: "var(--cav-gold)" }}>✦</span>
          <p style={{ color: "var(--cav-grey)", margin: 0 }}>
            Caelinus session&apos;ını kontrol ediyor…
          </p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="cav-mobile-page">
        <header className="cav-mobile-hero">
          <div className="cav-mobile-kicker">CAELINUS · AVATAR CORE</div>
          <h1 className="cav-mobile-title">Session bulunamadı</h1>
        </header>
        <div className="cav-mobile-card">
          <div className="cav-mobile-error">{error}</div>
          <p style={{ fontSize: 13, color: "var(--cav-grey)", lineHeight: 1.55, margin: 0 }}>
            Masaüstündeki Caelinus sayfasında <strong>↻ Bağlantıyı Sıfırla</strong>{" "}
            butonuyla yeni bir QR oluşturup tekrar tara.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="cav-mobile-page">
        <div className="cav-mobile-card cav-fade-in">
          <div className="cav-mobile-success">
            <span className="cav-mobile-success-glyph">✦</span>
            <h2 className="cav-mobile-success-title">Selfie&apos;n yolda</h2>
            <p className="cav-mobile-success-sub">
              Caelinus seni okumaya başladı. Masaüstüne dön — bedeninin
              sahnede belirdiğini göreceksin.
            </p>
          </div>
          <LuxButton variant="ghost" size="md" onClick={handleReset}>
            Başka Selfie Çek
          </LuxButton>
        </div>
      </div>
    );
  }

  return (
    <div className="cav-mobile-page">
      <header className="cav-mobile-hero">
        <div className="cav-mobile-kicker">CAELINUS · AVATAR CORE</div>
        <h1 className="cav-mobile-title">Selfie&apos;ni gönder</h1>
        <p className="cav-mobile-sub">
          Yüzün burada kalır — analiz tarayıcında yapılır. Görselin
          masaüstüne köprülenir, sunucuya yazılmaz.
        </p>
      </header>

      <div className="cav-mobile-card">
        <SelfieCapture onCapture={handleCapture} />

        {uploading && (
          <div className="cav-mobile-state">
            <div className="cav-mobile-state-row">
              <span>Durum</span>
              <strong>Yükleniyor…</strong>
            </div>
            <div className="cav-mobile-state-row">
              <span>Session</span>
              <code style={{ fontSize: 11 }}>{sessionId}</code>
            </div>
          </div>
        )}

        {error && <div className="cav-mobile-error">{error}</div>}

        {!uploading && !error && (
          <div className="cav-mobile-state">
            <div className="cav-mobile-state-row">
              <span>Session</span>
              <code style={{ fontSize: 11 }}>{sessionId}</code>
            </div>
            <div className="cav-mobile-state-row">
              <span>Geçerlilik</span>
              <strong>10 dk</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

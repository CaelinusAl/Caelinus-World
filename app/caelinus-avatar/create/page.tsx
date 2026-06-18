"use client";

/**
 * /caelinus-avatar/create — Desktop QR + selfie polling + 3D + outfit.
 *
 * Akış:
 *   1. Sayfa açılınca POST /api/avatar/session → QR ve mobileUrl
 *   2. usePolling her 1.5s'de session state'ini çeker
 *   3. status "selfie-received" olunca:
 *      • desktop client-side provider.generateMatches(selfie)
 *      • status'u backend'de "generating" olarak işaretle (PATCH)
 *      • 6 kart UI'da belirir
 *   4. Kullanıcı kart seçer → provider.finalizeMatch()
 *      → POST /api/avatar/session/[id]/result (status "ready")
 *      → localStorage'a yaz
 *      → 3D scene + outfit/animation pickerlar görünür
 *   5. Kullanıcı outfit + animation değiştirebilir; sahne canlı tepki verir
 */

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import LuxButton from "@/components/caelinus-ai/LuxButton";
import AvatarMatchGrid from "@/components/caelinus-ai/AvatarMatchGrid";
import ReadingCard from "@/components/caelinus-ai/ReadingCard";
import SelfieCapture from "@/components/caelinus-ai/SelfieCapture";
import AnimationPicker from "@/components/caelinus-avatar/AnimationPicker";
import OutfitPicker from "@/components/caelinus-avatar/OutfitPicker";
import QRPanel from "@/components/caelinus-avatar/QRPanel";
import { useSessionPolling } from "@/components/caelinus-avatar/useSessionPolling";

import {
  DEFAULT_ANIMATION_ID,
  DEFAULT_OUTFIT_ID,
  DEFAULT_STYLE_PROFILE,
  getActiveProvider,
  getAnimation,
  getOutfit,
  saveGeneratedAvatar,
  type AnimationPreset,
  type AvatarMatch,
  type AvatarSession,
  type CreateSessionResponse,
  type GeneratedAvatar,
  type OutfitPreset,
  type ProgressUpdate,
  type SelfieInput,
  type SessionResponse,
} from "@/lib/caelinus-avatar-core";

const Caelinus3DScene = lazy(
  () => import("@/components/caelinus-ai/Caelinus3DScene"),
);

type LocalState =
  | { phase: "idle" }
  | { phase: "creating-session" }
  | { phase: "awaiting-mobile" }
  | { phase: "matches"; matches: AvatarMatch[] }
  | { phase: "finalizing"; match: AvatarMatch }
  | { phase: "ready"; avatar: GeneratedAvatar };

export default function CaelinusAvatarCreatePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Selfie giriş yolu: "qr" (telefonla tara) | "device" (bu cihazın
  // kamerası / dosya). İki yol da aynı session'a selfie POST'lar;
  // gerisini polling + runGeneration ortak akışı halleder.
  const [captureMode, setCaptureMode] = useState<"qr" | "device">("qr");
  const [deviceUploading, setDeviceUploading] = useState(false);

  const [local, setLocal] = useState<LocalState>({ phase: "idle" });
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);

  const [outfit, setOutfit] = useState<OutfitPreset>(getOutfit(DEFAULT_OUTFIT_ID));
  const [animation, setAnimation] = useState<AnimationPreset>(
    getAnimation(DEFAULT_ANIMATION_ID),
  );

  const generationTriggeredRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* Polling backend session */
  const { session, error: pollError } = useSessionPolling(sessionId);

  /* Auto-create session on mount */
  useEffect(() => {
    if (sessionId || sessionLoading) return;
    void createNewSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createNewSession = useCallback(async () => {
    setSessionError(null);
    setSessionLoading(true);
    setLocal({ phase: "creating-session" });
    try {
      const res = await fetch("/api/avatar/session", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CreateSessionResponse;
      setSessionId(data.session.id);
      generationTriggeredRef.current = null;
      setLocal({ phase: "awaiting-mobile" });
    } catch (err) {
      console.error("[avatar-core] createSession failed:", err);
      setSessionError("Session yaratılamadı. Yeniden dene.");
      setLocal({ phase: "idle" });
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (sessionId) {
      void fetch(`/api/avatar/session/${sessionId}`, { method: "DELETE" });
    }
    abortRef.current?.abort();
    abortRef.current = null;
    setSessionId(null);
    setLocal({ phase: "idle" });
    setProgress(null);
    void createNewSession();
  }, [sessionId, createNewSession]);

  /* Backend "selfie-received" → trigger generation (idempotent) */
  useEffect(() => {
    if (!session || !sessionId) return;
    if (session.status !== "selfie-received") return;
    if (generationTriggeredRef.current === sessionId) return;
    if (!session.selfie) return;

    generationTriggeredRef.current = sessionId;
    void runGeneration(sessionId, session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionId]);

  const runGeneration = useCallback(
    async (id: string, current: AvatarSession) => {
      try {
        // Status'u "generating" olarak işaretle
        await fetch(`/api/avatar/session/${id}/result`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "generating" }),
        });

        const provider = getActiveProvider();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        const matches = await provider.generateMatches!({
          selfie: current.selfie,
          style: DEFAULT_STYLE_PROFILE,
          signal: ctrl.signal,
          onProgress: (u) => setProgress(u),
        });

        setLocal({ phase: "matches", matches });
        setProgress(null);
      } catch (err: unknown) {
        const e = err as { name?: string };
        if (e?.name !== "AbortError") {
          console.error("[avatar-core] generateMatches failed:", err);
          setSessionError("Eşleştirme yapılamadı.");
          await fetch(`/api/avatar/session/${id}/result`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              status: "error",
              errorMessage: "Mock provider failed",
            }),
          }).catch(() => null);
        }
      }
    },
    [],
  );

  const handleSelectMatch = useCallback(
    async (match: AvatarMatch) => {
      if (!sessionId || !session?.selfie) return;
      setLocal({ phase: "finalizing", match });
      setProgress(null);

      try {
        const provider = getActiveProvider();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        const finalAvatar = await provider.finalizeMatch!({
          match,
          selfie: session.selfie,
          signal: ctrl.signal,
          onProgress: (u) => setProgress(u),
        });

        // Backend'e publish
        await fetch(`/api/avatar/session/${sessionId}/result`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ avatar: finalAvatar }),
        });

        // localStorage — try-on sayfası buradan okuyor
        saveGeneratedAvatar(finalAvatar);

        setLocal({ phase: "ready", avatar: finalAvatar });
        setProgress(null);
      } catch (err: unknown) {
        const e = err as { name?: string };
        if (e?.name !== "AbortError") {
          console.error("[avatar-core] finalizeMatch failed:", err);
          setSessionError("Avatar finalize edilemedi.");
        }
      }
    },
    [sessionId, session],
  );

  /* Bu cihazın kamerası/dosyası ile selfie — telefon yerine doğrudan
     desktop'tan gönder. Session zaten mount'ta yaratıldı; selfie'yi
     aynı endpoint'e POST'larız, polling "selfie-received" görüp
     runGeneration'ı tetikler (QR akışıyla birebir aynı downstream). */
  const handleDeviceCapture = useCallback(
    async (selfie: SelfieInput) => {
      if (!sessionId) return;
      setSessionError(null);
      setDeviceUploading(true);
      try {
        const res = await fetch(`/api/avatar/session/${sessionId}/selfie`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dataUrl: selfie.dataUrl,
            source: selfie.source,
            width: selfie.width,
            height: selfie.height,
          }),
        });
        if (res.status === 404) {
          setSessionError("Session süresi doldu. Bağlantıyı sıfırla.");
          return;
        }
        if (res.status === 413) {
          setSessionError("Selfie çok büyük — daha küçük bir görsel dene.");
          return;
        }
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j?.error ?? `HTTP ${res.status}`);
        }
        // Başarılı — polling birazdan "selfie-received" görüp generation'ı
        // başlatacak. Kullanıcıya beklenti ver.
        setLocal({ phase: "awaiting-mobile" });
      } catch (err) {
        console.error("[avatar-core] device selfie upload failed:", err);
        setSessionError("Selfie yüklenemedi. Bağlantını kontrol et.");
      } finally {
        setDeviceUploading(false);
      }
    },
    [sessionId],
  );

  const isWorking =
    local.phase === "creating-session" ||
    (local.phase === "awaiting-mobile" &&
      session?.status &&
      ["generating", "selfie-uploading"].includes(session.status));

  // Selfie henüz toplanıyor mu? (matches/finalizing/ready'e geçmeden,
  // session da işleme/üretime girmemişken giriş affordance'ı göster.)
  const stillGathering =
    local.phase !== "ready" &&
    local.phase !== "matches" &&
    local.phase !== "finalizing";

  const showCapturePicker =
    stillGathering &&
    (!session ||
      ["pending", "mobile-connected", "error", "expired"].includes(
        session.status,
      ));

  // Device modunda SelfieCapture'ı yalnızca selfie gönderilmeden önce
  // göster; gönderildikten sonra (selfie-received/generating) QRPanel
  // status banner'ına düş.
  const awaitingDeviceInput =
    stillGathering &&
    (!session ||
      session.status === "pending" ||
      session.status === "mobile-connected");

  return (
    <div className="cav-page cav-fade-in">
      <section className="cav-hero">
        <div className="cav-hero-kicker">CAELINUS · AVATAR CORE</div>
        <h1 className="cav-hero-title">
          QR&apos;ı tara — <em>bedenin gelsin</em>
        </h1>
        <p className="cav-hero-sub">
          Telefonundaki kameranı kullan, selfie&apos;ni yolla. Caelinus
          buradaki sahnende seni karşılıyor — outfit ve animasyonla istediğin
          gibi taşı.
        </p>
      </section>

      <div className="cav-create-grid">
        {/* SOL — selfie giriş yolu (QR telefon | bu cihazın kamerası) */}
        <div>
          {showCapturePicker && (
            <div className="cav-capture-modes" role="tablist" aria-label="Selfie yolu">
              <button
                type="button"
                role="tab"
                aria-selected={captureMode === "qr"}
                className={`cav-capture-tab ${captureMode === "qr" ? "is-active" : ""}`}
                onClick={() => setCaptureMode("qr")}
              >
                <span className="cav-capture-tab-glyph" aria-hidden="true">▢</span>
                <span className="cav-capture-tab-label">Telefonla — QR tara</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={captureMode === "device"}
                className={`cav-capture-tab ${captureMode === "device" ? "is-active" : ""}`}
                onClick={() => setCaptureMode("device")}
              >
                <span className="cav-capture-tab-glyph" aria-hidden="true">◉</span>
                <span className="cav-capture-tab-label">Kameran var mı? — bu cihazdan</span>
              </button>
            </div>
          )}

          {captureMode === "device" && awaitingDeviceInput ? (
            <div className="cav-device-panel">
              <div className="cav-qr-panel-status">
                <span className="cav-qr-panel-kicker">◉ Bu cihaz</span>
                <h3 className="cav-qr-panel-title">Selfie&apos;ni burada çek</h3>
                <p className="cav-qr-panel-body">
                  Kameranı aç ve çek, ya da bir fotoğraf yükle. Yüzün
                  tarayıcında işlenir — sahnen birazdan bedeninle dolacak.
                </p>
              </div>
              <SelfieCapture onCapture={handleDeviceCapture} />
              {deviceUploading && (
                <div className="cav-qr-panel-meta" style={{ marginTop: 12 }}>
                  <div className="cav-qr-panel-meta-row">
                    <span>Durum</span>
                    <span>Selfie aktarılıyor…</span>
                  </div>
                </div>
              )}
              <LuxButton variant="ghost" size="md" onClick={reset}>
                ↻ Bağlantıyı Sıfırla
              </LuxButton>
            </div>
          ) : (
            <QRPanel
              session={session}
              loading={sessionLoading || (!session && !sessionError && !pollError)}
              onReset={reset}
              hideQr={captureMode === "device"}
            />
          )}

          {(sessionError || pollError) && (
            <div className="cav-mobile-error" style={{ marginTop: 12 }}>
              {sessionError ?? pollError}
            </div>
          )}
        </div>

        {/* SAĞ — sahne + araçlar */}
        <div className="cav-create-stage">
          <div className="cav-create-canvas-wrap">
            {local.phase === "ready" ? (
              <Suspense fallback={<CanvasFallback />}>
                <Caelinus3DScene
                  avatar={local.avatar}
                  skinTone={local.avatar.styleProfile.skinTone}
                  animationUrl={animation.glbUrl}
                  tryOnAccent={outfit.accent}
                  tryOnLabel={outfit.label}
                  autoRotate
                />
              </Suspense>
            ) : local.phase === "matches" ? (
              <div className="cav-create-empty">
                <span className="cav-create-empty-glyph">✦</span>
                <h3 className="cav-create-empty-title">
                  Caelinus seni okudu — altı arketipinden seç
                </h3>
                <p className="cav-create-empty-sub">
                  Aşağıdaki kartlardan birini seç, bedenin sahnede belirsin.
                </p>
              </div>
            ) : local.phase === "finalizing" ? (
              <div className="cav-create-empty">
                <span className="cav-create-empty-glyph">✶</span>
                <h3 className="cav-create-empty-title">Bedenin örülüyor</h3>
                <p className="cav-create-empty-sub">
                  {progress?.message ?? "Son rötuş — saç, ten, dudak…"}
                </p>
              </div>
            ) : (
              <div className="cav-create-empty">
                <span className="cav-create-empty-glyph">✦</span>
                <h3 className="cav-create-empty-title">Sahne hazır</h3>
                <p className="cav-create-empty-sub">
                  Telefonunla QR&apos;ı tara — selfie&apos;ni yolla, Caelinus
                  buraya seni getirsin.
                </p>
                {progress && (
                  <p className="cav-create-empty-sub" style={{ color: "var(--cav-gold-soft)" }}>
                    {progress.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {local.phase === "matches" && (
            <AvatarMatchGrid
              matches={local.matches}
              onSelect={handleSelectMatch}
            />
          )}

          {local.phase === "ready" && (
            <>
              {local.avatar.reading && (
                <ReadingCard reading={local.avatar.reading} variant="compact" />
              )}

              <div className="cav-create-tools">
                <OutfitPicker selectedId={outfit.id} onSelect={setOutfit} />
                <AnimationPicker
                  selectedId={animation.id}
                  onSelect={setAnimation}
                />

                <div className="cav-create-actions">
                  <LuxButton variant="ghost" size="md" onClick={reset}>
                    ↻ Yeni Selfie
                  </LuxButton>
                  <a href="/caelinus-ai/try-on" className="cav-cta-link">
                    <LuxButton variant="gold" size="md">
                      Try-on&apos;a Geç →
                    </LuxButton>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CanvasFallback() {
  return (
    <div className="cav-create-empty">
      <span className="cav-create-empty-glyph">✦</span>
      <p className="cav-create-empty-sub">Sahne yükleniyor…</p>
    </div>
  );
}

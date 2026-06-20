"use client";

/**
 * /caelinus-ai/avatar — Caelinus AI'ın "Avatar" sayfası.
 *
 * Akış (algılanan AI deneyimi):
 *   1. Selfie + style customizer
 *   2. "Avatarımı Oluştur" → provider.generateMatches() (~2-3sn)
 *   3. AI 6 kart döndürür, biri "✦ Senin için"
 *   4. Kullanıcı seçer → provider.finalizeMatch() (~1sn)
 *   5. ReadingCard + 3D scene fade-in, "Try-on'a Geç" CTA
 *
 * Generate aşamaları phase-by-phase progress bandında poetic Türkçe
 * mesajlarla rotate edilir. Tamamlanınca match grid stagger fade-up
 * ile belirir.
 */

import Link from "next/link";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AvatarMatchGrid from "@/components/caelinus-ai/AvatarMatchGrid";
import LuxButton from "@/components/caelinus-ai/LuxButton";
import ReadingCard from "@/components/caelinus-ai/ReadingCard";
import SelfieCapture from "@/components/caelinus-ai/SelfieCapture";
import StyleCustomizer from "@/components/caelinus-ai/StyleCustomizer";
import {
  DEFAULT_STYLE_PROFILE,
  getActiveProvider,
  loadGeneratedAvatar,
  loadSelfie,
  loadStyleProfile,
  saveGeneratedAvatar,
  saveSelfie,
  saveStyleProfile,
  type AvatarMatch,
  type AvatarStyleProfile,
  type GeneratedAvatar,
  type ProgressUpdate,
  type SelfieInput,
} from "@/lib/caelinus-ai";

const Caelinus3DScene = lazy(
  () => import("@/components/caelinus-ai/Caelinus3DScene"),
);

type Step = "compose" | "matches" | "finalized";

export default function CaelinusAvatarPage() {
  const [selfie, setSelfieState] = useState<SelfieInput | null>(null);
  const [style, setStyle] = useState<AvatarStyleProfile>(DEFAULT_STYLE_PROFILE);
  const [matches, setMatches] = useState<AvatarMatch[] | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<GeneratedAvatar | null>(null);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [mounted, setMounted] = useState(false);

  /* Hydration */
  useEffect(() => {
    setStyle(loadStyleProfile());
    const stored = loadGeneratedAvatar();
    setAvatar(stored);
    if (stored) setSelectedMatchId(stored.matchId ?? null);
    void loadSelfie().then((s) => setSelfieState(s));
    setMounted(true);
  }, []);

  /* Style auto-save */
  useEffect(() => {
    if (!mounted) return;
    saveStyleProfile(style);
  }, [style, mounted]);

  const step: Step = useMemo(() => {
    if (avatar) return "finalized";
    if (matches && matches.length > 0) return "matches";
    return "compose";
  }, [avatar, matches]);

  const handleSelfie = useCallback((s: SelfieInput) => {
    setSelfieState(s);
    void saveSelfie(s);
  }, []);

  const handleClearSelfie = useCallback(() => {
    setSelfieState(null);
  }, []);

  const handleGenerateMatches = useCallback(async () => {
    setError(null);
    setGenerating(true);
    setProgress(null);
    setAvatar(null);
    setMatches(null);
    setSelectedMatchId(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const provider = getActiveProvider();
      const fn = provider.generateMatches?.bind(provider);
      if (!fn) {
        // Provider generateMatches'ı implement etmiyorsa generate
        // ile single-shot avatar üretip onu fake-tek-match olarak
        // göster.
        const single = await provider.generate({
          selfie: selfie ?? undefined,
          style,
          signal: ctrl.signal,
          onProgress: (u) => setProgress(u),
        });
        setAvatar(single);
        saveGeneratedAvatar(single);
        return;
      }
      const result = await fn({
        selfie: selfie ?? undefined,
        style,
        signal: ctrl.signal,
        onProgress: (u) => setProgress(u),
      });
      setMatches(result);
      // Recommended kartı default seçilmiş olarak işaretle
      const rec = result.find((m) => m.isRecommended) ?? result[0];
      if (rec) setSelectedMatchId(rec.id);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === "AbortError") {
        setError("İşlem iptal edildi.");
      } else {
        console.error("[caelinus-ai] generateMatches failed:", err);
        setError("Eşleştirme yapılamadı. Bir kez daha dene.");
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [selfie, style]);

  const handleSelectMatch = useCallback(
    async (match: AvatarMatch) => {
      setSelectedMatchId(match.id);
      setError(null);
      setFinalizing(true);
      setProgress(null);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const provider = getActiveProvider();
        const finalizer = provider.finalizeMatch?.bind(provider);
        if (!finalizer) {
          // Fallback — match'i raw GeneratedAvatar'a map et
          const synthetic: GeneratedAvatar = {
            id: `caelinus-${Date.now().toString(36)}`,
            glbUrl: match.glbUrl,
            thumbnailUrl: match.thumbnailUrl,
            styleProfile: match.styleProfile,
            provider: provider.id,
            providerVersion: provider.version,
            generatedAt: new Date().toISOString(),
            reading: match.reading,
            caelinusReading: match.reading.reading,
            matchId: match.id,
          };
          setAvatar(synthetic);
          saveGeneratedAvatar(synthetic);
          return;
        }
        const finalAvatar = await finalizer({
          match,
          selfie: selfie ?? undefined,
          signal: ctrl.signal,
          onProgress: (u) => setProgress(u),
        });
        setAvatar(finalAvatar);
        saveGeneratedAvatar(finalAvatar);
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string };
        if (e?.name === "AbortError") {
          setError("İşlem iptal edildi.");
        } else {
          console.error("[caelinus-ai] finalizeMatch failed:", err);
          setError("Avatar finalize edilemedi.");
        }
      } finally {
        setFinalizing(false);
        abortRef.current = null;
      }
    },
    [selfie],
  );

  const handleStartOver = useCallback(() => {
    setMatches(null);
    setSelectedMatchId(null);
    setAvatar(null);
  }, []);

  const cancelOp = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <div className="cai-page cai-avatar-page">
      <section className="cai-hero">
        <div className="cai-hero-kicker">CAELINUS AI · STÜDYO</div>
        <h1 className="cai-hero-title">
          Selfie&apos;ni ver — <em>frekansını okuyalım</em>
        </h1>
        <p className="cai-hero-sub">
          Yüzünü bir görsel olarak değil, bir ses gibi alıyoruz. Stilini sen
          seç, biz Caelinus dilinde 3D bedenini hazırlayalım. Sonra shop&apos;ta
          ürünü kendi bedeninde dene.
        </p>
      </section>

      {/* STEP INDICATOR */}
      <div className="cai-stepper" role="navigation" aria-label="Akış">
        <div className={`cai-step ${step === "compose" ? "is-active" : "is-done"}`}>
          <span className="cai-step-num">01</span>
          <span className="cai-step-label">Selfie + Stil</span>
        </div>
        <div className="cai-step-line" />
        <div
          className={`cai-step ${
            step === "matches" ? "is-active" : step === "finalized" ? "is-done" : ""
          }`}
        >
          <span className="cai-step-num">02</span>
          <span className="cai-step-label">AI Eşleşme</span>
        </div>
        <div className="cai-step-line" />
        <div className={`cai-step ${step === "finalized" ? "is-active" : ""}`}>
          <span className="cai-step-num">03</span>
          <span className="cai-step-label">Bedenin</span>
        </div>
      </div>

      {/* COMPOSE — Selfie + Style + Generate */}
      {step === "compose" && (
        <div className="cai-avatar-grid cai-fade-in">
          <div className="cai-col cai-col--selfie">
            <h2 className="cai-col-heading">1. Selfie</h2>
            <SelfieCapture
              initialDataUrl={selfie?.dataUrl ?? null}
              onCapture={handleSelfie}
              onClear={handleClearSelfie}
            />
            {selfie && (
              <div className="cai-selfie-meta">
                <span>
                  Kaynak: {selfie.source === "upload" ? "Yükleme" : "Kamera"}
                </span>
                {selfie.width && selfie.height && (
                  <span>
                    {selfie.width}×{selfie.height}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="cai-col cai-col--style">
            <h2 className="cai-col-heading">2. Stilini Seç</h2>
            <StyleCustomizer value={style} onChange={setStyle} />
          </div>

          <div className="cai-col cai-col--cta">
            <h2 className="cai-col-heading">3. AI&apos;a Sor</h2>

            <div className="cai-cta-illustration">
              <div className="cai-cta-illustration-ring" aria-hidden="true" />
              <div className="cai-cta-illustration-ring cai-cta-illustration-ring--mid" aria-hidden="true" />
              <div className="cai-cta-illustration-ring cai-cta-illustration-ring--inner" aria-hidden="true" />
              <div className="cai-cta-illustration-glyph" aria-hidden="true">
                ✦
              </div>
            </div>

            <p className="cai-cta-explainer">
              Caelinus AI yüzünü, stilini ve getirdiğin frekansı okuyup
              sana <strong>altı arketipsel kimlik</strong> önerecek.
              Birini seç — bedenin o kimlikte görünür.
            </p>

            {generating && progress && (
              <div className="cai-progress">
                <div
                  className="cai-progress-bar"
                  style={{ width: `${progress.progress}%` }}
                />
                <div className="cai-progress-message">
                  <span className="cai-progress-phase">
                    {progress.phase.replace("-", " ")}
                  </span>
                  <span className="cai-progress-text">{progress.message}</span>
                </div>
              </div>
            )}

            {error && <div className="cai-error">{error}</div>}

            <div className="cai-cta-stack">
              {!generating && (
                <LuxButton
                  variant="gold"
                  size="lg"
                  onClick={handleGenerateMatches}
                >
                  Avatarımı Oluştur
                </LuxButton>
              )}
              {generating && (
                <LuxButton variant="ghost" onClick={cancelOp}>
                  Vazgeç
                </LuxButton>
              )}
            </div>

            <div className="cai-fineprint">
              Selfie&apos;n cihazında kalır (IndexedDB). Hiçbir görsel
              sunucumuza gönderilmez.
            </div>
          </div>
        </div>
      )}

      {/* MATCHES — 6 kart */}
      {step === "matches" && matches && (
        <div className="cai-fade-in">
          <AvatarMatchGrid
            matches={matches}
            selectedId={selectedMatchId}
            onSelect={handleSelectMatch}
          />

          {finalizing && progress && (
            <div className="cai-progress cai-progress--floating">
              <div
                className="cai-progress-bar"
                style={{ width: `${progress.progress}%` }}
              />
              <div className="cai-progress-message">
                <span className="cai-progress-phase">
                  {progress.phase.replace("-", " ")}
                </span>
                <span className="cai-progress-text">{progress.message}</span>
              </div>
            </div>
          )}

          {error && <div className="cai-error cai-error--center">{error}</div>}

          <div className="cai-match-actions">
            <LuxButton variant="ghost" size="md" onClick={handleStartOver}>
              ← Selfie / Stil&apos;e Dön
            </LuxButton>
          </div>
        </div>
      )}

      {/* FINALIZED — Reading + 3D + Try-on CTA */}
      {step === "finalized" && avatar && (
        <div className="cai-finalized cai-fade-in">
          <div className="cai-finalized-grid">
            <div className="cai-finalized-reading">
              {avatar.reading ? (
                <ReadingCard reading={avatar.reading} />
              ) : avatar.caelinusReading ? (
                <blockquote className="cai-reading">
                  <span className="cai-reading-mark">✦</span>
                  <p>{avatar.caelinusReading}</p>
                </blockquote>
              ) : null}

              <div className="cai-finalized-actions">
                <Link href="/caelinus-ai/try-on" className="cai-cta-link">
                  <LuxButton variant="gold" size="lg">
                    Try-on&apos;a Geç →
                  </LuxButton>
                </Link>
                <LuxButton
                  variant="nude"
                  size="md"
                  onClick={handleStartOver}
                >
                  Başka Bir Eşleşme Dene
                </LuxButton>
              </div>
            </div>

            <div className="cai-finalized-stage">
              <Suspense
                fallback={
                  <div className="cai-canvas-fallback">
                    <div className="cai-canvas-pulse" />
                    <span>Sahne yükleniyor…</span>
                  </div>
                }
              >
                <Caelinus3DScene
                  avatar={avatar}
                  skinTone={style.skinTone}
                  hairColor={style.hair.color}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

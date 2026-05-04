"use client";

/**
 * BuilderFlow — selfie'siz AI tanrıça yaratma akışı.
 *
 * Vizyon: Manifesto'nun "içindeki gökyüzünü hatırlayan kişi"
 * vaadinin teknik karşılığı. Kullanıcı saç, göz, ten, dudak, aura
 * seçer — sonra "Tanrıçayı Doğur" der, AI portresi 1024×1024
 * photoreal döner.
 *
 * Akış:
 *   1. AvatarBuilder UI → trait state'i
 *   2. Trait'ler değişirken anlık moodboard preview (renk çalışması)
 *   3. "✦ Tanrıçayı Doğur" butonu → POST /api/avatar/portrait
 *      • Trait DNA hash'i ile content-addressed cache lookup
 *      • Hit = anında geri dön (sıfır maliyet, paylaşılan cache)
 *      • Miss = OpenAI gpt-image-1, ~10-15sn, sonra cache'e yaz
 *   4. AI portre gelince moodboard yerine geçer, "Bu Tanrıçayı Kaydet"
 *      açılır
 *   5. Kayıt → localStorage'a yaz (kind: "ai-portrait", traits + url)
 *      → opsiyonel /api/avatar/save (login varsa) → next ile dönüş
 *
 * Re-edit: Sayfa açılışında localStorage'da kayıtlı parametric/ai
 * avatar varsa trait'ler restore edilir, AI portre URL'i de
 * gösterilir (yeniden generate gerekmez, sadece trait değişirse).
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import AvatarBuilder from "@/components/avatar/AvatarBuilder";
import {
  DEFAULT_TRAITS,
  serializeTraits,
  type BuilderTraits,
} from "@/lib/avatar/builder";
import {
  readUserAvatar,
  writeUserAvatar,
  type AvatarKind,
} from "@/lib/user-avatar";
import { useAuthStore } from "@/stores/auth-store";

type Lang = "tr" | "en";

type Props = {
  lang?: Lang;
};

const COPY = {
  tr: {
    kicker: "✦ Caelinus AI Tanrıça Yaratıcısı",
    title: "Saçını seç, gözünü seç, AI tanrıçanı doğur",
    sub: "Selfie yok, kişisel veri yok. Saç, ten, göz, dudak ve aura seçimleriyle Caelinus AI senin için 1024×1024 photoreal portre üretir.",
    birth: "✦ Tanrıçayı Doğur",
    birthing: "Tanrıçan doğuyor…",
    rebirth: "✦ Yeni Tanrıça Doğur",
    save: "✦ Bu Avatarımı Kaydet",
    saving: "Kaydediliyor…",
    saved: "✓ Avatarın olarak kaydedildi.",
    cloudBusy: "Buluta yazılıyor…",
    cloudErr: "Yerel olarak kaydedildi, ama buluta yazılamadı.",
    download: "İndir",
    backHome: "← Evrene dön",
    backShop: "Mağazaya Dön →",
    privacy:
      "AI gpt-image-1 ile üretilir, ~10-15 saniye sürer. Aynı seçim kombinasyonu paylaşılan cache'e düşer — ikinci kez ücret yok.",
    ready: "Tanrıçan hazır:",
    cached: "anında cache",
    fresh: "yeni doğdu",
    needBirth: "Önce trait'lerini seç ve Tanrıçayı Doğur butonuna bas.",
    error: "Tanrıça doğurulamadı. Bir saniye sonra tekrar dene.",
    rateLimit:
      "Saatlik AI portre limitine ulaştın. Bir saat sonra tekrar dene.",
    traitsChanged:
      "Trait'ler değişti — yeni tanrıça doğurmak için butona bas.",
  },
  en: {
    kicker: "✦ Caelinus AI Goddess Creator",
    title: "Pick your hair, your eyes, birth your AI goddess",
    sub: "No selfie, no personal data. Pick hair, skin, eyes, lips and aura — Caelinus AI paints a 1024×1024 photoreal portrait for you.",
    birth: "✦ Birth the Goddess",
    birthing: "Painting your goddess…",
    rebirth: "✦ Birth a New Goddess",
    save: "✦ Make This My Avatar",
    saving: "Saving…",
    saved: "✓ Saved as your avatar.",
    cloudBusy: "Saving to cloud…",
    cloudErr: "Saved locally, but the cloud save failed.",
    download: "Download",
    backHome: "← Back to the Universe",
    backShop: "Back to Shop →",
    privacy:
      "Generated with AI gpt-image-1, ~10-15s. Same trait combination hits a shared cache — never costs twice.",
    ready: "Your goddess is ready:",
    cached: "served from cache",
    fresh: "freshly painted",
    needBirth: "Pick your traits first, then press Birth the Goddess.",
    error: "Could not paint the goddess. Try again in a moment.",
    rateLimit: "Hourly AI portrait limit reached. Try again in an hour.",
    traitsChanged: "Traits changed — press the button to birth a new goddess.",
  },
} as const;

type GenState =
  | { kind: "idle" }
  | { kind: "generating"; startedAt: number }
  | { kind: "ready"; url: string; cached: boolean; dnaSnapshot: string }
  | { kind: "error"; message: string };

export default function BuilderFlow({ lang = "tr" }: Props) {
  const t = COPY[lang];
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [traits, setTraits] = useState<BuilderTraits>(DEFAULT_TRAITS);
  const [gen, setGen] = useState<GenState>({ kind: "idle" });
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [savedKind, setSavedKind] = useState<AvatarKind | null>(null);
  const [savingCloud, setSavingCloud] = useState(false);
  const [cloudWarn, setCloudWarn] = useState<string | null>(null);

  const authUser = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);
  useEffect(() => useAuthStore.getState().init(), []);

  // Re-edit: kayıtlı avatar varsa state'i restore et.
  useEffect(() => {
    const stored = readUserAvatar();
    if (!stored) return;
    setSavedUrl(stored.url);
    setSavedKind(stored.meta?.kind ?? "selfie");
    if (
      (stored.meta?.kind === "parametric" || stored.meta?.kind === "ai-portrait") &&
      stored.meta.traits
    ) {
      setTraits(stored.meta.traits);
      // AI portre kayıtlıysa onu hemen göster — yeni generate gerekmez.
      if (stored.meta.kind === "ai-portrait") {
        setGen({
          kind: "ready",
          url: stored.url,
          cached: true,
          dnaSnapshot: serializeTraits(stored.meta.traits),
        });
      }
    }
  }, []);

  /* ── Tanrıçayı Doğur (AI portrait) ──────────────────── */

  const generate = useCallback(async () => {
    setCloudWarn(null);
    const startedAt = Date.now();
    setGen({ kind: "generating", startedAt });

    try {
      const controller = new AbortController();
      const abortTimer = window.setTimeout(() => controller.abort(), 75_000);
      const res = await fetch("/api/avatar/portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traits, lang }),
        signal: controller.signal,
      });
      window.clearTimeout(abortTimer);

      if (res.status === 429) {
        const j = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        setGen({ kind: "error", message: j?.message ?? t.rateLimit });
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as
          | { message?: string; error?: string }
          | null;
        setGen({
          kind: "error",
          message: j?.message ?? j?.error ?? t.error,
        });
        return;
      }
      const j = (await res.json()) as {
        ok: boolean;
        url: string;
        cached: boolean;
        dna: string;
      };
      if (!j.ok || !j.url) {
        setGen({ kind: "error", message: t.error });
        return;
      }
      setGen({
        kind: "ready",
        url: j.url,
        cached: j.cached,
        dnaSnapshot: j.dna,
      });
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      setGen({
        kind: "error",
        message: isAbort
          ? lang === "tr"
            ? "AI 75 saniye içinde yanıt vermedi."
            : "AI didn't respond within 75s."
          : t.error,
      });
    }
  }, [traits, lang, t.error, t.rateLimit]);

  /* ── Bu Avatarımı Kaydet ─────────────────────────────── */

  const saveAsMine = useCallback(async () => {
    if (gen.kind !== "ready") return;
    const createdAt = new Date().toISOString();
    writeUserAvatar(gen.url, {
      zodiac: traits.zodiac ?? "aries",
      kind: "ai-portrait",
      traits,
      createdAt,
    });
    setSavedUrl(gen.url);
    setSavedKind("ai-portrait");
    setCloudWarn(null);

    if (authUser) {
      setSavingCloud(true);
      try {
        const res = await fetch("/api/avatar/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            url: gen.url,
            zodiac: traits.zodiac ?? null,
            kind: "ai-portrait",
            dna: gen.dnaSnapshot,
          }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setCloudWarn(j?.error || t.cloudErr);
        }
      } catch {
        setCloudWarn(t.cloudErr);
      } finally {
        setSavingCloud(false);
      }
    }

    if (next) {
      setTimeout(() => router.push(next), 700);
    }
  }, [gen, traits, authUser, next, router, t.cloudErr]);

  /* ── Trait değişince stale flag — kullanıcı bilsin ───── */

  const stale =
    gen.kind === "ready" && gen.dnaSnapshot !== serializeTraits(traits);

  const isGenerating = gen.kind === "generating";
  const portraitUrl = gen.kind === "ready" && !stale ? gen.url : null;

  return (
    <div className="avatar-flow avatar-flow--builder">
      <header className="avatar-header">
        <p className="avatar-kicker">{t.kicker}</p>
        <h1 className="avatar-title">{t.title}</h1>
        <p className="avatar-sub">{t.sub}</p>
        {savedUrl && savedKind === "ai-portrait" && (
          <p
            className="avatar-kicker"
            style={{ color: "rgba(150,220,180,0.9)" }}
          >
            {t.ready}
          </p>
        )}
      </header>

      <AvatarBuilder
        traits={traits}
        onChange={setTraits}
        lang={lang}
        portraitUrl={portraitUrl}
        generating={isGenerating}
        actions={
          <div className="avatar-cta-row">
            {gen.kind === "ready" && !stale ? (
              <>
                <button
                  type="button"
                  className="avatar-btn avatar-btn--primary"
                  onClick={() => void saveAsMine()}
                  disabled={savingCloud || (savedUrl === gen.url)}
                >
                  {savingCloud
                    ? t.cloudBusy
                    : savedUrl === gen.url
                      ? t.saved
                      : t.save}
                </button>
                <button
                  type="button"
                  className="avatar-btn avatar-btn--ghost"
                  onClick={() => void generate()}
                  disabled={isGenerating}
                >
                  {t.rebirth}
                </button>
                <a
                  href={gen.url}
                  download="caelinus-goddess.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="avatar-btn avatar-btn--ghost"
                >
                  {t.download}
                </a>
              </>
            ) : (
              <button
                type="button"
                className="avatar-btn avatar-btn--primary"
                onClick={() => void generate()}
                disabled={isGenerating}
              >
                {isGenerating ? t.birthing : t.birth}
              </button>
            )}
          </div>
        }
      />

      {gen.kind === "ready" && !stale && (
        <p className="avatar-meta-row">
          <span className="avatar-meta-pill">openai · gpt-image-1</span>
          <span className="avatar-meta-pill">{gen.cached ? t.cached : t.fresh}</span>
        </p>
      )}
      {stale && (
        <p className="avatar-privacy" style={{ color: "rgba(255,200,140,0.85)" }}>
          {t.traitsChanged}
        </p>
      )}
      {gen.kind === "error" && (
        <p className="avatar-error">{gen.message}</p>
      )}
      {cloudWarn && <p className="avatar-error">{cloudWarn}</p>}
      {savedKind === "selfie" && gen.kind !== "ready" && (
        <p className="avatar-privacy">
          {lang === "tr"
            ? "Şu an kayıtlı avatarın selfie ile yapılmış. Yeni AI tanrıçayı kaydedersen onu değiştirir."
            : "Your saved avatar is currently from a selfie. Saving this AI goddess will replace it."}
        </p>
      )}
      <p className="avatar-privacy">{t.privacy}</p>
      {authHydrated ? null : null}

      <div className="avatar-back-row">
        <Link href="/universe" className="avatar-back-link">
          {t.backHome}
        </Link>
        {savedUrl && next ? (
          <Link href={next} className="avatar-btn">
            {t.backShop}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

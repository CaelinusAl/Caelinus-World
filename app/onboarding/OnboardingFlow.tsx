"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useProfileStore } from "@/stores/profile-store";
import {
  ELEMENT_TONE,
  FREQUENCY_LABELS,
  INTENT_TUNING,
  INTENTS,
  ZODIAC_LABEL,
  type FrequencyProfile,
  type Intent,
} from "@/lib/frequency";

type Step = "threshold" | "intent" | "tuning" | "reveal";

type Lang = "tr" | "en";

const COPY: Record<Lang, {
  ribbonBack: string;
  ribbonMark: string;
  // step 1
  s1Kicker: string;
  s1Title: string;
  s1Lede: string;
  s1Day: string;
  s1Month: string;
  s1Year: string;
  s1Whisper: string;
  s1Continue: string;
  // step 2
  s2Kicker: string;
  s2Title: string;
  s2Lede: string;
  s2Continue: string;
  back: string;
  // step 3
  s3Kicker: string;
  s3Title: string;
  s3Whisper: string[];
  // step 4 (reveal)
  s4Kicker: string;
  s4FreqLabel: string;
  s4Zodiac: string;
  s4Element: string;
  s4Archetype: string;
  s4PlantTitle: string;
  s4ProductTitle: string;
  s4MottoBefore: string;
  s4CtaShop: string;
  s4CtaGaia: string;
  s4Restart: string;
  s4Manifesto: string;
}> = {
  tr: {
    ribbonBack: "Eşikten dön",
    ribbonMark: "CAELINUS · ONBOARDING",

    s1Kicker: "I · EŞİK",
    s1Title: "Doğduğun gün, evrenle yaptığın ilk anlaşmadır.",
    s1Lede: "Tarihini bize emanet et. Onu yıldız haritasına çeviririz.",
    s1Day: "Gün",
    s1Month: "Ay",
    s1Year: "Yıl",
    s1Whisper: "Yüzünü görmüyoruz, ismini sormuyoruz. Sadece tarih, sadece frekans.",
    s1Continue: "Devam ✦",

    s2Kicker: "II · NİYET",
    s2Title: "Bu yolculukta seni ne çağırıyor?",
    s2Lede: "Bir niyet seç. Frekansının rengi onunla incelir.",
    s2Continue: "Frekansımı Bul ✦",
    back: "← Geri",

    s3Kicker: "III · AKORT",
    s3Title: "Frekansın akort ediliyor",
    s3Whisper: [
      "Yıldızlarla konuşuluyor…",
      "Toprağa danışılıyor…",
      "Bedenine bir titreşim hediye ediliyor…",
    ],

    s4Kicker: "IV · VAHİY",
    s4FreqLabel: "Senin frekansın",
    s4Zodiac: "Burcun",
    s4Element: "Element",
    s4Archetype: "Arketip",
    s4PlantTitle: "Sana yoldaş bitki",
    s4ProductTitle: "Sana yakışan kıyafet",
    s4MottoBefore: "Senin manifestonun bir cümlesi:",
    s4CtaShop: "Frekansını Giy",
    s4CtaGaia: "Toprağa İn",
    s4Restart: "Yeniden akort ol",
    s4Manifesto: "Manifestoyu Oku",
  },
  en: {
    ribbonBack: "Back from threshold",
    ribbonMark: "CAELINUS · ONBOARDING",

    s1Kicker: "I · THE THRESHOLD",
    s1Title: "Your birthday is the first pact you made with the universe.",
    s1Lede: "Trust us with that date. We will turn it into a starmap.",
    s1Day: "Day",
    s1Month: "Month",
    s1Year: "Year",
    s1Whisper: "We do not see your face. We do not ask your name. Only the date. Only the frequency.",
    s1Continue: "Continue ✦",

    s2Kicker: "II · INTENT",
    s2Title: "What is calling you on this journey?",
    s2Lede: "Choose an intent. The color of your frequency will tune to it.",
    s2Continue: "Find My Frequency ✦",
    back: "← Back",

    s3Kicker: "III · TUNING",
    s3Title: "Your frequency is tuning in",
    s3Whisper: [
      "Speaking with the stars…",
      "Asking the soil…",
      "A vibration is offered to your body…",
    ],

    s4Kicker: "IV · REVELATION",
    s4FreqLabel: "Your frequency",
    s4Zodiac: "Your sign",
    s4Element: "Element",
    s4Archetype: "Archetype",
    s4PlantTitle: "Your plant companion",
    s4ProductTitle: "The garment that calls you",
    s4MottoBefore: "A line from your own manifesto:",
    s4CtaShop: "Wear Your Frequency",
    s4CtaGaia: "Descend to the Soil",
    s4Restart: "Re-attune",
    s4Manifesto: "Read the Manifesto",
  },
};

const PRODUCT_NAMES: Record<string, { tr: string; en: string; image: string; price: string }> = {
  b1:  { tr: "Aries — Ateş Müzesi",      en: "Aries — Fire Muse",         image: "/play/shop/aries-look.jpg",       price: "$220" },
  b2:  { tr: "Taurus — Toprak Tüllü",    en: "Taurus — Earth Veil",       image: "/play/shop/taurus-look.jpg",      price: "$220" },
  b3:  { tr: "Gemini — İkiz Işık",       en: "Gemini — Twin Light",       image: "/play/shop/gemini-look.jpg",      price: "$220" },
  b4:  { tr: "Cancer — Ay Tüllü",        en: "Cancer — Moon Veil",        image: "/play/shop/cancer-look.jpg",      price: "$240" },
  b5:  { tr: "Leo — Güneş Kraliçesi",    en: "Leo — Solar Queen",         image: "/play/shop/leo-look.jpg",         price: "$260" },
  b6:  { tr: "Virgo — İnci Şifresi",     en: "Virgo — Pearl Code",        image: "/play/shop/virgo-look.jpg",       price: "$220" },
  b7:  { tr: "Libra — Venüs Dengesi",    en: "Libra — Venus Balance",     image: "/play/shop/libra-look.jpg",       price: "$240" },
  b8:  { tr: "Scorpio — Gece Kahini",    en: "Scorpio — Night Oracle",    image: "/play/shop/scorpio-look.jpg",     price: "$260" },
  b9:  { tr: "Sagittarius — Altın Ok",   en: "Sagittarius — Golden Arrow", image: "/play/shop/sagittarius-look.jpg", price: "$240" },
  b10: { tr: "Capricorn — Taş Sireni",   en: "Capricorn — Stone Siren",   image: "/play/shop/capricorn-look.jpg",   price: "$260" },
  b11: { tr: "Aquarius — Yıldız Akıntısı", en: "Aquarius — Star Current", image: "/play/shop/aquarius-look.jpg",    price: "$240" },
  b12: { tr: "Pisces — Rüya Dalgası",    en: "Pisces — Dream Tide",       image: "/play/shop/pisces-look.jpg",      price: "$220" },
};

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Star = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
};

const CURRENT_YEAR = new Date().getFullYear();

export default function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");
  const [lang, setLang] = useState<Lang>(langParam === "en" ? "en" : "tr");

  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);
  const hydrate = useProfileStore((s) => s.hydrate);
  const attune = useProfileStore((s) => s.attune);
  const reset = useProfileStore((s) => s.reset);

  const [step, setStep] = useState<Step>("threshold");
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [computed, setComputed] = useState<FrequencyProfile | null>(null);

  // Hydrate profile on mount; if user already attuned, jump to reveal.
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && profile && !computed && step === "threshold") {
      setComputed(profile);
      setStep("reveal");
    }
  }, [hydrated, profile, computed, step]);

  const copy = COPY[lang];

  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 90 }).map((_, i) => ({
        id: i,
        left: ((i * 47) % 96) + 2,
        top: ((i * 71) % 92) + 2,
        size: (i % 4) + 1,
        delay: (i % 9) * 0.31,
        duration: 3 + (i % 5) * 0.7,
      })),
    []
  );

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
  const months = lang === "tr" ? MONTHS_TR : MONTHS_EN;
  const years = useMemo(
    () => Array.from({ length: CURRENT_YEAR - 1924 + 1 }, (_, i) => CURRENT_YEAR - i),
    []
  );

  const dobValid = day && month && year && Number(day) >= 1 && Number(day) <= 31 && Number(month) >= 1 && Number(month) <= 12 && Number(year) >= 1925 && Number(year) <= CURRENT_YEAR;

  function handleThresholdContinue() {
    if (!dobValid) return;
    setStep("intent");
  }

  function handleIntentContinue() {
    if (!intent) return;
    setStep("tuning");
    const dobIso = `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    // Theatrical pause (1.6s) before reveal.
    window.setTimeout(() => {
      const next = attune(dobIso, intent);
      setComputed(next);
      setStep("reveal");
    }, 1600);
  }

  function handleRestart() {
    reset();
    setComputed(null);
    setIntent(null);
    setDay("");
    setMonth("");
    setYear("");
    setStep("threshold");
  }

  return (
    <main className="onb-root">
      {/* Cosmic background */}
      <div className="onb-bg" aria-hidden="true" />
      <div className="onb-stars" aria-hidden="true">
        {stars.map((s) => {
          const style: CSSProperties = {
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          };
          return <span key={s.id} className="onb-star" style={style} />;
        })}
      </div>

      {/* Top ribbon */}
      <header className="onb-ribbon">
        <Link href="/universe" className="onb-ribbon-back">
          ← {copy.ribbonBack}
        </Link>
        <div className="onb-ribbon-mark">{copy.ribbonMark}</div>
        <div className="onb-lang" role="group" aria-label="Language">
          <button
            type="button"
            className={`onb-lang-btn ${lang === "tr" ? "is-active" : ""}`}
            onClick={() => setLang("tr")}
            aria-pressed={lang === "tr"}
          >
            TR
          </button>
          <span className="onb-lang-divider" aria-hidden="true">/</span>
          <button
            type="button"
            className={`onb-lang-btn ${lang === "en" ? "is-active" : ""}`}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
        </div>
      </header>

      {/* Step indicator */}
      <div className="onb-steps" aria-hidden="true">
        <span className={`onb-step-dot ${step === "threshold" ? "is-active" : ""} ${["intent","tuning","reveal"].includes(step) ? "is-done" : ""}`} />
        <span className={`onb-step-dot ${step === "intent" ? "is-active" : ""} ${["tuning","reveal"].includes(step) ? "is-done" : ""}`} />
        <span className={`onb-step-dot ${step === "tuning" ? "is-active" : ""} ${step === "reveal" ? "is-done" : ""}`} />
        <span className={`onb-step-dot ${step === "reveal" ? "is-active" : ""}`} />
      </div>

      <section className="onb-stage">
        {/* STEP 1 — THRESHOLD */}
        {step === "threshold" && (
          <div className="onb-card onb-fade-in">
            <div className="onb-kicker">{copy.s1Kicker}</div>
            <h1 className="onb-title">{copy.s1Title}</h1>
            <p className="onb-lede">{copy.s1Lede}</p>

            <div className="onb-dob">
              <label className="onb-field">
                <span className="onb-field-label">{copy.s1Day}</span>
                <select
                  className="onb-select"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  aria-label={copy.s1Day}
                >
                  <option value="">—</option>
                  {days.map((d) => (
                    <option key={d} value={String(d)}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="onb-field">
                <span className="onb-field-label">{copy.s1Month}</span>
                <select
                  className="onb-select"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  aria-label={copy.s1Month}
                >
                  <option value="">—</option>
                  {months.map((m, i) => (
                    <option key={m} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="onb-field">
                <span className="onb-field-label">{copy.s1Year}</span>
                <select
                  className="onb-select"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  aria-label={copy.s1Year}
                >
                  <option value="">—</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </label>
            </div>

            <p className="onb-whisper">{copy.s1Whisper}</p>

            <button
              type="button"
              className={`onb-cta ${dobValid ? "" : "is-disabled"}`}
              onClick={handleThresholdContinue}
              disabled={!dobValid}
            >
              {copy.s1Continue}
            </button>
          </div>
        )}

        {/* STEP 2 — INTENT */}
        {step === "intent" && (
          <div className="onb-card onb-fade-in">
            <div className="onb-kicker">{copy.s2Kicker}</div>
            <h1 className="onb-title">{copy.s2Title}</h1>
            <p className="onb-lede">{copy.s2Lede}</p>

            <div className="onb-intent-grid">
              {INTENTS.map((id) => {
                const t = INTENT_TUNING[id];
                const active = intent === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`onb-intent-card ${active ? "is-active" : ""}`}
                    style={{
                      ["--intent-color" as string]: t.color,
                    } as CSSProperties}
                    onClick={() => setIntent(id)}
                    aria-pressed={active}
                  >
                    <span className="onb-intent-symbol" aria-hidden="true">{t.symbol}</span>
                    <span className="onb-intent-label">{t.label[lang]}</span>
                    <span className="onb-intent-whisper">{t.whisper[lang]}</span>
                    {t.hzShift && (
                      <span className="onb-intent-hz">{t.hzShift} Hz</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="onb-actions">
              <button
                type="button"
                className="onb-back"
                onClick={() => setStep("threshold")}
              >
                {copy.back}
              </button>
              <button
                type="button"
                className={`onb-cta ${intent ? "" : "is-disabled"}`}
                onClick={handleIntentContinue}
                disabled={!intent}
              >
                {copy.s2Continue}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — TUNING */}
        {step === "tuning" && (
          <TuningRitual title={copy.s3Title} kicker={copy.s3Kicker} whispers={copy.s3Whisper} />
        )}

        {/* STEP 4 — REVEAL */}
        {step === "reveal" && computed && (
          <Reveal
            profile={computed}
            lang={lang}
            copy={copy}
            onRestart={handleRestart}
            onShop={() => router.push(`/universe/shop?zodiac=${computed.zodiac}`)}
            onGaia={() => router.push(`/universe/gaia/plants`)}
          />
        )}
      </section>
    </main>
  );
}

/* ─────────────────────────────────────────────
   TUNING RITUAL — animated cosmic loader
   ───────────────────────────────────────────── */

function TuningRitual({ title, kicker, whispers }: { title: string; kicker: string; whispers: string[] }) {
  const [whisperIdx, setWhisperIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setWhisperIdx((i) => (i + 1) % whispers.length);
    }, 600);
    return () => window.clearInterval(id);
  }, [whispers.length]);

  return (
    <div className="onb-card onb-tuning onb-fade-in">
      <div className="onb-kicker">{kicker}</div>
      <h1 className="onb-title">{title}</h1>

      <div className="onb-aura" aria-hidden="true">
        <div className="onb-aura-ring onb-aura-ring-1" />
        <div className="onb-aura-ring onb-aura-ring-2" />
        <div className="onb-aura-ring onb-aura-ring-3" />
        <div className="onb-aura-core" />
      </div>

      <div className="onb-tuning-whisper" aria-live="polite">
        {whispers[whisperIdx]}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REVEAL — the moment of truth
   ───────────────────────────────────────────── */

function Reveal({
  profile,
  lang,
  copy,
  onRestart,
  onShop,
  onGaia,
}: {
  profile: FrequencyProfile;
  lang: Lang;
  copy: (typeof COPY)["tr"];
  onRestart: () => void;
  onShop: () => void;
  onGaia: () => void;
}) {
  const tone = ELEMENT_TONE[profile.element];
  const counter = useFrequencyCounter(profile.frequency, 1400);
  const motto = FREQUENCY_LABELS[profile.frequency][lang];
  const product = PRODUCT_NAMES[profile.productId];

  return (
    <div
      className="onb-reveal onb-fade-in"
      style={{
        ["--rev-color" as string]: tone.color,
        ["--rev-glow" as string]: tone.glow,
      } as CSSProperties}
    >
      <div className="onb-reveal-aura" aria-hidden="true">
        <div className="onb-reveal-ring onb-reveal-ring-1" />
        <div className="onb-reveal-ring onb-reveal-ring-2" />
        <div className="onb-reveal-ring onb-reveal-ring-3" />
      </div>

      <div className="onb-kicker">{copy.s4Kicker}</div>

      <div className="onb-freq-label">{copy.s4FreqLabel}</div>
      <div className="onb-freq-number">
        <span className="onb-freq-num">{counter}</span>
        <span className="onb-freq-unit">Hz</span>
      </div>
      <div className="onb-freq-motto">"{motto}"</div>

      <div className="onb-meta-grid">
        <div className="onb-meta">
          <span className="onb-meta-label">{copy.s4Zodiac}</span>
          <span className="onb-meta-value">
            <span className="onb-zodiac-symbol" aria-hidden="true">{ZODIAC_LABEL[profile.zodiac].symbol}</span>
            {ZODIAC_LABEL[profile.zodiac][lang]}
          </span>
        </div>
        <div className="onb-meta">
          <span className="onb-meta-label">{copy.s4Element}</span>
          <span className="onb-meta-value">{tone.label[lang]}</span>
        </div>
        <div className="onb-meta">
          <span className="onb-meta-label">{copy.s4Archetype}</span>
          <span className="onb-meta-value">{profile.archetype[lang]}</span>
        </div>
      </div>

      <p className="onb-motto-intro">{copy.s4MottoBefore}</p>

      <div className="onb-recs">
        <article className="onb-rec">
          <div className="onb-rec-label">{copy.s4PlantTitle}</div>
          <div className="onb-rec-image">
            <img src={profile.plant.image} alt={profile.plant.name[lang]} draggable={false} />
            <span className="onb-rec-hz">{profile.plant.hz} Hz</span>
          </div>
          <div className="onb-rec-name">{profile.plant.name[lang]}</div>
          <div className="onb-rec-region">{profile.plant.region}</div>
          <p className="onb-rec-whisper">"{profile.plant.whisper[lang]}"</p>
        </article>

        {product && (
          <article className="onb-rec">
            <div className="onb-rec-label">{copy.s4ProductTitle}</div>
            <div className="onb-rec-image">
              <img src={product.image} alt={product[lang]} draggable={false} />
              <span className="onb-rec-hz">{profile.frequency} Hz</span>
            </div>
            <div className="onb-rec-name">{product[lang]}</div>
            <div className="onb-rec-region">{product.price}</div>
          </article>
        )}
      </div>

      <div className="onb-cta-row">
        <button type="button" className="onb-cta onb-cta-primary" onClick={onShop}>
          {copy.s4CtaShop} <span aria-hidden="true">◐</span>
        </button>
        <button type="button" className="onb-cta onb-cta-secondary" onClick={onGaia}>
          {copy.s4CtaGaia} <span aria-hidden="true">✦</span>
        </button>
      </div>

      <div className="onb-reveal-foot">
        <Link href="/manifesto" className="onb-foot-link">
          {copy.s4Manifesto} →
        </Link>
        <button type="button" className="onb-foot-link onb-foot-restart" onClick={onRestart}>
          {copy.s4Restart} ↻
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Animated frequency counter — rolls up from 0
   ───────────────────────────────────────────── */

function useFrequencyCounter(target: number, durationMs: number): number {
  const [value, setValue] = useState(0);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
    setValue(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(targetRef.current * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

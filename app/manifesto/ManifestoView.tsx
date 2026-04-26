"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type Lang = "tr" | "en";

type Section = {
  key: string;
  heading: string;
  paragraphs: string[][];
};

type Props = {
  tr: string;
  en: string;
};

const COPY: Record<
  Lang,
  {
    kicker: string;
    backToUniverse: string;
    scrollCue: string;
    beliefTitle: string;
    triadCards: { mark: string; title: string; body: string }[];
    existTitle: string;
    existIntro: string;
    woundsTitle: string;
    healingsTitle: string;
    wounds: string[];
    healings: string[];
    workTitle: string;
    workIntro: string;
    plantsTitle: string;
    plantsIntro: string;
    promiseTitle: string;
    promiseLines: string[];
    callingTitle: string;
    callingLines: string[];
    ctaShop: string;
    ctaGaia: string;
    closing: string;
    finalQuote: string;
    home: string;
  }
> = {
  tr: {
    kicker: "✦ CAELINUS MANİFESTO ✦",
    backToUniverse: "Evrene Dön",
    scrollCue: "Aşağı kay",
    beliefTitle: "İnanıyoruz ki",
    triadCards: [
      {
        mark: "I",
        title: "BEDEN",
        body: "Beden bir kıyafet değil, bir tapınaktır. Sana en az kalbin kadar yakındır.",
      },
      {
        mark: "II",
        title: "TOPRAK",
        body: "Toprak bir kaynak değil, bir annedir. Konuşur, hatırlar, şifa verir.",
      },
      {
        mark: "III",
        title: "MODA",
        body: "Moda bir tüketim değil, bir ritüeldir. Frekansını giyersen, evreni giyersin.",
      },
    ],
    existTitle: "Neden varız",
    existIntro:
      "Bu üç yarayı aynı anda iyileştirmek için doğduk. Her birine ayrı bir merhem sürdük.",
    woundsTitle: "Yara",
    healingsTitle: "Şifa",
    wounds: [
      "Dünya hızlı moda ile yorgun düştü",
      "Toprak bilinçsiz tüketimle sustu",
      "İnsan kendi titreşimini unuttu",
    ],
    healings: [
      "Bedeni — kozmik bilince yeniden bağlayarak",
      "Toprağı — üreticisiyle aynı tabloda buluşturarak",
      "Ruhu — şifa frekanslarıyla yeniden akort ederek",
    ],
    workTitle: "Solfeggio frekans merdiveni",
    workIntro:
      "Her ürünümüz bir frekansa akort edilir. Sen kıyafetini değil, frekansını seçersin.",
    plantsTitle: "Toprağın sesi",
    plantsIntro:
      "Bitkilerimiz Türkiye'nin köşelerinden gelir. Onları yetiştiren ellerle aynı masada otururuz.",
    promiseTitle: "Vaadimiz",
    promiseLines: [
      "Sana satmayacağız —",
      "sana hatırlatacağız.",
      "Yıldız tozundan yapılmış",
      "bir tapınak olduğunu.",
    ],
    callingTitle: "Çağrımız",
    callingLines: [
      "Ay'a dokun.",
      "Eşik açılsın.",
      "Frekansını giy.",
      "Toprağa selam ver.",
    ],
    ctaShop: "Frekansını Giy",
    ctaGaia: "Toprağa İn",
    closing: "Sen artık göğe aitsin.",
    finalQuote: "Frekansını giy, evrenle dans et.",
    home: "Aya Dön",
  },
  en: {
    kicker: "✦ CAELINUS MANIFESTO ✦",
    backToUniverse: "Back to Universe",
    scrollCue: "Scroll",
    beliefTitle: "We believe",
    triadCards: [
      {
        mark: "I",
        title: "THE BODY",
        body: "The body is not a garment but a temple. As close to you as your own heartbeat.",
      },
      {
        mark: "II",
        title: "THE SOIL",
        body: "The soil is not a resource but a mother. She speaks, remembers, and heals.",
      },
      {
        mark: "III",
        title: "FASHION",
        body: "Fashion is not consumption but a ritual. Wear your frequency, and you wear the universe.",
      },
    ],
    existTitle: "Why we exist",
    existIntro:
      "We were born to heal three wounds at once — each one tended with its own salve.",
    woundsTitle: "Wound",
    healingsTitle: "Healing",
    wounds: [
      "The world is exhausted by fast fashion",
      "The soil has gone silent under unconscious consumption",
      "The human has forgotten her own vibration",
    ],
    healings: [
      "The body — reconnected to cosmic awareness",
      "The soil — seated at the same table as its grower",
      "The soul — retuned to healing frequencies",
    ],
    workTitle: "The Solfeggio ladder",
    workIntro:
      "Each piece is tuned to a frequency. You don't choose a garment, you choose a vibration.",
    plantsTitle: "Voice of the soil",
    plantsIntro:
      "Our plants come from the corners of Anatolia. We sit at the table of those who grow them.",
    promiseTitle: "Our promise",
    promiseLines: [
      "We will not sell to you —",
      "we will remind you.",
      "That you are a temple",
      "made of stardust.",
    ],
    callingTitle: "Our calling",
    callingLines: [
      "Touch the moon.",
      "Let the threshold open.",
      "Wear your frequency.",
      "Greet the soil.",
    ],
    ctaShop: "Wear Your Frequency",
    ctaGaia: "Descend to the Soil",
    closing: "You belong to the sky now.",
    finalQuote: "Wear your frequency, dance with the universe.",
    home: "Return to the Moon",
  },
};

const SOLFEGGIO = [
  {
    hz: 396,
    tr: "Suçluluğu salar",
    en: "Releases guilt",
    color: "linear-gradient(90deg, #ff6b6b, #ff9966)",
  },
  {
    hz: 417,
    tr: "Değişimi başlatır",
    en: "Initiates change",
    color: "linear-gradient(90deg, #ff9966, #ffcc66)",
  },
  {
    hz: 528,
    tr: "Hücreleri şifalandırır",
    en: "Heals the cells",
    color: "linear-gradient(90deg, #ffd479, #b6e26e)",
  },
  {
    hz: 639,
    tr: "İlişkileri iyileştirir",
    en: "Mends relationships",
    color: "linear-gradient(90deg, #6effc1, #6ec3ff)",
  },
  {
    hz: 741,
    tr: "Hakikati uyandırır",
    en: "Awakens truth",
    color: "linear-gradient(90deg, #6ec3ff, #8a9bff)",
  },
  {
    hz: 852,
    tr: "Sezgiyi açar",
    en: "Opens intuition",
    color: "linear-gradient(90deg, #a08aff, #c98aff)",
  },
  {
    hz: 963,
    tr: "Bilinci genişletir",
    en: "Expands consciousness",
    color: "linear-gradient(90deg, #c98aff, #ff8ad9)",
  },
];

const PLANTS = [
  {
    id: "lavanta",
    image: "/universe/plants/lavanta.png",
    tr: { name: "Lavanta", region: "İzmir / Isparta", whisper: "Toprağın mor nefesi" },
    en: { name: "Lavender", region: "Izmir / Isparta", whisper: "The violet breath of the earth" },
    hz: "118 Hz",
  },
  {
    id: "zeytin",
    image: "/universe/plants/zeytin.png",
    tr: { name: "Zeytin", region: "Ege", whisper: "Güneşle konuşan bilge" },
    en: { name: "Olive", region: "Aegean", whisper: "The sage who speaks with the sun" },
    hz: "528 Hz",
  },
  {
    id: "gul",
    image: "/universe/plants/gul.png",
    tr: { name: "Gül", region: "Isparta", whisper: "Toprağın kalpten konuştuğu an" },
    en: { name: "Rose", region: "Isparta", whisper: "The moment soil speaks from the heart" },
    hz: "320 Hz",
  },
  {
    id: "adacayi",
    image: "/universe/plants/adacayi.png",
    tr: { name: "Adaçayı", region: "İzmir / Ankara", whisper: "Eski bilginin hafızası" },
    en: { name: "Sage", region: "Izmir / Ankara", whisper: "The memory of ancient wisdom" },
    hz: "741 Hz",
  },
  {
    id: "biberiye",
    image: "/universe/plants/biberiye.png",
    tr: { name: "Biberiye", region: "İzmir / Antalya", whisper: "Rüzgarı hafızasında saklayan uyanış" },
    en: { name: "Rosemary", region: "Izmir / Antalya", whisper: "The awakening that remembers wind" },
    hz: "432 Hz",
  },
  {
    id: "melisa",
    image: "/universe/plants/melisa.png",
    tr: { name: "Melisa", region: "Isparta / Trabzon", whisper: "Telaşın içinden geçen huzur nehri" },
    en: { name: "Lemon Balm", region: "Isparta / Trabzon", whisper: "A river of stillness through the rush" },
    hz: "432 Hz",
  },
  {
    id: "yasemin",
    image: "/universe/plants/yasemin.png",
    tr: { name: "Yasemin", region: "Akdeniz / Ege", whisper: "Yıldızların gece kokusu" },
    en: { name: "Jasmine", region: "Mediterranean / Aegean", whisper: "Night fragrance of the stars" },
    hz: "432 Hz",
  },
];

type Star = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
};

export default function ManifestoView({ tr, en }: Props) {
  const [lang, setLang] = useState<Lang>("tr");
  const [scrollY, setScrollY] = useState(0);
  const sections = useMemo(() => parseSections(lang === "tr" ? tr : en), [lang, tr, en]);
  const copy = COPY[lang];

  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 110 }).map((_, i) => ({
        id: i,
        left: ((i * 47) % 96) + 2,
        top: ((i * 71) % 92) + 2,
        size: (i % 4) + 1,
        delay: (i % 9) * 0.31,
        duration: 3 + (i % 5) * 0.7,
      })),
    []
  );

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const promiseSection = sections.find((s) => /VAAT|PROMISE/i.test(s.heading));
  const callingSection = sections.find((s) => /ÇAĞRI|CALLING/i.test(s.heading));

  return (
    <main className="mf-root">
      {/* TOP RIBBON */}
      <header className="mf-ribbon">
        <Link href="/universe" className="mf-ribbon-back">
          ← {copy.backToUniverse}
        </Link>
        <div className="mf-ribbon-mark">CAELINUS · MANIFESTO</div>
        <div className="mf-lang" role="group" aria-label="Language">
          <button
            type="button"
            className={`mf-lang-btn ${lang === "tr" ? "is-active" : ""}`}
            onClick={() => setLang("tr")}
            aria-pressed={lang === "tr"}
          >
            TR
          </button>
          <span className="mf-lang-divider" aria-hidden="true">/</span>
          <button
            type="button"
            className={`mf-lang-btn ${lang === "en" ? "is-active" : ""}`}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
        </div>
      </header>

      {/* HERO */}
      <Hero
        copy={copy}
        stars={stars}
        scrollY={scrollY}
        manifestoText={lang === "tr" ? tr : en}
      />

      {/* BELIEF TRIAD */}
      <section className="mf-section mf-belief">
        <SectionTitle kicker="I" title={copy.beliefTitle} />
        <div className="mf-triad">
          {copy.triadCards.map((c) => (
            <article key={c.title} className="mf-triad-card">
              <div className="mf-triad-mark">{c.mark}</div>
              <h3 className="mf-triad-title">{c.title}</h3>
              <p className="mf-triad-body">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* WHY WE EXIST — wounds vs healings */}
      <section className="mf-section mf-exist">
        <SectionTitle kicker="II" title={copy.existTitle} />
        <p className="mf-section-lede">{copy.existIntro}</p>

        <div className="mf-wounds-grid">
          <div className="mf-wounds-col">
            <div className="mf-wounds-label">{copy.woundsTitle}</div>
            <ul className="mf-wounds-list">
              {copy.wounds.map((w, i) => (
                <li key={i} className="mf-wound-item">
                  <span className="mf-wound-num">0{i + 1}</span>
                  <span className="mf-wound-text">{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mf-wounds-arrow" aria-hidden="true">→</div>

          <div className="mf-wounds-col mf-wounds-col-light">
            <div className="mf-wounds-label">{copy.healingsTitle}</div>
            <ul className="mf-wounds-list">
              {copy.healings.map((h, i) => (
                <li key={i} className="mf-wound-item">
                  <span className="mf-wound-num">✦</span>
                  <span className="mf-wound-text">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SOLFEGGIO LADDER */}
      <section className="mf-section mf-ladder-section">
        <SectionTitle kicker="III" title={copy.workTitle} />
        <p className="mf-section-lede">{copy.workIntro}</p>

        <div className="mf-ladder">
          {SOLFEGGIO.map((row, i) => (
            <div key={row.hz} className="mf-ladder-row" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="mf-ladder-hz">{row.hz}<span>Hz</span></div>
              <div className="mf-ladder-bar">
                <div
                  className="mf-ladder-fill"
                  style={{
                    background: row.color,
                    width: `${40 + i * 8}%`,
                  }}
                />
              </div>
              <div className="mf-ladder-meaning">{lang === "tr" ? row.tr : row.en}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PLANTS RIBBON */}
      <section className="mf-section mf-plants-section">
        <SectionTitle kicker="IV" title={copy.plantsTitle} />
        <p className="mf-section-lede">{copy.plantsIntro}</p>

        <div className="mf-plants-grid">
          {PLANTS.map((p) => (
            <article key={p.id} className="mf-plant-card">
              <div className="mf-plant-image-wrap">
                <img
                  src={p.image}
                  alt={p[lang].name}
                  className="mf-plant-image"
                  draggable={false}
                />
                <span className="mf-plant-hz">{p.hz}</span>
              </div>
              <div className="mf-plant-info">
                <h4 className="mf-plant-name">{p[lang].name}</h4>
                <div className="mf-plant-region">{p[lang].region}</div>
                <p className="mf-plant-whisper">"{p[lang].whisper}"</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PROMISE — pull quote */}
      <section className="mf-section mf-promise-section">
        <SectionTitle kicker="V" title={copy.promiseTitle} />
        <blockquote className="mf-pull-quote">
          {copy.promiseLines.map((l, i) => (
            <span key={i} className="mf-quote-line">{l}</span>
          ))}
        </blockquote>
        {promiseSection && promiseSection.paragraphs.length > 0 && (
          <p className="mf-promise-source">
            {promiseSection.paragraphs[0].join(" ")}
          </p>
        )}
      </section>

      {/* CALLING — final ritual + CTA */}
      <section className="mf-section mf-calling-section">
        <SectionTitle kicker="VI" title={copy.callingTitle} />

        <ol className="mf-calling-steps">
          {copy.callingLines.map((line, i) => (
            <li key={i} className="mf-calling-step">
              <span className="mf-calling-step-num">0{i + 1}</span>
              <span className="mf-calling-step-text">{line}</span>
            </li>
          ))}
        </ol>

        <div className="mf-closing">{copy.closing}</div>

        <div className="mf-cta-row">
          <Link href="/universe/shop" className="mf-cta mf-cta-primary">
            {copy.ctaShop} <span aria-hidden="true">◐</span>
          </Link>
          <Link href="/universe/gaia" className="mf-cta mf-cta-secondary">
            {copy.ctaGaia} <span aria-hidden="true">✦</span>
          </Link>
        </div>

        {callingSection && callingSection.paragraphs.length > 0 && (
          <p className="mf-calling-source">
            {callingSection.paragraphs.flat().join(" ")}
          </p>
        )}

        <div className="mf-final-quote">"{copy.finalQuote}"</div>
        <Link href="/" className="mf-home-link">
          ← {copy.home} ◐
        </Link>
      </section>
    </main>
  );
}

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mf-section-head">
      <div className="mf-section-kicker">{kicker}</div>
      <h2 className="mf-section-title">{title}</h2>
    </div>
  );
}

function Hero({
  copy,
  stars,
  scrollY,
  manifestoText,
}: {
  copy: (typeof COPY)["tr"];
  stars: Star[];
  scrollY: number;
  manifestoText: string;
}) {
  const intro = useMemo(() => {
    const lines = manifestoText
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.slice(2, 7);
  }, [manifestoText]);

  const heroRef = useRef<HTMLElement>(null);
  const parallax = Math.min(scrollY * 0.4, 280);

  return (
    <section ref={heroRef} className="mf-hero">
      <div
        className="mf-hero-bg"
        style={{ transform: `translateY(${parallax * 0.5}px)` }}
        aria-hidden="true"
      />
      <div className="mf-hero-overlay" aria-hidden="true" />

      <div className="mf-stars" aria-hidden="true">
        {stars.map((s) => {
          const style: CSSProperties = {
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          };
          return <span key={s.id} className="mf-star" style={style} />;
        })}
      </div>

      <div
        className="mf-hero-moon"
        style={{ transform: `translateY(${-parallax * 0.25}px)` }}
        aria-hidden="true"
      >
        <img src="/moon/moon-real.png" alt="" draggable={false} />
      </div>

      <div className="mf-hero-content">
        <div className="mf-hero-kicker">{copy.kicker}</div>
        <h1 className="mf-hero-title">
          {(copy === COPY.tr ? "GÖĞE AİT OLANLARIN" : "FOR THOSE WHO BELONG").split(" ").map((w, i) => (
            <span key={i} className="mf-hero-word">{w}</span>
          ))}
          <span className="mf-hero-title-2">
            {copy === COPY.tr ? "ÇAĞRISI" : "TO THE SKY"}
          </span>
        </h1>

        <div className="mf-hero-intro">
          {intro.map((line, i) => (
            <p key={i} className="mf-hero-intro-line">{line}</p>
          ))}
        </div>

        <div className="mf-hero-scroll" aria-hidden="true">
          <div className="mf-hero-scroll-line" />
          <div className="mf-hero-scroll-text">{copy.scrollCue}</div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Manifesto plain-text parser
   ───────────────────────────────────────────── */

function parseSections(raw: string): Section[] {
  if (!raw.trim()) return [];

  const groups = raw
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((g) => g.trim())
    .filter(Boolean);

  const sections: Section[] = [];
  let current: Section | null = null;

  groups.forEach((group) => {
    if (group === "✦") return;
    const lines = group.split("\n").map((l) => l.trim()).filter(Boolean);
    const joined = lines.join(" ");

    if (/^[A-ZĞÜŞİÖÇ\s—✦]+$/u.test(joined) && lines.length <= 2) {
      current = {
        key: lines[0],
        heading: lines.join(" "),
        paragraphs: [],
      };
      sections.push(current);
    } else if (current) {
      current.paragraphs.push(lines);
    }
  });

  return sections;
}

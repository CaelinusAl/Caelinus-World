"use client";

/**
 * StylistPanel — "Bugün ne giysem?" / Gün / Gece kombin önerici.
 *
 * Vizyon: AI ile seçilen, ama mağazadaki gerçek SKU'larla çalışan
 * dijital moda danışmanı. UI hızlı ve ritüel hissinde:
 *
 *   • 3 zaman dilimi sekmesi: Şimdi · Gün · Gece
 *   • İsteğe bağlı burç chip'i (12 burç)
 *   • İsteğe bağlı tek satır niyet
 *   • Sonuç: 5 ürün kartı + "Avatara Giydir" + tekli "Sadece bunu giy"
 *
 * Engine `/api/stylist` üzerinden çağrılır. Network başarısız
 * olursa (offline, edge cold-start), aynı motor client-side
 * fallback olarak çalışır — kullanıcı asla boş ekran görmez.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useWardrobeStore } from "@/stores/wardrobe-store";
import {
  buildStylistLook,
  STYLIST_ZODIACS,
  type StylistLook,
  type StylistSlot,
} from "@/lib/stylist/engine";

import StylistAvatarPreview from "./StylistAvatarPreview";

const SLOT_LABELS: Record<StylistSlot, { tr: string; en: string; hint: { tr: string; en: string } }> = {
  now: {
    tr: "Şimdi",
    en: "Now",
    hint: {
      tr: "Saatine göre gün/gece otomatik seçilir.",
      en: "Day or night picked automatically from your hour.",
    },
  },
  day: {
    tr: "Gün",
    en: "Day",
    hint: { tr: "Açık, akışkan, deniz tuzu.", en: "Light, flowing, salt-bright." },
  },
  night: {
    tr: "Gece",
    en: "Night",
    hint: { tr: "Velvet karanlık, parıltı, ay.", en: "Velvet dark, shimmer, moon." },
  },
};

type Props = {
  lang?: "tr" | "en";
};

export default function StylistPanel({ lang = "tr" }: Props) {
  const [slot, setSlot] = useState<StylistSlot>("now");
  const [zodiac, setZodiac] = useState<string>("");
  const [intent, setIntent] = useState<string>("");
  const [look, setLook] = useState<StylistLook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const requestSeq = useRef(0);

  const dressProduct = useWardrobeStore((s) => s.dressProduct);
  const clearAllSlots = useWardrobeStore((s) => s.clearAllSlots);

  /** Saat — `now` modunda gönderilecek. Sayfa açıldığında hesaplanır. */
  const currentHour = useMemo(() => {
    if (typeof window === "undefined") return 12;
    return new Date().getHours();
  }, []);

  const fetchLook = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot,
          zodiac: zodiac || undefined,
          intent: intent || undefined,
          hour: slot === "now" ? currentHour : undefined,
          lang,
        }),
      });
      const json = (await res.json()) as
        | { ok: true; look: StylistLook }
        | { error: string };
      if (seq !== requestSeq.current) return; // race koruması
      if (!("ok" in json) || !json.ok) {
        // Network değil, body hatası — yine de client engine ile dön.
        const offline = buildStylistLook(
          {
            slot,
            zodiac: zodiac || undefined,
            intent: intent || undefined,
            hour: slot === "now" ? currentHour : undefined,
          },
          lang,
        );
        setLook(offline);
        return;
      }
      setLook(json.look);
    } catch {
      // Offline / edge cold-start — client-side fallback.
      const offline = buildStylistLook(
        {
          slot,
          zodiac: zodiac || undefined,
          intent: intent || undefined,
          hour: slot === "now" ? currentHour : undefined,
        },
        lang,
      );
      if (seq === requestSeq.current) {
        setLook(offline);
        setError(
          lang === "tr"
            ? "Bağlantı yavaş — yerel öneri gösteriliyor."
            : "Slow connection — showing local pick.",
        );
      }
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [slot, zodiac, intent, currentHour, lang]);

  // Slot/zodiac değişince otomatik yeni öneri.
  useEffect(() => {
    void fetchLook();
  }, [fetchLook]);

  const dressAll = useCallback(() => {
    if (!look) return;
    clearAllSlots();
    look.items.forEach((it) => dressProduct(it.product));
    // Stage'e kaydır
    if (typeof window !== "undefined") {
      const stage = document.querySelector(".shop-avatar-stage");
      stage?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [look, clearAllSlots, dressProduct]);

  return (
    <div className="stylist-panel">
      <header className="stylist-header">
        <div className="stylist-kicker">
          ✦ {lang === "tr" ? "Caelinus AI Danışman" : "Caelinus AI Stylist"} ✦
        </div>
        <h2 className="stylist-title">
          {lang === "tr" ? "Bugün ne giysem?" : "What should I wear today?"}
        </h2>
        <p className="stylist-sub">
          {lang === "tr"
            ? "Mağazadaki gerçek parçalardan, sana özel kombin."
            : "A look made from the real pieces in the store."}
        </p>
      </header>

      {/* SLOT TABS */}
      <div className="stylist-tabs" role="tablist">
        {(["now", "day", "night"] as StylistSlot[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={slot === s}
            className={`stylist-tab ${slot === s ? "active" : ""}`}
            onClick={() => setSlot(s)}
            type="button"
          >
            <span className="stylist-tab-label">{SLOT_LABELS[s][lang]}</span>
            <span className="stylist-tab-hint">{SLOT_LABELS[s].hint[lang]}</span>
          </button>
        ))}
      </div>

      {/* ZODIAC CHIPS */}
      <div className="stylist-chips" aria-label={lang === "tr" ? "Burç" : "Zodiac"}>
        <button
          type="button"
          className={`stylist-chip ${zodiac === "" ? "active" : ""}`}
          onClick={() => setZodiac("")}
        >
          {lang === "tr" ? "Burç yok" : "No zodiac"}
        </button>
        {STYLIST_ZODIACS.map((z) => (
          <button
            key={z}
            type="button"
            className={`stylist-chip ${zodiac === z ? "active" : ""}`}
            onClick={() => setZodiac(z)}
          >
            {z.charAt(0).toUpperCase() + z.slice(1)}
          </button>
        ))}
      </div>

      {/* INTENT */}
      <label className="stylist-intent">
        <span className="stylist-intent-label">
          {lang === "tr" ? "Niyet (opsiyonel)" : "Intent (optional)"}
        </span>
        <input
          type="text"
          className="stylist-intent-input"
          maxLength={120}
          placeholder={
            lang === "tr"
              ? "örn. denize gidiyorum, akşam yemeği, doğum günüm…"
              : "e.g. heading to the sea, dinner, my birthday…"
          }
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void fetchLook();
            }
          }}
        />
        <button
          type="button"
          className="stylist-intent-btn"
          onClick={() => void fetchLook()}
          disabled={loading}
        >
          {loading
            ? lang === "tr"
              ? "Düşünüyor…"
              : "Thinking…"
            : lang === "tr"
              ? "Yeniden öner"
              : "Suggest again"}
        </button>
      </label>

      {/* RESULT */}
      {error ? <p className="stylist-warn">{error}</p> : null}

      {look ? (
        <article className="stylist-look">
          <header className="stylist-look-head">
            <div className="stylist-look-meta">
              <span className="stylist-look-slot">
                {look.resolvedSlot === "day"
                  ? lang === "tr"
                    ? "GÜN"
                    : "DAY"
                  : lang === "tr"
                    ? "GECE"
                    : "NIGHT"}
              </span>
              {look.signatureFrequency ? (
                <span className="stylist-look-freq">{look.signatureFrequency}</span>
              ) : null}
            </div>
            <h3 className="stylist-look-title">{look.title}</h3>
            <p className="stylist-look-narr">{look.narrative}</p>
          </header>

          <div className="stylist-items">
            {look.items.map((it) => (
              <div key={it.product.id} className="stylist-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.product.image}
                  alt={it.product.name}
                  className="stylist-item-img"
                  loading="lazy"
                />
                <div className="stylist-item-body">
                  <div className="stylist-item-name">{it.product.name}</div>
                  <div className="stylist-item-rationale">{it.rationale}</div>
                  <div className="stylist-item-foot">
                    <span className="stylist-item-price">
                      ${it.product.numericPrice}
                    </span>
                    <button
                      type="button"
                      className="stylist-item-btn"
                      onClick={() => dressProduct(it.product)}
                    >
                      {lang === "tr" ? "Sadece bunu giy" : "Wear only this"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <footer className="stylist-look-foot">
            <span className="stylist-look-total">
              {lang === "tr" ? "Toplam" : "Total"}: ${look.totalPrice}
            </span>
            <button
              type="button"
              className="stylist-look-cta stylist-look-cta--ghost"
              onClick={() => setShowAvatarPreview(true)}
            >
              {lang === "tr" ? "✦ AI ile Avatarımda Gör" : "✦ See on My AI Avatar"}
            </button>
            <button type="button" className="stylist-look-cta" onClick={dressAll}>
              {lang === "tr" ? "✦ Avatara Giydir" : "✦ Dress the Avatar"}
            </button>
          </footer>
        </article>
      ) : !loading ? (
        <p className="stylist-empty">
          {lang === "tr"
            ? "Bir an içinde önerin geliyor…"
            : "Your suggestion is on the way…"}
        </p>
      ) : null}

      {showAvatarPreview && look ? (
        <StylistAvatarPreview
          look={look}
          lang={lang}
          onClose={() => setShowAvatarPreview(false)}
        />
      ) : null}
    </div>
  );
}

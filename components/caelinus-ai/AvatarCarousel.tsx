"use client";

/**
 * AvatarCarousel — Caelinus AI'ın "kendi bedeni seç" akışı.
 *
 * Founder vision'daki "avatar carousel" gereksinimini karşılar:
 * kullanıcı bir avatar listesi (Caelinus Body Library + varsa kendi
 * üretilmiş avatarı) arasında yatay olarak gezer, tıklayınca seçim
 * yapar. Üst component (shop / avatar / try-on) seçilen body'nin
 * GLB url'ini sahneye geçirir.
 *
 * Özellikler:
 *   • Mobile-first scroll-snap horizontal carousel
 *   • Klavye desteği (← / → ile navigasyon, Enter ile seç)
 *   • "✦ Senin avatar'ın" rozeti (storage'dan gelen GeneratedAvatar)
 *   • "Default" rozeti (Caelinus Aslı)
 *   • Boş durum: "Henüz avatar oluşturmadın" → /caelinus-ai/avatar
 *
 * QR-ready: ileride telefondan selfie çekildiğinde yeni avatar listeye
 * dinamik olarak girer; mimari aynı kalır (sadece props değişir).
 */

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CAELINUS_BODY_LIBRARY,
  DEFAULT_BODY_ID,
  type BodyEntry,
} from "@/lib/avatar-bodies";
import AvatarsInProduction from "@/components/avatar/AvatarsInProduction";
import {
  loadGeneratedAvatar,
  type GeneratedAvatar,
} from "@/lib/caelinus-ai";

export type CarouselAvatar = {
  /** Stable id — Body library id veya GeneratedAvatar id. */
  id: string;
  label: string;
  tagline?: string;
  /** GLB URL — sahnenin yükleyeceği path. */
  url: string;
  /** Önizleme görseli — yoksa CSS gradient. */
  preview?: string;
  /** Caelinus tarafından önerilen — altın halka + "Senin için". */
  isRecommended?: boolean;
  /** Default body — "Aslı" rozeti. */
  isDefault?: boolean;
  /** Kullanıcının kendi üretmiş olduğu avatar — storage'dan. */
  isUserGenerated?: boolean;
  /** UI vurgusu için renk (try-on aura'sı vs.). */
  accentColor?: string;
  /** Body type — try-on outfit binding fallback'i için. */
  vibe?: string;
};

type Props = {
  selectedId: string | null;
  onSelect: (avatar: CarouselAvatar) => void;
  /** Carousel başlığı — "Bedenini Seç" gibi. */
  heading?: string;
  /** Subtitle. */
  subtitle?: string;
  /** Storage'dan kullanıcının ürettiği avatarı dahil et. */
  includeUserAvatar?: boolean;
  /** Sadece bu body id'leri göster (filtreleme). */
  filterIds?: string[];
  /** UI varyantı: full kart grid veya tek satır thumb strip. */
  variant?: "cards" | "thumbs";
  className?: string;
};

function bodyToCarousel(body: BodyEntry): CarouselAvatar {
  return {
    id: body.id,
    label: body.label,
    tagline: body.tagline,
    url: body.url,
    preview: body.preview,
    isDefault: body.isDefault,
    vibe: body.vibe,
  };
}

function generatedToCarousel(avatar: GeneratedAvatar): CarouselAvatar {
  return {
    id: avatar.id,
    label: avatar.reading?.styleIdentity.label ?? "Senin Avatar'ın",
    tagline:
      avatar.reading?.frequencyTag ??
      avatar.styleProfile.frequencyTag ??
      "Caelinus AI tarafından okundu",
    url: avatar.glbUrl,
    preview: avatar.thumbnailUrl,
    isRecommended: true,
    isUserGenerated: true,
    vibe: avatar.styleProfile.frequencyTag,
  };
}

export default function AvatarCarousel({
  selectedId,
  onSelect,
  heading = "Bedenini Seç",
  subtitle = "Caelinus body library — biri sana yakın olacak",
  includeUserAvatar = true,
  filterIds,
  variant = "cards",
  className = "",
}: Props) {
  const [userAvatar, setUserAvatar] = useState<GeneratedAvatar | null>(null);
  const [mounted, setMounted] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (includeUserAvatar) setUserAvatar(loadGeneratedAvatar());
  }, [includeUserAvatar]);

  const items: CarouselAvatar[] = useMemo(() => {
    const bodies = CAELINUS_BODY_LIBRARY.filter((b) =>
      filterIds ? filterIds.includes(b.id) : true,
    ).map(bodyToCarousel);

    if (userAvatar && includeUserAvatar) {
      // Kullanıcının kendi avatarı — listeye ÖNCE eklenir
      return [generatedToCarousel(userAvatar), ...bodies];
    }
    return bodies;
  }, [userAvatar, includeUserAvatar, filterIds]);

  const currentIndex = useMemo(() => {
    if (!selectedId) return 0;
    const idx = items.findIndex((i) => i.id === selectedId);
    return idx === -1 ? 0 : idx;
  }, [items, selectedId]);

  /* Klavye navigasyonu */
  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (items.length === 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = items[(currentIndex + 1) % items.length];
        onSelect(next);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = items[(currentIndex - 1 + items.length) % items.length];
        onSelect(prev);
      }
    },
    [items, currentIndex, onSelect],
  );

  /* Seçilen kartı görünür alana kaydır */
  useEffect(() => {
    if (!trackRef.current) return;
    const el = trackRef.current.querySelector<HTMLElement>(
      `[data-avatar-id="${CSS.escape(selectedId ?? "")}"]`,
    );
    if (!el) return;
    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedId, mounted]);

  const handlePrev = useCallback(() => {
    if (items.length === 0) return;
    const prev = items[(currentIndex - 1 + items.length) % items.length];
    onSelect(prev);
  }, [items, currentIndex, onSelect]);

  const handleNext = useCallback(() => {
    if (items.length === 0) return;
    const next = items[(currentIndex + 1) % items.length];
    onSelect(next);
  }, [items, currentIndex, onSelect]);

  if (items.length === 0) {
    return (
      <div className={`cai-carousel cai-carousel--empty ${className}`}>
        <AvatarsInProduction compact />
      </div>
    );
  }

  return (
    <section
      className={`cai-carousel cai-carousel--${variant} ${className}`}
      aria-label={heading}
    >
      <header className="cai-carousel-header">
        <div className="cai-carousel-heading-block">
          <div className="cai-carousel-kicker">✦ Caelinus Body Library</div>
          <h3 className="cai-carousel-heading">{heading}</h3>
          {subtitle && (
            <p className="cai-carousel-subtitle">{subtitle}</p>
          )}
        </div>

        <div className="cai-carousel-nav" aria-hidden="true">
          <button
            type="button"
            className="cai-carousel-nav-btn"
            onClick={handlePrev}
            aria-label="Önceki avatar"
          >
            ‹
          </button>
          <span className="cai-carousel-counter">
            {currentIndex + 1} / {items.length}
          </span>
          <button
            type="button"
            className="cai-carousel-nav-btn"
            onClick={handleNext}
            aria-label="Sonraki avatar"
          >
            ›
          </button>
        </div>
      </header>

      <div
        ref={trackRef}
        className="cai-carousel-track"
        role="listbox"
        aria-label="Avatar seçimi"
        tabIndex={0}
        onKeyDown={handleKey}
      >
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          const initials = item.label
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("");

          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              data-avatar-id={item.id}
              className={`cai-carousel-card ${
                isSelected ? "is-selected" : ""
              } ${item.isRecommended ? "is-recommended" : ""} ${
                item.isUserGenerated ? "is-user-generated" : ""
              }`}
              onClick={() => onSelect(item)}
            >
              {item.isRecommended && (
                <div className="cai-carousel-card-badge cai-carousel-card-badge--gold">
                  <span aria-hidden="true">✦</span>
                  <span>Senin avatar'ın</span>
                </div>
              )}
              {item.isDefault && !item.isRecommended && (
                <div className="cai-carousel-card-badge">Aslı</div>
              )}

              <div className="cai-carousel-card-thumb">
                {item.preview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.preview}
                    alt={item.label}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : null}
                <div
                  className="cai-carousel-card-thumb-fallback"
                  aria-hidden="true"
                >
                  <span className="cai-carousel-card-thumb-mono">
                    {initials}
                  </span>
                  <span className="cai-carousel-card-thumb-glyph">✦</span>
                </div>
                <div className="cai-carousel-card-aura" aria-hidden="true" />
              </div>

              <div className="cai-carousel-card-meta">
                <h4 className="cai-carousel-card-name">{item.label}</h4>
                {item.tagline && (
                  <p className="cai-carousel-card-tagline">{item.tagline}</p>
                )}
                {item.vibe && (
                  <span className="cai-carousel-card-vibe">{item.vibe}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Default body fallback hint — eğer kullanıcı hiç avatar oluşturmamışsa */}
      {!userAvatar && includeUserAvatar && mounted && (
        <p className="cai-carousel-hint">
          ✦ Henüz kendi AI avatar'ını oluşturmadın.
          {" "}
          <a className="cai-carousel-hint-link" href="/caelinus-ai/avatar">
            Selfie ile başla →
          </a>
        </p>
      )}
    </section>
  );
}

/**
 * DEFAULT_CAROUSEL_BODY — fallback için ilk seçim.
 * Şu sırayla denenir:
 *   1. Kullanıcının üretilmiş avatarı (varsa)
 *   2. CAELINUS_BODY_LIBRARY default body
 *   3. Library'nin ilk elemanı
 */
export function getDefaultCarouselSelection(): CarouselAvatar {
  if (typeof window !== "undefined") {
    const user = loadGeneratedAvatar();
    if (user) return generatedToCarousel(user);
  }
  const def =
    CAELINUS_BODY_LIBRARY.find((b) => b.id === DEFAULT_BODY_ID) ??
    CAELINUS_BODY_LIBRARY[0];
  return bodyToCarousel(def);
}

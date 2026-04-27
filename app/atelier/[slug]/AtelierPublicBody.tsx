"use client";

import Link from "next/link";
import { useMemo } from "react";

import { CinemaCTA, NebulaPortal, SceneTile, StageCard } from "@/app/_stage";
import { PROVINCES, PROVINCE_REGIONS } from "@/data/provinces";
import {
  ITEM_STATUS_LABELS,
  KIND_LABELS,
  formatItemPrice,
} from "@/lib/atelier/validation";
import type {
  AtelierItemRow,
  AtelierKind,
  AtelierRow,
  AtelierStatus,
} from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../_components/AtelierMatrix";
import { startItemCheckout } from "./_actions/checkout";

type Props = {
  atelier: AtelierRow;
  /** True when the visitor is the atelier's owner. Triggers preview banner +
   *  edit shortcut, regardless of status. */
  isOwner: boolean;
  /** Items to render in the collection slot. Owners see everything; the
   *  public sees only published + sold-out (RLS already enforces). */
  items: AtelierItemRow[];
  /** True when Stripe is configured server-side. When false we fall
   *  back to "Inquire" CTAs so the BUY button never appears broken. */
  checkoutEnabled?: boolean;
  /** Banner surfaced after a checkout round-trip — see translations
   *  for what each code means in user copy. */
  checkoutNotice?:
    | "iptal"
    | "yapilandirma"
    | "stripe"
    | "yok"
    | "fiyatsiz"
    | "kapali"
    | "hata"
    | null;
};

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  back: { tr: "← Universe", en: "← Universe" },
  edit: { tr: "Düzenle", en: "Edit" },
  story: { tr: "Hikâye", en: "The story" },
  contact: { tr: "İletişim", en: "Contact" },
  contactLabels: {
    email: { tr: "E-posta", en: "Email" },
    phone: { tr: "Telefon", en: "Phone" },
    website: { tr: "Web", en: "Website" },
    instagram: { tr: "Instagram", en: "Instagram" },
  },
  collection: {
    title: { tr: "Koleksiyon", en: "Collection" },
    placeholder: {
      tr: "Bu tezgâh için koleksiyon henüz hazırlanmadı.",
      en: "No pieces have been published yet.",
    },
    placeholderOwner: {
      tr: "Henüz ürün eklemedin. Tezgâhını düzenleyip ilk parçanı koy.",
      en: "No items yet. Edit your bench and add your first piece.",
    },
    addItem: { tr: "Yeni ürün", en: "Add item" },
    edit: { tr: "Düzenle", en: "Edit" },
    inquireOnly: { tr: "Fiyat için iletişim", en: "Inquire for price" },
    buy: { tr: "Satın al", en: "Buy" },
    soldOut: { tr: "Tükendi", en: "Sold out" },
    inquire: { tr: "Fiyat için iletişim", en: "Inquire" },
    cancelled: {
      tr: "Ödeme yarıda kaldı. İstediğin zaman yeniden deneyebilirsin.",
      en: "Checkout was cancelled. Try again whenever you're ready.",
    },
    notReady: {
      tr: "Ödeme sistemi henüz hazır değil. Caelinus ekibi yapılandırmayı tamamlıyor.",
      en: "Payments aren't live yet. The Caelinus team is finishing setup.",
    },
    stripeFailed: {
      tr: "Stripe oturumu açılamadı. Birazdan tekrar dene.",
      en: "Stripe session couldn't be started. Please try again shortly.",
    },
    notAvailable: {
      tr: "Bu ürün şu anda satışta değil.",
      en: "This piece is not currently for sale.",
    },
    noFixedPrice: {
      tr: "Bu ürün için sabit fiyat yok. Üreticiyle iletişime geç.",
      en: "No fixed price for this piece — please contact the maker.",
    },
    closed: {
      tr: "Bu atölye şu anda alımı kabul edemiyor.",
      en: "This atelier isn't accepting orders right now.",
    },
    genericError: {
      tr: "Bir aksilik oldu. Lütfen yeniden dene.",
      en: "Something went wrong. Please try again.",
    },
  },
  approvedStamp: {
    tr: "Caelinus Atelier · Onaylı",
    en: "Caelinus Atelier · Verified",
  },
  preview: {
    draft: {
      tr: "Bu sayfa henüz taslak — sadece sen görüyorsun. Düzenleyip incelemeye gönderince Caelinus kütüphanesine düşecek.",
      en: "This page is still a draft — only you can see it. Once you edit and submit, the Caelinus librarians will receive it for review.",
    },
    pending: {
      tr: "Sayfan inceleniyor. Onaylanınca herkes bu URL'den ulaşabilecek.",
      en: "Your page is in review. Once approved, anyone with this URL can reach it.",
    },
    rejected: {
      tr: "Caelinus kütüphanesi geri bildirim bıraktı. Düzenle, sonra yeniden gönder.",
      en: "The Caelinus librarians left feedback. Revise, then resubmit.",
    },
  },
  noBio: {
    tr: "Hikâye henüz yazılmadı.",
    en: "Story not written yet.",
  },
} as const;

function provinceLabel(
  provinceId: string | null | undefined,
  lang: "tr" | "en",
): { name: string; plate: string; regionLabel: string } | null {
  if (!provinceId) return null;
  const p = PROVINCES.find((x) => x.id === provinceId);
  if (!p) return null;
  const region = PROVINCE_REGIONS.find((r) => r.id === p.regionId);
  return {
    name: p.name[lang],
    plate: p.plate,
    regionLabel: region ? region.name[lang] : "",
  };
}

/** Pick the language-appropriate copy, fall back to the other language
 *  if the requested one is empty. Returns null if neither has content. */
function pickLocalised(
  primary: string | null | undefined,
  fallback: string | null | undefined,
): string | null {
  const a = primary?.trim();
  if (a) return a;
  const b = fallback?.trim();
  if (b) return b;
  return null;
}

function instagramHref(handle: string): string {
  // Strip a leading @ defensively even though the form already does.
  const clean = handle.replace(/^@+/, "").trim();
  return `https://instagram.com/${encodeURIComponent(clean)}`;
}

function instagramLabel(handle: string): string {
  return "@" + handle.replace(/^@+/, "").trim();
}

function kindToTone(
  kind: AtelierKind,
): "magenta" | "cosmic" | "gold" | "amber" | "teal" {
  switch (kind) {
    case "designer":   return "magenta";
    case "artisan":    return "cosmic";
    case "farmer":     return "teal";
    case "chef":       return "amber";
    case "herbalist":  return "gold";
    case "cooperative":
    case "other":
    default:           return "magenta";
  }
}

export default function AtelierPublicBody({
  atelier,
  isOwner,
  items,
  checkoutEnabled = false,
  checkoutNotice = null,
}: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const tone = kindToTone(atelier.kind);
  const kindLabel = KIND_LABELS[atelier.kind][L];
  const place = useMemo(
    () => provinceLabel(atelier.province, L),
    [atelier.province, L],
  );

  const bio = pickLocalised(
    L === "tr" ? atelier.bio_tr : atelier.bio_en,
    L === "tr" ? atelier.bio_en : atelier.bio_tr,
  );
  const story = pickLocalised(
    L === "tr" ? atelier.story_tr : atelier.story_en,
    L === "tr" ? atelier.story_en : atelier.story_tr,
  );

  const hasContact =
    !!atelier.contact_email ||
    !!atelier.contact_phone ||
    !!atelier.website ||
    !!atelier.instagram;

  const isApproved = atelier.status === "approved";
  // The preview banner only ever shows for the owner — non-owners are
  // already blocked at the server level.
  const previewKey: AtelierStatus | null =
    !isApproved && isOwner ? atelier.status : null;

  return (
    <div className="atelier-shell">
      {/* Soft matrix — same nebula language, dialled down so the
          atelier's images and copy are the focus. */}
      <AtelierMatrix intensity="soft" />
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/universe" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">{T.brand[L]}</span>
        </Link>
        <div className="atelier-ribbon-actions">
          {isOwner ? (
            <Link
              href={`/atelier/${atelier.slug}/duzenle`}
              className="atelier-ribbon-btn"
            >
              {T.edit[L]}
            </Link>
          ) : null}
          <button
            type="button"
            className="atelier-ribbon-lang"
            onClick={toggle}
            aria-label="Toggle language"
          >
            <span className={L === "tr" ? "is-active" : ""}>TR</span>
            <span className="atelier-ribbon-lang-divider">·</span>
            <span className={L === "en" ? "is-active" : ""}>EN</span>
          </button>
        </div>
      </header>

      {previewKey ? (
        <div className="atelier-preview-banner">
          <span className="atelier-preview-banner-dot" aria-hidden="true" />
          <span className="atelier-preview-banner-text">
            {T.preview[
              previewKey === "pending"
                ? "pending"
                : previewKey === "rejected"
                  ? "rejected"
                  : "draft"
            ][L]}
          </span>
        </div>
      ) : null}

      {checkoutNotice ? (
        <div className="atelier-preview-banner is-cancel">
          <span className="atelier-preview-banner-dot" aria-hidden="true" />
          <span className="atelier-preview-banner-text">
            {checkoutNotice === "iptal"
              ? T.collection.cancelled[L]
              : checkoutNotice === "yapilandirma"
                ? T.collection.notReady[L]
                : checkoutNotice === "stripe"
                  ? T.collection.stripeFailed[L]
                  : checkoutNotice === "yok"
                    ? T.collection.notAvailable[L]
                    : checkoutNotice === "fiyatsiz"
                      ? T.collection.noFixedPrice[L]
                      : checkoutNotice === "kapali"
                        ? T.collection.closed[L]
                        : T.collection.genericError[L]}
          </span>
        </div>
      ) : null}

      <main className="atelier-public">
        {/* ── Hero — full-bleed cover under a NebulaPortal avatar ────── */}
        <section className={`atelier-stage-hero atelier-stage-hero--${tone}`}>
          <div
            className={
              "atelier-stage-hero-cover" +
              (atelier.cover_image_url ? " has-image" : "")
            }
            style={
              atelier.cover_image_url
                ? { backgroundImage: `url(${atelier.cover_image_url})` }
                : undefined
            }
            role={atelier.cover_image_url ? "img" : undefined}
            aria-label={
              atelier.cover_image_url ? `${atelier.name} — kapak` : undefined
            }
          >
            <div className="atelier-stage-hero-cover-fade" aria-hidden="true" />
          </div>

          <div className="atelier-stage-hero-foreground">
            <NebulaPortal size={232} tone={tone}>
              {atelier.avatar_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={atelier.avatar_image_url}
                  alt={`${atelier.name} — avatar`}
                />
              ) : (
                <span className="atelier-stage-hero-portal-glyph" aria-hidden="true">
                  ⌖
                </span>
              )}
            </NebulaPortal>

            <div className="atelier-stage-hero-meta">
              <p className="atelier-stage-hero-eyebrow">{kindLabel}</p>
              <h1 className="atelier-stage-hero-name">{atelier.name}</h1>
              {place ? (
                <p className="atelier-stage-hero-place">
                  <span className="atelier-stage-hero-plate">{place.plate}</span>
                  <span>{place.name}</span>
                  {place.regionLabel ? (
                    <span className="atelier-stage-hero-region">
                      · {place.regionLabel}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {bio ? (
                <p className="atelier-stage-hero-bio">{bio}</p>
              ) : (
                <p className="atelier-stage-hero-bio is-empty">{T.noBio[L]}</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Story — parchment-style prose, only when content exists ─ */}
        {story ? (
          <section className="atelier-public-section atelier-public-scroll">
            <h2 className="atelier-public-section-title">
              <span className="atelier-public-section-glyph" aria-hidden="true">
                ✦
              </span>
              {T.story[L]}
            </h2>
            <div className="atelier-public-prose">
              {story.split(/\n{2,}/).map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Contact — SceneTile-style square contact channels ──────── */}
        {hasContact ? (
          <section className="atelier-public-section">
            <h2 className="atelier-public-section-title">
              <span className="atelier-public-section-glyph" aria-hidden="true">
                ◇
              </span>
              {T.contact[L]}
            </h2>
            <div className="atelier-stage-contact-grid">
              {atelier.contact_email ? (
                <SceneTile
                  as="link"
                  href={`mailto:${atelier.contact_email}`}
                  tone={tone}
                  label={T.contactLabels.email[L]}
                  glyph="✉"
                  aspect="wide"
                />
              ) : null}
              {atelier.contact_phone ? (
                <SceneTile
                  as="link"
                  href={`tel:${atelier.contact_phone.replace(/\s+/g, "")}`}
                  tone={tone}
                  label={T.contactLabels.phone[L]}
                  glyph="☎"
                  aspect="wide"
                />
              ) : null}
              {atelier.website ? (
                <SceneTile
                  as="link"
                  href={atelier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  tone={tone}
                  label={T.contactLabels.website[L]}
                  glyph="◯"
                  aspect="wide"
                />
              ) : null}
              {atelier.instagram ? (
                <SceneTile
                  as="link"
                  href={instagramHref(atelier.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  tone={tone}
                  label={instagramLabel(atelier.instagram)}
                  glyph="✸"
                  aspect="wide"
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── Collection — published items + owner add-shortcut ──────── */}
        <section className="atelier-public-section">
          <div className="atelier-public-section-head">
            <h2 className="atelier-public-section-title">
              <span className="atelier-public-section-glyph" aria-hidden="true">
                ✿
              </span>
              {T.collection.title[L]}
            </h2>
            {isOwner ? (
              <CinemaCTA
                href={`/atelier/${atelier.slug}/duzenle/urun/yeni`}
                variant="ghost"
                tone={tone}
                trailingGlyph="+"
              >
                {T.collection.addItem[L]}
              </CinemaCTA>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="atelier-stage-collection-empty">
              <p>
                {isOwner
                  ? T.collection.placeholderOwner[L]
                  : T.collection.placeholder[L]}
              </p>
              {isOwner ? (
                <CinemaCTA
                  href={`/atelier/${atelier.slug}/duzenle/urun/yeni`}
                  variant="primary"
                  tone={tone}
                  trailingGlyph="→"
                >
                  {T.collection.addItem[L]}
                </CinemaCTA>
              ) : null}
            </div>
          ) : (
            <ul className="atelier-stage-collection-grid">
              {items.map((item) => {
                const cover = item.images?.[0] ?? null;
                const title =
                  L === "en" && item.title_en?.trim()
                    ? item.title_en
                    : item.title_tr;
                const desc = pickLocalised(
                  L === "tr" ? item.description_tr : item.description_en,
                  L === "tr" ? item.description_en : item.description_tr,
                );
                const priceLabel = formatItemPrice(
                  item.price_amount,
                  item.currency,
                  L,
                );
                const showStatusPill =
                  isOwner && item.status !== "published";

                const isSoldOut = item.status === "sold-out";
                const hasFixedPrice = item.price_amount > 0;
                const canBuy =
                  !isOwner &&
                  !isSoldOut &&
                  item.status === "published" &&
                  hasFixedPrice &&
                  checkoutEnabled;

                const meta = (
                  <div className="atelier-stage-collection-meta">
                    <span className="atelier-stage-collection-price">
                      {priceLabel}
                    </span>
                    {isSoldOut ? (
                      <span className="atelier-stage-collection-soldout">
                        {T.collection.soldOut[L]}
                      </span>
                    ) : canBuy ? (
                      <form
                        action={startItemCheckout}
                        className="atelier-stage-collection-buy-form"
                      >
                        <input
                          type="hidden"
                          name="itemId"
                          value={item.id}
                        />
                        <input
                          type="hidden"
                          name="atelierSlug"
                          value={atelier.slug}
                        />
                        <button
                          type="submit"
                          className="atelier-stage-collection-buy"
                        >
                          {T.collection.buy[L]} →
                        </button>
                      </form>
                    ) : !isOwner && !hasFixedPrice && atelier.contact_email ? (
                      <a
                        href={`mailto:${atelier.contact_email}?subject=${encodeURIComponent(
                          `${atelier.name} · ${title}`,
                        )}`}
                        className="atelier-stage-collection-inquire"
                      >
                        {T.collection.inquire[L]} →
                      </a>
                    ) : null}
                  </div>
                );
                const statusLabel = showStatusPill
                  ? ITEM_STATUS_LABELS[item.status][L]
                  : undefined;
                const cardStatus =
                  item.status === "published"
                    ? "approved"
                    : item.status === "draft"
                      ? "draft"
                      : item.status === "archived"
                        ? "rejected"
                        : "neutral";

                return (
                  <li key={item.id} className="atelier-stage-collection-item">
                    {isOwner ? (
                      <StageCard
                        as="link"
                        href={`/atelier/${atelier.slug}/duzenle/urun/${item.id}`}
                        variant="poster"
                        tone={tone}
                        image={cover}
                        title={title}
                        eyebrow={item.intent ?? undefined}
                        body={desc ?? undefined}
                        meta={meta}
                        statusLabel={statusLabel}
                        status={cardStatus}
                      />
                    ) : (
                      <StageCard
                        as="div"
                        variant="poster"
                        tone={tone}
                        image={cover}
                        title={title}
                        eyebrow={item.intent ?? undefined}
                        body={desc ?? undefined}
                        meta={meta}
                        statusLabel={statusLabel}
                        status={cardStatus}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Caelinus stamp — only on approved pages ─────────────── */}
        {isApproved ? (
          <footer
            className="atelier-stage-stamp"
            aria-label={T.approvedStamp[L]}
          >
            <span className="atelier-stage-stamp-rule" aria-hidden="true" />
            <span className="atelier-stage-stamp-mark" aria-hidden="true">⌖</span>
            <span className="atelier-stage-stamp-text">
              {T.approvedStamp[L]}
            </span>
            <span className="atelier-stage-stamp-rule" aria-hidden="true" />
          </footer>
        ) : null}
      </main>
    </div>
  );
}

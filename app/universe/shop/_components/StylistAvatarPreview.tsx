"use client";

/**
 * StylistAvatarPreview — Stylist'in önerdiği look'u kullanıcının
 * kayıtlı AI avatarı ile karşılaştırmalı gösteren modal.
 *
 * Üç durum:
 *
 *   1. Avatar yok                 → "Önce avatar yarat" CTA → /avatar
 *   2. Avatar var, zodiac uyumlu  → kayıtlı avatar görseli yan yana
 *                                    look item'larıyla; doğrudan
 *                                    "Avatara Giydir" + "Sepete Ekle"
 *   3. Avatar var, zodiac farklı  → "Bu look <zodiac> burcu için.
 *                                    İstersen avatarını yeniden yarat"
 *                                    + /avatar?zodiac=X linki
 *
 * Burada bilinçli bir tasarım kararı: yeni burç için "fresh AI render"
 * yapmıyoruz çünkü kullanıcının selfie'si Faz 3.1 privacy gereği
 * persistent değil. Auth-bound persist (Faz 3.3) eklenince bu modal
 * gerçek "tek-tıkla yeni burç render"a yükseltilir.
 */

import Link from "next/link";
import { useEffect } from "react";

import type { StylistLook } from "@/lib/stylist/engine";
import { useUserAvatar } from "@/lib/user-avatar";
import { useWardrobeStore } from "@/stores/wardrobe-store";
import { useCartStore } from "@/stores/cart-store";

type Props = {
  look: StylistLook;
  onClose: () => void;
  lang: "tr" | "en";
};

export default function StylistAvatarPreview({ look, onClose, lang }: Props) {
  const avatar = useUserAvatar();
  const dressProduct = useWardrobeStore((s) => s.dressProduct);
  const clearAllSlots = useWardrobeStore((s) => s.clearAllSlots);
  const addToCart = useCartStore((s) => s.addToCart);

  // ESC ile kapat — modal davranışının olmazsa olmaz parçası.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Modal açıkken arka planı scroll'lama.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Look içindeki bikini'nin burcunu çıkar — eşleşme kontrolü için.
  const lookBikini = look.items.find((it) => it.product.category === "bikini");
  const lookZodiac = lookBikini?.product.zodiac ?? null;

  const userZodiac = avatar?.meta?.zodiac ?? null;
  const matches = !!userZodiac && !!lookZodiac && userZodiac === lookZodiac;

  const dressAll = () => {
    clearAllSlots();
    look.items.forEach((it) => dressProduct(it.product));
    onClose();
    if (typeof window !== "undefined") {
      const stage = document.querySelector(".shop-avatar-stage");
      stage?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const buyAll = () => {
    look.items.forEach((it) => addToCart(it.product, "M"));
    onClose();
  };

  const T = {
    tr: {
      title: "AI Avatarımda",
      noAvatarTitle: "Henüz avatarın yok",
      noAvatarBody:
        "Önce kendi yüzünden Caelinus AI avatarını yarat. Sonra Stylist önerilerini ona giydir.",
      noAvatarCta: "✦ Avatarımı Yarat",
      mismatchTitle: "Avatarın farklı bir burç için",
      mismatchBody: (z: string) =>
        `Bu look ${z} burcunun signature parçasıyla. İstersen avatarını ${z} için yeniden yarat — selfie'ni tekrar yüklemen gerekir.`,
      mismatchCta: (z: string) => `✦ ${z.toUpperCase()} Avatarını Yarat`,
      keepCurrent: "Mevcut avatarımla bak",
      dressAvatar: "✦ Avatara Giydir",
      addAllToCart: "Tümünü Sepete Ekle",
      lookLabel: "Önerilen kombin",
      avatarLabel: "Senin avatarın",
      total: "Toplam",
      close: "Kapat",
    },
    en: {
      title: "On My AI Avatar",
      noAvatarTitle: "You don't have an avatar yet",
      noAvatarBody:
        "Create your Caelinus AI avatar from your own face first, then dress it with Stylist suggestions.",
      noAvatarCta: "✦ Create My Avatar",
      mismatchTitle: "Your avatar is for a different zodiac",
      mismatchBody: (z: string) =>
        `This look pairs with ${z}'s signature piece. You can recreate your avatar for ${z} — you'll need to upload your selfie again.`,
      mismatchCta: (z: string) => `✦ Create ${z.toUpperCase()} Avatar`,
      keepCurrent: "Keep my current avatar",
      dressAvatar: "✦ Dress the Avatar",
      addAllToCart: "Add All to Cart",
      lookLabel: "Suggested look",
      avatarLabel: "Your avatar",
      total: "Total",
      close: "Close",
    },
  }[lang];

  return (
    <div
      className="stylist-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={T.title}
    >
      <div className="stylist-modal">
        <button
          type="button"
          className="stylist-modal-close"
          onClick={onClose}
          aria-label={T.close}
        >
          ✕
        </button>

        <header className="stylist-modal-head">
          <p className="stylist-modal-kicker">✦ {T.title} ✦</p>
          <h3 className="stylist-modal-title">{look.title}</h3>
        </header>

        {!avatar ? (
          /* ── 1. Avatar yok ── */
          <div className="stylist-modal-empty">
            <div className="stylist-modal-glyph" aria-hidden="true">
              ◉
            </div>
            <h4 className="stylist-modal-empty-title">{T.noAvatarTitle}</h4>
            <p className="stylist-modal-empty-body">{T.noAvatarBody}</p>
            <Link
              href={`/avatar${
                lookZodiac ? `?zodiac=${encodeURIComponent(lookZodiac)}` : ""
              }`}
              className="stylist-modal-cta stylist-modal-cta--primary"
            >
              {T.noAvatarCta}
            </Link>
          </div>
        ) : !matches && lookZodiac ? (
          /* ── 2. Burç eşleşmiyor ── */
          <div className="stylist-modal-empty">
            <div className="stylist-modal-avatar-mini">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar.url} alt="" aria-hidden="true" />
            </div>
            <h4 className="stylist-modal-empty-title">{T.mismatchTitle}</h4>
            <p className="stylist-modal-empty-body">
              {T.mismatchBody(lookZodiac)}
            </p>
            <div className="stylist-modal-actions">
              <Link
                href={`/avatar?zodiac=${encodeURIComponent(lookZodiac)}`}
                className="stylist-modal-cta stylist-modal-cta--primary"
              >
                {T.mismatchCta(lookZodiac)}
              </Link>
              <button
                type="button"
                className="stylist-modal-cta"
                onClick={dressAll}
              >
                {T.keepCurrent} →
              </button>
            </div>
          </div>
        ) : (
          /* ── 3. Eşleşme: avatar yan yana ── */
          <div className="stylist-modal-grid">
            <div className="stylist-modal-col">
              <p className="stylist-modal-col-label">{T.avatarLabel}</p>
              <div className="stylist-modal-avatar-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar.url}
                  alt={lang === "tr" ? "Senin Caelinus avatarın" : "Your Caelinus avatar"}
                  className="stylist-modal-avatar-img"
                />
              </div>
            </div>
            <div className="stylist-modal-col">
              <p className="stylist-modal-col-label">{T.lookLabel}</p>
              <div className="stylist-modal-items">
                {look.items.map((it) => (
                  <div key={it.product.id} className="stylist-modal-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.product.image}
                      alt={it.product.name}
                      className="stylist-modal-item-img"
                      loading="lazy"
                    />
                    <div className="stylist-modal-item-body">
                      <div className="stylist-modal-item-name">
                        {it.product.name}
                      </div>
                      <div className="stylist-modal-item-price">
                        ${it.product.numericPrice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="stylist-modal-foot">
                <span className="stylist-modal-total">
                  {T.total}: ${look.totalPrice}
                </span>
                <div className="stylist-modal-actions">
                  <button
                    type="button"
                    className="stylist-modal-cta stylist-modal-cta--primary"
                    onClick={dressAll}
                  >
                    {T.dressAvatar}
                  </button>
                  <button
                    type="button"
                    className="stylist-modal-cta"
                    onClick={buyAll}
                  >
                    {T.addAllToCart}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

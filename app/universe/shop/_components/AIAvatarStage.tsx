"use client";

/**
 * AIAvatarStage — Faz 3.4 (avatar-first Shop sahnesi).
 *
 * Vizyon: "Avatarınla giydiğin." Bu sahne, kullanıcının kendi
 * AI avatarını Shop'un merkezine alır. Eski 3D mesh + slider
 * ekranı (yüzü boş manken) yerini, kullanıcının selfie'sinden
 * üretilmiş profesyonel kalitede AI portresine bırakır.
 *
 * Görüntülenenler:
 *   • Tam boy AI avatar görseli (Caelinus modelinin bedeninde
 *     kullanıcının yüzü, saçı, kaşı, gözü, dudağı)
 *   • Sahne tonlu vignette üst katman
 *   • Kullanıcı bilgisi: "Sen — <Burç>"
 *   • Kıyafet badge'leri (TryOnSection'dan gelen dressedSlots)
 *   • "Avatarımı değiştir" linki → /avatar
 *
 * Bu bileşen 3D bir şey çizmez; ileride (Faz 3.5) seçilen kıyafet
 * için fresh face-swap render eklenebilir, ancak o auth-bound
 * persist (Faz 3.3) tamamlandıktan sonra anlamlı olur — selfie'nin
 * sunucuda kalıcı (encrypted) saklanması gerekir.
 */

import Link from "next/link";

import { ZODIACS } from "@/data/play-assets";
import type { UserAvatar } from "@/lib/user-avatar";
import { useWardrobeStore } from "@/stores/wardrobe-store";

type Props = {
  avatar: UserAvatar;
  sceneLabel: string;
  archetypeLabel: string;
};

export default function AIAvatarStage({
  avatar,
  sceneLabel,
  archetypeLabel,
}: Props) {
  const dressedSlots = useWardrobeStore((s) => s.dressedSlots);

  const zodiacLabel = avatar.meta
    ? ZODIACS.find((z) => z.id === avatar.meta!.zodiac)?.label.tr ??
      avatar.meta.zodiac
    : null;

  return (
    <div className="ai-stage">
      <div className="ai-stage-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar.url}
          alt="Senin Caelinus AI avatarın"
          className="ai-stage-img"
        />
        <div className="ai-stage-vignette" aria-hidden="true" />
        <div className="ai-stage-glow" aria-hidden="true" />

        {/* Sol üst — kullanıcı kimliği */}
        <div className="ai-stage-info-card ai-stage-info-card--top-left">
          <span className="ai-stage-info-kicker">SEN</span>
          {zodiacLabel ? (
            <span className="ai-stage-info-text">{zodiacLabel}</span>
          ) : null}
        </div>

        {/* Sağ üst — sahne / arketip */}
        <div className="ai-stage-info-card ai-stage-info-card--top-right">
          <span className="ai-stage-info-kicker">SAHNE</span>
          <span className="ai-stage-info-text">{sceneLabel}</span>
          <span className="ai-stage-info-sub">Arketip · {archetypeLabel}</span>
        </div>

        {/* Sağ üst — avatarı değiştir */}
        <Link
          href="/avatar"
          className="ai-stage-change-link"
          aria-label="Avatarını yeniden yarat"
        >
          ✦ Avatarı Değiştir
        </Link>

        {/* Alt — kıyafet badge'leri (StylistPanel "Avatara Giydir"
         * tıklandığında dolar; mevcut wardrobe sistemi aynı kalır
         * çünkü 3D mesh outfit binding'i hala arka planda çalışır
         * (görselleşmese bile lojik olarak takip edilir, gelecekte
         * AI ile fresh render basacağımız zaman aynı state'ten
         * okunacak). */}
        {(dressedSlots.bag || dressedSlots.shoes || dressedSlots.accessory) && (
          <div className="ai-stage-outfit-row">
            {dressedSlots.bag && (
              <span className="ai-stage-outfit-badge">
                ◐ {dressedSlots.bag.name}
              </span>
            )}
            {dressedSlots.shoes && (
              <span className="ai-stage-outfit-badge">
                ◇ {dressedSlots.shoes.name}
              </span>
            )}
            {dressedSlots.accessory && (
              <span className="ai-stage-outfit-badge">
                ✦ {dressedSlots.accessory.name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

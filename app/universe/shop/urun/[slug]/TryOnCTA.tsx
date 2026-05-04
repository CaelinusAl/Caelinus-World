"use client";

/**
 * PDP TryOn CTA — kullanıcının kendi AI avatarı olup olmamasına göre
 * yönlendirme yapar.
 *
 *   • Avatar var      → doğrudan Shop'a `?try=<id>` ile gider
 *                       (TryOnLauncher orada ürünü try-on paneline yükler).
 *   • Avatar yok      → /avatar?next=/universe/shop?try=<id>
 *                       (Avatar Studio'ya gönderir; selfie + burç +
 *                        save sonrası kullanıcı buraya geri döner.)
 *
 * Avatar durumu `useUserAvatar()` ile dinlenir — Avatar Studio'da
 * kaydedilince Badge ve diğer tab'lar anında günceller.
 */

import Link from "next/link";

import { useUserAvatar } from "@/lib/user-avatar";

type Props = {
  productId: string;
  hasOutfitGlb: boolean;
  isTr: boolean;
};

export default function TryOnCTA({ productId, hasOutfitGlb, isTr }: Props) {
  const avatar = useUserAvatar();

  // Hidrasyon eşitliği: ilk paint server-side ile aynı görünsün diye
  // `null` durumunda Shop hedefine düşeriz. Mount sonrası gerçek
  // karara göre yenilenir.
  const noAvatar = avatar === null;
  const tryHref = noAvatar
    ? `/avatar?next=${encodeURIComponent(`/universe/shop?try=${productId}`)}`
    : `/universe/shop?try=${encodeURIComponent(productId)}`;

  const dressHref = `/universe/shop?dress=${encodeURIComponent(productId)}`;

  return (
    <>
      <Link href={tryHref} className="pdp-cta pdp-cta--primary">
        {noAvatar
          ? isTr
            ? "Önce Avatar Yarat"
            : "Create My Avatar First"
          : isTr
            ? "Avatarımda Dene"
            : "Try on My Avatar"}
      </Link>
      {hasOutfitGlb ? (
        <Link href={dressHref} className="pdp-cta">
          {isTr ? "Direkt Giydir" : "Dress Now"}
        </Link>
      ) : null}
    </>
  );
}

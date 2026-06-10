"use client";

/**
 * Shop AvatarBadge — kullanıcının kayıtlı AI avatarını gösteren,
 * sahnenin köşesine yerleşen sticky kart.
 *
 * İki durum:
 *   • Avatar var → thumbnail + "burç adı" + "değiştir" linki
 *   • Avatar yok → "Avatarını yarat" CTA'sı /avatar'a yönlendirir
 *
 * Bu badge sayesinde "her sayfada benim avatarım" hissi vurgulanır;
 * vizyonun "Avatarınla giydiğin" vaadinin görsel sürekliliği.
 *
 * Faz 3.2 (bu adım) — sadece görselleştirme + linkleme.
 * Faz 3.2b (sıradaki) — Stylist sonuçlarındaki kombinleri "AI ile
 *   avatarımda gör" butonuyla `/api/play/render` zincirine bağlama.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ZODIACS, type ZodiacId } from "@/data/play-assets";
import { clearUserAvatar } from "@/lib/user-avatar";
import { useCaelinusIdentity } from "@/lib/identity/caelinus-identity";

const ZODIAC_GLYPHS: Record<ZodiacId, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
};

export default function AvatarBadge() {
  // Faz 1 — kanonik kimlikten oku. Portre URL'i buradan; burç ise
  // portre meta YOKSA frekans profilinden çözülür (artık tek "doğru"
  // zodiac, üç store arasında çelişki yok).
  const identity = useCaelinusIdentity();
  const router = useRouter();

  const portrait = identity.portrait;

  // Portre yok / hidrasyon öncesi → "yarat" davetkar CTA.
  if (!portrait) {
    return (
      <aside className="shop-avatar-badge shop-avatar-badge--empty" aria-label="Avatar Studio">
        <div className="shop-avatar-badge-glyph" aria-hidden="true">
          ◉
        </div>
        <div className="shop-avatar-badge-body">
          <p className="shop-avatar-badge-kicker">Avatar Studio</p>
          <p className="shop-avatar-badge-text">
            Selfie yükle, AI seni Caelinus tanrıçası olarak çizsin.
          </p>
          <Link href="/avatar" className="shop-avatar-badge-cta">
            ✦ Avatarımı Yarat
          </Link>
        </div>
      </aside>
    );
  }

  // Kanonik burç — portre meta'sı boş olsa bile frekans profilinden gelir.
  const zodiac = identity.zodiac;
  const zodiacLabel = zodiac
    ? ZODIACS.find((z) => z.id === zodiac)?.label.tr ?? zodiac
    : null;
  const glyph = zodiac ? ZODIAC_GLYPHS[zodiac] : "◉";

  return (
    <aside className="shop-avatar-badge" aria-label="Senin avatarın">
      <Link href="/avatar" className="shop-avatar-badge-thumb-link" aria-label="Avatar Studio'ya git">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portrait.url}
          alt="Senin Caelinus avatarın"
          className="shop-avatar-badge-thumb"
          loading="lazy"
        />
        <span className="shop-avatar-badge-glyph-overlay" aria-hidden="true">
          {glyph}
        </span>
      </Link>
      <div className="shop-avatar-badge-body">
        <p className="shop-avatar-badge-kicker">Avatarın</p>
        {zodiacLabel ? (
          <p className="shop-avatar-badge-zodiac">{zodiacLabel}</p>
        ) : null}
        <div className="shop-avatar-badge-actions">
          <Link href="/avatar" className="shop-avatar-badge-link">
            Yeniden Yarat
          </Link>
          <button
            type="button"
            onClick={() => {
              clearUserAvatar();
              router.refresh();
            }}
            className="shop-avatar-badge-link shop-avatar-badge-link--ghost"
            aria-label="Kayıtlı avatarı kaldır"
          >
            Kaldır
          </button>
        </div>
      </div>
    </aside>
  );
}

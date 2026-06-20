"use client";

/**
 * MIRROR CONSOLE — eski "Avatar Studio" sticky kartının yeni hâli.
 *
 * Sahnenin sağ üst köşesinde duran, aynanın kontrol paneli gibi
 * çalışan cam yüzey. İki durum:
 *   • Avatar yok → "AI Mirror aktif" + ritüel kısayolları + "Aynaya Gir"
 *   • Avatar var → kullanıcının portresi + burç + "Yeniden Doğur" / "Kaldır"
 *
 * Kanonik kimlikten (portrait + zodiac) okur; çözümleme mantığı
 * değişmedi, yalnızca dil ve görsel "ayna konsolu"na çevrildi.
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

const CONSOLE_STEPS: string[] = ["Selfie yükle", "Stil seç", "Avatar üret"];

export default function AvatarBadge() {
  const identity = useCaelinusIdentity();
  const router = useRouter();

  const portrait = identity.portrait;

  // Portre yok / hidrasyon öncesi → ayna konsolu "boş" hâli.
  if (!portrait) {
    return (
      <aside
        className="shop-avatar-badge shop-avatar-badge--console shop-avatar-badge--empty"
        aria-label="Mirror Console"
      >
        <div className="mirror-console-head">
          <span className="mirror-console-pulse" aria-hidden="true" />
          <span className="mirror-console-status">AI Mirror aktif</span>
        </div>
        <p className="mirror-console-title">Mirror Console</p>
        <ol className="mirror-console-steps">
          {CONSOLE_STEPS.map((s, i) => (
            <li key={s} className="mirror-console-step">
              <span className="mirror-console-step-dot" aria-hidden="true">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <Link href="/universe/shop/avatar" className="mirror-console-cta">
          ◍ Aynaya Gir
        </Link>
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
    <aside
      className="shop-avatar-badge shop-avatar-badge--console"
      aria-label="Aynadaki bedenin"
    >
      <Link
        href="/avatar"
        className="shop-avatar-badge-thumb-link"
        aria-label="Mirror Console'a git"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portrait.url}
          alt="Aynadaki Caelinus bedenin"
          className="shop-avatar-badge-thumb"
          loading="lazy"
        />
        <span className="shop-avatar-badge-glyph-overlay" aria-hidden="true">
          {glyph}
        </span>
      </Link>
      <div className="shop-avatar-badge-body">
        <p className="shop-avatar-badge-kicker">Aynadaki Beden</p>
        {zodiacLabel ? (
          <p className="shop-avatar-badge-zodiac">{zodiacLabel}</p>
        ) : null}
        <div className="shop-avatar-badge-actions">
          <Link href="/universe/shop/avatar" className="shop-avatar-badge-link">
            Yeniden Doğur
          </Link>
          <button
            type="button"
            onClick={() => {
              clearUserAvatar();
              router.refresh();
            }}
            className="shop-avatar-badge-link shop-avatar-badge-link--ghost"
            aria-label="Aynadaki bedeni kaldır"
          >
            Kaldır
          </button>
        </div>
      </div>
    </aside>
  );
}

"use client";

/**
 * BodyPicker — Caelinus Avatar Studio'nun "Bedenini Seç" bölümü.
 *
 * Vizyon: Avaturn'ün "body library" konseptinin Caelinus versiyonu.
 * Kullanıcı kendi mesh'ini (selin.glb) ya da Caelinus'in atölyesinde
 * şekillendirilmiş varyantları seçer. Her body kendine özgü bir
 * "vibe" taşır — mereotopojik bir ölçü değil, bir karakter.
 *
 * UI:
 *   • Yatay kaydırılan kart şeridi (mobil + masaüstü).
 *   • Her kart: önizleme görseli (ya da gradient fallback) + isim
 *     + tagline + vibe satırı + "personal" rozeti.
 *   • Aktif kart altın yumuşak halka ile vurgulanır.
 *   • Tıklayınca onChange tetiklenir, üst component avatar'ı yeniden
 *     yüklemek üzere body URL'ini değiştirir.
 *
 * Önizleme görselleri opsiyonel — `/public/models/previews/<id>.png`
 * dosyası varsa kullanılır, yoksa CSS gradient + ilk harf monogramı.
 */

import { useState } from "react";
import Image from "next/image";
import {
  CAELINUS_BODY_LIBRARY,
  AVATARS_IN_PRODUCTION,
  type BodyEntry,
} from "@/lib/avatar-bodies";
import AvatarsInProduction from "@/components/avatar/AvatarsInProduction";

type Props = {
  selectedId: string;
  onSelect: (bodyId: string) => void;
};

export default function BodyPicker({ selectedId, onSelect }: Props) {
  if (AVATARS_IN_PRODUCTION) {
    return (
      <section className="body-picker">
        <AvatarsInProduction compact />
      </section>
    );
  }
  return (
    <section className="body-picker">
      <header className="body-picker-header">
        <div className="body-picker-kicker">✦ CAELINUS · BEDEN KÜTÜPHANESİ</div>
        <h3 className="body-picker-title">Bedenini Seç</h3>
        <p className="body-picker-sub">
          Senin mesh&apos;in burada — boy, ölçü, ten rengi sliderlarla
          ayarlanır, yüzünü yükle, shop&apos;ta deneyeceğin bedeni o.
        </p>
      </header>

      <div className="body-picker-rail" role="radiogroup" aria-label="Avatar bedeni seç">
        {CAELINUS_BODY_LIBRARY.map((body) => (
          <BodyCard
            key={body.id}
            body={body}
            active={body.id === selectedId}
            onClick={() => onSelect(body.id)}
          />
        ))}
      </div>
    </section>
  );
}

function BodyCard({
  body,
  active,
  onClick,
}: {
  body: BodyEntry;
  active: boolean;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const showPreview = body.preview && !imgError;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`body-card ${active ? "is-active" : ""}`}
    >
      <div className="body-card-thumb">
        {showPreview ? (
          <Image
            src={body.preview!}
            alt={body.label}
            fill
            sizes="160px"
            quality={80}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="body-card-thumb-fallback"
            data-vibe={body.gender}
          >
            <span className="body-card-thumb-monogram">
              {body.label.charAt(0)}
            </span>
          </div>
        )}
        {body.isPersonal && (
          <span className="body-card-badge body-card-badge--personal">
            ✦ Senin
          </span>
        )}
        {body.isDefault && !body.isPersonal && (
          <span className="body-card-badge body-card-badge--default">
            Default
          </span>
        )}
      </div>
      <div className="body-card-meta">
        <div className="body-card-name">{body.label}</div>
        <div className="body-card-tagline">{body.tagline}</div>
        {body.vibe && <div className="body-card-vibe">{body.vibe}</div>}
      </div>
    </button>
  );
}

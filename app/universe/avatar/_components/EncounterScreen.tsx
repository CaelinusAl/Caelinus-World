"use client";

/**
 * [7] KARŞILAŞMA — Experience Bible §2[7].
 *
 * Bir "indir" düğmesi değil; bir karşılaşma. Tanrıça tam ekran, sinematik
 * belirir. "İşte sen. {Arketip} olarak, {District}'te doğdun."
 *
 * Vatandaşlık katmanı (Civilization): kimlik kartı 3 satırı gösterir
 * (Arketip / Düzen / Rank). Henüz çağrılmadıysa Temple of Silence Çağrı
 * eşiğine geçiş CTA'sı sunulur.
 */

import { getGoddess } from "@/data/goddess-archetypes";
import { getAvatarDistrict } from "@/data/avatar-districts";
import type { BornAvatar } from "@/lib/avatar/birth-types";

import AvatarIdentityCard from "./AvatarIdentityCard";

type Props = {
  avatar: BornAvatar;
  saved: boolean;
  onSave: () => void;
  onRebirth: () => void;
  onCalling: () => void;
};

export default function EncounterScreen({
  avatar,
  saved,
  onSave,
  onRebirth,
  onCalling,
}: Props) {
  const g = getGoddess(avatar.goddess);
  const d = getAvatarDistrict(avatar.district);
  const hasOrder = !!avatar.order;

  return (
    <div
      className="av-step av-step-encounter"
      style={{ "--g-accent": g.palette.accent } as React.CSSProperties}
    >
      <figure className="av-encounter-portrait">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar.portraitDataUrl} alt={`${g.name} — ${d.name}`} />
      </figure>

      <div className="av-encounter-meta">
        <p className="av-encounter-line">
          İşte sen. <strong>{g.name}</strong> olarak, <strong>{d.name}</strong>’te
          doğdun.
        </p>

        <AvatarIdentityCard avatar={avatar} />

        <div className="av-actions">
          <button
            type="button"
            className="av-btn av-btn-primary"
            onClick={onSave}
            disabled={saved}
          >
            {saved ? "Kaydedildi ✓" : "Bu benim"}
          </button>
          <button type="button" className="av-btn av-btn-ghost" onClick={onRebirth}>
            Yeniden doğur
          </button>
        </div>

        <button type="button" className="av-calling-cta" onClick={onCalling}>
          {hasOrder
            ? "Çağrını yeniden dinle · Temple of Silence"
            : "Çağrını dinle · Temple of Silence →"}
        </button>
      </div>
    </div>
  );
}

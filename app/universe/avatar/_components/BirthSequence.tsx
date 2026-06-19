"use client";

/**
 * [6] DOĞUŞ — Experience Bible §2[6].
 *
 * Bir "loading spinner" değil; bir doğuş sekansı. Tören dilinde faz
 * mesajları sırayla belirir, arketibin sembolü parlar. Arka planda
 * Portrait kompozisyonu üretilir (compose-portrait). Hem minimum tören
 * süresi hem de üretim bittiğinde karşılaşmaya geçilir.
 */

import { useEffect, useRef, useState } from "react";

import { getGoddess, type GoddessId } from "@/data/goddess-archetypes";
import { getAvatarDistrict, type AvatarDistrictId } from "@/data/avatar-districts";
import { composePortrait } from "@/lib/avatar/compose-portrait";
import type { BirthIntensity } from "@/lib/avatar/birth-types";

type Props = {
  faceDataUrl: string | null;
  goddess: GoddessId;
  district: AvatarDistrictId;
  intensity: BirthIntensity;
  onBorn: (portraitDataUrl: string) => void;
};

export default function BirthSequence({
  faceDataUrl,
  goddess,
  district,
  intensity,
  onBorn,
}: Props) {
  const g = getGoddess(goddess);
  const d = getAvatarDistrict(district);

  const phases = [
    "Kimliğin okunuyor…",
    "Frekansın çağrılıyor…",
    `${g.name} uyanıyor…`,
    `${d.name}'te doğuyorsun…`,
  ];
  const [phaseIndex, setPhaseIndex] = useState(0);

  // onBorn'u ref'te tut — effect'i tek sefer çalıştır.
  const onBornRef = useRef(onBorn);
  onBornRef.current = onBorn;

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    phases.forEach((_, i) => {
      timers.push(setTimeout(() => !cancelled && setPhaseIndex(i), i * 1100));
    });
    const minDuration = phases.length * 1100 + 400;

    const startedAt = Date.now();
    const portraitPromise = composePortrait({
      faceDataUrl,
      goddess,
      district,
      intensity,
    });

    void portraitPromise.then((dataUrl) => {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, minDuration - elapsed);
      timers.push(
        setTimeout(() => {
          if (!cancelled) onBornRef.current(dataUrl);
        }, wait)
      );
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceDataUrl, goddess, district, intensity]);

  return (
    <div
      className="av-step av-step-birth"
      style={{ "--g-accent": g.palette.accent } as React.CSSProperties}
    >
      <div className="av-birth-orb" aria-hidden="true">
        <span className="av-birth-glyph">{g.symbolGlyph}</span>
      </div>
      <p className="av-birth-phase" aria-live="polite">
        {phases[phaseIndex]}
      </p>
    </div>
  );
}

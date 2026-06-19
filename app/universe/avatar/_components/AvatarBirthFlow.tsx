"use client";

/**
 * CAELINUS AVATAR — Doğuş Akışı orkestratörü (Phase 1A MVP).
 *
 * Experience Bible §2 birebir 7 eşik durum makinesi:
 *   face → privacy → goddess → district → intensity → birth → encounter
 *
 * Tek karar / ekran ilkesi. Toplanan niyetler `BirthSelection`'da; doğuş
 * `compose-portrait` ile üretilir, sonuç `birth-storage` (localStorage).
 * Supabase migration YOK.
 */

import { useState } from "react";

import { DEFAULT_AVATAR_DISTRICT } from "@/data/avatar-districts";
import type { GoddessId } from "@/data/goddess-archetypes";
import type { AvatarDistrictId } from "@/data/avatar-districts";
import { getOrder, type OrderId } from "@/data/orders";
import {
  writeBornAvatar,
  useBornAvatar,
} from "@/lib/avatar/birth-storage";
import type {
  BirthIntensity,
  BirthSelection,
  BirthStep,
  BornAvatar,
} from "@/lib/avatar/birth-types";

import FaceStep from "./FaceStep";
import PrivacyStep from "./PrivacyStep";
import GoddessStep from "./GoddessStep";
import DistrictStep from "./DistrictStep";
import IntensityStep from "./IntensityStep";
import BirthSequence from "./BirthSequence";
import EncounterScreen from "./EncounterScreen";
import CallingScreen from "./CallingScreen";

const STEP_ORDER: BirthStep[] = [
  "face",
  "privacy",
  "goddess",
  "district",
  "intensity",
  "birth",
  "encounter",
];

const INITIAL: BirthSelection = {
  faceDataUrl: null,
  privacyAccepted: false,
  goddess: null,
  district: DEFAULT_AVATAR_DISTRICT,
  intensity: "balanced",
};

export default function AvatarBirthFlow() {
  const existing = useBornAvatar();
  const [step, setStep] = useState<BirthStep>("face");
  const [sel, setSel] = useState<BirthSelection>(INITIAL);
  const [born, setBorn] = useState<BornAvatar | null>(null);
  const [saved, setSaved] = useState(false);

  function patch(p: Partial<BirthSelection>) {
    setSel((s) => ({ ...s, ...p }));
  }

  function handleBorn(portraitDataUrl: string) {
    if (!sel.goddess) return;
    const avatar: BornAvatar = {
      id: `born_${Date.now().toString(36)}`,
      goddess: sel.goddess,
      district: sel.district,
      intensity: sel.intensity,
      portraitDataUrl,
      faceDataUrl: sel.faceDataUrl,
      createdAt: new Date().toISOString(),
      // Yeni doğan ruh: henüz düzensiz — Gezgin / Yansıma (Civilization §3).
      rank: "reflection",
      callingStatus: "wanderer",
    };
    setBorn(avatar);
    setSaved(false);
    setStep("encounter");
  }

  /** Çağrı: bir düzene çağrıl veya Gezgin kal (Civilization §3–§4). */
  function handleChoose(order: OrderId | null) {
    if (!born) return;
    const next: BornAvatar = order
      ? {
          ...born,
          order,
          rank: getOrder(order).defaultRank,
          callingStatus: "called",
        }
      : {
          // Gezgin — order alanını temizle (canon: kutsal)
          ...born,
          order: undefined,
          rank: "reflection",
          callingStatus: "wanderer",
        };
    setBorn(next);
    writeBornAvatar(next);
    setSaved(true);
    setStep("encounter");
  }

  function restart() {
    setSel(INITIAL);
    setBorn(null);
    setSaved(false);
    setStep("face");
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="av-flow">
      {/* Eşik göstergesi — doğuş ve çağrı eşiklerinde gizli */}
      {step !== "birth" && step !== "calling" && (
        <ol className="av-progress" aria-hidden="true">
          {STEP_ORDER.slice(0, 6).map((s, i) => (
            <li
              key={s}
              className={`av-progress-dot${i <= stepIndex ? " is-done" : ""}${
                i === stepIndex ? " is-now" : ""
              }`}
            />
          ))}
        </ol>
      )}

      {/* Daha önce doğmuş bir tanrıça varsa nazik hatırlatma */}
      {step === "face" && existing && (
        <div className="av-resume">
          <p>
            Zaten bir tanrıçan var. Dilersen yeni bir frekansta yeniden doğabilir
            ya da
            {" "}
            <button
              type="button"
              className="av-link"
              onClick={() => {
                setBorn(existing);
                setSaved(true);
                setStep("encounter");
              }}
            >
              ona geri dönebilirsin
            </button>
            .
          </p>
        </div>
      )}

      {step === "face" && (
        <FaceStep
          initial={sel.faceDataUrl}
          onNext={(faceDataUrl) => {
            patch({ faceDataUrl });
            setStep("privacy");
          }}
        />
      )}

      {step === "privacy" && (
        <PrivacyStep
          hasFace={!!sel.faceDataUrl}
          onBack={() => setStep("face")}
          onAccept={() => {
            patch({ privacyAccepted: true });
            setStep("goddess");
          }}
        />
      )}

      {step === "goddess" && (
        <GoddessStep
          initial={sel.goddess}
          onBack={() => setStep("privacy")}
          onNext={(goddess: GoddessId) => {
            patch({ goddess });
            setStep("district");
          }}
        />
      )}

      {step === "district" && (
        <DistrictStep
          initial={sel.district}
          goddess={sel.goddess}
          onBack={() => setStep("goddess")}
          onNext={(district: AvatarDistrictId) => {
            patch({ district });
            setStep("intensity");
          }}
        />
      )}

      {step === "intensity" && (
        <IntensityStep
          initial={sel.intensity}
          onBack={() => setStep("district")}
          onNext={(intensity: BirthIntensity) => {
            patch({ intensity });
            setStep("birth");
          }}
        />
      )}

      {step === "birth" && sel.goddess && (
        <BirthSequence
          faceDataUrl={sel.faceDataUrl}
          goddess={sel.goddess}
          district={sel.district}
          intensity={sel.intensity}
          onBorn={handleBorn}
        />
      )}

      {step === "encounter" && born && (
        <EncounterScreen
          avatar={born}
          saved={saved}
          onSave={() => {
            writeBornAvatar(born);
            setSaved(true);
          }}
          onRebirth={restart}
          onCalling={() => setStep("calling")}
        />
      )}

      {step === "calling" && born && (
        <CallingScreen
          avatar={born}
          onChoose={handleChoose}
          onBack={() => setStep("encounter")}
        />
      )}
    </div>
  );
}

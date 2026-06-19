"use client";

/**
 * ÇAĞRI — Temple of Silence sonunda açılan "Calling" ekranı.
 *
 * Canon: World Bible §7 (Temple = döngünün kapanışı + Çağrı belirir),
 * Civilization §3–§4 (Ortak Yol biter → rezonansa göre düzen çağrısı).
 *
 * MVP: seçim MANUEL. Otomatik öneri (rezonans okuması) sonraki dilim.
 * Kullanıcı bir düzene çağrılabilir VEYA Gezgin kalabilir (canon: kutsal).
 * Order ekseni archetype/district'ten BAĞIMSIZ — doğal yuva yalnızca ince
 * bir işaret, dayatma değil.
 */

import { useState } from "react";

import { getAvatarDistrict } from "@/data/avatar-districts";
import { ORDER_LIST, type OrderId } from "@/data/orders";
import type { BornAvatar } from "@/lib/avatar/birth-types";

type Choice = OrderId | "wanderer";

type Props = {
  avatar: BornAvatar;
  onChoose: (order: OrderId | null) => void;
  onBack: () => void;
};

export default function CallingScreen({ avatar, onChoose, onBack }: Props) {
  const [choice, setChoice] = useState<Choice | null>(avatar.order ?? null);
  const homeDistrict = getAvatarDistrict(avatar.district);

  function confirm() {
    if (!choice) return;
    onChoose(choice === "wanderer" ? null : choice);
  }

  return (
    <div className="av-step av-step-calling">
      <p className="av-kicker">TEMPLE OF SILENCE · ÇAĞRI</p>
      <h2 className="av-step-title">Bir yol seni çağırıyor</h2>
      <p className="av-step-lede">
        Sustuğunda her şeyi duyarsın. Ortak Yol'un sonunda rezonansın bir düzenle
        titreşir — ya da Gezgin kalırsın. İkisi de kutsaldır.
      </p>

      <div className="av-calling-grid" role="radiogroup" aria-label="Çağrını seç">
        {ORDER_LIST.map((o) => {
          const isOn = choice === o.id;
          const isHome = o.districtKey === avatar.district;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={isOn}
              className={`av-calling-card${isOn ? " is-on" : ""}`}
              onClick={() => setChoice(o.id)}
              style={
                {
                  "--o-robe": o.robePalette.robe,
                  "--o-accent": o.robePalette.accent,
                  "--o-glow": o.robePalette.sigilGlow,
                } as React.CSSProperties
              }
            >
              <span className="av-calling-sigil" aria-hidden="true">
                {o.sigil}
              </span>
              <span className="av-calling-name">{o.title}</span>
              <span className="av-calling-lesson">{o.lesson}</span>
              {isHome && (
                <span className="av-calling-home">
                  {homeDistrict.name} · doğal yuva
                </span>
              )}
            </button>
          );
        })}

        {/* Gezgin — hiçbir düzene ait olmamak da kutsaldır */}
        <button
          type="button"
          role="radio"
          aria-checked={choice === "wanderer"}
          className={`av-calling-card av-calling-wanderer${
            choice === "wanderer" ? " is-on" : ""
          }`}
          onClick={() => setChoice("wanderer")}
        >
          <span className="av-calling-sigil" aria-hidden="true">
            ✶
          </span>
          <span className="av-calling-name">Gezgin</span>
          <span className="av-calling-lesson">
            Henüz bir yol seçme; özgürce dolaş.
          </span>
        </button>
      </div>

      <div className="av-actions">
        <button type="button" className="av-btn av-btn-ghost" onClick={onBack}>
          Geri
        </button>
        <button
          type="button"
          className="av-btn av-btn-primary"
          disabled={!choice}
          onClick={confirm}
        >
          {choice === "wanderer"
            ? "Gezgin olarak yürü"
            : choice
              ? "Bu yola çağrıl"
              : "Bir yol seç"}
        </button>
      </div>
    </div>
  );
}

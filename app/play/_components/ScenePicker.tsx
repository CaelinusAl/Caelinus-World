"use client";

/**
 * ScenePicker — final picker. 4 cinematic SceneTiles that decide the
 * background palette of the look. Once the user picks a scene we kick
 * off the render automatically.
 *
 * F2b — when the visitor is signed in, a textarea appears beneath the
 * scene grid that lets them add a one-line "brief" to the prompt
 * (e.g. "wearing a silver headpiece, soft rain"). Empty briefs are
 * ignored. Anonymous visitors don't see the field — they get the
 * canonical render and a tiny "sign in to add a brief" hint instead.
 */

import { useEffect } from "react";

import { CinemaCTA, SceneTile } from "@/app/_stage";
import { findZodiac, SCENES, type SceneId } from "@/data/play-assets";
import { BRIEF_MAX_LENGTH, sanitizeBrief } from "@/lib/play/brief";
import { useAuthStore } from "@/stores/auth-store";
import { usePlayStore } from "@/stores/play-store";

type Props = {
  lang: "tr" | "en";
  /** Render trigger — caller passes the same fn used by the page so
   *  network logic stays out of the picker. */
  onGenerate: () => void;
};

export default function ScenePicker({ lang, onGenerate }: Props) {
  const scene = usePlayStore((s) => s.scene);
  const zodiacId = usePlayStore((s) => s.zodiac);
  const setScene = usePlayStore((s) => s.setScene);
  const brief = usePlayStore((s) => s.brief);
  const setBrief = usePlayStore((s) => s.setBrief);

  // Auth-store may not have hydrated yet on first paint — show the
  // brief field optimistically only after hydration to avoid a flicker.
  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);

  const z = findZodiac(zodiacId);
  const isAuthed = authHydrated && Boolean(user);
  const briefRemaining = BRIEF_MAX_LENGTH - brief.length;

  // If the user signs out mid-session, drop any brief they had so we
  // don't accidentally send it to the (anonymous) render endpoint.
  useEffect(() => {
    if (authHydrated && !user && brief) setBrief("");
  }, [authHydrated, user, brief, setBrief]);

  return (
    <div className="play-step play-step--scene">
      <header className="play-step-head">
        <p className="play-step-eyebrow">
          {lang === "tr" ? "Adım 03" : "Step 03"}
        </p>
        <h2 className="play-step-title">
          {lang === "tr" ? "Sahne Seç" : "Pick a Scene"}
        </h2>
        <p className="play-step-lead">
          {lang === "tr"
            ? "Tanrıçan nereye düşsün? Sahil, kahve, gece, resort."
            : "Where should she land? Beach, coffee, night, resort."}
        </p>
      </header>

      <div className="play-scene-grid">
        {SCENES.map((s) => (
          <SceneTile
            key={s.id}
            tone={s.tone}
            label={s.label[lang]}
            glyph={s.glyph}
            active={scene === s.id}
            onClick={() => setScene(s.id as SceneId)}
            aspect="square"
          />
        ))}
      </div>

      {scene ? (
        <div className="play-brief">
          {isAuthed ? (
            <>
              <label className="play-brief-label" htmlFor="play-brief-field">
                <span className="play-brief-eyebrow">
                  {lang === "tr" ? "Kişisel brief (opsiyonel)" : "Personal brief (optional)"}
                </span>
                <span
                  className={
                    "play-brief-counter" +
                    (briefRemaining < 20 ? " is-warning" : "")
                  }
                  aria-live="polite"
                >
                  {brief.length}/{BRIEF_MAX_LENGTH}
                </span>
              </label>
              <textarea
                id="play-brief-field"
                className="play-brief-input"
                value={brief}
                onChange={(e) => setBrief(sanitizeBrief(e.target.value))}
                maxLength={BRIEF_MAX_LENGTH}
                rows={2}
                placeholder={
                  lang === "tr"
                    ? "Örn: gümüş başlık, hafif yağmur, yıldız tozu"
                    : "e.g. silver headpiece, soft rain, stardust"
                }
                aria-describedby="play-brief-hint"
              />
              <p id="play-brief-hint" className="play-brief-hint">
                {lang === "tr"
                  ? "Briefin AI'a ek bir not olarak iletilir. Topluluk kurallarına uymalı."
                  : "Your brief is added as an extra note for the AI. Must follow the community guidelines."}
              </p>
            </>
          ) : (
            <p className="play-brief-signin">
              {lang === "tr"
                ? "Kişisel brief eklemek için giriş yap."
                : "Sign in to add a personal brief."}
            </p>
          )}
        </div>
      ) : null}

      {scene ? (
        <div className="play-step-foot">
          <CinemaCTA
            variant="luminous"
            tone={z ? z.tone : "magenta"}
            trailingGlyph="✦"
            onClick={onGenerate}
          >
            {lang === "tr" ? "Görünümü oluştur" : "Generate look"}
          </CinemaCTA>
        </div>
      ) : null}
    </div>
  );
}

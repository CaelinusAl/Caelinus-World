"use client";

/**
 * LaunchAtelierBody — açılış imza tasarımcılarının statik showcase'i.
 *
 * Atelier altyapısı (DB) henüz kurulu olmayan ortamlarda bile çalışan,
 * AtelierMatrix arka planı + cinematic hero + bio + "koleksiyon yakında"
 * blokunu render eder. Kullanıcı Caelinus'un açılış kadrosuna sosyal
 * proof olarak görür; gerçek atelier hesabı oluşturulduğunda satır bu
 * listeden çıkarılır ve sayfa otomatik olarak [slug] dynamic route'una
 * (DB) düşer.
 */

import Link from "next/link";

import { NebulaPortal, StageHero } from "@/app/_stage";
import { PROVINCES, PROVINCE_REGIONS } from "@/data/provinces";
import { KIND_LABELS } from "@/lib/atelier/validation";
import type { LaunchAtelier } from "@/data/atelier-launch";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../_components/AtelierMatrix";
import AvatarShowcase from "./AvatarShowcase";

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  back: { tr: "← Atelier", en: "← Atelier" },
  signin: { tr: "Giriş", en: "Sign in" },
  eyebrow: { tr: "Açılış Tasarımcısı", en: "Launch Designer" },
  story: { tr: "Hikâye", en: "The story" },
  meta: {
    where: { tr: "Toprak", en: "Land" },
    kind: { tr: "Zanaat", en: "Craft" },
  },
} as const;

function provinceMeta(provinceId: string, lang: "tr" | "en") {
  const p = PROVINCES.find((x) => x.id === provinceId);
  if (!p) return null;
  const r = PROVINCE_REGIONS.find((x) => x.id === p.regionId);
  return {
    name: p.name[lang],
    plate: p.plate,
    region: r ? r.name[lang] : "",
  };
}

export default function LaunchAtelierBody({
  atelier,
}: {
  atelier: LaunchAtelier;
}) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const place = provinceMeta(atelier.province, L);
  const kindLabel = KIND_LABELS[atelier.kind][L];
  const bio = L === "tr" ? atelier.bio_tr : atelier.bio_en;
  const story = L === "tr" ? atelier.story_tr : atelier.story_en;

  return (
    <div className="atelier-shell atelier-launch-shell">
      <AtelierMatrix intensity="rich" tone="frost" />
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/atelier" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">{T.brand[L]}</span>
        </Link>
        <div className="atelier-ribbon-actions">
          <Link href="/atelier" className="atelier-ribbon-btn">
            {T.back[L]}
          </Link>
          <button
            type="button"
            className="atelier-ribbon-lang"
            onClick={toggle}
            aria-label="Toggle language"
          >
            <span className={L === "tr" ? "is-active" : ""}>TR</span>
            <span className="atelier-ribbon-lang-divider">·</span>
            <span className={L === "en" ? "is-active" : ""}>EN</span>
          </button>
        </div>
      </header>

      <main className="atelier-launch">
        <StageHero
          tone="magenta"
          eyebrow={T.eyebrow[L]}
          title={atelier.name}
          lead={bio}
          portalSlot={
            <NebulaPortal size={240} tone="magenta" pulse>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={atelier.cover_image_url}
                alt={atelier.name}
                className="atelier-launch-portal-img"
              />
            </NebulaPortal>
          }
        >
          <p className="atelier-launch-meta">
            <span className="atelier-launch-meta-pill">{kindLabel}</span>
            {place ? (
              <span className="atelier-launch-meta-pill atelier-launch-meta-place">
                <span className="atelier-launch-meta-plate">{place.plate}</span>{" "}
                {place.name}
                {place.region ? (
                  <span className="atelier-launch-meta-region">
                    {" "}
                    · {place.region}
                  </span>
                ) : null}
              </span>
            ) : null}
          </p>
        </StageHero>

        {story ? (
          <section className="atelier-launch-section">
            <header className="atelier-launch-section-head">
              <h2 className="atelier-launch-section-title">{T.story[L]}</h2>
            </header>
            <div className="atelier-launch-prose">
              {story.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ) : null}

        <AvatarShowcase lang={L} comingSoon={Boolean(atelier.comingSoon)} />
      </main>
    </div>
  );
}

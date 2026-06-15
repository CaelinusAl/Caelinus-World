"use client";

/**
 * AvatarShowcase — Naz Yardımcı sayfasında "koleksiyon yakında" kartının
 * yerine geçen 3D vitrin.
 *
 * Akış:
 *   1. Mount olur olmaz aday dosya listesini sırayla HEAD-check'le:
 *        a) `/models/model_texture.glb`     (en yeni, "WOW level" Meshy)
 *        b) `/models/caelibus-avatar.glb`   (klasik web standardı)
 *        c) `/models/caelibus-avatar.fbx`   (FBX fallback)
 *   2. İlk bulunan dosyayı R3F Canvas'e ver — sıralama önceliği belirler.
 *   3. Hiçbiri yoksa → klasik "Koleksiyon yakında" kartına düş.
 *
 * Bu sayede tasarımcı yeni mesh'i klasöre koyduğu anda site otomatik
 * en güncel modeli yükler; ek deploy veya kod değişikliği gerekmez.
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { CinemaCTA, GlowPlatform } from "@/app/_stage";

const AvatarCanvas = dynamic(() => import("./AvatarCanvas"), {
  ssr: false,
  loading: () => <div className="atelier-launch-3d-shimmer" aria-hidden="true" />,
});

type ModelKind = "glb" | "fbx";

type ModelCandidate = { url: string; kind: ModelKind };

// Öncelik sırası: en yeni / WOW seviyesi en üstte.
const MODEL_CANDIDATES: ModelCandidate[] = [
  { url: "/models/n.yardimci.tulum.glb", kind: "glb" },
  { url: "/models/model_texture.glb", kind: "glb" },
];

const T = {
  title: { tr: "Koleksiyon", en: "Collection" },
  liveTitle: {
    tr: "Caelinus mankeni · 3D vitrin",
    en: "Caelinus mannequin · 3D vitrine",
  },
  liveBody: {
    tr: "Modeli sürükleyerek 360° döndürün. Naz Yardımcı'nın ilk koleksiyonu bu mankenin üzerinde sahne alacak.",
    en: "Drag the model to rotate 360°. Naz Yardımcı's debut collection will take the stage on this mannequin.",
  },
  hint: {
    tr: "Sürükle · yakınlaştır · oto-dönüş",
    en: "Drag · zoom · auto-rotate",
  },
  soonTitle: {
    tr: "İlk koleksiyon hazırlanıyor",
    en: "The debut collection is on the way",
  },
  soonBody: {
    tr: "Caelinus tezgâhında ilk parçalar yakında. Açılış mektubunu kaçırmamak için Atelier listesine kayıt ol.",
    en: "The first pieces arrive at the Caelinus bench soon. Subscribe to the Atelier list to catch the opening letter.",
  },
  soonCta: {
    tr: "Caelinus listesine katıl",
    en: "Join the Caelinus list",
  },
} as const;

type State =
  | { kind: "checking" }
  | { kind: "ready"; candidate: ModelCandidate }
  | { kind: "missing" };

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export default function AvatarShowcase({
  lang,
  comingSoon,
}: {
  lang: "tr" | "en";
  comingSoon: boolean;
}) {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Öncelik sırasına göre dene; ilk bulunanı yükle.
      for (const candidate of MODEL_CANDIDATES) {
        const ok = await probe(candidate.url);
        if (cancelled) return;
        if (ok) {
          setState({ kind: "ready", candidate });
          return;
        }
      }
      if (!cancelled) setState({ kind: "missing" });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "ready") {
    return (
      <section className="atelier-launch-section atelier-launch-3d">
        <header className="atelier-launch-section-head">
          <h2 className="atelier-launch-section-title">{T.title[lang]}</h2>
        </header>
        <div className="atelier-launch-3d-card">
          <div className="atelier-launch-3d-stage">
            <AvatarCanvas
              kind={state.candidate.kind}
              url={state.candidate.url}
            />
            <span className="atelier-launch-3d-live" aria-hidden="true">
              Live 3D
            </span>
            <span className="atelier-launch-3d-hint" aria-hidden="true">
              ◴ {T.hint[lang]}
            </span>
          </div>
          <div className="atelier-launch-3d-caption">
            <h3 className="atelier-launch-3d-title">{T.liveTitle[lang]}</h3>
            <p className="atelier-launch-3d-body">{T.liveBody[lang]}</p>
          </div>
          <GlowPlatform
            width={460}
            tone="magenta"
            intensity="soft"
            className="atelier-launch-3d-platform"
          />
        </div>
      </section>
    );
  }

  if (state.kind === "checking") {
    return (
      <section className="atelier-launch-section atelier-launch-3d">
        <header className="atelier-launch-section-head">
          <h2 className="atelier-launch-section-title">{T.title[lang]}</h2>
        </header>
        <div className="atelier-launch-3d-card">
          <div className="atelier-launch-3d-stage atelier-launch-3d-stage--loading">
            <div className="atelier-launch-3d-shimmer" aria-hidden="true" />
          </div>
        </div>
      </section>
    );
  }

  if (!comingSoon) return null;

  return (
    <section className="atelier-launch-section atelier-launch-soon">
      <header className="atelier-launch-section-head">
        <h2 className="atelier-launch-section-title">{T.title[lang]}</h2>
      </header>
      <div className="atelier-launch-soon-card">
        <h3 className="atelier-launch-soon-title">{T.soonTitle[lang]}</h3>
        <p className="atelier-launch-soon-body">{T.soonBody[lang]}</p>
        <CinemaCTA
          href="/atelier/kesfet"
          variant="ghost"
          tone="magenta"
          trailingGlyph="→"
        >
          {T.soonCta[lang]}
        </CinemaCTA>
        <GlowPlatform
          width={420}
          tone="magenta"
          intensity="soft"
          className="atelier-launch-soon-platform"
        />
      </div>
    </section>
  );
}

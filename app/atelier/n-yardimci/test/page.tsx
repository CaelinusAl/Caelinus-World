"use client";

/**
 * /atelier/n-yardimci/test — manken aday gallery'si.
 *
 * Naz Yardımcı vitrini için elimizde 5 farklı `.glb`/`.fbx` export var.
 * Bu sayfa hepsini yan yana, sürüklenebilir 3D olarak gösterir; varsayılan
 * mankeni seçtikten sonra ilgili dosya `caelibus-avatar.glb` olarak alias
 * edilir ve production sayfası otomatik yüklenir.
 *
 * Sayfa client-only; her preview küçük bir R3F canvas'i mount eder.
 * Ağır dosyalar (örn. avatar3 ~27MB) burada yan yana ön izlenir; gerçek
 * vitrinde yalnızca seçilen tek bir model kullanılır.
 */

import dynamic from "next/dynamic";
import Link from "next/link";

const ModelPreview = dynamic(() => import("./ModelPreview"), {
  ssr: false,
  loading: () => <div className="atelier-launch-3d-shimmer" aria-hidden="true" />,
});

type Candidate = {
  id: string;
  label: string;
  url: string;
  size: string;
  kind: "glb" | "fbx";
  hint: string;
  highlight?: boolean;
};

const CANDIDATES: Candidate[] = [
  {
    id: "tulum",
    label: "Naz Yardımcı · Tulum",
    url: "/models/n.yardimci.tulum.glb",
    size: "7.1 MB",
    kind: "glb",
    hint: "Naz Yardımcı'nın kıyafetli mankeni. Ana vitrinde aktif olan model bu.",
    highlight: true,
  },
  {
    id: "wow",
    label: "model_texture · saçlı manken",
    url: "/models/model_texture.glb",
    size: "8.2 MB",
    kind: "glb",
    hint: "Saçlı + yüzlü base mesh (kıyafetsiz). Tulum versiyonu yokken yedek.",
  },
  {
    id: "v5",
    label: "avatar5 · sweet-spot",
    url: "/models/caelinus-avatar5.glb",
    size: "9.8 MB",
    kind: "glb",
    hint: "Orta-yüksek kalite, web sweet-spot. Masaüstü/tablet için ideal.",
  },
  {
    id: "v1",
    label: "avatar · hafif",
    url: "/models/caelinus-avatar.glb",
    size: "3.4 MB",
    kind: "glb",
    hint: "Hafif, mobilde hızlı. Makul kalite, ilk yüklemede en çevik.",
  },
  {
    id: "v3",
    label: "avatar3 · yüksek kalite",
    url: "/models/caelinus-avatar3.glb",
    size: "27.3 MB",
    kind: "glb",
    hint: "En yüksek kalite. Mobilde ağır yüklenir, masaüstü demoda etkileyici.",
  },
  {
    id: "v4",
    label: "avatar4 · low-poly",
    url: "/models/caelinus-avatar4.glb",
    size: "1.4 MB",
    kind: "glb",
    hint: "En hafif. Low-poly hissi olabilir; ilk render saniye altı.",
  },
  {
    id: "v2",
    label: "avatar2 · FBX",
    url: "/models/caelinus-avatar2.fbx",
    size: "3.0 MB",
    kind: "fbx",
    hint: "FBX alternatifi. Texture yoksa mat/gri görünebilir.",
  },
];

export default function TestGallery() {
  return (
    <div className="atelier-shell atelier-launch-shell">
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/atelier/n-yardimci" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">
            ←
          </span>
          <span className="atelier-ribbon-name">Naz Yardımcı</span>
        </Link>
      </header>

      <main className="atelier-launch atelier-launch-gallery">
        <header className="atelier-launch-gallery-head">
          <p className="atelier-launch-meta">
            <span className="atelier-launch-meta-pill">Test · Manken Adayları</span>
          </p>
          <h1 className="atelier-launch-section-title">
            Hangi Naz mankeni vitrine çıksın?
          </h1>
          <p className="atelier-launch-prose atelier-launch-gallery-lead">
            5 farklı export'u yan yana karşılaştır. Sürükleyerek döndürebilir,
            kalite ile dosya boyutu arasındaki dengeyi kendi gözünle görebilirsin.
            Seçimini söyle, kararlaştırılan dosyayı{" "}
            <code>caelibus-avatar.glb</code> olarak alias yapayım — production
            sayfası anında bu mankeni yükleyecek.
          </p>
        </header>

        <div className="atelier-launch-gallery-grid">
          {CANDIDATES.map((c) => (
            <article
              key={c.id}
              className={
                "atelier-launch-gallery-card" +
                (c.highlight ? " atelier-launch-gallery-card--star" : "")
              }
            >
              <div className="atelier-launch-3d-stage atelier-launch-gallery-stage">
                <ModelPreview url={c.url} kind={c.kind} />
                {c.highlight ? (
                  <span
                    className="atelier-launch-gallery-badge"
                    aria-hidden="true"
                  >
                    ★ Önerim
                  </span>
                ) : null}
              </div>
              <div className="atelier-launch-gallery-caption">
                <h3 className="atelier-launch-3d-title">{c.label}</h3>
                <p className="atelier-launch-gallery-meta">
                  <code>{c.url.split("/").pop()}</code>
                  <span className="atelier-launch-gallery-meta-divider">·</span>
                  {c.size}
                </p>
                <p className="atelier-launch-3d-body">{c.hint}</p>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

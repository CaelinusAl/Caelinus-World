"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { loadMasterAssetExperience } from "@/lib/codex/discovery-data";

type MasterAssetExperience = NonNullable<
  Awaited<ReturnType<typeof loadMasterAssetExperience>>
>;

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: "Üretim Yol Haritasında",
  SPECIFICATION_COMPLETE: "Tasarım Paketi Hazır",
  SPECIFIED: "Tanımlandı",
  PASS: "Tamamlandı",
  PENDING: "Planlandı",
  READY: "Hazır",
  MISSING: "Planlandı",
};

const GATE_LABELS: Record<string, string> = {
  "identity-lock": "Kimlik ve Tasarım",
  "reference-review": "Görsel Referans",
  geometry: "3D Geometri",
  topology: "Topoloji",
  transforms: "Sahne Dönüşümleri",
  materials: "Malzeme Sistemi",
  collision: "Collision",
  lod: "LOD Optimizasyonu",
  export: "Engine Export",
  "visual-review": "Görsel Kalite",
};

const ARTIFACT_LABELS: Record<string, string> = {
  "source-scene": "Kaynak 3D Sahne",
  "web-runtime": "Web 3D Modeli",
  "engine-interchange": "Unreal Aktarım Modeli",
  preview: "Model Önizlemesi",
  "validation-report": "Teknik Doğrulama",
};

const statusLabel = (status: string) => STATUS_LABELS[status] ?? status;

export default function CodexMasterAssetExperience({
  asset,
}: {
  asset: MasterAssetExperience;
}) {
  const tabs = asset.tabs.length
    ? [...asset.tabs]
    : [
        {
          id: "overview",
          label: "Overview",
          title: asset.title,
          paragraphs: [asset.description],
        },
      ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <main className="codex-book codex-discovery codex-master-asset">
      <header className="codex-document__bar">
        <Link href="/archive/chapter/genesis">Genesis</Link>
        <span>MASTER ASSET · {asset.assetId}</span>
        <Link href={`/archive/read/${asset.pageNumber}`}>Levha {asset.pageNumber}</Link>
      </header>

      <section className="codex-discovery__hero">
        <div className="codex-discovery__hero-copy">
          <p>{asset.primaryCanonId} · İmza Oyun Varlığı</p>
          <span className="codex-discovery__glyph" aria-hidden="true">◆</span>
          <h1>{asset.title}</h1>
          <h2>{asset.subtitle}</h2>
          <p>{asset.description}</p>
          <dl>
            <div>
              <dt>Üretim Aşaması</dt>
              <dd>{statusLabel(asset.productionStatus)}</dd>
            </div>
            <div>
              <dt>Tasarım Paketi</dt>
              <dd>
                {asset.package
                  ? statusLabel(asset.package.packageStatus)
                  : "Geliştirme Yol Haritasında"}
              </dd>
            </div>
            <div>
              <dt>3D Model</dt>
              <dd>{asset.modelArtifactReady ? "Hazır" : "Üretim Sırasında"}</dd>
            </div>
          </dl>
        </div>
        <figure className="codex-discovery__hero-art">
          <Image
            src={asset.imageSrc}
            alt={`${asset.title} üretim referansı`}
            fill
            priority
            unoptimized
            sizes="(max-width: 800px) 94vw, 46vw"
          />
          <figcaption>
            Master Asset · Onaylı görsel yön
          </figcaption>
        </figure>
      </section>

      <section className="codex-master-asset__workspace" aria-labelledby="asset-workspace-title">
        <header>
          <p>Living Production Dossier</p>
          <h2 id="asset-workspace-title">Bir asset, bütün üretim katmanları</h2>
        </header>

        <div
          className="codex-master-asset__tabs"
          role="tablist"
          aria-label={`${asset.title} production layers`}
        >
          {tabs.map((tab) => (
            <button
              id={`tab-${tab.id}`}
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <article
          id={`panel-${active.id}`}
          className="codex-master-asset__panel"
          role="tabpanel"
          aria-labelledby={`tab-${active.id}`}
          tabIndex={0}
        >
          <div>
            <p>Production Layer · {active.label}</p>
            <h3>{active.title}</h3>
            {active.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {"bullets" in active && active.bullets ? (
              <ul>
                {active.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {active.id === "three-d" ? (
            <aside className="codex-master-asset__readiness">
              <Image
                src={asset.imageSrc}
                alt=""
                width={620}
                height={420}
                unoptimized
              />
              <strong>3D üretim yol haritası</strong>
              <span>
                Ölçek, malzeme, Nanite, LOD ve Unreal aktarım kararları
                tamamlandı. Gerçek zamanlı model, üretim teslimiyle bu alanda
                yayınlanacak.
              </span>
            </aside>
          ) : null}

          {active.id === "production" && asset.package ? (
            <aside className="codex-master-asset__deliverables">
              <h4>Tanımlı Teslimatlar</h4>
              <ol>
                {asset.package.deliverables.map((deliverable) => (
                  <li key={deliverable.id}>
                    <span>{String(deliverable.id).padStart(2, "0")}</span>
                    <strong>{deliverable.name}</strong>
                    <small>{statusLabel(deliverable.status)}</small>
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}

          {active.id === "engineering" ||
          active.id === "nanite" ||
          active.id === "lod" ? (
            <aside className="codex-master-asset__gates">
              <h4>Üretim Yol Haritası</h4>
              {asset.gates.map((gate) => (
                <div key={gate.id}>
                  <span>{GATE_LABELS[gate.id] ?? gate.id}</span>
                  <strong data-status={gate.status}>
                    {statusLabel(gate.status)}
                  </strong>
                </div>
              ))}
            </aside>
          ) : null}
        </article>
      </section>

      <section className="codex-discovery__evidence" aria-labelledby="asset-evidence-title">
        <header>
          <p>Production Roadmap</p>
          <h2 id="asset-evidence-title">Üretim teslimleri ve sistem bağları</h2>
        </header>
        <div className="codex-master-asset__artifact-grid">
          {asset.artifacts.map((artifact) => (
            <article key={`${artifact.kind}-${artifact.format}`}>
              <small>{artifact.format}</small>
              <h3>{ARTIFACT_LABELS[artifact.kind] ?? artifact.kind}</h3>
              <strong data-status={artifact.state}>
                {statusLabel(artifact.state)}
              </strong>
            </article>
          ))}
        </div>
        <nav className="codex-discovery__links" aria-label="Related production volumes">
          <Link href="/archive/chapter/gameplay-bible">
            <span>CN-04.3</span>
            <strong>Production Bible · Gameplay</strong>
          </Link>
          <Link href="/archive/chapter/engineering-bible">
            <span>CN-04.2</span>
            <strong>Engineering Bible</strong>
          </Link>
          <Link href="/archive/chapter/unreal-implementation">
            <span>CN-13</span>
            <strong>Unreal Implementation</strong>
          </Link>
          <Link href="/archive/discover/yasam-agaci">
            <span>Sembol</span>
            <strong>Yaşam Ağacı</strong>
          </Link>
        </nav>
      </section>
    </main>
  );
}

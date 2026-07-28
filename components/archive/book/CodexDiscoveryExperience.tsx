import Image from "next/image";
import Link from "next/link";

import type { loadDiscoveryExperience } from "@/lib/codex/discovery-data";

type DiscoveryExperience = NonNullable<
  Awaited<ReturnType<typeof loadDiscoveryExperience>>
>;

const KIND_LABELS = {
  symbol: "Sembol Sistemi",
  place: "Mekân Sistemi",
  npc: "NPC Sistemi",
} as const;

export default function CodexDiscoveryExperience({
  dossier,
}: {
  dossier: DiscoveryExperience;
}) {
  const hero = dossier.assets[0];

  return (
    <main className="codex-book codex-discovery">
      <header className="codex-document__bar">
        <Link href="/archive/chapter/genesis">Genesis</Link>
        <span>{KIND_LABELS[dossier.kind]} · Living Codex</span>
        <Link href="#discovery-relations">İlişkiler</Link>
      </header>

      <section className="codex-discovery__hero">
        <div className="codex-discovery__hero-copy">
          <p>{KIND_LABELS[dossier.kind]}</p>
          <span className="codex-discovery__glyph" aria-hidden="true">
            {dossier.glyph}
          </span>
          <h1>{dossier.title}</h1>
          <h2>{dossier.subtitle}</h2>
          <p>{dossier.statusLabel}</p>
          <nav aria-label={`${dossier.title} sections`}>
            {dossier.sections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>
                {section.title}
              </a>
            ))}
          </nav>
        </div>
        {hero ? (
          <figure className="codex-discovery__hero-art">
            <Image
              src={hero.imageSrc}
              alt={`${dossier.title} ile ilişkili Codex görseli: ${hero.title}`}
              fill
              priority
              unoptimized
              sizes="(max-width: 800px) 94vw, 46vw"
            />
            <figcaption>
              {hero.assetId} · Codex Görsel Referansı
            </figcaption>
          </figure>
        ) : (
          <div className="codex-discovery__hero-symbol" aria-hidden="true">
            {dossier.glyph}
          </div>
        )}
      </section>

      <section className="codex-discovery__chapters" aria-label={`${dossier.title} dossier`}>
        {dossier.sections.map((section, index) => (
          <article id={section.id} key={section.id} data-codex-section>
            <header>
              <p>{section.eyebrow}</p>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{section.title}</h2>
            </header>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets?.length ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      <section className="codex-discovery__evidence" aria-labelledby="discovery-evidence-title">
        <header>
          <p>Living Codex Connections</p>
          <h2 id="discovery-evidence-title">Görseller ve geçtiği bölümler</h2>
        </header>
        {dossier.assets.length ? (
          <div className="codex-discovery__asset-grid">
            {dossier.assets.map((asset) => (
              <figure key={asset.assetId}>
                <Link href={`/archive/read/${asset.pageNumber}`}>
                  <span>
                    <Image
                      src={asset.imageSrc}
                      alt={asset.title}
                      fill
                      unoptimized
                      sizes="(max-width: 760px) 90vw, 360px"
                    />
                  </span>
                  <figcaption>
                    <small>{asset.assetId} · Codex Referansı</small>
                    <strong>{asset.title}</strong>
                    {asset.subtitle ? <p>{asset.subtitle}</p> : null}
                  </figcaption>
                </Link>
              </figure>
            ))}
          </div>
        ) : null}

        {dossier.occurrences.length ? (
          <nav className="codex-discovery__occurrences" aria-label="Codex appearances">
            <h3>Codex içinde geçtiği bölümler</h3>
            {dossier.occurrences.map((occurrence) => (
              <Link
                href={`/archive/chapter/${occurrence.chapterSlug}#${occurrence.sectionId}`}
                key={`${occurrence.chapterSlug}-${occurrence.sectionId}`}
              >
                <span>{occurrence.chapterTitle}</span>
                <strong>{occurrence.sectionTitle}</strong>
              </Link>
            ))}
          </nav>
        ) : (
          <p className="codex-discovery__boundary">
            Bu yaşayan bağ, doğrulanmış Codex görsellerini Genesis anlatısıyla
            birleştirerek yeni keşif yolları açar.
          </p>
        )}
      </section>

      <section
        id="discovery-relations"
        className="codex-discovery__relations"
        aria-labelledby="discovery-relations-title"
      >
        <header>
          <p>Four System Gates</p>
          <h2 id="discovery-relations-title">Bu kapı nereye açılıyor?</h2>
        </header>
        <nav className="codex-discovery__links" aria-label="Related systems">
          {dossier.relatedLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              <span>{link.detail}</span>
              <strong>{link.label}</strong>
              <i aria-hidden="true">→</i>
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}

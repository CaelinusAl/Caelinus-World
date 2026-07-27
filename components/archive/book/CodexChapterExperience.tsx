import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import type { CodexChapterDocument } from "@/lib/codex/experience-contract";

import BookParticles from "./BookParticles";
import CodexChapterTools from "./CodexChapterTools";

const REFERENCE_LABELS = {
  environment: "Places & Environments",
  npc: "People & NPCs",
  profession: "Professions",
  "production-volume": "Production Volumes",
  "text-image-bridge": "Text & Image Bridges",
} as const;

export default function CodexChapterExperience({
  chapter,
}: {
  chapter: CodexChapterDocument;
}) {
  const sections = chapter.sections.map((section) => ({
    id: section.id,
    title: section.title,
  }));
  const referencesByType = Object.entries(
    chapter.references.reduce<
      Partial<Record<(typeof chapter.references)[number]["type"], typeof chapter.references>>
    >((groups, reference) => {
      const group = groups[reference.type] ?? [];
      group.push(reference);
      groups[reference.type] = group;
      return groups;
    }, {}),
  );

  return (
    <main
      className="codex-book codex-document"
      style={{ "--chapter-accent": chapter.accent } as CSSProperties}
    >
      <BookParticles />
      <CodexChapterTools
        chapterSlug={chapter.slug}
        chapterTitle={chapter.title}
        sections={sections}
      />

      <header className="codex-document__bar">
        <Link href="/archive/contents">Contents</Link>
        <span>{chapter.canonId}</span>
        <Link href="/archive/chapter/image-archive">Image Archive</Link>
      </header>

      <div className="codex-document__layout">
        <aside className="codex-document__navigation">
          <Link href="/archive" className="codex-document__brand">
            <span aria-hidden="true">✣</span>
            <strong>CAELINUS CODEX</strong>
            <small>THE LIVING BOOK OF ANATOLIA</small>
          </Link>
          <nav aria-label={`${chapter.title} sections`}>
            <p>In this volume</p>
            {sections.length ? (
              <ol>
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="codex-document__source-note">
                No canonical prose source is currently present.
              </p>
            )}
            <a href="#visual-archive">Illustrations</a>
            <a href="#canonical-relations">Cross-references</a>
          </nav>
        </aside>

        <article className="codex-document__page">
          <header className="codex-document__hero">
            <span aria-hidden="true">{chapter.glyph}</span>
            <p>
              VOLUME {String(chapter.order).padStart(2, "0")} · {chapter.canonId}
            </p>
            <h1>{chapter.title}</h1>
            <h2>{chapter.subtitle}</h2>
            <dl>
              <div>
                <dt>Canonical source</dt>
                <dd>{chapter.sourceStatus}</dd>
              </div>
              <div>
                <dt>Sections</dt>
                <dd>{chapter.sections.length}</dd>
              </div>
              <div>
                <dt>Full text</dt>
                <dd>{chapter.wordCount.toLocaleString("tr-TR")} words</dd>
              </div>
              <div>
                <dt>Linked plates</dt>
                <dd>{chapter.assets.length}</dd>
              </div>
            </dl>
          </header>

          {chapter.sections.length ? (
            <div className="codex-document__prose">
              {chapter.sections.map((section, sectionIndex) => (
                <section id={section.id} key={section.id} data-codex-section>
                  <header>
                    <p>
                      {section.bibleId} · {section.kind}
                      {section.num === null ? "" : ` ${section.num}`}
                    </p>
                    <span>{String(sectionIndex + 1).padStart(2, "0")}</span>
                    <h2>{section.title}</h2>
                    <small>
                      {section.wordCount.toLocaleString("tr-TR")} words
                      {section.profession ? ` · ${section.profession}` : ""}
                    </small>
                  </header>
                  {section.blocks.map((block, blockIndex) => (
                    <div
                      className="codex-document__block"
                      key={`${section.id}-${blockIndex}`}
                    >
                      {block.heading ? <h3>{block.heading}</h3> : null}
                      <p>{block.text}</p>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          ) : (
            <section className="codex-document__gap" aria-labelledby="source-gap-title">
              <span aria-hidden="true">{chapter.glyph}</span>
              <h2 id="source-gap-title">Canonical source boundary</h2>
              <p>
                This Bible is defined by the frozen canon, but no canonical prose
                document is present in the current source corpus. Nothing has been
                generated, summarized or inferred. Its verified editorial plates and
                explicit relationships remain available below.
              </p>
            </section>
          )}

          <section id="visual-archive" className="codex-document__assets">
            <header>
              <p>Editorial Runtime</p>
              <h2>Illustrations & production references</h2>
              <span>{chapter.assets.length} canon-linked plates</span>
            </header>
            {chapter.assets.length ? (
              <div className="codex-document__asset-grid">
                {chapter.assets.map((asset) => (
                  <figure id={`asset-${asset.assetId}`} key={asset.assetId}>
                    <Link href={asset.imageSrc} target="_blank">
                      <Image
                        src={asset.imageSrc}
                        alt={asset.publicTitle}
                        width={720}
                        height={450}
                        sizes="(max-width: 760px) 92vw, (max-width: 1200px) 44vw, 360px"
                      />
                    </Link>
                    <figcaption>
                      <small>
                        {asset.assetId} · {asset.primaryCanonId}
                      </small>
                      <h3>{asset.publicTitle}</h3>
                      {asset.subtitle ? <p>{asset.subtitle}</p> : null}
                      {asset.description ? <p>{asset.description}</p> : null}
                      {asset.npc || asset.profession ? (
                        <dl>
                          {asset.npc ? (
                            <div>
                              <dt>NPC</dt>
                              <dd>{asset.npc}</dd>
                            </div>
                          ) : null}
                          {asset.profession ? (
                            <div>
                              <dt>Profession</dt>
                              <dd>{asset.profession}</dd>
                            </div>
                          ) : null}
                        </dl>
                      ) : null}
                      {asset.relatedSystems.length ? (
                        <ul aria-label="Related systems">
                          {asset.relatedSystems.map((system) => (
                            <li key={system}>{system}</li>
                          ))}
                        </ul>
                      ) : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="codex-document__empty">
                No editorial plate is explicitly bound to this Canon ID.
              </p>
            )}
          </section>

          <section id="canonical-relations" className="codex-document__relations">
            <header>
              <p>Canonical Knowledge Graph</p>
              <h2>Related knowledge</h2>
            </header>
            {referencesByType.length ? (
              <div className="codex-document__relation-grid">
                {referencesByType.map(([type, references]) => (
                  <section key={type}>
                    <h3>
                      {REFERENCE_LABELS[type as keyof typeof REFERENCE_LABELS] ?? type}
                    </h3>
                    <ul>
                      {references?.map((reference) => (
                        <li key={reference.id}>
                          <strong>{reference.label}</strong>
                          {reference.assetIds.length ? (
                            <span>{reference.assetIds.join(" · ")}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <p className="codex-document__empty">
                No explicit graph relationship is recorded for this volume.
              </p>
            )}

            {chapter.crossReferences.length ? (
              <nav aria-label="Related canonical volumes">
                <h3>Cross-referenced volumes</h3>
                <ul>
                  {chapter.crossReferences.map((reference) => (
                    <li key={reference.canonId}>
                      <Link href={`/archive/chapter/${reference.slug}`}>
                        <span>{reference.canonId}</span>
                        <strong>{reference.title}</strong>
                        <small>{reference.sharedAssetIds.length} shared assets</small>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </section>

          <nav className="codex-document__pagination" aria-label="Adjacent volumes">
            {chapter.previous ? (
              <Link href={`/archive/chapter/${chapter.previous.slug}`}>
                <span>Previous volume</span>
                {chapter.previous.title}
              </Link>
            ) : <span />}
            {chapter.next ? (
              <Link href={`/archive/chapter/${chapter.next.slug}`}>
                <span>Next volume</span>
                {chapter.next.title}
              </Link>
            ) : <span />}
          </nav>
        </article>
      </div>
    </main>
  );
}

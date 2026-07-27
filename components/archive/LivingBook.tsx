"use client";

import type { CSSProperties } from "react";

import type {
  ArchiveBibleSummary,
  ArchiveSectionDetail,
} from "@/lib/codex/experience-contract";

type LivingBookProps = {
  bibles: ArchiveBibleSummary[];
  activeBibleId: string;
  activeSectionId: string | null;
  section: ArchiveSectionDetail | null;
  loading: boolean;
  entityLabels: Map<string, string>;
  onBible: (id: string) => void;
  onSection: (id: string) => void;
  onEntity: (id: string) => void;
};

export default function LivingBook({
  bibles,
  activeBibleId,
  activeSectionId,
  section,
  loading,
  entityLabels,
  onBible,
  onSection,
  onEntity,
}: LivingBookProps) {
  const bible = bibles.find((item) => item.id === activeBibleId) ?? bibles[0];

  return (
    <section className="living-book" aria-labelledby="living-book-title">
      <aside className="living-book__volumes" aria-label="Kanon ciltleri">
        <p className="archive-kicker">16 CİLTLİK KANON</p>
        <h2 id="living-book-title">Living Book</h2>
        <div className="living-book__volume-list">
          {bibles.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={item.id === bible.id}
              className={item.id === bible.id ? "is-active" : undefined}
              onClick={() => onBible(item.id)}
              style={{ "--bible-accent": item.accent } as CSSProperties}
            >
              <span aria-hidden="true">{item.glyph}</span>
              <span>
                <small>{item.id}</small>
                {item.tr}
              </span>
              <em>{item.sectionCount}</em>
            </button>
          ))}
        </div>
      </aside>

      <nav className="living-book__chapters" aria-label={`${bible.tr} bölümleri`}>
        <header>
          <span aria-hidden="true">{bible.glyph}</span>
          <div>
            <small>{bible.id} · {bible.status}</small>
            <h3>{bible.tr}</h3>
          </div>
        </header>
        {bible.sections.length ? (
          <ol>
            {bible.sections.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={activeSectionId === item.id ? "page" : undefined}
                  className={activeSectionId === item.id ? "is-active" : undefined}
                  onClick={() => onSection(item.id)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.profession ?? item.kind} · {item.wordCount} kelime</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="archive-empty">Bu cilt kanonda tanımlı; metni henüz mevcut değil.</p>
        )}
      </nav>

      <article className={`living-book__page${loading ? " is-loading" : ""}`} aria-live="polite">
        {loading ? <p className="archive-loading">Sayfa açılıyor…</p> : null}
        {!loading && section ? (
          <>
            <header>
              <p className="archive-kicker">{section.bibleId} · {section.kind}</p>
              <h2>{section.title}</h2>
              <p>{section.wordCount} kelime · {section.sourceFile}</p>
            </header>
            <div className="living-book__prose">
              {section.blocks.map((block, index) => (
                <section key={`${block.heading ?? "body"}-${index}`}>
                  {block.heading ? <h3>{block.heading}</h3> : null}
                  {block.text.split(/\n{2,}/).filter(Boolean).map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </div>
            {section.entities.length ? (
              <footer>
                <span>Bu sayfadaki ilişkiler</span>
                <div>
                  {section.entities.map((entityId) => (
                    <button type="button" key={entityId} onClick={() => onEntity(entityId)}>
                      {entityLabels.get(entityId) ?? entityId}
                    </button>
                  ))}
                </div>
              </footer>
            ) : null}
          </>
        ) : null}
        {!loading && !section ? (
          <div className="living-book__welcome">
            <span aria-hidden="true">{bible.glyph}</span>
            <h2>{bible.tr}</h2>
            <p>Bir bölüm seç. Arşiv sayfasını açsın.</p>
          </div>
        ) : null}
      </article>
    </section>
  );
}

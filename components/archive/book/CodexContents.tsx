import Link from "next/link";

import type { LivingBookPublicModel } from "@/lib/codex/experience-contract";

import BookParticles from "./BookParticles";

export default function CodexContents({ book }: { book: LivingBookPublicModel }) {
  return (
    <main className="codex-book codex-contents">
      <BookParticles />
      <div className="codex-open-spread" aria-hidden="true">
        <span />
        <span />
      </div>
      <section className="codex-contents__page" aria-labelledby="codex-contents-title">
        <header>
          <Link href="/archive" aria-label="Return to the Codex cover">✣</Link>
          <p>CAELINUS CODEX</p>
          <h1 id="codex-contents-title">Table of Contents</h1>
          <span>THE LIVING BOOK OF ANATOLIA</span>
        </header>

        <ol>
          {book.chapters.map((chapter) => {
            const available = chapter.availablePages > 0;
            return (
              <li key={chapter.slug}>
                <span>{String(chapter.order).padStart(2, "0")}</span>
                {available ? (
                  <Link href={`/archive/chapter/${chapter.slug}`}>
                    <strong>{chapter.title}</strong>
                    <small>{chapter.availablePages} pages</small>
                  </Link>
                ) : (
                  <div aria-disabled="true">
                    <strong>{chapter.title}</strong>
                    <small>Volume</small>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <Link href="/archive/chapter/image-archive" className="codex-contents__continue">
          Enter the Image Archive <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}

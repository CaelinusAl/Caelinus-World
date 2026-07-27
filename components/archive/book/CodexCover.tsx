import type { LivingBookPublicModel } from "@/lib/codex/experience-contract";

import BookParticles from "./BookParticles";
import OpenCodexButton from "./OpenCodexButton";

export default function CodexCover({ book }: { book: LivingBookPublicModel }) {
  return (
    <main className="codex-book codex-cover-screen">
      <BookParticles />
      <div className="codex-cover-light" aria-hidden="true" />
      <article className="codex-cover" aria-labelledby="codex-cover-title">
        <div className="codex-cover__edge" aria-hidden="true" />
        {/* The cover is served by the same guarded asset pipeline as all pages. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={book.coverSrc}
          alt="Anadolu üzerinde ışıkla kök salan Caelinus Yaşam Ağacı"
          className="codex-cover__art"
          fetchPriority="high"
        />
        <div className="codex-cover__veil" aria-hidden="true" />
        <div className="codex-cover__inscription">
          <span className="codex-cover__seal" aria-hidden="true">✣</span>
          <p>{book.imprint}</p>
          <h1 id="codex-cover-title">{book.title}</h1>
          <h2>{book.subtitle}</h2>
          <OpenCodexButton />
        </div>
      </article>
    </main>
  );
}

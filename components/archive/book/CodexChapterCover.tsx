import Link from "next/link";

import type { CodexChapter } from "@/lib/codex/experience-contract";

import BookParticles from "./BookParticles";

export default function CodexChapterCover({ chapter }: { chapter: CodexChapter }) {
  return (
    <main className="codex-book codex-chapter">
      <BookParticles />
      <section aria-labelledby="codex-chapter-title">
        <div className="codex-chapter__motif" aria-hidden="true">✣</div>
        <p>VOLUME {String(chapter.order).padStart(2, "0")}</p>
        <h1 id="codex-chapter-title">{chapter.title}</h1>
        <span>CAELINUS CODEX · THE LIVING BOOK OF ANATOLIA</span>
        <div className="codex-chapter__actions">
          <Link href="/archive/contents">Contents</Link>
          <Link href="/archive/read/1">Begin <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </main>
  );
}

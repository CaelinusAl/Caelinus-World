import Link from "next/link";

import BookParticles from "./BookParticles";

export default function CodexEndPage() {
  return (
    <main className="codex-book codex-end">
      <BookParticles />
      <section aria-labelledby="codex-end-title">
        <span aria-hidden="true">✣</span>
        <h1 id="codex-end-title">Devam ediyor...</h1>
        <p>Every new page written expands the living memory of Anatolia.</p>
        <div>
          <Link href="/archive/contents">Return to contents</Link>
          <Link href="/archive/read/1">Begin again</Link>
        </div>
      </section>
    </main>
  );
}

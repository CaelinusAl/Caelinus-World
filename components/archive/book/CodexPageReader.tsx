"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { PublicCodexPage } from "@/lib/codex/experience-contract";
import { writeCodexReadingState } from "@/lib/codex/reading-state";

import BookParticles from "./BookParticles";

type CodexPageReaderProps = {
  pages: PublicCodexPage[];
  initialIndex: number;
};

export default function CodexPageReader({ pages, initialIndex }: CodexPageReaderProps) {
  const router = useRouter();
  const index = initialIndex;
  const [chromeVisible, setChromeVisible] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const page = pages[index];

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    if (chromeTimer.current) clearTimeout(chromeTimer.current);
    chromeTimer.current = setTimeout(() => setChromeVisible(false), 2600);
  }, []);

  const goTo = useCallback((nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= pages.length) return;
    revealChrome();
    router.push(`/archive/read/${pages[nextIndex].pageNumber}`, { scroll: false });
  }, [pages, revealChrome, router]);

  useEffect(() => {
    chromeTimer.current = setTimeout(() => setChromeVisible(false), 2600);
    return () => {
      if (chromeTimer.current) clearTimeout(chromeTimer.current);
    };
  }, []);

  useEffect(() => {
    const next = pages[index + 1];
    if (next) {
      const image = new Image();
      image.src = next.imageSrc;
    }
  }, [index, pages]);

  useEffect(() => {
    writeCodexReadingState({
      lastPage: page.pageNumber,
      lastChapter: page.chapter,
      progress: page.pageNumber / pages.length,
    });
  }, [page.chapter, page.pageNumber, pages.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === "Escape") {
        event.preventDefault();
        router.push("/archive/contents");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, index, router]);

  return (
    <main
      className={`codex-book codex-reader${chromeVisible ? " has-chrome" : ""}`}
      onMouseMove={revealChrome}
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start == null || end == null) return;
        const distance = end - start;
        if (Math.abs(distance) < 45) {
          setChromeVisible((current) => !current);
        } else if (distance < 0) {
          goTo(index + 1);
        } else {
          goTo(index - 1);
        }
      }}
    >
      <BookParticles key={page.pageNumber} />

      <header className="codex-reader__chrome">
        <button type="button" onClick={() => router.push("/archive/contents")}>
          <span aria-hidden="true">←</span> Contents
        </button>
        <div>
          <p>THE LIVING BOOK OF ANATOLIA</p>
          <h1>{page.publicTitle}</h1>
        </div>
        <span>{String(page.pageNumber).padStart(3, "0")} / {String(pages.length).padStart(3, "0")}</span>
      </header>

      <section className="codex-reader__stage" aria-live="polite">
        <CodexPageImage key={page.pageNumber} page={page} />
      </section>

      <button
        type="button"
        className="codex-reader__tap is-prev"
        aria-label="Previous page"
        disabled={index === 0}
        onClick={() => goTo(index - 1)}
      />
      <button
        type="button"
        className="codex-reader__tap is-next"
        aria-label="Next page"
        disabled={index === pages.length - 1}
        onClick={() => goTo(index + 1)}
      />

      <footer className="codex-reader__chrome">
        <button type="button" disabled={index === 0} onClick={() => goTo(index - 1)}>
          <span aria-hidden="true">←</span> Previous
        </button>
        <div className="codex-reader__progress" aria-label={`Page ${index + 1} of ${pages.length}`}>
          <i style={{ width: `${((index + 1) / pages.length) * 100}%` }} />
        </div>
        {index < pages.length - 1 ? (
          <button type="button" onClick={() => goTo(index + 1)}>
            Next <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button type="button" onClick={() => router.push("/archive/read/end")}>
            End <span aria-hidden="true">→</span>
          </button>
        )}
      </footer>
    </main>
  );
}

function CodexPageImage({ page }: { page: PublicCodexPage }) {
  const [unavailable, setUnavailable] = useState(false);
  return (
    <div className="codex-reader__page">
      {!unavailable ? (
        // Images stay behind the guarded Codex asset Route Handler.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.imageSrc}
          alt={page.publicTitle}
          onError={() => setUnavailable(true)}
          draggable={false}
        />
      ) : (
        <div className="codex-reader__unavailable">
          <span aria-hidden="true">✣</span>
          <p>This Codex page is unavailable in the current environment.</p>
        </div>
      )}
    </div>
  );
}

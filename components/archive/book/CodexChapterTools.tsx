"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CodexSearchResult } from "@/lib/codex/experience-contract";
import {
  readCodexChapterState,
  writeCodexChapterState,
  type CodexChapterBookmark,
} from "@/lib/codex/chapter-reading-state";

type SectionLink = { id: string; title: string };

export default function CodexChapterTools({
  chapterSlug,
  chapterTitle,
  sections,
}: {
  chapterSlug: string;
  chapterTitle: string;
  sections: SectionLink[];
}) {
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "overview");
  const [bookmarks, setBookmarks] = useState<CodexChapterBookmark[]>([]);
  const [panel, setPanel] = useState<"search" | "bookmarks" | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CodexSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const state = readCodexChapterState();
    setBookmarks(state.bookmarks);
    if (
      state.lastChapter === chapterSlug &&
      sections.some((section) => section.id === state.lastSection)
    ) {
      setActiveSection(state.lastSection);
    }
  }, [chapterSlug, sections]);

  useEffect(() => {
    const update = () => {
      frame.current = null;
      const root = document.documentElement;
      const scrollable = Math.max(1, root.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, window.scrollY / scrollable)));

      let current = sections[0]?.id ?? "overview";
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= 180) {
          current = section.id;
        }
      }
      setActiveSection(current);
    };
    const onScroll = () => {
      if (frame.current === null) frame.current = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [sections]);

  useEffect(() => {
    const state = readCodexChapterState();
    writeCodexChapterState({
      ...state,
      lastChapter: chapterSlug,
      lastSection: activeSection,
    });
  }, [activeSection, chapterSlug]);

  const activeTitle =
    sections.find((section) => section.id === activeSection)?.title ?? chapterTitle;
  const isBookmarked = bookmarks.some(
    (bookmark) =>
      bookmark.chapterSlug === chapterSlug &&
      bookmark.sectionId === activeSection,
  );

  useEffect(() => {
    if (!panel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panel]);

  const toggleBookmark = useCallback(() => {
    const state = readCodexChapterState();
    const exists = state.bookmarks.some(
      (bookmark) =>
        bookmark.chapterSlug === chapterSlug &&
        bookmark.sectionId === activeSection,
    );
    const nextBookmarks = exists
      ? state.bookmarks.filter(
          (bookmark) =>
            bookmark.chapterSlug !== chapterSlug ||
            bookmark.sectionId !== activeSection,
        )
      : [
          ...state.bookmarks,
          {
            chapterSlug,
            chapterTitle,
            sectionId: activeSection,
            sectionTitle: activeTitle,
            createdAt: new Date().toISOString(),
          },
        ];
    writeCodexChapterState({ ...state, bookmarks: nextBookmarks });
    setBookmarks(nextBookmarks);
  }, [activeSection, activeTitle, chapterSlug, chapterTitle]);

  async function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) return;
    setSearching(true);
    try {
      const response = await fetch(
        `/api/archive/search?q=${encodeURIComponent(cleanQuery)}`,
      );
      if (!response.ok) throw new Error("Search request failed");
      const payload = (await response.json()) as { results?: CodexSearchResult[] };
      setResults(payload.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <div className="codex-document__progress" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="codex-document__tools" aria-label="Codex reading tools">
        <button
          type="button"
          onClick={() => setPanel(panel === "search" ? null : "search")}
          aria-expanded={panel === "search"}
        >
          Search
        </button>
        <button
          type="button"
          onClick={toggleBookmark}
          aria-pressed={isBookmarked}
        >
          {isBookmarked ? "Bookmarked" : "Bookmark"}
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === "bookmarks" ? null : "bookmarks")}
          aria-expanded={panel === "bookmarks"}
        >
          Saved ({bookmarks.length})
        </button>
      </div>

      {panel ? (
        <aside
          className="codex-document__panel"
          role="dialog"
          aria-label={panel === "search" ? "Search the Codex" : "Saved bookmarks"}
        >
          <header>
            <h2>{panel === "search" ? "Search the Codex" : "Saved passages"}</h2>
            <button type="button" onClick={() => setPanel(null)} aria-label="Close">
              ×
            </button>
          </header>
          {panel === "search" ? (
            <>
              <form onSubmit={submitSearch}>
                <label htmlFor="codex-search">Search canonical documentation</label>
                <div>
                  <input
                    id="codex-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    minLength={2}
                    autoFocus
                  />
                  <button type="submit" disabled={searching || query.trim().length < 2}>
                    {searching ? "Searching…" : "Search"}
                  </button>
                </div>
              </form>
              <ol aria-live="polite">
                {results.map((result) => (
                  <li key={`${result.chapterSlug}-${result.sectionId}-${result.excerpt}`}>
                    <Link
                      href={`/archive/chapter/${result.chapterSlug}#${result.sectionId}`}
                      onClick={() => setPanel(null)}
                    >
                      <small>{result.chapterTitle}</small>
                      <strong>{result.heading ?? result.sectionTitle}</strong>
                      <p>{result.excerpt}</p>
                    </Link>
                  </li>
                ))}
              </ol>
            </>
          ) : bookmarks.length ? (
            <ol>
              {bookmarks.map((bookmark) => (
                <li key={`${bookmark.chapterSlug}-${bookmark.sectionId}`}>
                  <Link
                    href={`/archive/chapter/${bookmark.chapterSlug}#${bookmark.sectionId}`}
                    onClick={() => setPanel(null)}
                  >
                    <small>{bookmark.chapterTitle}</small>
                    <strong>{bookmark.sectionTitle}</strong>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p>No bookmarks yet.</p>
          )}
        </aside>
      ) : null}
    </>
  );
}

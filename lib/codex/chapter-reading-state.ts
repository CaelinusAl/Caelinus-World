export const CODEX_CHAPTER_STATE_KEY = "caelinus:codex:chapters:v1";

export type CodexChapterBookmark = {
  chapterSlug: string;
  chapterTitle: string;
  sectionId: string;
  sectionTitle: string;
  createdAt: string;
};

type CodexChapterState = {
  lastChapter: string;
  lastSection: string;
  bookmarks: CodexChapterBookmark[];
};

const EMPTY_STATE: CodexChapterState = {
  lastChapter: "",
  lastSection: "",
  bookmarks: [],
};

export function readCodexChapterState(): CodexChapterState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(CODEX_CHAPTER_STATE_KEY) ?? "null",
    ) as Partial<CodexChapterState> | null;
    return {
      lastChapter:
        typeof parsed?.lastChapter === "string" ? parsed.lastChapter : "",
      lastSection:
        typeof parsed?.lastSection === "string" ? parsed.lastSection : "",
      bookmarks: Array.isArray(parsed?.bookmarks)
        ? parsed.bookmarks.filter(
            (bookmark): bookmark is CodexChapterBookmark =>
              typeof bookmark?.chapterSlug === "string" &&
              typeof bookmark?.chapterTitle === "string" &&
              typeof bookmark?.sectionId === "string" &&
              typeof bookmark?.sectionTitle === "string" &&
              typeof bookmark?.createdAt === "string",
          )
        : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function writeCodexChapterState(state: CodexChapterState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CODEX_CHAPTER_STATE_KEY, JSON.stringify(state));
  } catch {
    // The Codex remains readable when storage is unavailable.
  }
}

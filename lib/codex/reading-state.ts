export const CODEX_READING_STATE_KEY = "caelinus:living-book:progress:v1";

export type CodexReadingState = {
  lastPage: number;
  lastChapter: string;
  progress: number;
};

export function readCodexReadingState(): CodexReadingState | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(CODEX_READING_STATE_KEY) ?? "null",
    ) as Partial<CodexReadingState> | null;
    if (
      !parsed ||
      !Number.isInteger(parsed.lastPage) ||
      typeof parsed.lastChapter !== "string" ||
      typeof parsed.progress !== "number"
    ) {
      return null;
    }
    return {
      lastPage: Math.max(1, Math.min(132, Number(parsed.lastPage))),
      lastChapter: parsed.lastChapter,
      progress: Math.max(0, Math.min(1, parsed.progress)),
    };
  } catch {
    return null;
  }
}

export function writeCodexReadingState(state: CodexReadingState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CODEX_READING_STATE_KEY, JSON.stringify(state));
  } catch {
    // Reading remains fully functional when storage is unavailable.
  }
}

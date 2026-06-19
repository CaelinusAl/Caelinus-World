/**
 * CAELINUS — Sanri istemci yardımcıları (browser-safe)
 *
 * Sanri district bileşenleri bu yardımcılarla `/api/sanri/*` proxy'sine
 * istek atar. Kimlik (X-User-Id) proxy tarafından eklenir; burada yok.
 * Sanri uçlarının çoğu tam JSON döndürür (AI-SDK stream değil).
 */

const BASE = "/api/sanri";

async function sanriFetch<T = unknown>(
  path: string,
  init?: { method?: "GET" | "POST"; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  const res = await fetch(`${BASE}/${path.replace(/^\//, "")}`, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: init?.signal,
  });
  if (!res.ok) {
    throw new Error(`sanri_${res.status}`);
  }
  return (await res.json()) as T;
}

/* ── Sanrı'ya Sor (oracle) ── */
export type AskResponse = {
  answer?: string;
  response?: string;
  session_id?: string;
  prompt_version?: string;
  deepen?: { theme: string; label: string; offer_text: string } | null;
};

export function askSanri(
  input: { message: string; session_id?: string; lang?: "tr" | "en"; mode?: string; domain?: string },
  signal?: AbortSignal,
): Promise<AskResponse> {
  return sanriFetch<AskResponse>("bilinc-alani/ask", {
    method: "POST",
    body: {
      message: input.message,
      session_id: input.session_id ?? "default",
      lang: input.lang ?? "tr",
      mode: input.mode ?? "mirror",
      domain: input.domain ?? "auto",
    },
    signal,
  });
}

/** Oracle yanıtından gösterilecek metni seç. */
export function askText(r: AskResponse): string {
  return r.answer ?? r.response ?? "";
}

/* ── Rüya yorumu ── */
export type DreamResponse = { interpretation?: string; symbols?: string[]; emotion?: string } & Record<string, unknown>;

export function interpretDream(
  input: { text: string; lang?: "tr" | "en" },
  signal?: AbortSignal,
): Promise<DreamResponse> {
  return sanriFetch<DreamResponse>("dream/interpret", {
    method: "POST",
    body: { text: input.text, lang: input.lang ?? "tr" },
    signal,
  });
}

/* ── Sembol ── */
export function weeklySymbol(lang: "tr" | "en" = "tr"): Promise<Record<string, unknown>> {
  return sanriFetch(`content/weekly-symbol?lang=${lang}`);
}

export function analyzeSymbol(text: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
  return sanriFetch("sanri/analyze", { method: "POST", body: { text }, signal });
}

/* ── Fal / Matrix rol ── */
export function matrixRol(
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  return sanriFetch("matrix-rol", { method: "POST", body: payload, signal });
}

export function nameNumerology(
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  return sanriFetch("sanri/name", { method: "POST", body: payload, signal });
}

/* ── Günün nabzı ── */
export function dailyStream(lang: "tr" | "en" = "tr"): Promise<Record<string, unknown>> {
  return sanriFetch(`content/daily-stream?lang=${lang}`);
}

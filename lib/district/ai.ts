/**
 * CAELINUS — District Engine · AI asistan çözümleyici (saf)
 *
 * Her district'in asistanı iki sağlayıcıdan birinden beslenir:
 *   • caelinus → Next.js Vercel AI SDK rotası (/api/ai/*), OpenAI stream.
 *   • sanri    → Sanri FastAPI proxy'si (/api/sanri/*), kendi bilinç motoru.
 *
 * Bu çözümleyici saftır; sadece district tanımından asistan tarifini döndürür.
 */

import type { District, AIProvider } from "./types";

export type AssistantSpec = {
  provider: AIProvider;
  route: string;
  promptId?: string;
  /** caelinus sağlayıcısı Vercel AI SDK stream protokolü kullanır (useChat). */
  streaming: boolean;
};

export function resolveAssistant(district: District): AssistantSpec {
  const { provider, route, promptId } = district.ai;
  return {
    provider,
    route,
    promptId,
    streaming: provider === "caelinus",
  };
}

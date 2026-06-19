/**
 * CAELINUS — Ortak konuşan-AI çekirdeği.
 *
 * İki modül (Gaia + Moda) bu tek fonksiyonu paylaşır; yalnızca system
 * prompt'ları ayrıdır. Vercel AI SDK v6 (`streamText`) + `@ai-sdk/openai`
 * provider'ı kullanır. Provider, `OPENAI_API_KEY`'i process env'den
 * otomatik okur; biz yalnızca model seçimini env'den geçiririz.
 *
 * Sunucu tarafı yardımcıdır — route handler bunu çağırıp
 * `.toUIMessageStreamResponse()` döner.
 */

import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

import { serverEnv } from "@/lib/env";

export class MissingOpenAIKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured");
    this.name = "MissingOpenAIKeyError";
  }
}

export type CaelinusChatArgs = {
  /** Çözümlenmiş system prompt (modüle özel). */
  system: string;
  /** useChat'ten gelen UIMessage geçmişi. */
  messages: UIMessage[];
  /** Yaratıcılık. Gaia daha temkinli (0.5), Moda daha akışkan (0.8). */
  temperature?: number;
};

/**
 * Streaming sohbet yanıtı üretir. `OPENAI_API_KEY` yoksa
 * `MissingOpenAIKeyError` fırlatır — route bunu 503'e çevirir.
 */
export async function streamCaelinusChat({
  system,
  messages,
  temperature = 0.6,
}: CaelinusChatArgs) {
  if (!serverEnv.OPENAI_API_KEY) {
    throw new MissingOpenAIKeyError();
  }

  return streamText({
    model: openai(serverEnv.AI_CHAT_MODEL),
    system,
    messages: await convertToModelMessages(messages),
    temperature,
  });
}

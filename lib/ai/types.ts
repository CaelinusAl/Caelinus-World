/**
 * CAELINUS — Ortak AI tipleri.
 *
 * İki sohbet modülü (Gaia + Moda) aynı altyapıyı paylaşır; system
 * promptları ve bilgi bağlamları ayrıdır. Burada yalnızca iki modülün
 * de kullandığı sade tipler durur. UIMessage/streaming tipleri Vercel
 * AI SDK'dan (`ai`, `@ai-sdk/react`) gelir; burada tekrar tanımlamayız.
 */

export type AIModuleId = "gaia" | "fashion";

export type AILang = "tr" | "en";

/** Sistem prompt builder'larının ortak imzası. */
export type SystemPromptBuilder = (lang: AILang) => string;

/** Route'ların gövde doğrulamasında beklediği minimal mesaj şekli.
 *  (UIMessage'ın yalnızca sunucunun ihtiyaç duyduğu alt kümesi.) */
export type IncomingUIMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  parts?: { type: string; text?: string }[];
};

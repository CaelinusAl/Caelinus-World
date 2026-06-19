/**
 * POST /api/ai/fashion
 *
 * CAELINUS MODA AI — "Mirror Stylist / Frekans Stilisti" sohbeti.
 *
 * useChat (v6) `{ messages }` gövdesi gönderir. Fashion system prompt'u
 * (burç stil haritası + tanrıça arketipleri + ürün kataloğu gömülü) ile
 * streamText çalıştırır ve `toUIMessageStreamResponse()` ile UI mesaj
 * akışı döner.
 *
 * Güvenlik dili prompt'ta gömülü (beden utandırma yok, tıbbi/diyet yok).
 * OPENAI_API_KEY yoksa zarif 503; akış hatasında zarif fallback metni.
 */

import type { UIMessage } from "ai";

import { streamCaelinusChat, MissingOpenAIKeyError } from "@/lib/ai/create-ai-response";
import { buildFashionSystemPrompt } from "@/lib/ai/fashion-system-prompt";
import type { AILang } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type FashionChatBody = {
  messages?: UIMessage[];
  lang?: AILang;
};

const FALLBACK_TR =
  "Ayna şu an puslandı — bağlantıda küçük bir aksaklık oldu. Birazdan tekrar dene; bana burcunu ya da aradığın hissi söylersen frekansını birlikte giydiririz.";
const FALLBACK_EN =
  "The mirror has misted over — a small hiccup in the connection. Try again shortly; tell me your sign or the feeling you're after and we'll dress your frequency together.";

export async function POST(req: Request) {
  let body: FashionChatBody;
  try {
    body = (await req.json()) as FashionChatBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages_required" }, { status: 400 });
  }

  const lang: AILang = body.lang === "en" ? "en" : "tr";

  try {
    const result = await streamCaelinusChat({
      system: buildFashionSystemPrompt(lang),
      messages,
      temperature: 0.8,
    });

    return result.toUIMessageStreamResponse({
      onError: () => (lang === "en" ? FALLBACK_EN : FALLBACK_TR),
    });
  } catch (err) {
    if (err instanceof MissingOpenAIKeyError) {
      return Response.json(
        {
          error: "openai_key_missing",
          message:
            lang === "en"
              ? "AI is not configured yet (OPENAI_API_KEY missing)."
              : "AI henüz yapılandırılmadı (OPENAI_API_KEY eksik).",
        },
        { status: 503 },
      );
    }
    return Response.json(
      { error: "fashion_chat_failed", message: lang === "en" ? FALLBACK_EN : FALLBACK_TR },
      { status: 502 },
    );
  }
}

export function GET() {
  return Response.json(
    { error: "method_not_allowed", allowed: ["POST"] },
    { status: 405 },
  );
}

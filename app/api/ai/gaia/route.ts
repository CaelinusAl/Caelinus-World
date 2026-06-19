/**
 * POST /api/ai/gaia
 *
 * CAELINUS GAIA AI — "Plant Oracle / Toprak Hafızası" sohbeti.
 *
 * useChat (v6) `{ messages }` gövdesi gönderir. Gaia system prompt'u
 * (bitki kütüphanesi gömülü) ile streamText çalıştırır ve
 * `toUIMessageStreamResponse()` ile UI mesaj akışı döner.
 *
 * Güvenlik dili prompt'ta gömülü (kesin teşhis yok → olasılık).
 * OPENAI_API_KEY yoksa zarif 503; akış hatasında zarif fallback metni.
 */

import type { UIMessage } from "ai";

import { streamCaelinusChat, MissingOpenAIKeyError } from "@/lib/ai/create-ai-response";
import { buildGaiaSystemPrompt } from "@/lib/ai/gaia-system-prompt";
import type { AILang } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type GaiaChatBody = {
  messages?: UIMessage[];
  lang?: AILang;
};

const FALLBACK_TR =
  "Toprak şu an sessiz — bağlantıda küçük bir aksaklık oldu. Birazdan tekrar dene; sorunu netleştirirsek (bitki, ışık, sulama) birlikte daraltırız.";
const FALLBACK_EN =
  "The soil is quiet for a moment — a small hiccup in the connection. Try again shortly; if you tell me the plant, light and watering we can narrow it down together.";

export async function POST(req: Request) {
  let body: GaiaChatBody;
  try {
    body = (await req.json()) as GaiaChatBody;
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
      system: buildGaiaSystemPrompt(lang),
      messages,
      temperature: 0.5,
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
      { error: "gaia_chat_failed", message: lang === "en" ? FALLBACK_EN : FALLBACK_TR },
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

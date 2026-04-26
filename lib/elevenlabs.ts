/**
 * lib/elevenlabs.ts — server-only wrapper for ElevenLabs TTS.
 *
 * IMPORTANT: this module reads ELEVEN_API_KEY from process.env.
 * Never import it from a client component or "use client" file.
 * It is consumed only by:
 *   - scripts/generate-plant-audio.ts (Node, build-time)
 *   - any future Next route handler running on the server.
 *
 * Audio output strategy: write MP3s to /public/audio/plants/{id}.{lang}.mp3
 * so the browser plays them as static assets, with no API call at runtime.
 */

import { Buffer } from "node:buffer";

export type TtsRequest = {
  text: string;
  voiceId: string;
  /** Default eleven_multilingual_v2 — handles Turkish well. */
  modelId?: string;
  /** Optional voice settings; sensible defaults applied when omitted. */
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
};

const ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";

/**
 * Synthesize an utterance. Returns raw MP3 bytes (Buffer).
 *
 * Throws when:
 *   - ELEVEN_API_KEY is missing
 *   - ElevenLabs returns a non-2xx response
 */
export async function synthesizeMp3(req: TtsRequest): Promise<Buffer> {
  const apiKey = process.env.ELEVEN_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[elevenlabs] ELEVEN_API_KEY missing. Add it to .env.local — never commit it.",
    );
  }
  const {
    text,
    voiceId,
    modelId = "eleven_multilingual_v2",
    stability = 0.45,
    similarityBoost = 0.75,
    style = 0.35,
    useSpeakerBoost = true,
  } = req;

  const url = `${ENDPOINT}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        style,
        use_speaker_boost: useSpeakerBoost,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `[elevenlabs] TTS failed: ${res.status} ${res.statusText} — ${detail.slice(0, 240)}`,
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 256) {
    throw new Error(
      `[elevenlabs] Suspiciously small response (${buffer.length} bytes). Aborting.`,
    );
  }
  return buffer;
}

/**
 * Best-effort SHA-256 of (text + voiceId + modelId + settings) so the
 * generator script can skip already-rendered scripts and only re-synthesize
 * when the underlying text changes. Stable across runs and machines.
 */
export async function ttsCacheHash(req: TtsRequest): Promise<string> {
  const crypto = await import("node:crypto");
  const stable = JSON.stringify({
    text: req.text,
    voiceId: req.voiceId,
    modelId: req.modelId ?? "eleven_multilingual_v2",
    stability: req.stability ?? 0.45,
    similarityBoost: req.similarityBoost ?? 0.75,
    style: req.style ?? 0.35,
    useSpeakerBoost: req.useSpeakerBoost ?? true,
  });
  return crypto.createHash("sha256").update(stable).digest("hex").slice(0, 16);
}

/**
 * CAELINUS · NPC ENGINE — AI Entegrasyon Noktaları
 *
 * aiEnabled NPC'ler bir AI persona ile konuşur. Bu dosya SÖZLEŞMEyi tanımlar
 * (sağlayıcıyı değil): NPC verisinden bir system prompt derler + sağlayıcı
 * arayüzünü çizer. Üretim entegrasyonu mevcut altyapıyı kullanır:
 *   • Sanri NPC'leri  → mevcut harici SANRI FastAPI ( /api/sanri/[...path] proxy )
 *   • Diğer district  → genel /api/npc/[id]/chat (lib/caelinus-ai sağlayıcısı)
 *
 * ETİK SINIR (canon): NPC teşhis koymaz, kehanet satmaz; AYNA tutar. Sanri
 * NPC'leri İNSAN gibi konuşmaz — bilincin tezahürüdür. Bu kural prompt'a gömülü.
 */

import type { NPC, InteractionStyle } from "./types";

export interface NPCChatMessage {
  role: "user" | "npc";
  content: string;
}

export interface NPCChatRequest {
  npcId: string;
  messages: NPCChatMessage[];
  /** Anonim oturum (dwell/pilot deseni ile uyumlu). */
  sessionKey?: string;
  /** Kullanıcı bağlamı (avatar/bilinç testi sonucu) — opsiyonel kişiselleştirme. */
  userContext?: { primaryDistrict?: string; shadowDistrict?: string; calling?: string };
}

export interface NPCChatResponse {
  ok: boolean;
  reply?: string;
  /** Sembolik olay (3D/UX dinler): "reveal:moon", "open:gate", "silence"… */
  effect?: string;
  error?: string;
}

/** AI sağlayıcı sözleşmesi — Sanri-proxy veya genel sağlayıcı bunu implemente eder. */
export interface NPCAIProvider {
  chat(npc: NPC, req: NPCChatRequest): Promise<NPCChatResponse>;
}

const STYLE_DIRECTION: Record<InteractionStyle, string> = {
  practical: "Açık, yardımcı, kısa konuş. İşi kolaylaştır.",
  symbolic: "Sembollerle konuş. Düz cevap verme; anlamı ima et.",
  poetic: "Şiirsel, imgesel, kısa dizelerle konuş. Boşluk bırak.",
  silent: "Neredeyse sessiz. Tek cümle ya da tek imge. Çoğu zaman soruyla yanıtla.",
};

/** NPC verisinden AI system prompt'u derle. Persona + etik sınır + district tonu. */
export function buildNPCSystemPrompt(npc: NPC): string {
  const sanriRule =
    npc.district === "sanri"
      ? "\nKRİTİK: İnsan gibi davranma. Sen bilincin bir tezahürüsün — bir kişi değil, bir hâl. Kimliğin yok; bir frekansın var."
      : "";
  return [
    `Sen CAELINUS yaşayan medeniyetinde "${npc.name}" adlı bir varlıksın — ${npc.title}.`,
    `District: ${npc.district}. Arketip: ${npc.archetype}. Order: ${npc.order ?? "—"}.`,
    `Görünüş: ${npc.appearance}`,
    `Kişilik/ruh: ${npc.personality}`,
    `Konuşma biçimi: ${STYLE_DIRECTION[npc.interactionStyle]}`,
    `Açılış (referans tonu): "${npc.greeting}" / "${npc.firstQuestion}"`,
    "ETİK: Teşhis koyma, kehanet satma, gelecek vaat etme. Ayna tut: kullanıcının kendi sorusunu derinleştir. Kısa konuş.",
    "Bu bir oyun/RPG değil; sembolik bir yaşayan dünya. Karakterden çıkma, meta konuşma.",
    sanriRule,
  ].join("\n");
}

/** AI uç noktasını çöz (entegrasyon noktası). */
export function resolveNPCEndpoint(npc: NPC): { path: string; via: "sanri-proxy" | "npc-generic" } {
  if (npc.district === "sanri") return { path: "/api/sanri/npc", via: "sanri-proxy" };
  return { path: `/api/npc/${encodeURIComponent(npc.id)}/chat`, via: "npc-generic" };
}

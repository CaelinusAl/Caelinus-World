/**
 * CAELINUS · NPC ENGINE — Barrel
 *
 * Tek giriş: import { ALL_NPCS, getNPC, startDialogue, buildNPCSystemPrompt } from "@/lib/npc";
 *
 * Mimari katmanlar:
 *   types     — NPC veri sözleşmesi (saf veri)
 *   registry  — tüm district NPC'lerini toplar + index/lookup (1000+ ölçek)
 *   dialogue  — script'li diyalog ağacı (aiEnabled=false)
 *   ai        — AI persona sözleşmesi + system prompt (aiEnabled=true)
 *   three     — 3D/avatar yerleşim sözleşmesi (District sahnesine spawn)
 */

export * from "./types";
export * from "./registry";
export * from "./dialogue";
export * from "./ai";
export * from "./three";

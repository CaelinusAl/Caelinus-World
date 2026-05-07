/**
 * Caelinus AI — Selfie analiz cache.
 *
 * Aynı selfie ikinci kez geldiğinde RunPod'a tekrar çağrı atmayalım:
 *   • Selfie data URL'inin SHA-256 hash'i key
 *   • TTL 24 saat (KVKK / GDPR — saklamak istemediğimiz için kısa)
 *   • Process-local Map; Next.js dev HMR'da globalThis ile korunur
 *
 * Multi-instance scale'da Redis'e taşınacak; o zaman bu modülün interface'i
 * korunur, store implementasyonu değişir (in-memory ↔ Upstash).
 */

import { createHash } from "node:crypto";

import type { SelfieAnalysis } from "../types";

type Entry = {
  analysis: SelfieAnalysis;
  expiresAt: number;
};

type CacheState = {
  store: Map<string, Entry>;
};

function getState(): CacheState {
  const g = globalThis as { __caelinusAnalyzeCache?: CacheState };
  if (!g.__caelinusAnalyzeCache) {
    g.__caelinusAnalyzeCache = { store: new Map() };
  }
  return g.__caelinusAnalyzeCache;
}

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;

export function selfieHash(dataUrl: string): string {
  return createHash("sha256").update(dataUrl).digest("hex");
}

export function getCachedAnalysis(hash: string): SelfieAnalysis | null {
  const { store } = getState();
  const hit = store.get(hash);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    store.delete(hash);
    return null;
  }
  return hit.analysis;
}

export function setCachedAnalysis(
  hash: string,
  analysis: SelfieAnalysis,
): void {
  const { store } = getState();
  // Basit LRU yerine FIFO: Map insertion order'ını kullan
  if (store.size >= MAX_ENTRIES) {
    const firstKey = store.keys().next().value;
    if (firstKey) store.delete(firstKey);
  }
  store.set(hash, {
    analysis,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function clearAnalysisCache(): void {
  getState().store.clear();
}

export function getAnalysisCacheSize(): number {
  return getState().store.size;
}

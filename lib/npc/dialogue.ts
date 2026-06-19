/**
 * CAELINUS · NPC ENGINE — Diyalog Sistemi
 *
 * İki yol:
 *   1) aiEnabled=false → SCRIPT'li diyalog ağacı (deterministik, AI'sız). Düşük
 *      maliyet, kontrollü; mystery/guide NPC'leri için ideal.
 *   2) aiEnabled=true  → AI persona (lib/npc/ai). Bu modül sadece açılışı verir;
 *      sonrası AI sözleşmesine devredilir.
 *
 * Diyalog AĞACI sembolik bir yapıdır: her düğüm bir "an"dır; seçenekler kapılar.
 * "Yanıtı isteme. Soruyu izle." — düğümler cevap değil, derinleşen sorular sunar.
 */

import type { NPC } from "./types";

export interface DialogueChoice {
  id: string;
  label: string; // kullanıcının seçtiği replik
  to: string; // hedef düğüm id
}

export interface DialogueNode {
  id: string;
  /** NPC'nin söylediği (sembolik, kısa). */
  line: string;
  /** Kullanıcı seçenekleri. Boşsa düğüm bir "kapanış/sessizlik"tir. */
  choices?: DialogueChoice[];
  /** Bu düğüme gelince tetiklenebilecek sembolik olay (3D/UX dinler). */
  effect?: string; // örn "open:mirror-gate", "reveal:moon", "silence"
  /** true → buradan sonra AI devralır (aiEnabled NPC için köprü). */
  handoffToAI?: boolean;
}

export interface DialogueTree {
  id: string;
  start: string; // başlangıç düğüm id
  nodes: Record<string, DialogueNode>;
}

export interface DialogueState {
  npcId: string;
  treeId: string;
  nodeId: string;
  history: string[]; // ziyaret edilen düğüm id'leri
  mode: "script" | "ai";
}

/** Bir NPC ile diyaloğu başlat. greeting + firstQuestion her zaman açılışı kurar. */
export function startDialogue(npc: NPC, tree?: DialogueTree): DialogueState {
  if (npc.aiEnabled) {
    return { npcId: npc.id, treeId: "ai", nodeId: "ai:open", history: [], mode: "ai" };
  }
  const t = tree ?? fallbackTree(npc);
  return { npcId: npc.id, treeId: t.id, nodeId: t.start, history: [t.start], mode: "script" };
}

/** Script modda bir seçenekle ilerle. AI modda no-op (AI sözleşmesi devralır). */
export function advance(state: DialogueState, tree: DialogueTree, choiceId: string): DialogueState {
  if (state.mode === "ai") return state;
  const node = tree.nodes[state.nodeId];
  const choice = node?.choices?.find((c) => c.id === choiceId);
  if (!choice) return state;
  const nextId = choice.to;
  const next = tree.nodes[nextId];
  return {
    ...state,
    nodeId: nextId,
    history: [...state.history, nextId],
    mode: next?.handoffToAI ? "ai" : "script",
  };
}

export function currentNode(state: DialogueState, tree: DialogueTree): DialogueNode | null {
  return tree.nodes[state.nodeId] ?? null;
}

/** aiEnabled olmayan NPC'ler için minimal, on-canon fallback ağacı (greeting→firstQuestion→sessizlik). */
export function fallbackTree(npc: NPC): DialogueTree {
  const id = `fallback:${npc.id}`;
  return {
    id,
    start: "greet",
    nodes: {
      greet: {
        id: "greet",
        line: npc.greeting,
        choices: [{ id: "stay", label: "…", to: "ask" }],
      },
      ask: {
        id: "ask",
        line: npc.firstQuestion,
        choices: [
          { id: "answer", label: "Cevap vermeye çalış", to: "deepen" },
          { id: "silence", label: "Sessiz kal", to: "silence" },
        ],
      },
      deepen: {
        id: "deepen",
        line: "Cevabın bir kapı. İçinden geç.",
        effect: "deepen",
        choices: [{ id: "leave", label: "Geç", to: "silence" }],
      },
      silence: {
        id: "silence",
        line: "…",
        effect: "silence",
      },
    },
  };
}

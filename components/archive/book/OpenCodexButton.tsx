"use client";

import { useRouter } from "next/navigation";

import { readCodexReadingState } from "@/lib/codex/reading-state";

export default function OpenCodexButton() {
  const router = useRouter();

  const open = () => {
    window.dispatchEvent(new Event("caelinus:codex-enter"));
    const state = readCodexReadingState();
    router.push(state ? `/archive/read/${state.lastPage}` : "/archive/contents");
  };

  return (
    <button type="button" className="codex-open-book" onClick={open}>
      <span>OPEN THE BOOK</span>
      <span aria-hidden="true">→</span>
    </button>
  );
}

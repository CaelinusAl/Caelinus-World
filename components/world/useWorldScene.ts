"use client";

/**
 * useWorldScene — bir sayfanın global WebGL sahnesini geçici olarak
 * override etmesini sağlar.
 *
 * Örnek: bir kampanya sayfası route eşlemesinden bağımsız olarak "sanctum"
 * sahnesini göstermek isterse:
 *
 *   useWorldScene("sanctum");
 *
 * Sayfa unmount olunca override otomatik temizlenir (route eşlemesine döner).
 */

import { useEffect } from "react";
import { useWorldStore } from "@/lib/world/store";
import type { WorldSceneId } from "@/lib/world/config";

export function useWorldScene(scene: WorldSceneId | null) {
  const setSceneOverride = useWorldStore((s) => s.setSceneOverride);

  useEffect(() => {
    setSceneOverride(scene);
    return () => setSceneOverride(null);
  }, [scene, setSceneOverride]);
}

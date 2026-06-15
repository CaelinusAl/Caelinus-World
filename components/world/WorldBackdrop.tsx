"use client";

/**
 * WorldBackdrop — global WebGL dünyasının montaj noktası.
 *
 * Root layout'ta bir kez mount edilir. Aktif route'a göre hangi sahnenin
 * gösterileceğine karar verir; "off" route'larda HİÇBİR canvas kurmaz
 * (utility/transactional sayfalarda performans + okunabilirlik için).
 *
 * WorldCanvas `ssr:false` ile dinamik yüklenir → WebGL yalnızca tarayıcıda
 * kurulur, sunucu render'ı (SEO/metin) etkilenmez.
 */

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { WORLD_ENABLED, sceneForPath } from "@/lib/world/config";

const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

export default function WorldBackdrop() {
  const pathname = usePathname();

  if (!WORLD_ENABLED) return null;

  const scene = sceneForPath(pathname ?? "/");
  if (scene === "off") return null;

  return <WorldCanvas scene={scene} />;
}

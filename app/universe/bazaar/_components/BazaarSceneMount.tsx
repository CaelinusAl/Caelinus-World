"use client";

/**
 * BazaarSceneMount — DistrictBlenderScene'in tarayıcı-yalnız mount köprüsü.
 *
 * r3f SSR'de çalışamaz → motor `dynamic(..., { ssr: false })` ile yüklenir.
 *
 * Asset hazır mı? Registry'de `glb` yolu tanımlı olsa bile dosya henüz export
 * edilmemiş olabilir. Bu yüzden mount'tan önce HEAD ile varlığı doğrulanır:
 *   • Dosya yoksa  → yalnız preview posteri + DistrictShell atmosferi (çökme yok).
 *   • Dosya varsa  → gerçek 3B sahne mount edilir.
 * Ek savunma: hata sınırı, yükleme sırasında oluşabilecek hatalarda sahneyi düşürür.
 */

import { Component, type ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { District } from "@/lib/district/types";

const DistrictBlenderScene = dynamic(
  () => import("@/components/district/DistrictBlenderScene"),
  { ssr: false, loading: () => null },
);

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function BazaarSceneMount({ district }: { district: District }) {
  const preview = district.blender.previewImage;
  const glb = district.blender.glb;
  const [assetReady, setAssetReady] = useState(false);

  useEffect(() => {
    if (!glb) return;
    let cancelled = false;
    fetch(glb, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setAssetReady(res.ok);
      })
      .catch(() => {
        if (!cancelled) setAssetReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [glb]);

  return (
    <div className="bazaar-stage">
      {preview && (
        <div
          className="bazaar-stage-poster"
          style={{ backgroundImage: `url("${preview}")` }}
          aria-hidden="true"
        />
      )}

      {assetReady && (
        <SceneBoundary>
          <DistrictBlenderScene district={district} mode="interactive" className="bazaar-stage-canvas" />
        </SceneBoundary>
      )}

      <div className="bazaar-stage-hint">
        {assetReady ? "Sürükle · döndür · yakınlaştır" : "Bazaar sahnesi hazırlanıyor…"}
      </div>
    </div>
  );
}

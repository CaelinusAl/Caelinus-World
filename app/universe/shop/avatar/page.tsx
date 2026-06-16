"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import type { AvatarConfig } from "@/types/avatar";
import { DEFAULT_AVATAR } from "@/types/avatar";
import {
  saveAvatarConfig,
  loadAvatarConfig,
  notifyAvatarConfigChanged,
  saveAvatarBodyId,
  loadAvatarBodyId,
} from "@/lib/avatar-storage";
import {
  CAELINUS_BODY_LIBRARY,
  DEFAULT_BODY_ID,
  AVATARS_IN_PRODUCTION,
  getBody,
} from "@/lib/avatar-bodies";
import AvatarSliders from "@/components/shop/AvatarSliders";
import BodyPicker from "@/components/shop/BodyPicker";
import AvatarsInProduction from "@/components/avatar/AvatarsInProduction";
import { FaceUpload } from "@/components/shop/FaceUpload";
import type { FaceUploadResult } from "@/lib/services";
import { cropFaceFromUrl, type CropResult } from "@/lib/face-crop";
import type { FaceMetrics, AvatarFaceDeformConfig, ModelCapabilities } from "@/lib/face";
import {
  extractFaceMetrics,
  clampFaceMetrics,
  mapMetricsToAvatarDeform,
} from "@/lib/face";

const AvatarConfigurator = lazy(
  () => import("@/components/shop/AvatarConfigurator")
);

void CAELINUS_BODY_LIBRARY; // tree-shake guard — registry referans

type FaceState = "idle" | "detecting" | "applied" | "error";

const FACE_KEY = "caelinus_face_texture";
const METRICS_KEY = "caelinus_face_metrics";

export default function AvatarPage() {
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [, setFaceUpload] = useState<FaceUploadResult | null>(null);
  const [faceBlobUrl, setFaceBlobUrl] = useState<string | null>(null);
  const [faceTextureUrl, setFaceTextureUrl] = useState<string | null>(null);
  const [faceState, setFaceState] = useState<FaceState>("idle");
  const [faceErr, setFaceErr] = useState<string | null>(null);
  const [faceThumb, setFaceThumb] = useState<string | null>(null);
  const [cropResult, setCropResult] = useState<CropResult | null>(null);
  const [faceMetrics, setFaceMetrics] = useState<FaceMetrics | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [deformEnabled, setDeformEnabled] = useState(true);
  const [deformStrength, setDeformStrength] = useState(1);
  const [comparing, setComparing] = useState(false);
  const [modelCaps, setModelCaps] = useState<ModelCapabilities | null>(null);

  // Caelinus body library — kullanıcının seçtiği base mesh
  const [bodyId, setBodyId] = useState<string>(DEFAULT_BODY_ID);
  const selectedBody = useMemo(() => getBody(bodyId), [bodyId]);

  const handleCapabilities = useCallback((caps: ModelCapabilities) => {
    setModelCaps(caps);
  }, []);

  // Derive deform config — null when disabled or comparing
  const faceDeform: AvatarFaceDeformConfig | null = useMemo(() => {
    if (!faceMetrics || !deformEnabled || comparing) return null;
    return mapMetricsToAvatarDeform(faceMetrics, deformStrength);
  }, [faceMetrics, deformEnabled, deformStrength, comparing]);

  // Load saved state
  useEffect(() => {
    setConfig(loadAvatarConfig());
    setLoaded(true);

    const storedTex = localStorage.getItem(FACE_KEY);
    if (storedTex) {
      setFaceTextureUrl(storedTex);
      setFaceThumb(storedTex);
      setFaceState("applied");
    }

    try {
      const storedMetrics = localStorage.getItem(METRICS_KEY);
      if (storedMetrics) setFaceMetrics(JSON.parse(storedMetrics));
    } catch { /* corrupted storage */ }

    // Body library — kullanıcı önceden hangi mesh'i seçmişse onu yükle
    const storedBodyId = loadAvatarBodyId();
    if (storedBodyId) setBodyId(storedBodyId);
  }, []);

  const handleBodySelect = useCallback((newBodyId: string) => {
    setBodyId(newBodyId);
    saveAvatarBodyId(newBodyId);
    // body değiştiği için diğer sahneler (TryOnSection) bilsin
    notifyAvatarConfigChanged();
  }, []);

  const handleChange = useCallback((cfg: AvatarConfig) => {
    setConfig(cfg);
    setSaved(false);
  }, []);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_AVATAR);
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    saveAvatarConfig(config);
    notifyAvatarConfigChanged();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [config]);

  const handleFaceUploaded = useCallback(
    (result: FaceUploadResult, localBlobUrl: string) => {
      setFaceUpload(result);
      setFaceBlobUrl(localBlobUrl);
      setFaceErr(null);
      setCropResult(null);
    },
    []
  );

  const applyFace = useCallback(async () => {
    const src = faceBlobUrl;
    if (!src) return;

    setFaceState("detecting");
    setFaceErr(null);

    try {
      const result = await cropFaceFromUrl(src);
      if (!result) {
        setFaceErr("Yuz tespit edilemedi. Farkli fotograf deneyin.");
        setFaceState("error");
        return;
      }

      setCropResult(result);

      // Extract & persist metrics if landmarks available
      let metrics: FaceMetrics | null = null;
      if (result.detection.detected && result.detection.landmarks.length > 400) {
        const raw = extractFaceMetrics(result.detection.landmarks);
        if (raw) {
          metrics = clampFaceMetrics(raw);
          setFaceMetrics(metrics);
          try {
            localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
          } catch { /* quota */ }
        }
      }

      try {
        localStorage.setItem(FACE_KEY, result.dataUrl);
      } catch { /* quota exceeded */ }

      setFaceTextureUrl(result.dataUrl);
      setFaceThumb(result.dataUrl);
      setFaceState("applied");
    } catch {
      setFaceErr("Islem basarisiz oldu.");
      setFaceState("error");
    }
  }, [faceBlobUrl]);

  const removeFace = useCallback(() => {
    localStorage.removeItem(FACE_KEY);
    localStorage.removeItem(METRICS_KEY);
    setFaceTextureUrl(null);
    setFaceThumb(null);
    setFaceState("idle");
    setFaceErr(null);
    setCropResult(null);
    setFaceMetrics(null);
  }, []);

  const faceApplied = faceState === "applied" && !!faceTextureUrl;
  const det = cropResult?.detection;

  // Avatarlar yapımda — beden kütüphanesi boşken tüm configurator
  // akışını "yapımda" boş-durumu ile değiştir (slider/yüz-yükleme
  // boş bir avatar üzerinde anlamsız kalmasın).
  if (AVATARS_IN_PRODUCTION) {
    return (
      <main className="avcfg-page">
        <div className="avcfg-page-bg" />
        <div className="avcfg-page-overlay" />
        <div className="avcfg-page-vignette" />
        <div className="avcfg-page-shell">
          <section className="avcfg-page-hero">
            <div className="avcfg-page-kicker">CAELINUS AVATAR</div>
            <h1 className="avcfg-page-title">AVATARINI OLUSTUR</h1>
          </section>
          <AvatarsInProduction />
        </div>
      </main>
    );
  }

  return (
    <main className="avcfg-page">
      <div className="avcfg-page-bg" />
      <div className="avcfg-page-overlay" />
      <div className="avcfg-page-vignette" />

      <div className="avcfg-page-shell">
        <section className="avcfg-page-hero">
          <div className="avcfg-page-kicker">CAELINUS AVATAR</div>
          <h1 className="avcfg-page-title">AVATARINI OLUSTUR</h1>
          <p className="avcfg-page-subtitle">
            Bedenini tanimla, yuzunu yukle, kimligini olustur.
          </p>
        </section>

        {/* ── Caelinus Body Library — kendi avaturn'ümüz ── */}
        <BodyPicker selectedId={bodyId} onSelect={handleBodySelect} />

        <div className="avcfg-layout">
          {/* LEFT: sliders + face */}
          <div className="avcfg-left-col">
            {loaded ? (
              <AvatarSliders
                config={config}
                onChange={handleChange}
                onReset={handleReset}
              />
            ) : (
              <div className="ux-skeleton-panel">
                <div className="ux-skeleton-line w60" />
                <div className="ux-skeleton-line w100" />
                <div className="ux-skeleton-line w80" />
                <div className="ux-skeleton-line w100" />
              </div>
            )}

            {/* ── Face Section ── */}
            <div className="face-section">
              <FaceUpload onUploaded={handleFaceUploaded} />

              {/* Apply / Remove */}
              {faceBlobUrl && !faceApplied && (
                <div className="face-section-actions">
                  <button
                    type="button"
                    className="face-toggle-btn face-toggle-btn--apply"
                    onClick={applyFace}
                    disabled={faceState === "detecting"}
                  >
                    {faceState === "detecting" ? (
                      <>
                        <span className="face-toggle-spinner" />
                        MediaPipe analiz ediyor...
                      </>
                    ) : (
                      "Yuzu Avatara Uygula"
                    )}
                  </button>
                </div>
              )}

              {faceApplied && (
                <div className="face-section-actions">
                  <button
                    type="button"
                    className="face-toggle-btn face-toggle-btn--remove"
                    onClick={removeFace}
                  >
                    Yuzu Kaldir
                  </button>
                </div>
              )}

              {faceErr && (
                <div className="face-section-error">
                  {faceErr}
                  <button className="face-section-retry" onClick={applyFace}>
                    Tekrar Dene
                  </button>
                </div>
              )}

              {/* Detection info */}
              {det && (
                <div className="face-det-info">
                  <div className="face-det-row">
                    <span
                      className={`face-det-badge ${det.detected ? "face-det-badge--ok" : "face-det-badge--fallback"}`}
                    >
                      {det.detected ? "MediaPipe Tespit" : "Heuristik Crop"}
                    </span>
                    {det.detected && (
                      <span className="face-det-landmarks">
                        {det.landmarks.length} landmark
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Preview */}
              {faceThumb && (
                <div className="face-section-preview">
                  <img
                    src={faceThumb}
                    alt="Kirpilmis yuz"
                    className="face-section-thumb"
                  />
                  <div className="face-section-preview-meta">
                    <span className="face-section-preview-label">
                      {faceApplied ? "Avatarinda aktif" : "Onizleme"}
                    </span>
                    {faceApplied && (
                      <span className="face-section-preview-badge">
                        Uygulandi
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Deform Controls ── */}
              {faceMetrics && (
                <div className="face-debug-panel">
                  {/* Toggle on/off */}
                  <div className="face-deform-controls">
                    <label className="face-deform-switch">
                      <input
                        type="checkbox"
                        checked={deformEnabled}
                        onChange={(e) => setDeformEnabled(e.target.checked)}
                      />
                      <span className="face-deform-switch-label">
                        Yuz Deform {deformEnabled ? "Aktif" : "Pasif"}
                      </span>
                    </label>

                    {/* Strength slider */}
                    {deformEnabled && (
                      <div className="face-deform-slider-row">
                        <span className="face-deform-slider-label">Guc</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(deformStrength * 100)}
                          onChange={(e) =>
                            setDeformStrength(Number(e.target.value) / 100)
                          }
                          className="face-deform-slider"
                        />
                        <span className="face-deform-slider-value">
                          {Math.round(deformStrength * 100)}%
                        </span>
                      </div>
                    )}

                    {/* Before / After compare */}
                    {deformEnabled && (
                      <button
                        type="button"
                        className="face-compare-btn"
                        onPointerDown={() => setComparing(true)}
                        onPointerUp={() => setComparing(false)}
                        onPointerLeave={() => setComparing(false)}
                      >
                        {comparing ? "Orjinal Gosteriliyor..." : "Basili Tut: Once / Sonra"}
                      </button>
                    )}
                  </div>

                  {/* Debug metrics */}
                  <button
                    type="button"
                    className="face-debug-toggle"
                    onClick={() => setShowDebug((p) => !p)}
                  >
                    {showDebug ? "Metrik Paneli Kapat" : "Metrik Paneli Ac"}
                  </button>

                  {showDebug && (
                    <div className="face-debug-grid">
                      {/* Model capabilities */}
                      {modelCaps && (
                        <>
                          <h4 className="face-debug-heading">Model</h4>
                          <div className="face-debug-row">
                            <span className="face-debug-label">Strateji</span>
                            <span className="face-debug-value face-debug-strategy">
                              {modelCaps.strategy}
                            </span>
                          </div>
                          <div className="face-debug-row">
                            <span className="face-debug-label">Bones</span>
                            <span className="face-debug-value">{modelCaps.boneNames.length}</span>
                          </div>
                          <div className="face-debug-row">
                            <span className="face-debug-label">Head Bone</span>
                            <span className="face-debug-value">{modelCaps.headBoneName ?? "yok"}</span>
                          </div>
                          <div className="face-debug-row">
                            <span className="face-debug-label">Morph Targets</span>
                            <span className="face-debug-value">{modelCaps.morphTargets.length}</span>
                          </div>
                          {modelCaps.morphTargets.length > 0 && (
                            <>
                              <h4 className="face-debug-heading">Shape Keys</h4>
                              {modelCaps.morphTargets.map((mt) => (
                                <div className="face-debug-row" key={`${mt.meshName}-${mt.targetName}`}>
                                  <span className="face-debug-label">{mt.targetName}</span>
                                  <span className="face-debug-value">{mt.meshName}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </>
                      )}

                      <h4 className="face-debug-heading">Face Metrics</h4>
                      {Object.entries(faceMetrics).map(([key, val]) => (
                        <div className="face-debug-row" key={key}>
                          <span className="face-debug-label">{key}</span>
                          <span className="face-debug-value">
                            {typeof val === "number" ? val.toFixed(3) : String(val)}
                          </span>
                        </div>
                      ))}

                      {faceDeform && (
                        <>
                          <h4 className="face-debug-heading">Avatar Deform</h4>
                          {Object.entries(faceDeform).map(([key, val]) => (
                            <div className="face-debug-row" key={key}>
                              <span className="face-debug-label">{key}</span>
                              <span className="face-debug-value">
                                {typeof val === "number" ? val.toFixed(3) : String(val)}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: 3D canvas */}
          <div className="avcfg-right-col">
            <Suspense
              fallback={
                <div className="avcfg-canvas ux-canvas-loading">
                  <div className="ux-loading-pulse" />
                  <span className="ux-loading-label">
                    Avatar yukleniyor...
                  </span>
                </div>
              }
            >
              <AvatarConfigurator
                config={config}
                avatarUrl={selectedBody.url}
                // Catwalk animasyonu — bu olmadan avatar donuk durur
                // (gömülü selin klipleri ~0.04sn = tek kare). Retarget
                // mantığı ModelAvatar'da bone-name eşleştirmesiyle çalışır.
                animationUrl="/models/catwalk.glb"
                // External textured mesh ise face decal/deform'u atla
                // (mesh kendi yüzüyle gelir; Caelinus default bald olduğunda
                // selfie face decal anlamlı olur).
                faceTextureUrl={
                  selectedBody.supportsSkinToneOverride ? faceTextureUrl : null
                }
                faceDeform={
                  selectedBody.supportsSkinToneOverride ? faceDeform : null
                }
                onCapabilities={handleCapabilities}
              />
            </Suspense>

            <div className="avcfg-save-bar">
              <button
                className={`avcfg-save-btn ${saved ? "saved" : ""}`}
                onClick={handleSave}
              >
                {saved ? "Kaydedildi" : "Avatarimi Kaydet"}
              </button>
              <Link href="/universe/shop" className="avcfg-back-btn">
                Shop&apos;a Don
              </Link>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}

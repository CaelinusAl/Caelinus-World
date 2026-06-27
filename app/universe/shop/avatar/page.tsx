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
import {
  productsExtended,
  SHOP_CATEGORY_ORDER,
  sortProductsForAvatar,
} from "@/data/products";
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
import type { ProductExtended } from "@/types/play";

const AvatarConfigurator = lazy(
  () => import("@/components/shop/AvatarConfigurator")
);

void CAELINUS_BODY_LIBRARY; // tree-shake guard — registry referans

type FaceState = "idle" | "detecting" | "applied" | "error";

const FACE_KEY = "caelinus_face_texture";
const METRICS_KEY = "caelinus_face_metrics";

const CATEGORY_LABELS: Record<ProductExtended["category"], { label: string; short: string; icon: string }> = {
  bikini: { label: "Look", short: "Look", icon: "sun" },
  pareo: { label: "Pareo", short: "Wrap", icon: "wave" },
  bag: { label: "Canta", short: "Bag", icon: "bag" },
  heels: { label: "Ayakkabi", short: "Shoe", icon: "heel" },
  jewelry: { label: "Mucevher", short: "Gem", icon: "gem" },
};

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
  const [activeCategory, setActiveCategory] =
    useState<ProductExtended["category"]>("bikini");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [outfitStatus, setOutfitStatus] = useState<string>("idle");
  // Wishlist — kalıcı favoriler (localStorage). Kart üstündeki kalp
  // butonu buraya yazar; seçimden bağımsızdır.
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("caelinus_wishlist", JSON.stringify([...next]));
      } catch { /* quota */ }
      return next;
    });
  }, []);

  const avatarProducts = useMemo(
    () => sortProductsForAvatar(productsExtended),
    [],
  );
  const visibleProducts = useMemo(
    () => avatarProducts.filter((product) => product.category === activeCategory),
    [activeCategory, avatarProducts],
  );
  const selectedProduct = useMemo(() => {
    // Kullanıcı bir ürün seçtiyse onu göster.
    if (selectedProductId) {
      const explicit = avatarProducts.find((p) => p.id === selectedProductId);
      if (explicit) return explicit;
    }
    // İlk açılışta avatar GİYİNİK gelsin: görünür kategoride 3D kıyafeti olan
    // ilk ürünü seç. Yoksa ilk ürüne düş. (Hardcode yok — kıyafet GLB'leri
    // eklendikçe/düzeldikçe otomatik olarak ilgili ürün seçilir.)
    return (
      visibleProducts.find((p) => p.outfitGlb) ??
      visibleProducts[0] ??
      avatarProducts[0] ??
      null
    );
  }, [avatarProducts, selectedProductId, visibleProducts]);
  const activeOutfitBindings = useMemo(
    () => (selectedProduct?.outfitGlb ? [selectedProduct.outfitGlb] : []),
    [selectedProduct],
  );

  const handleCapabilities = useCallback((caps: ModelCapabilities) => {
    setModelCaps(caps);
  }, []);

  // Derive deform config — null when disabled or comparing
  const faceDeform: AvatarFaceDeformConfig | null = useMemo(() => {
    if (!faceMetrics || !deformEnabled || comparing) return null;
    return mapMetricsToAvatarDeform(faceMetrics, deformStrength);
  }, [faceMetrics, deformEnabled, deformStrength, comparing]);

  // Load saved state
  /* eslint-disable react-hooks/set-state-in-effect */
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

    // Wishlist'i geri yükle
    try {
      const storedWish = localStorage.getItem("caelinus_wishlist");
      if (storedWish) setFavorites(new Set(JSON.parse(storedWish) as string[]));
    } catch { /* corrupted storage */ }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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

        <section className="avcfg-game-layout" aria-label="Avatar deneyimi">
          <div className="avcfg-stage-panel">
            <div className="avcfg-stage-hud" aria-hidden="true">
              <span>Mirror Room</span>
              <span>{faceApplied ? "Face synced" : "Face optional"}</span>
              <span>
                {selectedProduct?.outfitGlb
                  ? outfitStatus === "ready"
                    ? "Outfit active"
                    : "Outfit loading"
                  : "Preview only"}
              </span>
            </div>

            <nav className="avcfg-radial-tools" aria-label="Avatar bolumleri">
              {SHOP_CATEGORY_ORDER.map((category) => {
                const item = CATEGORY_LABELS[category];
                return (
                  <button
                    key={category}
                    type="button"
                    className={`avcfg-tool-orb ${activeCategory === category ? "is-active" : ""}`}
                    onClick={() => setActiveCategory(category)}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <span className={`avcfg-tool-icon avcfg-tool-icon--${item.icon}`} />
                  </button>
                );
              })}
            </nav>

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
                animationUrl="/models/caelinus-catwalk.glb"
                // External textured mesh ise face decal/deform'u atla
                // (mesh kendi yüzüyle gelir; Caelinus default bald olduğunda
                // selfie face decal anlamlı olur).
                faceTextureUrl={
                  selectedBody.supportsSkinToneOverride ? faceTextureUrl : null
                }
                faceDeform={
                  selectedBody.supportsSkinToneOverride ? faceDeform : null
                }
                outfitBindings={activeOutfitBindings}
                onCapabilities={handleCapabilities}
                onOutfitStatus={(status) => setOutfitStatus(status.state)}
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

          <aside className="avcfg-inventory-panel" aria-label="Caelinus envanteri">
            <div className="avcfg-inventory-head">
              <div>
                <span className="avcfg-inventory-kicker">Wardrobe</span>
                <h2 className="avcfg-inventory-title">
                  {CATEGORY_LABELS[activeCategory].label}
                </h2>
              </div>
              <span className="avcfg-inventory-count">{visibleProducts.length}</span>
            </div>

            <div className="avcfg-category-tabs" role="tablist" aria-label="Urun kategorileri">
              {SHOP_CATEGORY_ORDER.map((category) => {
                const item = CATEGORY_LABELS[category];
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === category}
                    className={`avcfg-category-tab ${activeCategory === category ? "is-active" : ""}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    <span className={`avcfg-tool-icon avcfg-tool-icon--${item.icon}`} />
                    <span>{item.short}</span>
                  </button>
                );
              })}
            </div>

            <div className="avcfg-product-grid">
              {visibleProducts.map((product) => {
                const isFav = favorites.has(product.id);
                return (
                  <button
                    type="button"
                    key={product.id}
                    className={`avcfg-product-card ${selectedProduct?.id === product.id ? "is-selected" : ""}`}
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    <span className="avcfg-card-media">
                      <img src={product.image} alt={product.name} loading="lazy" />
                    </span>

                    <span className="avcfg-card-badges" aria-hidden="true">
                      {product.outfitGlb ? (
                        <span className="avcfg-badge avcfg-badge--3d">3D</span>
                      ) : (
                        <span className="avcfg-badge avcfg-badge--virtual">Virtual</span>
                      )}
                    </span>

                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
                      aria-pressed={isFav}
                      className={`avcfg-card-wish ${isFav ? "is-active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(product.id);
                        }
                      }}
                    >
                      {isFav ? "♥" : "♡"}
                    </span>

                    <span className="avcfg-product-meta">
                      <span className="avcfg-card-cat">{product.zodiac ?? product.category}</span>
                      <strong className="avcfg-card-price">{product.price}</strong>
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedProduct && (
              <div className="avcfg-selected-product">
                <div>
                  <span className="avcfg-selected-kicker">
                    {selectedProduct.outfitGlb
                      ? outfitStatus === "ready"
                        ? "Avatarinda aktif"
                        : "3D kiyafet hazirlaniyor"
                      : "3D kiyafet henuz yok"}
                  </span>
                  <h3>{selectedProduct.name}</h3>
                  <p>
                    {selectedProduct.outfitGlb
                      ? selectedProduct.story
                      : "Bu parca katalogda gorunur; 3D giydirme dosyasi eklendiginde avatar sahnesinde de aktif olur."}
                  </p>
                </div>
                <div className="avcfg-selected-actions">
                  <Link
                    href={`/universe/shop?dress=${encodeURIComponent(selectedProduct.id)}`}
                    className="avcfg-wear-btn"
                  >
                    Avatarda Dene
                  </Link>
                  <Link
                    href={`/universe/shop/urun/${encodeURIComponent(selectedProduct.id)}`}
                    className="avcfg-details-btn"
                  >
                    Urune Git
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </section>

        <section className="avcfg-studio-drawer" aria-label="Avatar stüdyo ayarları">
          <BodyPicker selectedId={bodyId} onSelect={handleBodySelect} />

          <div className="avcfg-studio-grid">
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
            </div>

            <div className="face-section avcfg-face-card">
              <FaceUpload onUploaded={handleFaceUploaded} />

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

              {faceMetrics && (
                <div className="face-debug-panel">
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

                  <button
                    type="button"
                    className="face-debug-toggle"
                    onClick={() => setShowDebug((p) => !p)}
                  >
                    {showDebug ? "Metrik Paneli Kapat" : "Metrik Paneli Ac"}
                  </button>

                  {showDebug && (
                    <div className="face-debug-grid">
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
        </section>
      </div>

    </main>
  );
}

"use client";

/**
 * Caelinus3DScene — Caelinus AI sayfaları için 3D canvas.
 *
 * GeneratedAvatar'ın `glbUrl`'ünü ModelAvatar ile yükler, luxury
 * black/gold/nude palet için karanlık zemin + altın ışık + kontak
 * gölgesi sahnesi sunar.
 *
 * Try-on illusion:
 *   • `tryOnAccent` rengi sahne ışıklarını ve glow halkasını besler.
 *     Bir ürün seçildiğinde bu renk ürün kategorisine kayar (bikini
 *     → kızıl, pareo → mavi, çanta → altın), aura halkası pulse
 *     animasyonuyla canlanır. Cloth simulation YOK — sadece ışık
 *     ve renk ile illüzyon.
 *   • `tryOnLabel` sahnenin üst kısmında "✦ Bedeninde · {ürün}" tag'i
 *     gösterir, fade-in/out animasyonu vardır.
 */

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
  useGLTF,
} from "@react-three/drei";

import ModelAvatar from "@/components/shop/ModelAvatar";
import type { GeneratedAvatar } from "@/lib/caelinus-ai";

/**
 * Sahnede mesh yüklenirken in-canvas görünür fallback —
 * Suspense `null` döndürdüğünde kullanıcı siyah ekranla baş başa
 * kalmasın diye küçük altın bir nefes ile sahnenin ortasında durur.
 */
function SceneLoading({ label = "Sahne örülüyor" }: { label?: string }) {
  return (
    <Html center transform={false} zIndexRange={[10, 0]}>
      <div className="cai-scene-inline-loading" role="status">
        <span className="cai-scene-inline-glyph">✦</span>
        <span>{label}</span>
      </div>
    </Html>
  );
}

/**
 * GLB load hatasını yakala — `useGLTF` 404'lerde ya da CORS
 * sorununda throw eder, normalde Suspense bu hatayı yutar ve
 * sayfa siyah kalır. Burada hatayı yakalayıp sahnenin ortasında
 * okunabilir bir mesaj gösteriyoruz ki teşhis kolay olsun.
 */
class SceneErrorBoundary extends Component<
  { children: ReactNode; onError?: (e: Error) => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[Caelinus3DScene] GLB error:", error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.error) {
      return (
        <Html center transform={false} zIndexRange={[10, 0]}>
          <div className="cai-scene-inline-error" role="alert">
            <span className="cai-scene-inline-glyph">⚠</span>
            <span>Sahne yüklenemedi — sayfayı yenile</span>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

const DEFAULT_MODEL = "/models/caelinus-avatar.glb";

useGLTF.preload(DEFAULT_MODEL);

type Props = {
  avatar?: GeneratedAvatar | null;
  /** Skin tone override — sadece supportsSkinToneOverride body'lerde etkili. */
  skinTone?: string;
  /** Catwalk animasyonu — try-on sayfasında otomatik açabiliriz. */
  animationUrl?: string | null;
  className?: string;
  autoRotate?: boolean;
  /** Try-on aura rengi — null ise default altın. */
  tryOnAccent?: string | null;
  /** Try-on tag — "✦ Bedeninde · {ürün}". */
  tryOnLabel?: string | null;
  /**
   * Avatar GLB'sini geçici olarak başka bir mesh ile override et —
   * try-on sırasında "ürünü giymiş bir varyantın" hâli için.
   * null ise avatar.glbUrl kullanılır.
   */
  avatarUrlOverride?: string | null;
};

export default function Caelinus3DScene({
  avatar,
  skinTone,
  animationUrl = null,
  className = "",
  autoRotate = true,
  tryOnAccent = null,
  tryOnLabel = null,
  avatarUrlOverride = null,
}: Props) {
  const url = avatarUrlOverride || avatar?.glbUrl || DEFAULT_MODEL;
  const tone =
    avatar?.outfitBindingHints?.supportsSkinToneOverride
      ? skinTone || avatar?.styleProfile.skinTone || "#d4ad8a"
      : avatar?.styleProfile.skinTone || skinTone || "#d4ad8a";

  // Aura/ışık rengi — try-on rengi varsa onu, yoksa altın
  const accent = tryOnAccent || "#caa56a";

  // Three.js'in ışık rengini her render'da hex string'le tetikle
  const lightTint = useMemo(() => accent, [accent]);

  // GLB değiştiğinde kısa swap shimmer overlay'ini tetikle —
  // mesh yeniden yükleniyor süresince kullanıcıya "değişim" hissi verir.
  //
  // ÖNEMLİ — StrictMode safety:
  // React 19 + StrictMode dev modda effect'i mount/unmount/mount
  // sırasıyla iki kez çalıştırır. Önceki sürümde "lastUrlRef === url
  // → return" guard'ı, ikinci mount'ta `setSwapping(false)` adımını
  // hiç çağırmıyordu ve veil sonsuza takılıyordu. Cleanup'ta state'i
  // her durumda kapatarak sorunu sıfırladık.
  const [swapping, setSwapping] = useState(false);
  const lastUrlRef = useRef<string>(url);
  useEffect(() => {
    if (lastUrlRef.current === url) return;
    lastUrlRef.current = url;
    setSwapping(true);
    const timer = window.setTimeout(() => setSwapping(false), 700);
    return () => {
      window.clearTimeout(timer);
      setSwapping(false);
    };
  }, [url]);

  return (
    <div
      className={`cai-canvas ${tryOnLabel ? "is-trying" : ""} ${
        swapping ? "is-swapping" : ""
      } ${className}`}
      style={{ ["--accent" as string]: accent } as React.CSSProperties}
    >
      <div className="cai-canvas-rim" aria-hidden="true" />
      <div className="cai-canvas-swap-veil" aria-hidden="true">
        <div className="cai-canvas-swap-shimmer" />
        <div className="cai-canvas-swap-text">
          ✦ Caelinus seni yeniden örüyor…
        </div>
      </div>

      {tryOnLabel && (
        <div className="cai-canvas-tryon-tag" key={tryOnLabel}>
          <span className="cai-canvas-tryon-tag-glyph">✦</span>
          <span className="cai-canvas-tryon-tag-text">
            Bedeninde · <strong>{tryOnLabel}</strong>
          </span>
        </div>
      )}

      <Canvas camera={{ position: [0, 1.4, 8.5], fov: 32 }} shadows>
        <color attach="background" args={["#0a0806"]} />
        <fog attach="fog" args={["#0a0806", 8, 20]} />

        <ambientLight intensity={0.55} />
        <directionalLight
          position={[3, 4, 3]}
          intensity={1.4}
          color={lightTint}
          castShadow
        />
        <directionalLight
          position={[-3, 2, -2]}
          intensity={0.6}
          color="#e8c8a8"
        />
        <pointLight position={[0, 6, 4]} intensity={0.5} color="#fff5d5" />
        {tryOnAccent && (
          <pointLight
            position={[0, 1.6, 4]}
            intensity={1.2}
            color={lightTint}
            distance={8}
            decay={2}
          />
        )}

        <SceneErrorBoundary>
          <Suspense fallback={<SceneLoading label="Bedenin geliyor…" />}>
            <ModelAvatar
              key={url}
              url={url}
              skinTone={tone}
              auraColor={accent}
              animationUrl={animationUrl}
            />
          </Suspense>
        </SceneErrorBoundary>

        <ContactShadows
          position={[0, -0.02, 0]}
          opacity={0.45}
          scale={6}
          blur={3}
          far={4}
          color="#000000"
        />

        <Suspense fallback={null}>
          <Environment preset="warehouse" environmentIntensity={0.45} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.18}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          minDistance={4}
          maxDistance={14}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.7}
          target={[0, 1.4, 0]}
          makeDefault
        />
      </Canvas>
    </div>
  );
}

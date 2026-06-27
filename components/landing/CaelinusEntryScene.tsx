"use client";

/**
 * CaelinusEntryScene — sinematik giriş eşiği (lüks dijital evrene kapı).
 *
 * Kompozisyon her ekranda birebir korunur ve daima 100dvh'ye sığar:
 *   • arka plan (z0): MoonHeroCanvas — prosedürel 3D ay + yıldız alanı + bulutlar
 *     + bloom; ay asla kırpılmaz (görünür alana göre ölçeklenir).
 *   • ön plan (z10): LivingLogo (üst) · başlık + alt başlık + CTA (alt küme).
 *   • eşikten geçiş: ay tık / CTA tık → kamera aya uçar, enerji halkaları,
 *     beyaza fade → /universe.
 *
 * SAĞLAMLIK: WebGL yoksa / bağlam kaybolursa / canvas hata verirse 3D katman
 * yerine zarif bir CSS ay fallback'i gösterilir — sayfa ASLA çökmez (tarayıcı
 * "This page couldn't load" GPU reset ekranı yerine her zaman içerik görünür).
 * 3D katman next/dynamic ssr:false ile tembel yüklenir.
 */

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";
import LivingLogo from "@/components/landing/LivingLogo";
import "@/app/styles/caelinus-entry.css";

const MoonHeroCanvas = dynamic(
  () => import("@/components/landing/hero/MoonHeroCanvas"),
  { ssr: false },
);

/* WebGL yeteneği — bir kez, senkron. Başarısızsa 3D hiç denenmez. */
function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

/* Canvas içindeki herhangi bir JS hatasını yakalar → fallback'e düşer. */
class CanvasBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function CaelinusEntryScene() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [use3D, setUse3D] = useState(false);
  const enteringRef = useRef(false);

  // Mount sonrası yeteneği ölç (SSR'da çalışmaz). Başarılıysa 3D'yi aç.
  useEffect(() => {
    if (detectWebGL()) setUse3D(true);
  }, []);

  const failTo2D = useCallback(() => setUse3D(false), []);

  const enterUniverse = useCallback(() => {
    if (enteringRef.current) return;
    enteringRef.current = true;

    if (prefersReducedMotion()) {
      router.push("/universe");
      return;
    }

    setEntering(true);
    window.setTimeout(() => router.push("/universe"), 1700);
  }, [router]);

  return (
    <section className={`caelinus-entry${entering ? " is-entering" : ""}`}>
      {/* z0 — yaşayan 3D gökyüzü + ay portalı (yetenek varsa) */}
      <div className="caelinus-canvas-layer" aria-hidden="true">
        {use3D ? (
          <CanvasBoundary onError={failTo2D}>
            <MoonHeroCanvas
              entering={entering}
              onEnter={enterUniverse}
              onError={failTo2D}
            />
          </CanvasBoundary>
        ) : (
          /* Statik fallback — WebGL yok / çökme: CSS ay + hâle (tıklanabilir) */
          <button
            type="button"
            className="caelinus-fallback-moon"
            aria-label="Caelinus evrenine gir"
            onClick={enterUniverse}
          />
        )}
      </div>

      {/* z2 — atmosferik scrim: alt metin için kontrast */}
      <div className="caelinus-scrim" aria-hidden="true" />

      {/* z10 — ön plan içerik */}
      <div className="caelinus-foreground">
        <header className="caelinus-top">
          <LivingLogo />
        </header>

        <div className="caelinus-bottom">
          <h1 className="caelinus-title">Wear Your Frequency</h1>
          <p className="caelinus-subtitle">
            A living universe of fashion, ritual and earth.
          </p>

          <div className="caelinus-cta">
            <button
              type="button"
              className="cta-enter"
              onClick={enterUniverse}
              aria-label="Caelinus evrenine gir"
            >
              <span>Enter When Ready</span>
            </button>
          </div>

          <p className="gate-copy">The gate is open · tap the moon to cross.</p>
        </div>
      </div>

      {/* Geçiş ışık patlaması → beyaza fade */}
      <div className="enter-flash" aria-hidden="true" />
    </section>
  );
}

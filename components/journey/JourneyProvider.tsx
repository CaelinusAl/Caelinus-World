"use client";

/**
 * JourneyProvider — "dünyalar arası dalış" geçiş katmanı (Faz 1).
 *
 * Caelinus'u menü hissinden çıkarıp gezilen bir mekâna çevirmenin omurgası:
 * bir portala tıklandığında ekranı o dünyanın rengiyle bir bloom-veil yutar,
 * rota client-side değişir, sonra veil sönerek yeni dünya belirir. Veil aynı
 * zamanda arka plandaki kalıcı WebGL sahnesi (WorldBackdrop) değişirken
 * oluşabilecek "zıplamayı" maskeler.
 *
 * Kullanım: navigasyon için <JourneyLink href color> ya da useJourney().travel().
 * prefers-reduced-motion açıksa geçiş atlanır, anında router.push yapılır.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/lib/anime/reduced-motion";

type JourneyContextValue = {
  /** Renkli dalış geçişiyle iç rotaya git. */
  travel: (href: string, color?: string) => void;
};

const JourneyContext = createContext<JourneyContextValue>({
  travel: () => {},
});

export function useJourney() {
  return useContext(JourneyContext);
}

// Veil'in açılış (dive-in) ve kapanış (reveal-out) süreleri — CSS ile eşleşir.
const IN_MS = 460;
const OUT_MS = 560;

const DEFAULT_COLOR = "#8aa0ff";

export default function JourneyProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");
  const [color, setColor] = useState(DEFAULT_COLOR);

  // Hedef href ve "biz mi başlattık" bayrağı — geri/ileri ile gelen pathname
  // değişimlerinde veil tetiklenmesin diye ref'le takip ediyoruz.
  const pendingRef = useRef<string | null>(null);
  const navigatingRef = useRef(false);

  const travel = useCallback(
    (href: string, c?: string) => {
      if (!href || !href.startsWith("/")) return;
      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      if (c) setColor(c);
      pendingRef.current = href;
      setPhase("in");
      window.setTimeout(() => {
        if (pendingRef.current) router.push(pendingRef.current);
      }, IN_MS);
    },
    [router],
  );

  // Varış: pathname değişti → veil'i söndür (reveal-out). Yalnızca biz
  // başlattıysak (navigatingRef) çalışır; ilk mount ve geri/ileri sessizdir.
  useEffect(() => {
    if (!navigatingRef.current) return;
    pendingRef.current = null;
    setPhase("out");
    const t = window.setTimeout(() => {
      setPhase("idle");
      navigatingRef.current = false;
      setColor(DEFAULT_COLOR);
    }, OUT_MS);
    return () => window.clearTimeout(t);
    // pathname kasıtlı tek bağımlılık — varış sinyali (ref/setState stabil).
  }, [pathname]);

  return (
    <JourneyContext.Provider value={{ travel }}>
      {children}
      <div
        className={`journey-veil${phase === "in" ? " is-in" : ""}${
          phase === "out" ? " is-out" : ""
        }`}
        style={{ ["--veil-color" as string]: color }}
        aria-hidden="true"
      >
        <div className="journey-veil-bloom" />
      </div>
    </JourneyContext.Provider>
  );
}

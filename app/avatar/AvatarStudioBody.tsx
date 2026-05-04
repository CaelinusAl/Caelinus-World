"use client";

/**
 * Avatar Studio — sekmeli giriş.
 *
 * İki yol bir kapıda birleşir:
 *
 *   • "Kendi Yarat" (BuilderFlow)  — varsayılan. Saç/göz/ten/dudak
 *     trait'leriyle SVG-tabanlı parametric tanrıça. Anlık, sıfır
 *     AI maliyeti, mahremiyet endişesi yok.
 *
 *   • "Selfie ile" (SelfieFlow)    — mevcut akış. fal-ai/nano-banana
 *     face-swap pipeline'ı, gerçek yüz transferi.
 *
 * Her iki yolun çıktısı aynı `caelinus_user_avatar_url` storage'ına
 * yazılır; meta'da `kind: "parametric" | "selfie"` ile ayrılır.
 * Shop / PDP / Stylist akışları farketmez — hep aynı URL'i okur.
 *
 * default export = `AvatarStudio` (tab shell).
 * Tarihsel `SelfieFlow` (eski adıyla AvatarStudioBody) named export
 * olarak kalır — başka bir route ondan import etmiyor ama gelecekte
 * /universe/shop/avatar gibi bir mini-modal'dan reuse'a hazır.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import BuilderFlow from "./BuilderFlow";
import { ZODIACS, type ZodiacId } from "@/data/play-assets";
import { findSignatureBikini } from "@/data/play-outfits";
import {
  AVATAR_CANVASES,
  DEFAULT_CANVAS,
  findCanvas,
  isAvatarCanvasId,
  type AvatarCanvasId,
} from "@/lib/avatar/canvases";
import { readUserAvatar, writeUserAvatar } from "@/lib/user-avatar";
import { useAuthStore } from "@/stores/auth-store";

const SELFIE_TARGET_PX = 1024;
const SELFIE_JPEG_QUALITY = 0.85;
const MAX_RAW_BYTES = 12 * 1024 * 1024;

type Lang = "tr" | "en";

type Props = {
  lang?: Lang;
};

type RenderState =
  | { kind: "idle" }
  | { kind: "loading"; startedAt: number }
  | { kind: "ready"; url: string; cached: boolean }
  | { kind: "error"; message: string };

const COPY = {
  tr: {
    kicker: "✦ Avatar Studio",
    title: "Caelinus tanrıçası olarak kendi yüzünü dene",
    sub: "Selfie yükle, burcunu seç. AI seni Caelinus modelinin yüzüne yerleştirsin — kıyafet, vücut ve sahne sabit kalır, yalnızca yüz değişir.",
    step1: "1 · Selfie",
    step2: "2 · Tuval",
    step3: "3 · Burç",
    step4: "4 · Avatar",
    canvasTitle: "Tuvalini seç",
    canvasHint:
      "AI yüzünü bu tarafsız tuvalin üzerine yerleştirir. Sonra mağazadan ürünleri tuvalin üstüne giydirebilirsin.",
    canvasRecommended: "önerilen",
    selfieDrop: "Selfie seç veya buraya sürükle",
    selfieRemove: "Selfie'yi kaldır",
    selfieReplace: "Selfie'yi değiştir",
    cloudHintAuthed:
      "Caelinus hesabına giriş yapmışsın — kaydettiğin avatar tüm cihazlarında geçerli olacak.",
    cloudHintAnon:
      "Anonim modda — avatar bu tarayıcıda saklanır. Tüm cihazlar arasında taşımak için ",
    cloudHintAnonLink: "giriş yap",
    cloudSaveBusy: "Buluta kaydediliyor…",
    cloudSaveErr: "Avatar yerel olarak kaydedildi, ama buluta yazılamadı.",
    privacy:
      "Selfie kalıcı saklanmaz; sadece bu render için kullanılır. Sonuç görseli Supabase Storage'da cache'lenir (aynı selfie + burç ikinci kez ücret yazmaz).",
    zodiacHint: "Burcunun signature bikini'si avatarına giydirilir.",
    generate: "Avatarımı Yarat",
    generating: "Avatar paintleniyor…",
    retry: "Yeniden dene",
    saveLocal: "✦ Bu Avatarımı Kaydet",
    saved: "✓ Kalıcı avatarın olarak kaydedildi.",
    download: "İndir",
    placeholder: "Selfie ve burç seçtikten sonra avatarın burada belirir.",
    chooseZodiac: "Önce burcunu seç.",
    chooseSelfie: "Önce selfie yükle.",
    error401: "Bu özellik için Caelinus hesabına giriş yapman gerekiyor.",
    errorAuth: "Giriş yap",
    errorGeneric: "Avatar üretilemedi. Bir saniye sonra tekrar dene.",
    errorTooLarge: "Dosya çok büyük (maks 12 MB).",
    errorType: "Sadece JPG/PNG/WEBP destekleniyor.",
    backHome: "← Evrene dön",
    metaCached: "anında cache",
    metaFresh: "yeni üretildi",
    metaProvider: "fal.ai · nano-banana",
    welcomeBack: "Avatarın hazır:",
  },
  en: {
    kicker: "✦ Avatar Studio",
    title: "Try your own face as a Caelinus goddess",
    sub: "Upload a selfie, pick your zodiac. AI places your face onto the Caelinus model — outfit, body and scene stay still, only the face changes.",
    step1: "1 · Selfie",
    step2: "2 · Canvas",
    step3: "3 · Zodiac",
    step4: "4 · Avatar",
    canvasTitle: "Pick your canvas",
    canvasHint:
      "AI lays your face onto this neutral canvas. Then you can dress the canvas with shop products.",
    canvasRecommended: "recommended",
    selfieDrop: "Choose a selfie or drop one here",
    selfieRemove: "Remove selfie",
    selfieReplace: "Replace selfie",
    cloudHintAuthed:
      "You're signed in to your Caelinus account — your saved avatar will follow you on every device.",
    cloudHintAnon:
      "Anonymous mode — avatar is stored in this browser. To carry it across devices ",
    cloudHintAnonLink: "sign in",
    cloudSaveBusy: "Saving to cloud…",
    cloudSaveErr: "Avatar saved locally, but the cloud save failed.",
    privacy:
      "Selfie isn't stored — used only for this render. The result is cached in Supabase Storage (same selfie + zodiac never costs twice).",
    zodiacHint: "Your zodiac's signature bikini is placed on the avatar.",
    generate: "Create my Avatar",
    generating: "Painting your avatar…",
    retry: "Try again",
    saveLocal: "✦ Make This My Avatar",
    saved: "✓ Saved as your permanent avatar.",
    download: "Download",
    placeholder: "Your avatar will appear here once you've added a selfie and zodiac.",
    chooseZodiac: "Pick your zodiac first.",
    chooseSelfie: "Upload a selfie first.",
    error401: "You need to sign in to your Caelinus account for this feature.",
    errorAuth: "Sign in",
    errorGeneric: "Could not produce avatar. Try again in a moment.",
    errorTooLarge: "File too large (max 12 MB).",
    errorType: "Only JPG/PNG/WEBP supported.",
    backHome: "← Back to the Universe",
    metaCached: "served from cache",
    metaFresh: "freshly generated",
    metaProvider: "fal.ai · nano-banana",
    welcomeBack: "Your avatar is ready:",
  },
} as const satisfies Record<Lang, Record<string, string>>;

const ZODIAC_GLYPHS: Record<ZodiacId, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
};

/**
 * Tab shell — varsayılan tab "build".
 *
 * URL parametresi `?tab=selfie` ile direkt selfie sekmesine
 * gidilebilir (örn. /avatar?tab=selfie&next=/universe/shop). Bu
 * Shop / PDP'den dönen mevcut linklerin geriye dönük uyumluluğu için.
 */
export default function AvatarStudio({ lang = "tr" }: Props) {
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab") === "selfie" ? "selfie" : "build";
  const [tab, setTab] = useState<"build" | "selfie">(initial);

  const tCopy = lang === "tr"
    ? { build: "Kendi Yarat", selfie: "Selfie ile", buildHint: "Anlık · ücretsiz", selfieHint: "AI face-swap · ~10sn" }
    : { build: "Build Your Own", selfie: "Use a Selfie", buildHint: "Instant · free", selfieHint: "AI face-swap · ~10s" };

  return (
    <main className="avatar-scene">
      <div className="avatar-shell">
        {/* Faz 4 pivot — primary avatar yolu artık 3D mesh.
         * Bu sayfa 2D AI tanrıça portresi üretir (parametric ya da
         * selfie). Shop'taki try-on 3D mesh kullandığı için bu sayfa
         * "stylist mood / mood-portre" amacıyla kalıyor. Üst banner
         * kullanıcıyı 3D primary path'e doğru yönlendirir. */}
        <div className="avatar-deprecation-banner" role="status">
          <div className="avatar-deprecation-text">
            <strong>
              {lang === "tr"
                ? "✦ 3D bedeniyle giymek istiyorsan"
                : "✦ Want to wear it on your 3D body?"}
            </strong>
            <span>
              {lang === "tr"
                ? "Primary avatar 3D mesh oldu — Shop ürünleri orada bone-bound olarak deniyor."
                : "Primary avatar is now the 3D mesh — Shop products try on with bone-bound binding."}
            </span>
          </div>
          <Link
            href="/universe/shop/avatar"
            className="avatar-deprecation-cta"
          >
            {lang === "tr" ? "◉ 3D Avatar Studio →" : "◉ 3D Avatar Studio →"}
          </Link>
        </div>

        <nav className="avatar-tabbar" role="tablist" aria-label={lang === "tr" ? "Avatar yaratım yolu" : "Avatar creation path"}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "build"}
            className={`avatar-tabbar-btn ${tab === "build" ? "active" : ""}`}
            onClick={() => setTab("build")}
          >
            <span className="avatar-tabbar-label">✦ {tCopy.build}</span>
            <span className="avatar-tabbar-hint">{tCopy.buildHint}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "selfie"}
            className={`avatar-tabbar-btn ${tab === "selfie" ? "active" : ""}`}
            onClick={() => setTab("selfie")}
          >
            <span className="avatar-tabbar-label">📸 {tCopy.selfie}</span>
            <span className="avatar-tabbar-hint">{tCopy.selfieHint}</span>
          </button>
        </nav>

        {tab === "build" ? (
          <BuilderFlow lang={lang} />
        ) : (
          <SelfieFlow lang={lang} />
        )}
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────
 * SelfieFlow — eski AvatarStudioBody. Selfie + tuval + burç →
 * fal-ai face-swap pipeline'ı. Davranışı değişmedi; sadece artık
 * default export değil, AvatarStudio tab shell'ından çağrılıyor.
 * ──────────────────────────────────────────────────────────── */
export function SelfieFlow({ lang = "tr" }: Props) {
  const t = COPY[lang];
  const router = useRouter();
  const searchParams = useSearchParams();
  // PDP'den (`?next=...`) geliyorsa kaydet/yarat sonrası oraya dön.
  const next = searchParams.get("next");

  const [selfie, setSelfie] = useState<{ dataUri: string; hash: string } | null>(
    null,
  );
  // URL parametresi `?zodiac=X` (StylistPanel "AI ile avatarımda gör"
  // akışından) gelmişse o burcu otomatik seç. Geçersiz değer yok sayılır.
  const initialZodiac = (() => {
    const z = searchParams.get("zodiac");
    return z && ZODIACS.some((zo) => zo.id === z) ? (z as ZodiacId) : null;
  })();
  const [zodiac, setZodiacState] = useState<ZodiacId | null>(initialZodiac);

  // URL parametresi `?canvas=X` (Wardrobe Drawer "tuvali değiştir"
  // akışından) gelmişse onu, yoksa varsayılan canvas'ı kullan. Stored
  // meta varsa onu mount sonrası override eder. Bilinmeyen ID güvenle
  // varsayılana düşer.
  const initialCanvas: AvatarCanvasId = (() => {
    const c = searchParams.get("canvas");
    return isAvatarCanvasId(c) ? c : DEFAULT_CANVAS;
  })();
  const [canvasId, setCanvasId] = useState<AvatarCanvasId>(initialCanvas);
  const [render, setRender] = useState<RenderState>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savingCloud, setSavingCloud] = useState(false);
  const [cloudWarn, setCloudWarn] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Auth state — login varsa "Bu Avatarımı Kaydet" hem localStorage'a
  // hem profiles tablosuna yazsın. Hidrasyondan önce `null`; mount
  // sonrası init() çağrılıp gerçek session okunur.
  const authUser = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);
  useEffect(() => useAuthStore.getState().init(), []);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Sayfaya girişte halihazırda kayıtlı avatar varsa rendera koy.
  // URL'den `?zodiac=X` (StylistPanel'den geliyorsa) explicit niyet
  // taşır — kayıtlı meta'nın override etmesine izin vermeyiz; aksi
  // halde kullanıcının "yeni burç için yarat" niyeti silinir.
  //
  // Faz 3.3 — Login varsa /api/avatar/me'yi de dene; cross-device
  // sync için sunucudaki avatar localStorage'ı ezer.
  useEffect(() => {
    const stored = readUserAvatar();
    if (stored) {
      setRender({ kind: "ready", url: stored.url, cached: true });
      setSaved(true);
      if (
        !initialZodiac &&
        stored.meta &&
        ZODIACS.some((z) => z.id === stored.meta!.zodiac)
      ) {
        setZodiacState(stored.meta.zodiac);
      }
      // Eski kayıtlarda canvas yok; varsa state'e taşı (URL parametresi
      // explicit niyet gibi yine baskındır).
      if (
        !searchParams.get("canvas") &&
        stored.meta?.canvas &&
        isAvatarCanvasId(stored.meta.canvas)
      ) {
        setCanvasId(stored.meta.canvas);
      }
    }

    // Login değilse API çağırma — 401 spam'ini engelle.
    if (!authHydrated || !authUser) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/avatar/me", { credentials: "include" });
        if (!res.ok) return; // 404/401/503 → sessizce localStorage-only.
        const j = (await res.json()) as {
          ok?: boolean;
          url?: string;
          zodiac?: ZodiacId | null;
          updatedAt?: string;
        };
        if (cancelled || !j.ok || !j.url) return;
        setRender({ kind: "ready", url: j.url, cached: true });
        setSaved(true);
        // localStorage'ı sunucudaki gerçek değerle sync'le.
        const serverCanvas = isAvatarCanvasId(
          (j as { canvas?: string }).canvas,
        )
          ? ((j as { canvas?: AvatarCanvasId }).canvas as AvatarCanvasId)
          : undefined;
        writeUserAvatar(j.url, {
          zodiac: j.zodiac ?? "aries",
          canvas: serverCanvas,
          createdAt: j.updatedAt ?? new Date().toISOString(),
        });
        if (!initialZodiac && j.zodiac && ZODIACS.some((z) => z.id === j.zodiac)) {
          setZodiacState(j.zodiac as ZodiacId);
        }
        if (!searchParams.get("canvas") && serverCanvas) {
          setCanvasId(serverCanvas);
        }
      } catch {
        // Offline / network — localStorage akışıyla devam.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialZodiac, authHydrated, authUser]);

  /* ── Selfie pipeline ─────────────────────────────────────── */

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError(t.errorType);
        return;
      }
      if (file.size > MAX_RAW_BYTES) {
        setError(t.errorTooLarge);
        return;
      }
      setBusy(true);
      try {
        const processed = await processSelfie(file);
        setSelfie(processed);
        // Selfie değişti → render'ı sıfırla (eski sonucu silmeyelim
        // ama "saved" bayrağını da kapatmayalım — kullanıcı yeni
        // bir avatar üretmedikçe kayıtlı olan kalsın).
        setRender({ kind: "idle" });
      } catch (err) {
        console.error("[avatar.studio] selfie process failed", err);
        setError(t.errorGeneric);
      } finally {
        setBusy(false);
      }
    },
    [t.errorType, t.errorTooLarge, t.errorGeneric],
  );

  const onPick = useCallback(() => inputRef.current?.click(), []);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void handleFile(f);
      e.target.value = "";
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void handleFile(f);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const removeSelfie = useCallback(() => {
    setSelfie(null);
    setError(null);
  }, []);

  /* ── Generate ────────────────────────────────────────────── */

  const canGenerate = !!selfie && !!zodiac && !busy;

  const generate = useCallback(async () => {
    if (!selfie || !zodiac) {
      setError(!selfie ? t.chooseSelfie : t.chooseZodiac);
      return;
    }
    setError(null);
    setSaved(false);

    // Wardrobe Faz B — face-swap target artık burcun lookbook'u
    // değil, kullanıcının seçtiği tarafsız tuval. Outfit hala
    // gönderilir (prompt fragment'i için), ama route içinde canvas
    // varsa target image canvas'tan gelir (canvas öncelikli).
    const outfit = findSignatureBikini(zodiac);
    const canvas = findCanvas(canvasId) ?? findCanvas(DEFAULT_CANVAS);
    if (!canvas) {
      setError(t.errorGeneric);
      return;
    }

    const startedAt = Date.now();
    setRender({ kind: "loading", startedAt });

    const controller = new AbortController();
    const abortTimer = window.setTimeout(() => controller.abort(), 75_000);
    try {
      const res = await fetch("/api/play/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetype: "cosmic",
          zodiac,
          scene: "night",
          outfit: outfit?.id,
          canvas: canvas.id,
          selfieDataUri: selfie.dataUri,
          selfieHash: selfie.hash,
          lang,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as
          | { error?: string; message?: string }
          | null;
        const msg =
          res.status === 401
            ? t.error401
            : j?.message || j?.error || t.errorGeneric;
        setRender({ kind: "error", message: msg });
        return;
      }

      const j = (await res.json()) as {
        url: string;
        cached: boolean;
      };
      setRender({ kind: "ready", url: j.url, cached: j.cached });
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      setRender({
        kind: "error",
        message: isAbort
          ? lang === "tr"
            ? "AI 75 saniye içinde yanıt vermedi. Tekrar dene."
            : "AI didn't respond within 75s. Try again."
          : t.errorGeneric,
      });
    } finally {
      window.clearTimeout(abortTimer);
    }
  }, [selfie, zodiac, lang, t.chooseSelfie, t.chooseZodiac, t.error401, t.errorGeneric]);

  /* ── Save as my avatar ───────────────────────────────────── */

  const saveAsMine = useCallback(async () => {
    if (render.kind !== "ready" || !zodiac) return;
    // Önce localStorage — anonim kullanıcı için tek doğru. Canvas da
    // meta'da; ileride Wardrobe Drawer "tuvali değiştir" akışı bunu
    // okuyup pre-select edebilsin diye.
    writeUserAvatar(render.url, {
      zodiac,
      canvas: canvasId,
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
    setCloudWarn(null);

    // Login varsa /api/avatar/save ile profiles tablosuna da yaz —
    // user-avatars/{userId}/caelinus.<ext>'e kopyalanır, cross-device
    // sync devreye girer. Hatayı sessizce yutmaz; kullanıcı yerelde
    // var olsa da bulut yazılımı başarısızsa görsün.
    if (authUser) {
      setSavingCloud(true);
      try {
        const res = await fetch("/api/avatar/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url: render.url, zodiac, canvas: canvasId }),
        });
        if (res.ok) {
          const j = (await res.json()) as { url: string; updatedAt: string };
          // user-avatars URL'i (sahibinin kendi path'i) — localStorage
          // ve render state'i bunu kullansın, böylece cross-device
          // erişimde aynı URL döner.
          writeUserAvatar(j.url, {
            zodiac,
            canvas: canvasId,
            createdAt: j.updatedAt,
          });
          setRender({ kind: "ready", url: j.url, cached: true });
        } else {
          const err = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setCloudWarn(err?.error || t.cloudSaveErr);
        }
      } catch {
        setCloudWarn(t.cloudSaveErr);
      } finally {
        setSavingCloud(false);
      }
    }

    // PDP'den yönlendirildiyse kullanıcı "kaydet"e basınca otomatik
    // dönsün. Aksi halde kalsın, indirme/paylaşma yapsın.
    if (next) {
      setTimeout(() => router.push(next), 800);
    }
  }, [render, zodiac, canvasId, next, router, authUser, t.cloudSaveErr]);

  /* ── Render ───────────────────────────────────────────────── */

  const placeholder =
    render.kind === "idle" || render.kind === "error"
      ? t.placeholder
      : null;

  return (
    <div className="avatar-flow avatar-flow--selfie">
      <header className="avatar-header">
        <p className="avatar-kicker">{t.kicker}</p>
        <h1 className="avatar-title">{t.title}</h1>
        <p className="avatar-sub">{t.sub}</p>
        {saved && render.kind === "ready" ? (
          <p className="avatar-kicker" style={{ color: "rgba(150,220,180,0.9)" }}>
            {t.welcomeBack}
          </p>
        ) : null}
      </header>

      <div className="avatar-grid">
          {/* ── LEFT: inputs ─────────────────────────────────── */}
          <div className="avatar-col">
            <section
              className="avatar-card"
              aria-labelledby={`${inputId}-h1`}
            >
              <p className="avatar-card-step">{t.step1}</p>
              <h2 className="avatar-card-title" id={`${inputId}-h1`}>
                {t.selfieDrop}
              </h2>
              <div
                className={
                  "avatar-selfie-drop" +
                  (selfie ? " has-selfie" : "") +
                  (dragOver ? " is-drag" : "")
                }
                onClick={!selfie ? onPick : undefined}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                role={selfie ? undefined : "button"}
                tabIndex={selfie ? -1 : 0}
                onKeyDown={(e) => {
                  if (!selfie && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onPick();
                  }
                }}
              >
                {selfie ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selfie.dataUri}
                    alt=""
                    aria-hidden="true"
                    className="avatar-selfie-preview"
                  />
                ) : (
                  <span className="avatar-selfie-glyph" aria-hidden="true">
                    ⌖
                  </span>
                )}
              </div>
              <div className="avatar-selfie-actions">
                <button
                  type="button"
                  className="avatar-btn"
                  onClick={onPick}
                  disabled={busy}
                >
                  {selfie ? t.selfieReplace : t.selfieDrop}
                </button>
                {selfie ? (
                  <button
                    type="button"
                    className="avatar-btn avatar-btn--ghost"
                    onClick={removeSelfie}
                    disabled={busy}
                  >
                    {t.selfieRemove}
                  </button>
                ) : null}
              </div>
              <p className="avatar-privacy">{t.privacy}</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onChange}
                className="avatar-input"
                tabIndex={-1}
                aria-hidden="true"
              />
            </section>

            {/* Step 2 — Tuvalini Seç (Wardrobe Faz B). Üç tarafsız
             * tuval; kullanıcı kendi estetiğini seçer. Seçim
             * canvasId state'inde tutulur, render request'ine
             * `canvas` alanı olarak gider. Önerilen olan rozetlenir. */}
            <section
              className="avatar-card"
              aria-labelledby={`${inputId}-canvas`}
            >
              <p className="avatar-card-step">{t.step2}</p>
              <h2 className="avatar-card-title" id={`${inputId}-canvas`}>
                {t.canvasTitle}
              </h2>
              <p className="avatar-card-hint">{t.canvasHint}</p>
              <div className="avatar-canvases">
                {AVATAR_CANVASES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`avatar-canvas-chip ${canvasId === c.id ? "active" : ""}`}
                    onClick={() => setCanvasId(c.id)}
                    aria-pressed={canvasId === c.id}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.src}
                      alt=""
                      aria-hidden="true"
                      className="avatar-canvas-thumb"
                      loading="lazy"
                    />
                    <span className="avatar-canvas-meta">
                      <span className="avatar-canvas-label">
                        {c.label[lang]}
                        {c.recommended ? (
                          <span className="avatar-canvas-badge">
                            {t.canvasRecommended}
                          </span>
                        ) : null}
                      </span>
                      <span className="avatar-canvas-hint">
                        {c.hint[lang]}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section
              className="avatar-card"
              aria-labelledby={`${inputId}-h2`}
            >
              <p className="avatar-card-step">{t.step3}</p>
              <h2 className="avatar-card-title" id={`${inputId}-h2`}>
                {lang === "tr" ? "Burcunu seç" : "Pick your zodiac"}
              </h2>
              <p className="avatar-card-hint">{t.zodiacHint}</p>
              <div className="avatar-zodiacs">
                {ZODIACS.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    className={`avatar-zodiac ${zodiac === z.id ? "active" : ""}`}
                    onClick={() => setZodiacState(z.id)}
                  >
                    <span className="avatar-zodiac-glyph">
                      {ZODIAC_GLYPHS[z.id]}
                    </span>
                    <span>{z.label[lang]}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* ── RIGHT: action + result ──────────────────────── */}
          <div className="avatar-col">
            <section className="avatar-card">
              <p className="avatar-card-step">{t.step4}</p>
              <h2 className="avatar-card-title">{t.generate}</h2>
              <div className="avatar-cta-row">
                <button
                  type="button"
                  className="avatar-btn avatar-btn--primary"
                  onClick={generate}
                  disabled={!canGenerate || render.kind === "loading"}
                >
                  {render.kind === "loading" ? t.generating : t.generate}
                </button>
                {render.kind === "ready" ? (
                  <>
                    <button
                      type="button"
                      className="avatar-btn"
                      onClick={() => void saveAsMine()}
                      disabled={saved || savingCloud}
                    >
                      {savingCloud
                        ? t.cloudSaveBusy
                        : saved
                          ? t.saved
                          : t.saveLocal}
                    </button>
                    <a
                      href={render.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="avatar-btn avatar-btn--ghost"
                    >
                      {t.download}
                    </a>
                  </>
                ) : null}
                {render.kind === "error" ? (
                  <button
                    type="button"
                    className="avatar-btn"
                    onClick={generate}
                  >
                    {t.retry}
                  </button>
                ) : null}
              </div>
              {error ? <p className="avatar-error">{error}</p> : null}
              {render.kind === "error" ? (
                <p className="avatar-error">{render.message}</p>
              ) : null}
              {cloudWarn ? <p className="avatar-error">{cloudWarn}</p> : null}
              {/* Faz 3.3 — bulut hint'i. authHydrated false iken
               * dökmeyiz, yoksa flash flicker olur. */}
              {authHydrated ? (
                authUser ? (
                  <p className="avatar-privacy" style={{ color: "rgba(150,220,180,0.85)" }}>
                    {t.cloudHintAuthed}
                  </p>
                ) : (
                  <p className="avatar-privacy">
                    {t.cloudHintAnon}
                    <Link
                      href={`/atelier/giris?next=${encodeURIComponent(
                        next ? `/avatar?next=${encodeURIComponent(next)}` : "/avatar",
                      )}`}
                      style={{ color: "rgba(220,200,255,0.95)", textDecoration: "underline" }}
                    >
                      {t.cloudHintAnonLink}
                    </Link>
                    .
                  </p>
                )
              ) : null}
            </section>

            <div className="avatar-result-card">
              <div className="avatar-result-frame">
                {render.kind === "ready" ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={render.url}
                      alt={
                        lang === "tr"
                          ? "Senin Caelinus avatarın"
                          : "Your Caelinus avatar"
                      }
                      className="avatar-result-img"
                    />
                  </>
                ) : render.kind === "loading" ? (
                  <>
                    <div className="avatar-result-placeholder">
                      {t.generating}
                    </div>
                    <div className="avatar-shimmer" aria-hidden="true" />
                  </>
                ) : (
                  <p className="avatar-result-placeholder">{placeholder}</p>
                )}
              </div>
              {render.kind === "ready" ? (
                <div className="avatar-result-meta">
                  <span>{t.metaProvider}</span>
                  <span>{render.cached ? t.metaCached : t.metaFresh}</span>
                </div>
              ) : null}
              {saved ? (
                <p className="avatar-saved-banner">{t.saved}</p>
              ) : null}
            </div>
          </div>
        </div>

      <div className="avatar-back-row">
        <Link href="/universe" className="avatar-back-link">
          {t.backHome}
        </Link>
        {render.kind === "ready" && next ? (
          <Link href={next} className="avatar-btn">
            {lang === "tr" ? "Mağazaya Dön →" : "Back to Shop →"}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/* ── Selfie processing — SelfieUploader ile bilinçli paralel ──── */

async function processSelfie(
  file: File,
): Promise<{ dataUri: string; hash: string }> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const long = Math.max(bitmap.width, bitmap.height);
  const scale = long > SELFIE_TARGET_PX ? SELFIE_TARGET_PX / long : 1;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const dataUri = canvas.toDataURL("image/jpeg", SELFIE_JPEG_QUALITY);
  const hash = (await sha256Hex(dataUri)).slice(0, 16);
  return { dataUri, hash };
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

"use client";

/**
 * LookActions — the row under the rendered look:
 *
 *   • REMIX        — return to AvatarPicker, keep archetype + scene,
 *   • RE-ROLL      — request another take of the same triple (F2a).
 *                    Each re-roll bumps the variant index in the store
 *                    and produces a new play_renders cache row, so the
 *                    canonical (v1) gallery entry isn't disturbed and
 *                    the new variant can be saved/liked independently.
 *   • SAVE LOOK    — POST to /api/play/save (auth-gated; caller
 *                    handles the redirect-to-signin),
 *   • SHARE LOOK   — copy the public look URL to clipboard,
 *   • BUY THIS LOOK — when the Stylist Caelinus AI overlay is active,
 *                     deep-link into /universe/shop for the selected
 *                     product. Without an outfit, links to the
 *                     zodiac-filtered shop view as an "explore the
 *                     drop" affordance.
 */

import { CinemaCTA } from "@/app/_stage";
import { findOutfit } from "@/data/play-outfits";
import { usePlayStore } from "@/stores/play-store";

const MAX_VARIANT = 8;

type Props = {
  lang: "tr" | "en";
  /** Caller knows whether the user is authed; if not we route SAVE
   *  through /atelier/giris with a "next" param. */
  onSave: () => void;
  onShare: () => void;
  /** F2a — request a fresh variant for the current triple. Caller
   *  bumps the variant index in the store and triggers the render. */
  onReroll: () => void;
  /** Current variant index (1 = canonical). Drives the re-roll label
   *  and disabled state when the cap is reached. */
  variant: number;
  /** Toast message currently in flight, if any. */
  toast: string | null;
};

export default function LookActions({
  lang,
  onSave,
  onShare,
  onReroll,
  variant,
  toast,
}: Props) {
  const remix = usePlayStore((s) => s.remix);
  const saved = usePlayStore((s) => s.saved);
  const renderState = usePlayStore((s) => s.render);
  const zodiacId = usePlayStore((s) => s.zodiac);
  const outfitId = usePlayStore((s) => s.outfit);
  const isReady = renderState.kind === "ready";
  const canReroll = variant < MAX_VARIANT;

  const selectedOutfit = outfitId ? findOutfit(outfitId) : null;
  const buyHref = selectedOutfit
    ? selectedOutfit.buyHref
    : zodiacId
      ? `/universe/shop?zodiac=${zodiacId}`
      : "/universe/shop";

  const buyLabel = selectedOutfit
    ? lang === "tr"
      ? `${selectedOutfit.name} · ${selectedOutfit.price}`
      : `${selectedOutfit.name} · ${selectedOutfit.price}`
    : lang === "tr"
      ? "Bu görünümü al"
      : "Buy this look";

  const buyTitle = selectedOutfit
    ? lang === "tr"
      ? `Mağazada satın al — ${selectedOutfit.name}`
      : `Open in shop — ${selectedOutfit.name}`
    : lang === "tr"
      ? "Burcuna ait koleksiyonu keşfet"
      : "Explore the matching collection";

  const rerollLabel =
    variant >= MAX_VARIANT
      ? lang === "tr"
        ? "Limit doldu"
        : "Limit reached"
      : variant === 1
        ? lang === "tr"
          ? "Yeni bir tane çiz"
          : "Paint another"
        : lang === "tr"
          ? `Tekrar dene · v${variant + 1}`
          : `Try again · v${variant + 1}`;

  return (
    <div className="play-actions">
      <div className="play-actions-row">
        <CinemaCTA
          variant="ghost"
          tone="magenta"
          trailingGlyph="↻"
          onClick={remix}
        >
          {lang === "tr" ? "Yeniden karıştır" : "Remix"}
        </CinemaCTA>

        <CinemaCTA
          variant="ghost"
          tone="cosmic"
          trailingGlyph="✦"
          onClick={onReroll}
          disabled={!isReady || !canReroll}
          title={
            !canReroll
              ? lang === "tr"
                ? "Aynı kombinasyon için maksimum varyant sayısına ulaştın"
                : "You've reached the variant limit for this combo"
              : undefined
          }
        >
          {rerollLabel}
        </CinemaCTA>

        <CinemaCTA
          variant="primary"
          tone="magenta"
          trailingGlyph={saved ? "✓" : "❤"}
          onClick={onSave}
          disabled={!isReady || saved}
        >
          {saved
            ? lang === "tr"
              ? "Kaydedildi"
              : "Saved"
            : lang === "tr"
              ? "Görünümü kaydet"
              : "Save look"}
        </CinemaCTA>

        <CinemaCTA
          variant="ghost"
          tone="cosmic"
          trailingGlyph="↗"
          onClick={onShare}
          disabled={!isReady}
        >
          {lang === "tr" ? "Paylaş" : "Share"}
        </CinemaCTA>

        <CinemaCTA
          href={buyHref}
          variant="ghost"
          tone="gold"
          trailingGlyph="⌖"
          aria-label={buyTitle}
          title={buyTitle}
          aria-disabled={!isReady ? true : undefined}
          tabIndex={!isReady ? -1 : undefined}
          className={!isReady ? "is-disabled" : ""}
        >
          {buyLabel}
        </CinemaCTA>
      </div>

      {variant > 1 ? (
        <p className="play-actions-variant" aria-live="polite">
          {lang === "tr"
            ? `Bu varyant: v${variant} · sadece sen görüyorsun, kaydedersen galeride yer alır.`
            : `This variant: v${variant} · only you can see it; saving adds it to the gallery.`}
        </p>
      ) : null}

      {toast ? (
        <p className="play-actions-toast" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}

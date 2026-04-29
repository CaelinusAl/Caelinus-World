"use client";

/**
 * LookActions — the row under the rendered look:
 *
 *   • REMIX        — return to AvatarPicker, keep archetype + scene,
 *   • SAVE LOOK    — POST to /api/play/save (auth-gated; caller
 *                    handles the redirect-to-signin),
 *   • SHARE LOOK   — copy the public look URL to clipboard,
 *   • BUY THIS LOOK — when the Stylist Caelinus AI overlay is active,
 *                     deep-link into /universe/shop for the selected
 *                     product. Without an outfit, links to the
 *                     zodiac-filtered shop view as an "explore the
 *                     drop" affordance.
 *
 * Phase-1: the live AI render path is paused, so the previous "RE-ROLL"
 * action (which spent an OpenAI/FASHN credit per click) is gone. Every
 * canvas state on /play now comes from a static designer-curated shop
 * frame, so there's nothing to "re-roll" — the only way to swap the
 * look is to pick a different zodiac or outfit tile.
 */

import { CinemaCTA } from "@/app/_stage";
import { findOutfit } from "@/data/play-outfits";
import { usePlayStore } from "@/stores/play-store";

type Props = {
  lang: "tr" | "en";
  /** Caller knows whether the user is authed; if not we route SAVE
   *  through /atelier/giris with a "next" param. */
  onSave: () => void;
  onShare: () => void;
  /** Current variant index (1 = canonical). Surfaces a small "v2/v3…"
   *  hint under the actions row whenever the user has cycled past the
   *  canonical render — kept for forward-compat even though Phase-1
   *  doesn't write new variants. */
  variant: number;
  /** Toast message currently in flight, if any. */
  toast: string | null;
};

export default function LookActions({
  lang,
  onSave,
  onShare,
  variant,
  toast,
}: Props) {
  const remix = usePlayStore((s) => s.remix);
  const saved = usePlayStore((s) => s.saved);
  const renderState = usePlayStore((s) => s.render);
  const zodiacId = usePlayStore((s) => s.zodiac);
  const outfitId = usePlayStore((s) => s.outfit);
  const isReady = renderState.kind === "ready";

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

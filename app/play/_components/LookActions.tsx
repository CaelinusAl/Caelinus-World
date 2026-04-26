"use client";

/**
 * LookActions — the row under the rendered look:
 *
 *   • REMIX        — return to AvatarPicker, keep archetype + scene,
 *   • SAVE LOOK    — POST to /api/play/save (auth-gated; caller
 *                    handles the redirect-to-signin),
 *   • SHARE LOOK   — copy the public look URL to clipboard,
 *   • BUY THIS LOOK — disabled "yakında" tooltip until the e-commerce
 *                     phase (5e) lands.
 *
 * The action buttons are intentionally heavy on the same .stage-cta
 * styling so they sit alongside the picker buttons without clashing.
 */

import { CinemaCTA } from "@/app/_stage";
import { usePlayStore } from "@/stores/play-store";

type Props = {
  lang: "tr" | "en";
  /** Caller knows whether the user is authed; if not we route SAVE
   *  through /atelier/giris with a "next" param. */
  onSave: () => void;
  onShare: () => void;
  /** Toast message currently in flight, if any. */
  toast: string | null;
};

export default function LookActions({ lang, onSave, onShare, toast }: Props) {
  const remix = usePlayStore((s) => s.remix);
  const saved = usePlayStore((s) => s.saved);
  const renderState = usePlayStore((s) => s.render);
  const isReady = renderState.kind === "ready";

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
          variant="ghost"
          tone="gold"
          trailingGlyph="⌖"
          disabled
          title={lang === "tr" ? "Yakında" : "Coming soon"}
        >
          {lang === "tr" ? "Bu görünümü al" : "Buy this look"}
        </CinemaCTA>
      </div>

      {toast ? (
        <p className="play-actions-toast" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}

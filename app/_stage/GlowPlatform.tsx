"use client";

/**
 * GlowPlatform — the lit elliptical disc beneath a figure. Borrowed
 * straight from the mockup where each archetype stands on her own
 * little circle of light. Used at the foot of avatars / poster cards
 * to ground them.
 *
 * Two stacked layers:
 *   • a thin elliptical ring that suggests a stage lip,
 *   • a soft blurred halo that bleeds upward into the subject.
 *
 * The optional `glyph` prop puts a centred zodiac / pillar mark on the
 * disc (e.g. ♌ for Leo, ✦ for cosmic) for picker tiles.
 */

import type { ReactNode } from "react";

import type { StageTone } from "./NebulaPortal";

export type GlowPlatformProps = {
  /** Width in px. Height is auto-derived as 22% (elliptical). Default 160. */
  width?: number;
  tone?: StageTone;
  /** "soft" trims the halo back ~40% — for dense grids. */
  intensity?: "rich" | "soft";
  /** A small glyph centred on the disc (zodiac sigil, pillar mark…). */
  glyph?: ReactNode;
  className?: string;
};

export default function GlowPlatform({
  width = 160,
  tone = "magenta",
  intensity = "rich",
  glyph,
  className,
}: GlowPlatformProps) {
  const cls = [
    "stage-platform",
    `stage-platform--${tone}`,
    `stage-platform--${intensity}`,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      style={{ ["--stage-platform-width" as string]: `${width}px` }}
      aria-hidden="true"
    >
      <span className="stage-platform-halo" />
      <span className="stage-platform-ring" />
      {glyph ? <span className="stage-platform-glyph">{glyph}</span> : null}
    </div>
  );
}

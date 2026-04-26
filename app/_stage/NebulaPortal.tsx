"use client";

/**
 * NebulaPortal — the big halo that frames a focal subject (an avatar,
 * an atelier cover, a goddess poster). Three layered rings:
 *
 *   1. aura-outer  — wide, low-opacity ring; sets the "this is alive"
 *                    glow without dominating contrast,
 *   2. aura-inner  — soft warm core that bleeds a few px past the
 *                    subject's edge,
 *   3. ring        — the crisp 1-px halo right at the subject border.
 *
 * The component is unopinionated about what's inside — pass any node
 * (an <Image>, an SVG glyph, a fallback letter). Sizing is driven by
 * the `size` prop and a CSS var so the ring layers scale naturally.
 *
 * Tones map to the broader Caelinus palette so the same component can
 * sit on /atelier (magenta), /play (cosmic), /universe (gold), without
 * us having to re-declare colours per page.
 */

import type { CSSProperties, ReactNode } from "react";

export type StageTone = "magenta" | "cosmic" | "gold" | "amber" | "teal";

export type NebulaPortalProps = {
  children?: ReactNode;
  /** Outer diameter in px (the ring extends a bit beyond this). Default 220. */
  size?: number;
  tone?: StageTone;
  /** Soft pulse animation. Default `true`; the reduced-motion media query
   *  will disable it regardless. */
  pulse?: boolean;
  /** Drop the rings — useful when nesting a portal inside a card that
   *  already has its own halo. */
  bare?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
};

export default function NebulaPortal({
  children,
  size = 220,
  tone = "magenta",
  pulse = true,
  bare = false,
  className,
  style,
  ariaLabel,
}: NebulaPortalProps) {
  const cls = [
    "stage-portal",
    `stage-portal--${tone}`,
    pulse ? "stage-portal--pulse" : "",
    bare ? "stage-portal--bare" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      style={{ ["--stage-portal-size" as string]: `${size}px`, ...style }}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      {!bare ? (
        <>
          <span className="stage-portal-aura-outer" aria-hidden="true" />
          <span className="stage-portal-aura-inner" aria-hidden="true" />
          <span className="stage-portal-ring" aria-hidden="true" />
        </>
      ) : null}
      <div className="stage-portal-slot">{children}</div>
    </div>
  );
}

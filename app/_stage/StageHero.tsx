"use client";

/**
 * StageHero — the big top-of-page hero block from the mockup.
 *   eyebrow → title → lead → optional NebulaPortal slot → CTA row
 *
 * Three slots:
 *   • `portalSlot` — typically a <NebulaPortal>. Centered above the
 *                    title in `vertical` layout, beside it in `split`.
 *   • `actions`    — the CTA row underneath (one or many <CinemaCTA>).
 *   • `children`   — anything extra that should appear after the CTAs
 *                    (a featured strip, a status block, …).
 */

import type { ReactNode } from "react";

import type { StageTone } from "./NebulaPortal";

export type StageHeroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  portalSlot?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  /** "vertical" — portal sits above the title (mockup default).
   *  "split"    — portal floats to the right on wide screens.
   *  "compact"  — short version for dashboards (no portal). */
  layout?: "vertical" | "split" | "compact";
  tone?: StageTone;
  className?: string;
};

export default function StageHero({
  eyebrow,
  title,
  lead,
  portalSlot,
  actions,
  children,
  layout = "vertical",
  tone = "magenta",
  className,
}: StageHeroProps) {
  const cls = [
    "stage-hero",
    `stage-hero--${layout}`,
    `stage-hero--${tone}`,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={cls}>
      {portalSlot && layout !== "compact" ? (
        <div className="stage-hero-portal" aria-hidden="true">
          {portalSlot}
        </div>
      ) : null}

      <div className="stage-hero-text">
        {eyebrow ? <p className="stage-hero-eyebrow">{eyebrow}</p> : null}
        <h1 className="stage-hero-title">{title}</h1>
        {lead ? <p className="stage-hero-lead">{lead}</p> : null}
        {actions ? <div className="stage-hero-actions">{actions}</div> : null}
      </div>

      {children ? <div className="stage-hero-after">{children}</div> : null}
    </section>
  );
}

"use client";

/**
 * StageCard — the universal poster card. One component covers:
 *   • atelier dashboard cards (cover image + name + status disk),
 *   • atelier landing pillars (glyph + title + body),
 *   • play archetype tiles (silhouette + label + active glow),
 *   • featured ateliers strip on /atelier.
 *
 * Three structural variants:
 *   • "poster"  — image-led, the dominant layout from the mockup,
 *   • "pillar"  — content-led, no image, glyph + serif title + body,
 *   • "tile"    — compact picker (square aspect, label below).
 *
 * All variants share the portal-ring border + hover lift + optional
 * status accent stripe. The component can render either as a button
 * (selectable) or as an anchor (link). Anything else (card with no
 * action) just passes `as="div"`.
 */

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
} from "react";

import type { StageTone } from "./NebulaPortal";

export type StageCardVariant = "poster" | "pillar" | "tile";

export type StageCardStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "neutral";

type CommonProps = {
  variant?: StageCardVariant;
  tone?: StageTone;
  /** Path to a cover image. Falls back to a nebula gradient when absent. */
  image?: string | null;
  /** Big serif title — present in all variants. */
  title: ReactNode;
  /** Optional eyebrow above the title (e.g. KIND, REGION). */
  eyebrow?: ReactNode;
  /** Glyph in the top-left for `pillar` / `tile`, ignored on `poster`. */
  glyph?: ReactNode;
  /** Short body text under the title. Mainly for `pillar`. */
  body?: ReactNode;
  /** Slot beneath the title — meta lines, place plate, frequency, …  */
  meta?: ReactNode;
  /** A coloured pill that floats top-right (e.g. "İncelemede"). */
  statusLabel?: ReactNode;
  status?: StageCardStatus;
  active?: boolean;
  /** Adds a `GlowPlatform` strip under the card. Already styled in CSS. */
  withPlatform?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

type AsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button";
    href?: never;
  };

type AsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "link";
    href: string;
  };

type AsDiv = CommonProps & {
  as: "div";
  href?: never;
};

export type StageCardProps = AsButton | AsLink | AsDiv;

function StageCardInner({
  variant = "poster",
  tone = "magenta",
  image,
  title,
  eyebrow,
  glyph,
  body,
  meta,
  statusLabel,
  status = "neutral",
  active = false,
  withPlatform = false,
  children,
}: CommonProps) {
  return (
    <>
      {variant === "poster" ? (
        <div
          className={
            "stage-card-cover" + (image ? " has-image" : "")
          }
          style={image ? { backgroundImage: `url(${image})` } : undefined}
          aria-hidden="true"
        >
          {!image ? (
            <span className="stage-card-cover-placeholder">✦</span>
          ) : null}
          <span className="stage-card-cover-fade" />
        </div>
      ) : null}

      <div className="stage-card-body">
        {variant !== "poster" && glyph ? (
          <span className="stage-card-glyph" aria-hidden="true">
            {glyph}
          </span>
        ) : null}

        {eyebrow ? (
          <p className="stage-card-eyebrow">{eyebrow}</p>
        ) : null}

        <h3 className="stage-card-title">{title}</h3>

        {body ? <p className="stage-card-body-text">{body}</p> : null}

        {meta ? <div className="stage-card-meta">{meta}</div> : null}

        {children}
      </div>

      {statusLabel ? (
        <span className={`stage-card-status status-${status}`}>
          {statusLabel}
        </span>
      ) : null}

      {withPlatform ? (
        <span className="stage-card-platform" aria-hidden="true" />
      ) : null}
    </>
  );
}

export default function StageCard(props: StageCardProps) {
  const cls = [
    "stage-card",
    `stage-card--${props.variant ?? "poster"}`,
    `stage-card--${props.tone ?? "magenta"}`,
    props.active ? "is-active" : "",
    props.status && props.status !== "neutral"
      ? `stage-card--status-${props.status}`
      : "",
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (props.as === "link") {
    const { as: _as, className: _c, style, href, children, ...rest } = props;
    return (
      <Link
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        href={href}
        className={cls}
        style={style}
      >
        <StageCardInner {...props}>{children}</StageCardInner>
      </Link>
    );
  }

  if (props.as === "div") {
    const { className: _c, style, children, ...rest } = props;
    return (
      <div className={cls} style={style}>
        <StageCardInner {...rest}>{children}</StageCardInner>
      </div>
    );
  }

  // default: button
  const { as: _as, className: _c, style, children, ...rest } = props;
  return (
    <button
      type="button"
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      className={cls}
      style={style}
    >
      <StageCardInner {...props}>{children}</StageCardInner>
    </button>
  );
}

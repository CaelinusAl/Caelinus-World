"use client";

/**
 * CinemaCTA — the "ENTER THE PLAYGROUND" / "START APPLICATION" button.
 * Wide tracking, oval shape, soft glow underneath. Renders as a button
 * or a link depending on whether `href` is supplied.
 *
 * Three visual variants:
 *   • "primary" — magenta gradient fill, dark text, glow shadow,
 *   • "ghost"   — transparent fill, glass border, parchment text,
 *   • "luminous"— full-width pill with a subtle moving sheen (used
 *                 sparingly: hero CTAs only).
 */

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import type { StageTone } from "./NebulaPortal";

export type CinemaCTAVariant = "primary" | "ghost" | "luminous";

type Common = {
  children: ReactNode;
  variant?: CinemaCTAVariant;
  tone?: StageTone;
  /** Trailing chevron / arrow / glyph (e.g. → ✦ ⌖). */
  trailingGlyph?: ReactNode;
  className?: string;
};

export type CinemaCTAProps = Common &
  (
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

export default function CinemaCTA(props: CinemaCTAProps) {
  const {
    children,
    variant = "primary",
    tone = "magenta",
    trailingGlyph,
    className,
    ...rest
  } = props;

  const cls = [
    "stage-cta",
    `stage-cta--${variant}`,
    `stage-cta--${tone}`,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="stage-cta-label">{children}</span>
      {trailingGlyph ? (
        <span className="stage-cta-glyph" aria-hidden="true">
          {trailingGlyph}
        </span>
      ) : null}
      <span className="stage-cta-glow" aria-hidden="true" />
    </>
  );

  if (props.href) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <Link {...anchorRest} href={href} className={cls}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      className={cls}
    >
      {content}
    </button>
  );
}

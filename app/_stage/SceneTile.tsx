"use client";

/**
 * SceneTile — small "Where to?" picker tile from the mockup. Used for
 * any compact image+label selection (Beach / Coffee / Night / Resort,
 * but also contact channels on the public atelier page where a hero
 * image is overkill).
 *
 * Renders as a button by default; pass `as="link"` to make it an
 * anchor. Aspect ratio is square by default (matches the mockup); for
 * the contact-row case use `aspect="wide"`.
 */

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import type { StageTone } from "./NebulaPortal";

export type SceneTileProps = {
  label: ReactNode;
  /** Cover image. Optional — without it we render a tinted gradient. */
  image?: string | null;
  /** Glyph rendered as the placeholder/badge when no image is set. */
  glyph?: ReactNode;
  tone?: StageTone;
  active?: boolean;
  /** "square" matches the mockup; "wide" works in contact / link rows. */
  aspect?: "square" | "wide";
  className?: string;
} & (
  | ({ as?: "button" } & ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ as: "link"; href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
);

export default function SceneTile(props: SceneTileProps) {
  const {
    label,
    image,
    glyph,
    tone = "magenta",
    active = false,
    aspect = "square",
    className,
    ...rest
  } = props;

  const cls = [
    "stage-scene-tile",
    `stage-scene-tile--${tone}`,
    `stage-scene-tile--${aspect}`,
    active ? "is-active" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span
        className={
          "stage-scene-tile-cover" + (image ? " has-image" : "")
        }
        style={image ? { backgroundImage: `url(${image})` } : undefined}
        aria-hidden="true"
      >
        {!image && glyph ? (
          <span className="stage-scene-tile-glyph">{glyph}</span>
        ) : null}
        <span className="stage-scene-tile-fade" />
      </span>
      <span className="stage-scene-tile-label">{label}</span>
    </>
  );

  if (props.as === "link") {
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

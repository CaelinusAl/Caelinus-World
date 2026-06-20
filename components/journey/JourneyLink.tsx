"use client";

/**
 * JourneyLink — next/link sarıcısı. İç (/ ile başlayan) ve düz sol-tıkları
 * yakalayıp JourneyProvider'ın renkli dalış geçişini tetikler. Modifier'lı
 * tıklar (Ctrl/Cmd/Shift/Alt, orta tık) ve dış/target linkler dokunulmadan
 * tarayıcıya bırakılır (yeni sekme vb. bozulmaz). SEO/erişilebilirlik için
 * altta gerçek bir <a href> kalır (next/link).
 */

import Link from "next/link";
import { type ComponentProps, type MouseEvent } from "react";
import { useJourney } from "./JourneyProvider";

type JourneyLinkProps = ComponentProps<typeof Link> & {
  /** Dalış veil'inin rengi (portalın dünyası). */
  color?: string;
};

export default function JourneyLink({
  href,
  color,
  onClick,
  ...rest
}: JourneyLinkProps) {
  const { travel } = useJourney();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    const target = (rest as { target?: string }).target;
    if (target && target !== "_self") return;

    const url = typeof href === "string" ? href : "";
    if (!url.startsWith("/")) return;

    e.preventDefault();
    travel(url, color);
  };

  return <Link href={href} onClick={handleClick} {...rest} />;
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { ELEMENT_TONE, ZODIAC_LABEL } from "@/lib/frequency";

/**
 * Compact "you are tuned in" badge that lives in TopBar.
 *
 * Reads the user's persisted frequency profile and offers a quick path
 * back to /onboarding (re-attune). When no profile exists, it renders
 * the inviting "Frekansını Bul" pill instead.
 */
export default function FrequencyBadge({ lang = "tr" }: { lang?: "tr" | "en" }) {
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);
  const hydrate = useProfileStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Avoid hydration mismatch — render nothing until we've hydrated.
  if (!hydrated) {
    return <span className="cae-freq-pill is-skeleton" aria-hidden="true" />;
  }

  if (!profile) {
    return (
      <Link href="/onboarding" className="cae-freq-pill is-cta">
        <span className="cae-freq-pill-symbol" aria-hidden="true">✦</span>
        <span className="cae-freq-pill-label">{lang === "tr" ? "Frekansını Bul" : "Find Your Frequency"}</span>
      </Link>
    );
  }

  const tone = ELEMENT_TONE[profile.element];

  return (
    <Link
      href="/onboarding"
      className="cae-freq-pill is-tuned"
      title={lang === "tr" ? "Yeniden akort ol" : "Re-attune"}
      style={{
        ["--freq-color" as string]: tone.color,
        ["--freq-glow" as string]: tone.glow,
      } as React.CSSProperties}
    >
      <span className="cae-freq-pill-symbol" aria-hidden="true">
        {ZODIAC_LABEL[profile.zodiac].symbol}
      </span>
      <span className="cae-freq-pill-hz">{profile.frequency} Hz</span>
    </Link>
  );
}

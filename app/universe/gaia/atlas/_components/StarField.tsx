"use client";

/**
 * StarField — Caelinus night sky behind everything.
 *
 * Procedurally generated stars with deterministic positions (seeded
 * by the `seed` prop so SSR + CSR match). Two layers: small still
 * stars + bigger twinkling stars.
 */

import { useMemo } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  d: number;
  twinkle: boolean;
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type StarFieldProps = {
  count?: number;
  seed?: number;
};

export default function StarField({ count = 220, seed = 8324 }: StarFieldProps) {
  const stars = useMemo<Star[]>(() => {
    const rng = mulberry32(seed);
    const result: Star[] = [];
    for (let i = 0; i < count; i++) {
      const r = 0.4 + rng() * 1.6;
      result.push({
        x: rng() * 100,
        y: rng() * 100,
        r,
        d: 2 + rng() * 6,
        twinkle: rng() > 0.55,
      });
    }
    return result;
  }, [count, seed]);

  return (
    <svg
      className="atlas-stars"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r * 0.05}
          className={s.twinkle ? "atlas-star atlas-star-twinkle" : "atlas-star"}
          style={{
            animationDuration: s.twinkle ? `${s.d}s` : undefined,
            animationDelay: s.twinkle ? `-${(i % 7) * 0.7}s` : undefined,
          }}
        />
      ))}
    </svg>
  );
}

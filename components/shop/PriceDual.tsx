"use client";

import { useEffect, useState } from "react";
import { FALLBACK_USD_TRY, formatTry, formatUsd } from "@/lib/pricing";

/** Sekme ömrü boyunca tek seferlik çekilen kur (her bileşen ayrı istek atmaz). */
let cachedRate: number | null = null;

function useUsdTry(): number {
  const [rate, setRate] = useState(cachedRate ?? FALLBACK_USD_TRY);

  useEffect(() => {
    if (cachedRate != null) return;
    let alive = true;
    fetch("/api/fx")
      .then((r) => r.json())
      .then((d: { usdTry?: number }) => {
        if (alive && typeof d?.usdTry === "number" && d.usdTry > 0) {
          cachedRate = d.usdTry;
          setRate(d.usdTry);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return rate;
}

type Props = {
  /** USD cinsinden tutar. */
  usd: number;
  className?: string;
};

/** "$120 · ₺4.080" — USD birincil, TL canlı kurla ikincil. */
export default function PriceDual({ usd, className }: Props) {
  const rate = useUsdTry();
  return (
    <span className={className}>
      {formatUsd(usd)}
      <span className="price-try"> · {formatTry(usd, rate)}</span>
    </span>
  );
}

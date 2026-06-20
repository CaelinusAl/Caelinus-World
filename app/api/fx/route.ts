import { NextResponse } from "next/server";
import { fetchUsdTry } from "@/lib/pricing";

/** Kuru saatte bir tazele; istemci PriceDual buradan okur. */
export const revalidate = 3600;

export async function GET() {
  const usdTry = await fetchUsdTry();
  return NextResponse.json(
    { usdTry },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}

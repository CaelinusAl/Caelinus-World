import { NextRequest, NextResponse } from "next/server";
import { productsExtended } from "@/data/products";
import { buildRecommendationPayload } from "@/lib/avatar-recommendations";
import type { AvatarConfig } from "@/types/avatar";
import { DEFAULT_AVATAR } from "@/types/avatar";

/**
 * POST { avatar?: AvatarConfig }
 * Rule-based fit scores for the full catalog (for apps / A-B tests later).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const avatar = (body?.avatar ?? DEFAULT_AVATAR) as AvatarConfig;
    const payload = buildRecommendationPayload(avatar, productsExtended);
    return NextResponse.json({ success: true, ...payload });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ARCHETYPES,
  SCENES,
  ZODIACS,
  type ArchetypeId,
  type SceneId,
  type ZodiacId,
} from "@/data/play-assets";
import type { PlayRenderRow } from "@/lib/supabase/types";

import GalleryBody, { type GalleryItem, type Filters } from "./GalleryBody";

export const metadata = {
  title: "Galeri · Caelinus Play",
  description:
    "Caelinus Play stüdyosunda canlanmış tanrıça sahneleri — herkesin yansıması, tek bir evrende.",
};

export const dynamic = "force-dynamic";

const ARCHETYPE_IDS = new Set<string>(ARCHETYPES.map((a) => a.id));
const ZODIAC_IDS = new Set<string>(ZODIACS.map((z) => z.id));
const SCENE_IDS = new Set<string>(SCENES.map((s) => s.id));

const PAGE_SIZE = 96;

function pickFilter<T extends string>(
  raw: string | string[] | undefined,
  allowed: Set<string>,
): T | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return allowed.has(v) ? (v as T) : null;
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const filters: Filters = {
    archetype: pickFilter<ArchetypeId>(params.archetype, ARCHETYPE_IDS),
    zodiac: pickFilter<ZodiacId>(params.zodiac, ZODIAC_IDS),
    scene: pickFilter<SceneId>(params.scene, SCENE_IDS),
  };

  let items: GalleryItem[] = [];
  let unavailable = false;

  try {
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("play_renders")
      .select("id, archetype, zodiac, scene, url, provider, created_at")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (filters.archetype) query = query.eq("archetype", filters.archetype);
    if (filters.zodiac) query = query.eq("zodiac", filters.zodiac);
    if (filters.scene) query = query.eq("scene", filters.scene);

    const { data } = await query;
    const rows = (data ?? []) as Pick<
      PlayRenderRow,
      "id" | "archetype" | "zodiac" | "scene" | "url" | "provider" | "created_at"
    >[];

    items = rows
      // Skip stub renders — they're SVG placeholders from dev sessions
      // and dilute the gallery's "this is a real image" promise.
      .filter((r) => r.provider !== "stub" && r.url)
      .map((r) => ({
        id: r.id,
        archetype: r.archetype,
        zodiac: r.zodiac,
        scene: r.scene,
        url: r.url,
        createdAt: r.created_at,
      }));
  } catch {
    // Service-role key not configured (typical in fresh dev). Render
    // an empty gallery + a hint so the page never 500s.
    unavailable = true;
  }

  return (
    <GalleryBody items={items} filters={filters} unavailable={unavailable} />
  );
}

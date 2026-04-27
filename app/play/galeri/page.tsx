import type { Metadata } from "next";

import JsonLd from "@/components/seo/JsonLd";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ARCHETYPES,
  SCENES,
  ZODIACS,
  type ArchetypeId,
  type SceneId,
  type ZodiacId,
} from "@/data/play-assets";
import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";
import { buildBreadcrumbList } from "@/lib/seo/jsonld";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlayLikeRow, PlayRenderRow } from "@/lib/supabase/types";

import GalleryBody, {
  type Filters,
  type GalleryItem,
  type GallerySort,
} from "./GalleryBody";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tr = locale === "tr";
  return {
    title: tr ? "Galeri · Caelinus Play" : "Gallery · Caelinus Play",
    description: tr
      ? "Caelinus Play stüdyosunda canlanmış tanrıça sahneleri — herkesin yansıması, tek bir evrende."
      : "Goddess scenes brought to life inside the Caelinus Play studio — everyone's reflection, one universe.",
    ...buildLocaleMetadata(locale, "/play/galeri"),
  };
}

export const dynamic = "force-dynamic";

const ARCHETYPE_IDS = new Set<string>(ARCHETYPES.map((a) => a.id));
const ZODIAC_IDS = new Set<string>(ZODIACS.map((z) => z.id));
const SCENE_IDS = new Set<string>(SCENES.map((s) => s.id));
const VALID_SORTS = new Set<GallerySort>(["recent", "popular", "random"]);

const PAGE_SIZE = 48;

function pickFilter<T extends string>(
  raw: string | string[] | undefined,
  allowed: Set<string>,
): T | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return allowed.has(v) ? (v as T) : null;
}

function pickSort(raw: string | string[] | undefined): GallerySort {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && VALID_SORTS.has(v as GallerySort)) return v as GallerySort;
  return "recent";
}

function pickPage(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(v ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 200); // cap so a stray query doesn't scan forever
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
  const sort = pickSort(params.sort);
  // Random shuffles results — pagination wouldn't be stable, so we
  // pin random to page 1 and hide the controls in the UI.
  const page = sort === "random" ? 1 : pickPage(params.page);

  let items: GalleryItem[] = [];
  let unavailable = false;
  let hasNext = false;
  let likedSet = new Set<string>();

  try {
    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("play_renders")
      .select(
        "id, archetype, zodiac, scene, url, provider, likes_count, created_at",
      );

    if (filters.archetype) query = query.eq("archetype", filters.archetype);
    if (filters.zodiac) query = query.eq("zodiac", filters.zodiac);
    if (filters.scene) query = query.eq("scene", filters.scene);

    if (sort === "popular") {
      query = query
        .order("likes_count", { ascending: false })
        .order("created_at", { ascending: false });
    } else if (sort === "random") {
      // PostgREST doesn't expose `order by random()` directly; we
      // approximate with a UUID order which is randomly distributed.
      // Cheap and good enough for "serendipity" feed.
      query = query.order("id", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Fetch one extra row so we can detect a next page without a count(*)
    const offset = (page - 1) * PAGE_SIZE;
    const { data } = await query.range(offset, offset + PAGE_SIZE);

    let rows = (data ?? []) as Pick<
      PlayRenderRow,
      | "id"
      | "archetype"
      | "zodiac"
      | "scene"
      | "url"
      | "provider"
      | "likes_count"
      | "created_at"
    >[];

    if (rows.length > PAGE_SIZE) {
      hasNext = true;
      rows = rows.slice(0, PAGE_SIZE);
    }

    // Skip stub renders — they're SVG placeholders from dev sessions
    // and dilute the gallery's "this is a real image" promise.
    items = rows
      .filter((r) => r.provider !== "stub" && r.url)
      .map((r) => ({
        id: r.id,
        archetype: r.archetype,
        zodiac: r.zodiac,
        scene: r.scene,
        url: r.url,
        likesCount: r.likes_count,
        createdAt: r.created_at,
      }));

    // Hydrate the "did I like this?" set for the signed-in viewer so
    // the heart icons paint in the correct state on first render.
    if (items.length > 0) {
      const userClient = await createSupabaseServerClient();
      const {
        data: { user },
      } = await userClient.auth.getUser();
      if (user) {
        const ids = items.map((i) => i.id);
        const likeRes = await userClient
          .from("play_likes")
          .select("render_id")
          .eq("user_id", user.id)
          .in("render_id", ids);
        const likes = (likeRes.data ?? []) as Pick<PlayLikeRow, "render_id">[];
        likedSet = new Set(likes.map((l) => l.render_id));
      }
    }
  } catch {
    // Service-role key not configured (typical in fresh dev). Render
    // an empty gallery + a hint so the page never 500s.
    unavailable = true;
  }

  const locale = await getLocale();
  const tr = locale === "tr";
  const crumbs = buildBreadcrumbList(locale, [
    { name: "Caelinus", path: "/" },
    { name: "Play", path: "/play" },
    { name: tr ? "Galeri" : "Gallery", path: "/play/galeri" },
  ]);

  return (
    <>
      <JsonLd nodes={crumbs} />
      <GalleryBody
        items={items}
        filters={filters}
        sort={sort}
        page={page}
        pageSize={PAGE_SIZE}
        hasNext={hasNext}
        likedIds={Array.from(likedSet)}
        unavailable={unavailable}
      />
    </>
  );
}

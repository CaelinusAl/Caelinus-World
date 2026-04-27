import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/i18n/locale";
import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";
import {
  buildBreadcrumbList,
  buildVisualArtwork,
} from "@/lib/seo/jsonld";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PlayLikeRow,
  PlayRenderRow,
  UserPlayLookRow,
} from "@/lib/supabase/types";

import LookView from "./LookView";

type LookSummary = Pick<
  UserPlayLookRow,
  "id" | "archetype" | "zodiac" | "scene" | "render_url" | "created_at" | "render_id"
>;

export const dynamic = "force-dynamic";

async function fetchLook(id: string): Promise<LookSummary | null> {
  // Public look pages bypass RLS via the service role — saved looks
  // aren't readable to anonymous users via the regular client.
  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return null;
  }
  const result = await admin
    .from("user_play_looks")
    .select("id, archetype, zodiac, scene, render_url, created_at, render_id")
    .eq("id", id)
    .maybeSingle();
  return (result.data as LookSummary | null) ?? null;
}

/**
 * Fetch the live like count for a render plus whether the current
 * viewer (if any) has already liked it. Both reads are cheap and run
 * in parallel where possible.
 */
async function fetchLikeState(renderId: string): Promise<{
  count: number;
  likedByMe: boolean;
}> {
  let count = 0;
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("play_renders")
      .select("likes_count")
      .eq("id", renderId)
      .maybeSingle();
    const row = data as Pick<PlayRenderRow, "likes_count"> | null;
    count = row?.likes_count ?? 0;
  } catch {
    // service-role unavailable in dev — likes feature degrades silently
  }

  let likedByMe = false;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("play_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("render_id", renderId)
        .maybeSingle();
      const row = data as Pick<PlayLikeRow, "id"> | null;
      likedByMe = !!row;
    }
  } catch {
    // anonymous viewer — keep likedByMe = false
  }

  return { count, likedByMe };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [locale, look] = await Promise.all([getLocale(), fetchLook(id)]);
  if (!look) return { title: "Caelinus · Play" };

  const tr = locale === "tr";
  const path = `/play/look/${look.id}`;
  const title = `${look.zodiac} · Caelinus Play`;
  const description = tr
    ? `Caelinus Play — ${look.archetype} ${look.zodiac} ${look.scene}.`
    : `Caelinus Play — ${look.archetype} ${look.zodiac} in ${look.scene}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: look.render_url,
          width: 768,
          height: 1024,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [look.render_url],
    },
    ...buildLocaleMetadata(locale, path),
  };
}

export default async function PlayLookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const look = await fetchLook(id);
  if (!look) notFound();

  const [locale, likeState] = await Promise.all([
    getLocale(),
    fetchLikeState(look.render_id),
  ]);

  // Share URL must be on the visitor's current locale host so the
  // recipient lands on the same language. `absoluteUrl` reads from
  // env hosts in production and falls back to localhost in dev.
  const path = `/play/look/${look.id}`;
  const shareUrl = absoluteUrl(locale, path);

  const tr = locale === "tr";
  const lookName = `${look.zodiac} · Caelinus Play`;
  const lookDescription = tr
    ? `Caelinus Play — ${look.archetype} ${look.zodiac} ${look.scene}.`
    : `Caelinus Play — ${look.archetype} ${look.zodiac} in ${look.scene}.`;

  const jsonLd = [
    buildVisualArtwork({
      locale,
      path,
      name: lookName,
      description: lookDescription,
      image: look.render_url,
      dateCreated: look.created_at,
    }),
    buildBreadcrumbList(locale, [
      { name: "Caelinus", path: "/" },
      { name: tr ? "Play" : "Play", path: "/play" },
      { name: tr ? "Galeri" : "Gallery", path: "/play/galeri" },
      { name: lookName, path },
    ]),
  ];

  return (
    <>
      <JsonLd nodes={jsonLd} />
      <LookView
        id={look.id}
        archetype={look.archetype}
        zodiac={look.zodiac}
        scene={look.scene}
        renderUrl={look.render_url}
        createdAt={look.created_at}
        shareUrl={shareUrl}
        renderId={look.render_id}
        initialLikes={likeState.count}
        initialLiked={likeState.likedByMe}
      />
    </>
  );
}

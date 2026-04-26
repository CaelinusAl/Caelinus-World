import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { clientEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserPlayLookRow } from "@/lib/supabase/types";

import LookView from "./LookView";

type LookSummary = Pick<
  UserPlayLookRow,
  "id" | "archetype" | "zodiac" | "scene" | "render_url" | "created_at"
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
    .select("id, archetype, zodiac, scene, render_url, created_at")
    .eq("id", id)
    .maybeSingle();
  return (result.data as LookSummary | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const look = await fetchLook(id);
  if (!look) return { title: "Caelinus · Play" };

  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const url = `${siteUrl}/play/look/${look.id}`;
  const title = `${look.zodiac} · Caelinus Play`;
  const description = `Caelinus Play — ${look.archetype} ${look.zodiac} ${look.scene}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
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

  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return (
    <LookView
      id={look.id}
      archetype={look.archetype}
      zodiac={look.zodiac}
      scene={look.scene}
      renderUrl={look.render_url}
      createdAt={look.created_at}
      shareUrl={`${siteUrl}/play/look/${look.id}`}
    />
  );
}

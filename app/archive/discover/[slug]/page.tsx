import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CodexDiscoveryExperience from "@/components/archive/book/CodexDiscoveryExperience";
import {
  listDiscoverySlugs,
  loadDiscoveryExperience,
} from "@/lib/codex/discovery-data";

export const dynamic = "force-static";

export function generateStaticParams() {
  return listDiscoverySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dossier = await loadDiscoveryExperience(slug);
  if (!dossier) return {};
  return {
    title: `${dossier.title} — CAELINUS CODEX`,
    description: dossier.subtitle,
    alternates: { canonical: `/archive/discover/${dossier.slug}` },
  };
}

export default async function DiscoveryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dossier = await loadDiscoveryExperience(slug);
  if (!dossier) notFound();
  return <CodexDiscoveryExperience dossier={dossier} />;
}

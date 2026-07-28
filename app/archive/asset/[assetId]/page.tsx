import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CodexMasterAssetExperience from "@/components/archive/book/CodexMasterAssetExperience";
import {
  listMasterAssetIds,
  loadMasterAssetExperience,
} from "@/lib/codex/discovery-data";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return (await listMasterAssetIds()).map((assetId) => ({ assetId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ assetId: string }>;
}): Promise<Metadata> {
  const { assetId } = await params;
  const asset = await loadMasterAssetExperience(assetId);
  if (!asset) return {};
  return {
    title: `${asset.title} — CAELINUS CODEX`,
    description: asset.subtitle || asset.description,
    alternates: { canonical: `/archive/asset/${asset.assetId}` },
  };
}

export default async function MasterAssetPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const asset = await loadMasterAssetExperience(assetId);
  if (!asset) notFound();
  return <CodexMasterAssetExperience asset={asset} />;
}

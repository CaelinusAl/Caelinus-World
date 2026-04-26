import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { plants, getPlant, getProducersForPlant, getRegion } from "@/data/gaia";
import { productsExtended } from "@/data/products";
import PlantDetailView from "./PlantDetailView";

export function generateStaticParams() {
  return plants.map((p) => ({ id: p.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const plant = getPlant(id);
  if (!plant) return { title: "Bitki bulunamadı" };

  return {
    title: `${plant.name.tr} — ${plant.frequency} Hz`,
    description: plant.poetic.tr,
    openGraph: {
      title: `${plant.name.tr} · Caelinus Gaia`,
      description: plant.poetic.tr,
      type: "article",
      images: [{ url: plant.image, alt: plant.name.tr }],
    },
  };
}

export default async function PlantDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const plant = getPlant(id);
  if (!plant) notFound();

  const producers = getProducersForPlant(plant.id);
  const region = getRegion(plant.region);
  const matchedProduct =
    plant.productMatchId
      ? productsExtended.find((p) => p.id === plant.productMatchId) ?? null
      : null;

  return (
    <PlantDetailView
      plant={plant}
      producers={producers}
      region={region ?? null}
      matchedProduct={matchedProduct}
    />
  );
}

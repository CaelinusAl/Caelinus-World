import { NextRequest, NextResponse } from "next/server";
import { productsExtended } from "@/data/products";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const zodiac = searchParams.get("zodiac");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const search = searchParams.get("q");

  let results = [...productsExtended];

  if (category && category !== "all") {
    results = results.filter((p) => p.category === category);
  }

  if (zodiac) {
    results = results.filter((p) => p.zodiac === zodiac);
  }

  if (minPrice) {
    const min = parseFloat(minPrice);
    results = results.filter((p) => p.numericPrice >= min);
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice);
    results = results.filter((p) => p.numericPrice <= max);
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.zodiac && p.zodiac.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({ products: results, total: results.length });
}

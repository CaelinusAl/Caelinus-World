import { NextRequest, NextResponse } from "next/server";
import type { ProductSize } from "@/types/play";
import { productsExtended } from "@/data/products";

type CartEntry = {
  productId: string;
  size: ProductSize;
  qty: number;
};

let memoryCart: CartEntry[] = [];

export async function GET() {
  const items = memoryCart.map((entry) => {
    const product = productsExtended.find((p) => p.id === entry.productId);
    return {
      ...entry,
      product: product ?? null,
      lineTotal: product ? product.numericPrice * entry.qty : 0,
    };
  });

  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  return NextResponse.json({ items, total, count: memoryCart.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, size, qty } = body as {
    productId: string;
    size: ProductSize;
    qty?: number;
  };

  if (!productId || !size) {
    return NextResponse.json(
      { error: "productId and size are required" },
      { status: 400 }
    );
  }

  const product = productsExtended.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const stockForSize = product.stock[size] ?? 0;
  const addQty = qty ?? 1;

  const existing = memoryCart.find(
    (c) => c.productId === productId && c.size === size
  );

  if (existing) {
    const newQty = existing.qty + addQty;
    if (newQty > stockForSize) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
    }
    existing.qty = newQty;
  } else {
    if (addQty > stockForSize) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
    }
    memoryCart.push({ productId, size, qty: addQty });
  }

  return NextResponse.json({ success: true, cart: memoryCart });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const productId = searchParams.get("productId");
  const size = searchParams.get("size");

  if (productId && size) {
    memoryCart = memoryCart.filter(
      (c) => !(c.productId === productId && c.size === size)
    );
  } else if (productId) {
    memoryCart = memoryCart.filter((c) => c.productId !== productId);
  } else {
    memoryCart = [];
  }

  return NextResponse.json({ success: true, cart: memoryCart });
}

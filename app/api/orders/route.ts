import { NextRequest, NextResponse } from "next/server";
import type { Order, OrderItem, OrderMetadata } from "@/types/play";

const memoryOrders: Order[] = [];

function generateId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function GET() {
  return NextResponse.json({ orders: memoryOrders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, address, paymentMethod, metadata } = body as {
    items: OrderItem[];
    address: Order["address"];
    paymentMethod: string;
    metadata?: OrderMetadata;
  };

  if (!items?.length || !address?.fullName || !address?.city) {
    return NextResponse.json(
      { error: "items, address.fullName, and address.city are required" },
      { status: 400 }
    );
  }

  const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  const order: Order = {
    id: generateId(),
    items,
    total,
    address,
    paymentMethod: paymentMethod || "mock",
    status: "confirmed",
    createdAt: new Date().toISOString(),
    metadata,
  };

  memoryOrders.push(order);

  return NextResponse.json({ success: true, order }, { status: 201 });
}

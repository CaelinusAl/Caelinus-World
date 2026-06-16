import { NextRequest, NextResponse } from "next/server";
import type { Order, OrderItem, OrderMetadata } from "@/types/play";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const memoryOrders: Order[] = [];

function generateId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/**
 * Yumuşak lansman: gerçek tahsilat yok. Gelen talep bir "ön sipariş"tir.
 * Talebi durable saklamak için Supabase `preorders` tablosuna service-role
 * ile yazmaya çalışırız (RLS bypass). Tablo henüz oluşturulmadıysa veya
 * service key yoksa, kullanıcı akışını bozmamak için sessizce geçeriz —
 * sipariş yine de bellekte tutulur ve onay ekranı gösterilir.
 *
 * Durable saklama için: supabase/migrations/0017_preorders.sql uygulanmalı
 * ve SUPABASE_SERVICE_ROLE_KEY tanımlı olmalı.
 */
async function persistPreorder(payload: {
  email: string;
  fullName?: string;
  phone?: string;
  items: OrderItem[];
  address: Order["address"];
  total: number;
}): Promise<boolean> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      // `preorders` henüz generated types'ta yok; güvenli cast.
      .from("preorders" as never)
      .insert({
        email: payload.email,
        full_name: payload.fullName ?? null,
        phone: payload.phone ?? null,
        items: payload.items,
        address: payload.address,
        total_amount: Math.round(payload.total * 100),
        currency: "USD",
        source: "shop",
      } as never);
    if (error) {
      console.warn("[preorders] persist failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[preorders] persist skipped:", (err as Error).message);
    return false;
  }
}

export async function GET() {
  return NextResponse.json({ orders: memoryOrders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, address, paymentMethod, metadata, email } = body as {
    items: OrderItem[];
    address: Order["address"];
    paymentMethod?: string;
    metadata?: OrderMetadata;
    email?: string;
  };

  if (!items?.length || !address?.fullName || !email) {
    return NextResponse.json(
      { error: "items, address.fullName, and email are required" },
      { status: 400 }
    );
  }

  const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  const order: Order = {
    id: generateId(),
    items,
    total,
    address,
    paymentMethod: paymentMethod || "preorder",
    status: "confirmed",
    createdAt: new Date().toISOString(),
    metadata,
  };

  memoryOrders.push(order);

  const persisted = await persistPreorder({
    email,
    fullName: address.fullName,
    phone: (address as { phone?: string }).phone,
    items,
    address,
    total,
  });

  return NextResponse.json({ success: true, order, persisted }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import type { Order, OrderItem, OrderMetadata } from "@/types/play";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail, getSiteUrl } from "@/lib/email/sender";
import { preorderReceivedEmail } from "@/lib/email/templates/preorder-received";
import { COMPANY } from "@/lib/company";
import { requireAdmin } from "@/lib/atelier/admin";

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

/**
 * Ön sipariş bildirimleri — best-effort. Müşteriye onay, ekibe haber.
 * RESEND_API_KEY yoksa sender konsola düşer (UX kırılmaz).
 */
async function notifyPreorder(payload: {
  email: string;
  fullName?: string;
  phone?: string;
  items: OrderItem[];
  total: number;
  orderId: string;
}): Promise<void> {
  const siteUrl = getSiteUrl();
  const name = payload.fullName?.trim() || "Caelinus dostu";
  const lines = payload.items.map((i) => ({
    name: i.name,
    size: i.size,
    qty: i.qty,
  }));

  try {
    const mail = preorderReceivedEmail({
      buyerName: name,
      orderId: payload.orderId,
      items: lines,
      locale: "tr",
      siteUrl,
    });
    await sendEmail({
      to: payload.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: COMPANY.email,
    });
  } catch (err) {
    console.warn("[preorder] customer mail skipped:", (err as Error).message);
  }

  try {
    const summary = payload.items
      .map((i) => `· ${i.name}${i.size ? ` (${i.size})` : ""} × ${i.qty}`)
      .join("\n");
    await sendEmail({
      to: COMPANY.email,
      subject: `Yeni ön sipariş · ${payload.orderId}`,
      html: `<pre style="font:14px/1.6 monospace">Yeni ön sipariş\n\nAd: ${payload.fullName ?? "-"}\nE-posta: ${payload.email}\nTelefon: ${payload.phone ?? "-"}\nToplam: $${payload.total}\n\n${summary}</pre>`,
      text: `Yeni ön sipariş\n\nAd: ${payload.fullName ?? "-"}\nE-posta: ${payload.email}\nTelefon: ${payload.phone ?? "-"}\nToplam: $${payload.total}\n\n${summary}`,
      replyTo: payload.email,
    });
  } catch (err) {
    console.warn("[preorder] team mail skipped:", (err as Error).message);
  }
}

/**
 * Sipariş listesi — PII içerir (ad, e-posta, telefon, adres). Yalnızca
 * Caelinus admin'leri erişebilir. Auth yoksa/yetkisizse 403.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }
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

  const phone = (address as { phone?: string }).phone;

  const persisted = await persistPreorder({
    email,
    fullName: address.fullName,
    phone,
    items,
    address,
    total,
  });

  await notifyPreorder({
    email,
    fullName: address.fullName,
    phone,
    items,
    total,
    orderId: order.id,
  });

  return NextResponse.json({ success: true, order, persisted }, { status: 201 });
}

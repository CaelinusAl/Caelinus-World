"use client";

/**
 * DistrictAIChat — District Engine · paylaşılan AI sohbet motoru.
 *
 * Gaia AI ("Toprak Hafızası") ve Fashion AI ("Frekans Stilisti") sayfaları
 * birebir aynı sohbet yaşam döngüsünü (useChat v6 + akış durumu + mesaj
 * görünüm eşlemesi) ve aynı sayfa iskeletini paylaşıyordu. Bu motor o ortak
 * çekirdeği tek yerde toplar; district'e özgü her şey (görsel sınıf öneki,
 * arka plan katmanları, hero metni, yan araçlar, koleksiyon bölümleri)
 * slot/render-prop olarak dışarıdan verilir → CSS ve görseller %100 korunur.
 *
 * AI rotası registry'den `resolveAssistant(getDistrict(...))` ile gelir;
 * böylece hangi district'in hangi backend'e (caelinus stream / sanri) gittiği
 * tek doğru kaynaktan (lib/district/registry.ts) yönetilir.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

/** Birleşik sohbet mesajı görünümü — Gaia/Fashion chat bileşenleriyle uyumlu. */
export type ChatMessageView = {
  id: string;
  role: string;
  parts?: { type: string; text?: string }[];
};

/** Sohbet sütununu render etmek için motorun verdiği bağlam. */
export type ChatRenderArgs = {
  messages: ChatMessageView[];
  busy: boolean;
  submitted: boolean;
  hasError: boolean;
  onSend: (text: string) => void;
};

/** Yan araç / bölüm slotları `onSend`'e ihtiyaç duyar (motorun içinde yaşar). */
type SendSlot = (onSend: (text: string) => void) => ReactNode;

type Props = {
  /** Görsel sınıf öneki: "gaia-ai" | "moda-ai" — mevcut CSS korunur. */
  classPrefix: string;
  /** İstek atılacak API rotası (resolveAssistant(...).route). */
  apiRoute: string;
  /** Arka plan dekor katmanları (district'e özgü). */
  backdrop?: ReactNode;
  hero: { kicker: string; title: string; lede: string };
  /** Sohbet sütunu (GaiaAIChat / FashionAIChat) — motordan akış durumu alır. */
  renderChat: (args: ChatRenderArgs) => ReactNode;
  /** Sağ kolon yan araçları. */
  renderAside?: SendSlot;
  /** Sohbet ızgarasının altındaki ek bölümler (koleksiyon, tanrıça vb.). */
  renderSections?: SendSlot;
  foot: { backHref: string; backLabel: string; whisper: string };
};

export default function DistrictAIChat({
  classPrefix,
  apiRoute,
  backdrop,
  hero,
  renderChat,
  renderAside,
  renderSections,
  foot,
}: Props) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: apiRoute }),
  });

  const busy = status === "submitted" || status === "streaming";
  const onSend = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
  };

  const view: ChatMessageView[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: m.parts.map((p) => ({
      type: p.type,
      text: "text" in p ? (p as { text?: string }).text : undefined,
    })),
  }));

  const chatArgs: ChatRenderArgs = {
    messages: view,
    busy,
    submitted: status === "submitted",
    hasError: Boolean(error),
    onSend,
  };

  return (
    <main className={`${classPrefix}-page`}>
      {backdrop}

      <div className={`${classPrefix}-shell`}>
        <header className={`${classPrefix}-hero`}>
          <p className={`${classPrefix}-kicker`}>{hero.kicker}</p>
          <h1 className={`${classPrefix}-title`}>{hero.title}</h1>
          <p className={`${classPrefix}-lede`}>{hero.lede}</p>
        </header>

        <section className={`${classPrefix}-grid`}>
          <div className={`${classPrefix}-main`}>{renderChat(chatArgs)}</div>
          {renderAside && (
            <aside className={`${classPrefix}-aside`}>{renderAside(onSend)}</aside>
          )}
        </section>

        {renderSections?.(onSend)}

        <div className={`${classPrefix}-foot`}>
          <Link href={foot.backHref} className={`${classPrefix}-back`}>
            ← {foot.backLabel}
          </Link>
          <span className={`${classPrefix}-whisper`}>{foot.whisper}</span>
        </div>
      </div>
    </main>
  );
}

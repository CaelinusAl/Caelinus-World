"use client";

/**
 * FashionAIChat — CAELINUS MODA AI sohbet arayüzü (sunum bileşeni).
 *
 * `useChat` durumu sayfada (client) tutulur; bu bileşen yalnızca
 * transkript + öneri çipleri + giriş alanını render eder ve metni
 * `onSend` ile yukarı verir. Böylece burç danışmanı / tanrıça seçici
 * gibi yan bileşenler de aynı `onSend` ile sohbete soru gönderebilir.
 */

import { useState, useRef, useEffect, type FormEvent } from "react";

export type FashionMessageView = {
  id: string;
  role: string;
  parts?: { type: string; text?: string }[];
};

const SUGGESTIONS: { label: string; prompt: string }[] = [
  {
    label: "✨ Bugün ne giymeliyim?",
    prompt: "Bugün enerjim biraz dağınık ama güçlü hissetmek istiyorum. Bana nasıl bir stil ve parça önerirsin?",
  },
  {
    label: "♊ Burcuma göre stil",
    prompt: "İkizler burcuyum. Bana frekansıma uygun bir Caelinus kombini öner.",
  },
  {
    label: "🌙 Tanrıça arketipim",
    prompt: "Sakin, gizemli ve gece enerjili biriyim. Hangi tanrıça arketipi bana uyar ve nasıl giyinmeliyim?",
  },
];

function messageText(parts: FashionMessageView["parts"]): string {
  if (!parts) return "";
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

type Props = {
  messages: FashionMessageView[];
  busy: boolean;
  submitted: boolean;
  hasError: boolean;
  onSend: (text: string) => void;
};

export default function FashionAIChat({ messages, busy, submitted, hasError, onSend }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    onSend(text);
    setInput("");
  }

  const empty = messages.length === 0;

  return (
    <div className="moda-ai-chat">
      <div className="moda-ai-scroll" ref={scrollRef}>
        {empty ? (
          <div className="moda-ai-welcome">
            <div className="moda-ai-welcome-glyph" aria-hidden="true">
              ◈
            </div>
            <p className="moda-ai-welcome-title">Aynaya hoş geldin.</p>
            <p className="moda-ai-welcome-sub">
              Frekansını söyle, hissini anlat. Sana sadece bir parça değil, bir
              kimlik gibi stil öneririm — burcuna, enerjine ve o günkü hâline göre.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`moda-msg moda-msg--${m.role === "user" ? "user" : "stylist"}`}
            >
              {m.role !== "user" && (
                <span className="moda-msg-avatar" aria-hidden="true">
                  ◈
                </span>
              )}
              <div className="moda-msg-bubble">{messageText(m.parts)}</div>
            </div>
          ))
        )}

        {submitted && (
          <div className="moda-msg moda-msg--stylist">
            <span className="moda-msg-avatar" aria-hidden="true">
              ◈
            </span>
            <div className="moda-msg-bubble moda-msg-typing">
              <span /> <span /> <span />
            </div>
          </div>
        )}

        {hasError && (
          <div className="moda-ai-error" role="alert">
            Ayna şu an puslandı — birazdan tekrar dene.
          </div>
        )}
      </div>

      <div className="moda-ai-suggestions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            className="moda-ai-chip"
            onClick={() => !busy && onSend(s.prompt)}
            disabled={busy}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form className="moda-ai-form" onSubmit={submit}>
        <input
          className="moda-ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Frekansını, burcunu, aradığın hissi söyle…"
          aria-label="Moda AI'ya sorunuzu yazın"
          disabled={busy}
        />
        <button type="submit" className="moda-ai-send" disabled={busy || !input.trim()}>
          {busy ? "…" : "Giydir"}
        </button>
      </form>
    </div>
  );
}

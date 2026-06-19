"use client";

/**
 * GaiaAIChat — CAELINUS GAIA AI sohbet arayüzü (sunum bileşeni).
 *
 * `useChat` durumu sayfada (client) tutulur; bu bileşen yalnızca
 * transkript + öneri çipleri + giriş alanını render eder ve metni
 * `onSend` ile yukarı verir. Böylece teşhis kartı / oracle kartı gibi
 * yan bileşenler de aynı `onSend` ile sohbete soru gönderebilir.
 */

import { useState, useRef, useEffect, type FormEvent } from "react";

export type ChatMessageView = {
  id: string;
  role: string;
  parts?: { type: string; text?: string }[];
};

const SUGGESTIONS: { label: string; prompt: string }[] = [
  {
    label: "🌱 Bitkini Sor",
    prompt: "Balkonumdaki fesleğenin yaprakları sararıyor, ne olabilir?",
  },
  {
    label: "🪨 Toprağını Oku",
    prompt: "Killi, ağır bir toprağım var. Hangi sebzeler buna uygun olur?",
  },
  {
    label: "🌙 Ekim Zamanını Bul",
    prompt: "Domatesi ay döngüsüne göre ne zaman ekmeliyim?",
  },
];

function messageText(parts: ChatMessageView["parts"]): string {
  if (!parts) return "";
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

type Props = {
  messages: ChatMessageView[];
  busy: boolean;
  submitted: boolean;
  hasError: boolean;
  onSend: (text: string) => void;
};

export default function GaiaAIChat({ messages, busy, submitted, hasError, onSend }: Props) {
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
    <div className="gaia-ai-chat">
      <div className="gaia-ai-scroll" ref={scrollRef}>
        {empty ? (
          <div className="gaia-ai-welcome">
            <div className="gaia-ai-welcome-glyph" aria-hidden="true">
              ❦
            </div>
            <p className="gaia-ai-welcome-title">Toprağın hafızasına hoş geldin.</p>
            <p className="gaia-ai-welcome-sub">
              Bir bitki, tohum, toprak veya iklim sorusu sor. Sana sezgisel ve
              pratik bir rehber gibi yanıt vereyim.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`gaia-msg gaia-msg--${m.role === "user" ? "user" : "oracle"}`}
            >
              {m.role !== "user" && (
                <span className="gaia-msg-avatar" aria-hidden="true">
                  ❦
                </span>
              )}
              <div className="gaia-msg-bubble">{messageText(m.parts)}</div>
            </div>
          ))
        )}

        {submitted && (
          <div className="gaia-msg gaia-msg--oracle">
            <span className="gaia-msg-avatar" aria-hidden="true">
              ❦
            </span>
            <div className="gaia-msg-bubble gaia-msg-typing">
              <span /> <span /> <span />
            </div>
          </div>
        )}

        {hasError && (
          <div className="gaia-ai-error" role="alert">
            Toprak şu an sessiz — birazdan tekrar dene.
          </div>
        )}
      </div>

      <div className="gaia-ai-suggestions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            className="gaia-ai-chip"
            onClick={() => !busy && onSend(s.prompt)}
            disabled={busy}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form className="gaia-ai-form" onSubmit={submit}>
        <input
          className="gaia-ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bitkini, toprağını, ekim zamanını sor…"
          aria-label="Gaia AI'ya sorunuzu yazın"
          disabled={busy}
        />
        <button type="submit" className="gaia-ai-send" disabled={busy || !input.trim()}>
          {busy ? "…" : "Sor"}
        </button>
      </form>
    </div>
  );
}

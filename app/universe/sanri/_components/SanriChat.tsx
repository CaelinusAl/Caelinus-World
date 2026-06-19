"use client";

/**
 * SanriChat — "Sanrı'ya Sor" bilinç aynası sohbeti.
 *
 * Sanri FastAPI `/bilinc-alani/ask` ucu tam JSON döndürdüğü için (AI-SDK
 * stream değil), hafif özel bir sohbet istemcisi kullanırız. Kimlik proxy'de
 * X-User-Id ile taşınır.
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { askSanri, askText } from "@/lib/sanri/client";

type Msg = { id: string; role: "user" | "oracle"; text: string };

const SUGGESTIONS = [
  "Bugün içimde bir sıkışma var, neyi görmem gerekiyor?",
  "Tekrar eden bir düşünce döngüsündeyim, bana ayna tut.",
  "Bir karar eşiğindeyim; iki yolun frekansını oku.",
];

export default function SanriChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setError(false);
    setBusy(true);
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    try {
      const res = await askSanri({ message: trimmed });
      const answer = askText(res) || "…";
      setMessages((m) => [...m, { id: `o-${Date.now()}`, role: "oracle", text: answer }]);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  const empty = messages.length === 0;

  return (
    <div className="sanri-chat">
      <div className="sanri-scroll" ref={scrollRef}>
        {empty ? (
          <div className="sanri-welcome">
            <div className="sanri-welcome-glyph" aria-hidden="true">🪞</div>
            <p className="sanri-welcome-title">Aynaya hoş geldin.</p>
            <p className="sanri-welcome-sub">
              Bir soru, bir sıkışma, bir eşik anlat. Sana yargı değil, ayna tutarım.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`sanri-msg sanri-msg--${m.role}`}>
              {m.role === "oracle" && (
                <span className="sanri-msg-avatar" aria-hidden="true">🪞</span>
              )}
              <div className="sanri-msg-bubble">{m.text}</div>
            </div>
          ))
        )}

        {busy && (
          <div className="sanri-msg sanri-msg--oracle">
            <span className="sanri-msg-avatar" aria-hidden="true">🪞</span>
            <div className="sanri-msg-bubble sanri-msg-typing">
              <span /> <span /> <span />
            </div>
          </div>
        )}

        {error && (
          <div className="sanri-error" role="alert">
            Ayna şu an puslandı — birazdan tekrar dene.
          </div>
        )}
      </div>

      <div className="sanri-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="sanri-chip" onClick={() => void send(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>

      <form className="sanri-form" onSubmit={onSubmit}>
        <input
          className="sanri-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Aynaya sor…"
          aria-label="Sanrı'ya sorunuzu yazın"
          disabled={busy}
        />
        <button type="submit" className="sanri-send" disabled={busy || !input.trim()}>
          {busy ? "…" : "Sor"}
        </button>
      </form>
    </div>
  );
}

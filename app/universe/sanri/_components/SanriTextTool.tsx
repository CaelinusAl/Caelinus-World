"use client";

/**
 * SanriTextTool — metin gir → Sanri yorumu al (genel araç).
 * Rüya yorumu ve sembol analizi gibi "metin → yorum" akışlarında kullanılır.
 */

import { useState, type FormEvent } from "react";

type Props = {
  placeholder: string;
  cta: string;
  run: (text: string) => Promise<string>;
};

export default function SanriTextTool({ placeholder, cta, run }: Props) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(false);
    setResult(null);
    try {
      setResult(await run(trimmed));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="sanri-tool" onSubmit={onSubmit}>
      <textarea
        className="sanri-tool-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={4}
        disabled={busy}
      />
      <button type="submit" className="sanri-send" disabled={busy || !text.trim()}>
        {busy ? "Aynada okunuyor…" : cta}
      </button>

      {error && (
        <p className="sanri-error" role="alert">
          Ayna şu an puslandı — birazdan tekrar dene.
        </p>
      )}
      {result && <div className="sanri-tool-result">{result}</div>}
    </form>
  );
}

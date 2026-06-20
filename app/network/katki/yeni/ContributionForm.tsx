"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createContribution } from "@/lib/contributions/actions";
import {
  CONTRIBUTION_KINDS,
  CONTRIBUTION_KIND_META,
  type ContributionKind,
} from "@/lib/contributions/types";

import styles from "../../network.module.css";

export default function ContributionForm({
  authorHandle,
}: {
  authorHandle: string;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<ContributionKind>("lore");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = CONTRIBUTION_KIND_META[kind];

  async function submit() {
    setError(null);
    if (!title.trim()) {
      setError("Bir başlık gir.");
      return;
    }
    setBusy(true);
    const res = await createContribution({
      kind,
      title,
      body: meta.needsBody || body.trim() ? body : null,
      mediaUrl: meta.needsMedia || mediaUrl.trim() ? mediaUrl : null,
      code: code ? Number(code) : null,
    });
    setBusy(false);
    if (res.ok) {
      router.push(`/katki/${res.data.id}`);
    } else {
      setError(res.error);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.formWrap}>
        <header className={styles.hero} style={{ marginBottom: 30 }}>
          <div className={styles.kicker}>✦ Dünyaya dokun ✦</div>
          <h1 className={styles.title} style={{ fontSize: "clamp(28px,5vw,46px)" }}>
            Katkı ekle
          </h1>
          <p className={styles.subtitle}>
            @{authorHandle} olarak ekliyorsun. Katkın “topluluk” katmanında
            yayımlanır; küratör sonradan kanona taşıyabilir.
          </p>
        </header>

        <div className={styles.formCard}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Tür</label>
            <div className={styles.kindRow}>
              {CONTRIBUTION_KINDS.map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  className={`${styles.kindBtn} ${kind === k ? styles.kindBtnOn : ""}`}
                >
                  <span className={styles.kindGlyph}>
                    {CONTRIBUTION_KIND_META[k].glyph}
                  </span>
                  {CONTRIBUTION_KIND_META[k].tr}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Başlık</label>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                kind === "verse" ? "Dizenin adı / ilk mısra" : "Kısa bir başlık"
              }
              maxLength={160}
            />
          </div>

          {meta.needsMedia && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Görsel bağlantısı</label>
              <input
                className={styles.input}
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://…"
                inputMode="url"
              />
              <p className={styles.hint}>
                Görselin herkese açık bir URL’si (şimdilik bağlantıyla).
              </p>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              {kind === "visual" ? "Açıklama (opsiyonel)" : "Metin"}
            </label>
            <textarea
              className={styles.textarea}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={kind === "verse" ? 6 : 8}
              placeholder={
                kind === "verse"
                  ? "Dinle neyden…"
                  : "Bu koda dokunan hikâyeni, lore’unu ya da notunu yaz."
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>SANRI kodu (opsiyonel)</label>
            <input
              className={styles.input}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
              }
              placeholder="1–81 · örn. 42 (Konya · Dönüş)"
              inputMode="numeric"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="button"
            className={styles.btnPrimary}
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            disabled={busy}
            onClick={submit}
          >
            {busy ? "Yayımlanıyor…" : "Yayımla"}
          </button>

          <Link href="/network/akis" className={styles.backLink}>
            ← Akışa dön
          </Link>
        </div>
      </div>
    </main>
  );
}

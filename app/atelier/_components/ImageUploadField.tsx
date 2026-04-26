"use client";

/**
 * CAELINUS — ImageUploadField
 *
 * Drop-in form field that uploads a single image straight to the
 * `atelier-images` Supabase Storage bucket and returns its public URL.
 *
 * Path convention (matches `supabase/migrations/0004_storage.sql`):
 *
 *   atelier-images/{atelier_id}/{slot}-{timestamp}.{ext}
 *
 * The first folder segment is the atelier id — that's what the bucket's
 * RLS policy reads with `storage.foldername(name)[1]` to confirm the
 * uploader owns the atelier. So we never accept an arbitrary atelier id
 * from the user; it must be passed in from a parent that already
 * validated ownership server-side.
 */

import { useId, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — matches bucket file_size_limit

type Props = {
  /** Owning atelier's UUID — top-level folder in storage. */
  atelierId: string;
  /** Logical slot, used as a filename prefix (e.g. "cover", "avatar"). */
  slot: "cover" | "avatar" | (string & {});
  /** Currently saved URL (optional). */
  value: string | null;
  /** Called with the new public URL once upload + commit are done. */
  onChange: (url: string | null) => void;
  /** Field label, already localised by the caller. */
  label: string;
  /** Helper line under the field. */
  hint?: string;
  /** Aspect-ratio class — mostly cosmetic. "wide" for cover, "square" for avatar. */
  shape?: "wide" | "square";
  /** Disable while a parent is mid-save. */
  disabled?: boolean;
};

function fileExtension(file: File): string {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  // Fallback: take from filename, strip query params.
  const m = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  return m ? m[1].toLowerCase() : "bin";
}

export default function ImageUploadField({
  atelierId,
  slot,
  value,
  onChange,
  label,
  hint,
  shape = "wide",
  disabled,
}: Props) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Sadece JPG, PNG, WEBP veya AVIF kabul ediliyor.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `Dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)} MB). En fazla 10 MB olabilir.`,
      );
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = fileExtension(file);
      // `Date.now()` is enough collision protection for a single
      // owner — the RLS policy already scopes writes to this folder.
      const path = `${atelierId}/${slot}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("atelier-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (upErr) {
        setError(upErr.message);
        return;
      }

      const { data } = supabase.storage
        .from("atelier-images")
        .getPublicUrl(path);

      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız oldu.");
    } finally {
      setBusy(false);
      // Allow re-uploading the same file: input keeps the previous
      // selection otherwise, so `change` doesn't fire again.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const previewClass =
    "atelier-upload-preview" +
    (shape === "square" ? " is-square" : " is-wide") +
    (value ? " has-image" : "");

  return (
    <div className="atelier-field atelier-upload">
      <span className="atelier-field-label" id={`${fieldId}-label`}>
        {label}
      </span>

      <div
        className={previewClass}
        style={value ? { backgroundImage: `url(${value})` } : undefined}
        aria-labelledby={`${fieldId}-label`}
        role="img"
      >
        {!value ? (
          <span className="atelier-upload-empty" aria-hidden="true">
            ◇
          </span>
        ) : null}
      </div>

      <div className="atelier-upload-actions">
        <label
          className={
            "atelier-btn atelier-btn-ghost" + (busy || disabled ? " is-disabled" : "")
          }
          htmlFor={fieldId}
        >
          {busy ? "Yükleniyor…" : value ? "Değiştir" : "Görsel yükle"}
        </label>
        <input
          ref={inputRef}
          id={fieldId}
          type="file"
          accept={ACCEPTED.join(",")}
          className="atelier-upload-input"
          disabled={busy || disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePick(file);
          }}
        />
        {value ? (
          <button
            type="button"
            className="atelier-link"
            onClick={() => onChange(null)}
            disabled={busy || disabled}
          >
            Kaldır
          </button>
        ) : null}
      </div>

      {hint ? <p className="atelier-field-hint">{hint}</p> : null}
      {error ? <p className="atelier-field-error">{error}</p> : null}
    </div>
  );
}

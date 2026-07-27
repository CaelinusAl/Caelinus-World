"use client";

import { useMemo, useState } from "react";

import type { ArchiveImageSummary } from "@/lib/codex/experience-contract";

type ImageVaultViewerProps = {
  images: ArchiveImageSummary[];
};

export default function ImageVaultViewer({ images }: ImageVaultViewerProps) {
  const [query, setQuery] = useState("");
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const filtered = useMemo(() => {
    const needle = query.toLocaleLowerCase("tr").trim();
    if (!needle) return images;
    return images.filter((image) =>
      `${image.assetId} ${image.file} ${image.title ?? ""}`
        .toLocaleLowerCase("tr")
        .includes(needle));
  }, [images, query]);

  return (
    <section className="image-vault" aria-labelledby="image-vault-title">
      <header>
        <div>
          <p className="archive-kicker">132 VISUAL MEMORY SLOTS</p>
          <h2 id="image-vault-title">Image Vault</h2>
          <p>Her görsel Production Bible’ın bir sayfasıdır.</p>
        </div>
        <label>
          <span className="sr-only">Görsel ara</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Asset ID veya dosya ara"
          />
        </label>
      </header>

      <p className="image-vault__count" aria-live="polite">
        {filtered.length} / {images.length} görsel
      </p>

      <div className="image-vault__grid">
        {filtered.map((image) => {
          const unavailable = failed.has(image.assetId);
          return (
            <article key={image.assetId}>
              <div className="image-vault__frame">
                {!unavailable ? (
                  // The local archive is intentionally served through a guarded
                  // Route Handler; it is not copied into public/.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/archive/asset/${image.assetId}`}
                    alt={image.title ?? `${image.assetId} konsept görseli`}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed((current) => new Set(current).add(image.assetId))}
                  />
                ) : (
                  <div className="image-vault__unavailable">
                    <span aria-hidden="true">◇</span>
                    <p>Görsel bu ortamda bağlı değil</p>
                    <small>CODEX_ASSET_DIR</small>
                  </div>
                )}
                <span>{image.status}</span>
              </div>
              <div>
                <small>{image.assetId}</small>
                <h3>{image.title ?? image.file.replace(/\.[^.]+$/, "")}</h3>
                <p>{(image.bytes / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

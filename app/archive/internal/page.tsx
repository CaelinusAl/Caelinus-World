import type { Metadata } from "next";

import ImageVaultViewer from "@/components/archive/ImageVaultViewer";
import { loadArchiveBootstrap } from "@/lib/codex/archive-data";

import "../archive.css";

export const metadata: Metadata = {
  title: "Codex Archivist Vault",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default async function InternalArchivePage() {
  const archive = await loadArchiveBootstrap();
  return (
    <main className="archive-experience is-vault">
      <ImageVaultViewer images={archive.images} />
    </main>
  );
}

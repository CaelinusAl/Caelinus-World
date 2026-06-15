import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPublicContribution } from "@/lib/contributions/server";
import { CONTRIBUTION_KIND_META } from "@/lib/contributions/types";

import styles from "../../network/network.module.css";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = await getPublicContribution(id);
  if (!c) return { title: "Katkı bulunamadı" };
  return {
    title: c.title,
    description: c.body?.slice(0, 150) ?? `${CONTRIBUTION_KIND_META[c.kind].tr} · Caelinus`,
  };
}

export default async function ContributionDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const c = await getPublicContribution(id);
  if (!c) notFound();

  const meta = CONTRIBUTION_KIND_META[c.kind];
  const isVerse = c.kind === "verse";

  return (
    <main className={styles.page}>
      <article className={styles.detail}>
        <div className={styles.contribTop}>
          <span className={styles.kindTag}>
            <span>{meta.glyph}</span> {meta.tr}
          </span>
          {typeof c.code === "number" && (
            <span className={styles.codeTag}>Kod {c.code}</span>
          )}
          {c.tier === "canon" && <span className={styles.canonTag}>Kanon</span>}
        </div>

        <h1
          className={styles.title}
          style={{ fontSize: "clamp(28px,5vw,48px)", textAlign: "left", marginTop: 14 }}
        >
          {c.title}
        </h1>

        <div className={styles.contribAuthor} style={{ marginTop: 6 }}>
          {c.author.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.author.avatar}
              alt={c.author.name ?? ""}
              className={styles.contribAuthorAvatar}
            />
          ) : null}
          {c.author.handle ? (
            <Link href={`/u/${c.author.handle}`} className={styles.contribAuthorName}>
              {c.author.name || `@${c.author.handle}`}
            </Link>
          ) : (
            <span>Bir frekans</span>
          )}
        </div>

        {c.mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.mediaUrl} alt={c.title} className={styles.contribMedia} style={{ marginTop: 22 }} />
        )}

        {c.body && (
          <div className={`${styles.detailBody} ${isVerse ? styles.detailVerse : ""}`}>
            {c.body}
          </div>
        )}

        <Link href="/network/akis" className={styles.backLink}>
          ← Akışa dön
        </Link>
      </article>
    </main>
  );
}

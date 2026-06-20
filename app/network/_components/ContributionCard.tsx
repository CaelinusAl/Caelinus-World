import Link from "next/link";

import type { PublicContribution } from "@/lib/contributions/types";
import { CONTRIBUTION_KIND_META } from "@/lib/contributions/types";

import styles from "../network.module.css";

export default function ContributionCard({
  c,
  showAuthor = true,
}: {
  c: PublicContribution;
  showAuthor?: boolean;
}) {
  const meta = CONTRIBUTION_KIND_META[c.kind];
  const isVerse = c.kind === "verse";

  return (
    <Link href={`/katki/${c.id}`} className={styles.contribCard}>
      <div className={styles.contribTop}>
        <span className={styles.kindTag}>
          <span>{meta.glyph}</span> {meta.tr}
        </span>
        {typeof c.code === "number" && (
          <span className={styles.codeTag}>Kod {c.code}</span>
        )}
        {c.tier === "canon" && <span className={styles.canonTag}>Kanon</span>}
      </div>

      <h3 className={`${styles.contribTitle} ${isVerse ? styles.contribTitleVerse : ""}`}>
        {c.title}
      </h3>

      {c.mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.mediaUrl} alt={c.title} className={styles.contribMedia} />
      )}

      {c.body && <p className={styles.contribBody}>{c.body}</p>}

      {showAuthor && (
        <div className={styles.contribAuthor}>
          {c.author.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.author.avatar}
              alt={c.author.name ?? c.author.handle ?? ""}
              className={styles.contribAuthorAvatar}
            />
          ) : null}
          <span>
            <span className={styles.contribAuthorName}>
              {c.author.name || (c.author.handle ? `@${c.author.handle}` : "Bir frekans")}
            </span>
            {c.author.handle && c.author.name ? ` · @${c.author.handle}` : ""}
          </span>
        </div>
      )}
    </Link>
  );
}

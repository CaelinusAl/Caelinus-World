import Link from "next/link";
import type { Metadata } from "next";

import { listContributions } from "@/lib/contributions/server";
import {
  CONTRIBUTION_KINDS,
  CONTRIBUTION_KIND_META,
  type ContributionKind,
} from "@/lib/contributions/types";
import { supabaseConfigured } from "@/lib/env";

import styles from "../network.module.css";
import ContributionCard from "../_components/ContributionCard";

export const metadata: Metadata = {
  title: "Akış — Bir kodun uyanışı",
  description:
    "Caelinus Frekans Ağı akışı: yazarların, sanatçıların dünyaya eklediği lore, dize ve görseller. Bir kodun uyanışını izle.",
};

type SearchParams = { kind?: string; code?: string };

function buildHref(current: SearchParams, key: keyof SearchParams, value?: string) {
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) if (v) next[k] = v;
  if (!value || next[key] === value) delete next[key];
  else next[key] = value;
  const qs = new URLSearchParams(next).toString();
  return qs ? `/network/akis?${qs}` : "/network/akis";
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const kind = CONTRIBUTION_KINDS.includes(sp.kind as ContributionKind)
    ? (sp.kind as ContributionKind)
    : undefined;
  const code = sp.code && /^\d{1,2}$/.test(sp.code) ? Number(sp.code) : undefined;

  const configured = supabaseConfigured();
  const items = configured ? await listContributions({ kind, code }) : [];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.kicker}>✦ Frekans Ağı · Akış ✦</div>
          <h1 className={styles.title}>Bir kodun uyanışı</h1>
          <p className={styles.subtitle}>
            Yazar bir lore bırakır, sanatçı bir görsel asar, biri bir dize
            fısıldar — dünya böyle dokunur. Her katkı bir koda bağlanır.
          </p>
          <div className={styles.heroCta}>
            <Link href="/network/katki/yeni" className={styles.btnPrimary}>
              Katkı ekle
            </Link>
            <Link href="/network" className={styles.btnGhost}>
              Üye dizini
            </Link>
          </div>
        </header>

        <div className={styles.tabs}>
          <Link href="/network" className={styles.tab}>
            Üyeler
          </Link>
          <Link href="/network/akis" className={`${styles.tab} ${styles.tabActive}`}>
            Akış
          </Link>
        </div>

        <div className={styles.filterRow} style={{ marginBottom: 28 }}>
          <span className={styles.filterLabel}>Tür</span>
          <Link
            href={buildHref(sp, "kind", undefined)}
            className={`${styles.chip} ${!kind ? styles.chipActive : ""}`}
          >
            Hepsi
          </Link>
          {CONTRIBUTION_KINDS.map((k) => (
            <Link
              key={k}
              href={buildHref(sp, "kind", k)}
              className={`${styles.chip} ${kind === k ? styles.chipActive : ""}`}
            >
              {CONTRIBUTION_KIND_META[k].glyph} {CONTRIBUTION_KIND_META[k].tr}
            </Link>
          ))}
        </div>

        {items.length > 0 ? (
          <div className={styles.feed}>
            {items.map((c) => (
              <ContributionCard key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyGlyph}>✎</div>
            <h2 className={styles.emptyTitle}>
              {configured ? "Akış henüz boş" : "Akış uykuda"}
            </h2>
            <p className={styles.emptyText}>
              {configured ? (
                <>
                  İlk dokunuş senden gelsin — bir lore, bir dize ya da bir
                  görsel bırak; dünya seninle dokunmaya başlasın.
                </>
              ) : (
                <>
                  Katkı akışı için Supabase bağlanmalı ve migration
                  uygulanmalı. Sonra üyelerin eklediği her şey burada belirir.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

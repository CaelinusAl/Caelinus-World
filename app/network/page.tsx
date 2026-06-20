import Link from "next/link";
import type { Metadata } from "next";

import { listMembers } from "@/lib/members/server";
import {
  MEMBER_ROLE_LABEL,
  type MemberElement,
  type MemberRole,
  type PublicMember,
} from "@/lib/members/types";
import { ELEMENT_TONE, ZODIAC_LABEL } from "@/lib/frequency";
import { supabaseConfigured } from "@/lib/env";

import styles from "./network.module.css";

export const metadata: Metadata = {
  title: "Frekans Ağı",
  description:
    "Caelinus Frekans Ağı: yazarın, sanatçının, tasarımcının ve üreticinin frekansıyla buluştuğu canlı dizin. Aynı kodda titreşenleri bul.",
};

const ROLE_ORDER: MemberRole[] = [
  "writer",
  "artist",
  "designer",
  "producer",
  "seeker",
];

const ELEMENTS: MemberElement[] = ["fire", "earth", "air", "water"];

type SearchParams = {
  role?: string;
  element?: string;
  q?: string;
};

/** Bir filtre değerini değiştirip (veya kaldırıp) yeni query string üret. */
function buildHref(
  current: SearchParams,
  key: keyof SearchParams,
  value: string | undefined,
): string {
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) {
    if (v) next[k] = v;
  }
  if (!value || next[key] === value) {
    delete next[key];
  } else {
    next[key] = value;
  }
  const qs = new URLSearchParams(next).toString();
  return qs ? `/network?${qs}` : "/network";
}

function MemberCard({ m }: { m: PublicMember }) {
  const tone = m.element ? ELEMENT_TONE[m.element] : null;
  const zodiac = m.zodiac ? ZODIAC_LABEL[m.zodiac] : null;
  const avatar = m.caelinusAvatarUrl || m.avatarUrl;
  const initial = (m.displayName || m.handle || "?").charAt(0).toUpperCase();

  return (
    <Link href={`/u/${m.handle}`} className={styles.card}>
      <div className={styles.cardHead}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={m.displayName ?? m.handle} className={styles.avatar} />
        ) : (
          <div className={`${styles.avatar} ${styles.avatarFallback}`}>{initial}</div>
        )}
        <div className={styles.identity}>
          <p className={styles.name}>{m.displayName || m.handle}</p>
          <span className={styles.handle}>@{m.handle}</span>
        </div>
      </div>

      {m.headline && <p className={styles.headline}>{m.headline}</p>}

      <div className={styles.meta}>
        {tone && (
          <span title={tone.label.tr}>
            <span className={styles.elementDot} style={{ background: tone.color }} />{" "}
            {tone.label.tr}
          </span>
        )}
        {zodiac && (
          <span className={styles.zodiac} title={zodiac.tr}>
            {zodiac.symbol} {zodiac.tr}
          </span>
        )}
      </div>

      <div className={styles.badges}>
        {m.roles
          .filter((r) => r !== "seeker" || m.roles.length === 1)
          .map((r) => (
            <span key={r} className={styles.badge}>
              {MEMBER_ROLE_LABEL[r].tr}
            </span>
          ))}
      </div>
    </Link>
  );
}

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const role = ROLE_ORDER.includes(sp.role as MemberRole)
    ? (sp.role as MemberRole)
    : undefined;
  const element = ELEMENTS.includes(sp.element as MemberElement)
    ? (sp.element as MemberElement)
    : undefined;

  const configured = supabaseConfigured();
  const members = configured
    ? await listMembers({ role, element, query: sp.q })
    : [];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.kicker}>✦ Caelinus · Frekans Ağı ✦</div>
          <h1 className={styles.title}>Aynı kodda titreşenler</h1>
          <p className={styles.subtitle}>
            Yazar, sanatçı, tasarımcı, üretici — herkes kendi frekansıyla bu
            evrene yerleşir. Burası beğeninin değil, <em>rezonansın</em> ağı.
          </p>
          <div className={styles.heroCta}>
            <Link href="/network/katil" className={styles.btnPrimary}>
              Ağa katıl
            </Link>
            <Link href="/onboarding" className={styles.btnGhost}>
              Frekansını bul
            </Link>
          </div>
        </header>

        <div className={styles.filters}>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>Rol</span>
            <Link
              href={buildHref(sp, "role", undefined)}
              className={`${styles.chip} ${!role ? styles.chipActive : ""}`}
            >
              Hepsi
            </Link>
            {ROLE_ORDER.filter((r) => r !== "seeker").map((r) => (
              <Link
                key={r}
                href={buildHref(sp, "role", r)}
                className={`${styles.chip} ${role === r ? styles.chipActive : ""}`}
              >
                {MEMBER_ROLE_LABEL[r].tr}
              </Link>
            ))}
          </div>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>Element</span>
            <Link
              href={buildHref(sp, "element", undefined)}
              className={`${styles.chip} ${!element ? styles.chipActive : ""}`}
            >
              Hepsi
            </Link>
            {ELEMENTS.map((e) => (
              <Link
                key={e}
                href={buildHref(sp, "element", e)}
                className={`${styles.chip} ${element === e ? styles.chipActive : ""}`}
              >
                {ELEMENT_TONE[e].label.tr}
              </Link>
            ))}
          </div>
        </div>

        {members.length > 0 ? (
          <div className={styles.grid}>
            {members.map((m) => (
              <MemberCard key={m.id} m={m} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyGlyph}>✦</div>
            <h2 className={styles.emptyTitle}>
              {configured
                ? "Ağ henüz sessiz"
                : "Ağ uykuda"}
            </h2>
            <p className={styles.emptyText}>
              {configured ? (
                <>
                  Bu frekansta henüz kimse yok. İlk titreşim senden gelsin —
                  bir kullanıcı adı seç, frekansını bağla, ağa katıl.
                </>
              ) : (
                <>
                  Frekans ağı veritabanı bu ortamda yapılandırılmamış. Migration
                  uygulanıp Supabase bağlandığında üyeler burada belirir.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

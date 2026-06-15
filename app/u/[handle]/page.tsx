import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPublicMember } from "@/lib/members/server";
import { getMemberContributions } from "@/lib/contributions/server";
import { MEMBER_ROLE_LABEL } from "@/lib/members/types";
import { ELEMENT_TONE, ZODIAC_LABEL, FREQUENCY_LABELS } from "@/lib/frequency";
import type { SolfeggioHz } from "@/lib/frequency";

import styles from "../../network/network.module.css";
import ContributionCard from "../../network/_components/ContributionCard";

type Params = { handle: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { handle } = await params;
  const m = await getPublicMember(handle);
  if (!m) return { title: "Üye bulunamadı" };
  const name = m.displayName || `@${m.handle}`;
  return {
    title: name,
    description: m.headline ?? `${name} · Caelinus Frekans Ağı`,
  };
}

const LINK_LABELS: Record<string, string> = {
  instagram: "Instagram",
  website: "Web",
  x: "X",
  behance: "Behance",
};

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { handle } = await params;
  const m = await getPublicMember(handle);
  if (!m) notFound();

  const contributions = await getMemberContributions(handle, 12);

  const tone = m.element ? ELEMENT_TONE[m.element] : null;
  const zodiac = m.zodiac ? ZODIAC_LABEL[m.zodiac] : null;
  const avatar = m.caelinusAvatarUrl || m.avatarUrl;
  const initial = (m.displayName || m.handle).charAt(0).toUpperCase();
  const freqLabel =
    m.frequencyHz && (m.frequencyHz as number) in FREQUENCY_LABELS
      ? FREQUENCY_LABELS[m.frequencyHz as SolfeggioHz].tr
      : null;

  const links = Object.entries(m.links).filter(([, v]) => Boolean(v)) as [
    string,
    string,
  ][];

  return (
    <main className={styles.page}>
      <div className={styles.profileWrap}>
        <header className={styles.profileHeader}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={m.displayName ?? m.handle}
              className={styles.profileAvatar}
            />
          ) : (
            <div className={`${styles.profileAvatar} ${styles.avatarFallback}`}>
              {initial}
            </div>
          )}
          <div>
            <h1 className={styles.profileName}>{m.displayName || m.handle}</h1>
            <div className={styles.profileHandle}>@{m.handle}</div>
            <div className={styles.badges}>
              {m.roles
                .filter((r) => r !== "seeker" || m.roles.length === 1)
                .map((r) => (
                  <span key={r} className={styles.badge}>
                    {MEMBER_ROLE_LABEL[r].tr}
                  </span>
                ))}
            </div>
          </div>
        </header>

        <div className={styles.meta} style={{ marginBottom: 22, gap: 18 }}>
          {tone && (
            <span>
              <span
                className={styles.elementDot}
                style={{ background: tone.color }}
              />{" "}
              {tone.label.tr}
            </span>
          )}
          {zodiac && (
            <span className={styles.zodiac}>
              {zodiac.symbol} {zodiac.tr}
            </span>
          )}
          {m.frequencyHz && (
            <span>
              {m.frequencyHz} Hz{freqLabel ? ` · ${freqLabel}` : ""}
            </span>
          )}
          {typeof m.homeCode === "number" && (
            <span>Yuva · Kod {m.homeCode}</span>
          )}
        </div>

        {m.headline && (
          <p className={styles.profileBio} style={{ color: "#dfe4f5" }}>
            {m.headline}
          </p>
        )}
        {m.bio && <p className={styles.profileBio}>{m.bio}</p>}

        {links.length > 0 && (
          <div className={styles.profileLinks}>
            {links.map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.linkPill}
              >
                {LINK_LABELS[key] ?? key} ↗
              </a>
            ))}
          </div>
        )}

        {contributions.length > 0 && (
          <section>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Dünyaya dokunuşları</h2>
            </div>
            <div className={styles.feed}>
              {contributions.map((c) => (
                <ContributionCard key={c.id} c={c} showAuthor={false} />
              ))}
            </div>
          </section>
        )}

        <Link href="/network" className={styles.backLink}>
          ← Frekans ağına dön
        </Link>
      </div>
    </main>
  );
}

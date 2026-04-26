"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { PROVINCES, PROVINCE_REGIONS } from "@/data/provinces";
import { KIND_LABELS } from "@/lib/atelier/validation";
import type { AtelierRow, AtelierStatus } from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../_components/AtelierMatrix";
import {
  approveAtelier,
  rejectAtelier,
  revertAtelier,
  type ActionResult,
} from "./actions";

/* ─── types ──────────────────────────────────────────────────────── */

export type AdminAtelier = AtelierRow;

export type AdminOwner = {
  id: string;
  email: string | null;
  displayName: string | null;
};

type Props = {
  ateliers: AdminAtelier[];
  owners: Record<string, AdminOwner>;
  loadError: string | null;
};

type Filter = "pending" | "approved" | "rejected" | "draft" | "all";

/* ─── copy ───────────────────────────────────────────────────────── */

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  modSuffix: { tr: "Moderasyon", en: "Moderation" },
  back: { tr: "← Tezgâh", en: "← Bench" },
  loadError: { tr: "Liste alınamadı", en: "Couldn't load list" },
  total: {
    tr: (n: number) => `${n} başvuru`,
    en: (n: number) => `${n} application${n === 1 ? "" : "s"}`,
  },
  filterLabel: {
    pending:  { tr: "İncelemede",     en: "Pending" },
    approved: { tr: "Onaylı",         en: "Approved" },
    rejected: { tr: "Geri gönderilmiş", en: "Rejected" },
    draft:    { tr: "Taslak",         en: "Draft" },
    all:      { tr: "Tümü",           en: "All" },
  } as Record<Filter, { tr: string; en: string }>,
  empty: {
    pending:  { tr: "İncelenecek başvuru yok. Toprak şimdilik sessiz.",  en: "No pending applications." },
    approved: { tr: "Henüz onaylanmış atelier yok.",                     en: "No approved ateliers yet." },
    rejected: { tr: "Geri gönderilmiş başvuru yok.",                     en: "No rejected applications." },
    draft:    { tr: "Henüz hiçbir taslak gönderilmemiş.",                en: "No drafts in flight." },
    all:      { tr: "Hiç atelier kaydı yok.",                            en: "No atelier records yet." },
  } as Record<Filter, { tr: string; en: string }>,
  card: {
    submitted:  { tr: "Gönderildi",  en: "Submitted" },
    updated:    { tr: "Güncellendi", en: "Updated" },
    approvedAt: { tr: "Onaylandı",   en: "Approved" },
  },
  drawer: {
    review:        { tr: "İnceleme",                en: "Review" },
    close:         { tr: "Kapat",                   en: "Close" },
    visit:         { tr: "Sayfaya bak",             en: "Visit page" },
    edit:          { tr: "Üreticinin gözünden",     en: "As the maker sees it" },
    owner:         { tr: "Üretici",                 en: "Maker" },
    location:      { tr: "Toprak",                  en: "Land" },
    bio:           { tr: "Kısa hikâye",             en: "Short story" },
    story:         { tr: "Uzun hikâye",             en: "Long story" },
    contact:       { tr: "İletişim",                en: "Contact" },
    rejectedReason:{ tr: "Reddetme nedeni",          en: "Rejection reason" },
    none:          { tr: "—",                       en: "—" },
    bioMissing:    { tr: "Kısa hikâye yazılmamış.",  en: "No short story." },
    storyMissing:  { tr: "Uzun hikâye yazılmamış.",  en: "No long story." },
    contactMissing:{ tr: "İletişim bilgisi paylaşılmamış.", en: "No contact info." },
  },
  buttons: {
    approve:        { tr: "Onayla",                en: "Approve" },
    reject:         { tr: "Reddet",                en: "Reject" },
    revert:         { tr: "Beklemeye al",          en: "Move to pending" },
    confirmReject:  { tr: "Reddi onayla",          en: "Confirm rejection" },
    cancelReject:   { tr: "Vazgeç",                en: "Cancel" },
  },
  reject: {
    label: { tr: "Üreticiye geri bildirim", en: "Feedback to the maker" },
    placeholder: {
      tr: "Hangi alanlar eksik / ne düzeltilmeli? Olduğu gibi kendisine gösterilir.",
      en: "Which fields are missing / what should be fixed? Shown verbatim to them.",
    },
    hint: {
      tr: "10–600 karakter. Yapıcı ve net yaz.",
      en: "10–600 characters. Be constructive and clear.",
    },
  },
  toast: {
    approved: { tr: "Onaylandı.",     en: "Approved." },
    rejected: { tr: "Geri gönderildi.", en: "Sent back." },
    reverted: { tr: "Beklemeye alındı.", en: "Moved to pending." },
  },
} as const;

/* ─── helpers ────────────────────────────────────────────────────── */

const ORDER: Filter[] = ["pending", "approved", "rejected", "draft", "all"];

function statusOf(a: AdminAtelier): AtelierStatus {
  return a.status;
}

function provinceMeta(provinceId: string | null | undefined, lang: "tr" | "en") {
  if (!provinceId) return null;
  const p = PROVINCES.find((x) => x.id === provinceId);
  if (!p) return null;
  const r = PROVINCE_REGIONS.find((x) => x.id === p.regionId);
  return {
    name: p.name[lang],
    plate: p.plate,
    regionLabel: r ? r.name[lang] : "",
  };
}

function formatDate(iso: string | null, lang: "tr" | "en"): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function pickLocalised(
  primary: string | null | undefined,
  fallback: string | null | undefined,
): string | null {
  const a = primary?.trim();
  if (a) return a;
  const b = fallback?.trim();
  if (b) return b;
  return null;
}

/* ─── component ──────────────────────────────────────────────────── */

export default function AdminBody({ ateliers, owners, loadError }: Props) {
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>("pending");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      pending: 0, approved: 0, rejected: 0, draft: 0, all: ateliers.length,
    };
    for (const a of ateliers) c[a.status as Filter] = (c[a.status as Filter] ?? 0) + 1;
    return c;
  }, [ateliers]);

  const visible = useMemo(() => {
    if (filter === "all") return ateliers;
    return ateliers.filter((a) => a.status === filter);
  }, [ateliers, filter]);

  const active = useMemo(
    () => (activeId ? ateliers.find((a) => a.id === activeId) ?? null : null),
    [ateliers, activeId],
  );

  // Auto-dismiss the toast after a short stay so it doesn't linger.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Close the drawer on Esc.
  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId]);

  return (
    <div className="atelier-shell">
      <AtelierMatrix intensity="soft" />
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/atelier" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">
            {T.brand[L]} · {T.modSuffix[L]}
          </span>
        </Link>
        <div className="atelier-ribbon-actions">
          <Link href="/atelier/dashboard" className="atelier-ribbon-btn">
            {T.back[L]}
          </Link>
          <button
            type="button"
            className="atelier-ribbon-lang"
            onClick={toggle}
            aria-label="Toggle language"
          >
            <span className={L === "tr" ? "is-active" : ""}>TR</span>
            <span className="atelier-ribbon-lang-divider">·</span>
            <span className={L === "en" ? "is-active" : ""}>EN</span>
          </button>
        </div>
      </header>

      <main className="atelier-admin">
        <section className="atelier-admin-head">
          <h1 className="atelier-admin-h1">
            {T.brand[L]} · {T.modSuffix[L]}
          </h1>
          <p className="atelier-admin-sub">{T.total[L](ateliers.length)}</p>
        </section>

        {loadError ? (
          <p className="atelier-admin-loaderr" role="alert">
            {T.loadError[L]}: {loadError}
          </p>
        ) : null}

        <nav className="atelier-admin-filters" aria-label="Status">
          {ORDER.map((f) => (
            <button
              key={f}
              type="button"
              className={
                "atelier-admin-filter" + (filter === f ? " is-active" : "")
              }
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
            >
              <span className="atelier-admin-filter-label">
                {T.filterLabel[f][L]}
              </span>
              <span className={"atelier-admin-filter-count is-" + f}>
                {counts[f]}
              </span>
            </button>
          ))}
        </nav>

        {visible.length === 0 ? (
          <p className="atelier-admin-empty">{T.empty[filter][L]}</p>
        ) : (
          <ul className="atelier-admin-grid">
            {visible.map((a) => {
              const owner = owners[a.owner_user_id] ?? null;
              const place = provinceMeta(a.province, L);
              const kindLabel = KIND_LABELS[a.kind][L];
              const lastUpdated = formatDate(a.updated_at, L);
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    className={`atelier-admin-card status-${a.status}`}
                    onClick={() => setActiveId(a.id)}
                  >
                    <div
                      className={
                        "atelier-admin-card-cover" +
                        (a.cover_image_url ? " has-image" : "")
                      }
                      style={
                        a.cover_image_url
                          ? { backgroundImage: `url(${a.cover_image_url})` }
                          : undefined
                      }
                      aria-hidden="true"
                    >
                      {!a.cover_image_url ? <span>✦</span> : null}
                    </div>
                    <div className="atelier-admin-card-body">
                      <div className="atelier-admin-card-row">
                        <h3 className="atelier-admin-card-name">{a.name}</h3>
                        <span className={`atelier-admin-card-status status-${a.status}`}>
                          {T.filterLabel[a.status as Filter]?.[L] ?? a.status}
                        </span>
                      </div>
                      <p className="atelier-admin-card-meta">
                        <span>{kindLabel}</span>
                        {place ? (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>
                              <span className="atelier-admin-card-plate">
                                {place.plate}
                              </span>{" "}
                              {place.name}
                            </span>
                          </>
                        ) : null}
                      </p>
                      <p className="atelier-admin-card-owner">
                        {owner?.displayName ?? owner?.email ?? "—"}
                        {owner?.email && owner?.displayName ? (
                          <>
                            {" "}
                            <span className="atelier-admin-card-email">
                              {owner.email}
                            </span>
                          </>
                        ) : null}
                      </p>
                      <p className="atelier-admin-card-time">
                        {T.card.updated[L]}: {lastUpdated}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {active ? (
        <ReviewDrawer
          atelier={active}
          owner={owners[active.owner_user_id] ?? null}
          lang={L}
          onClose={() => setActiveId(null)}
          onActionDone={(t) => {
            setToast(t);
            setActiveId(null);
            router.refresh();
          }}
        />
      ) : null}

      {toast ? (
        <div className="atelier-admin-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

/* ─── ReviewDrawer ───────────────────────────────────────────────── */

type DrawerProps = {
  atelier: AdminAtelier;
  owner: AdminOwner | null;
  lang: "tr" | "en";
  onClose: () => void;
  onActionDone: (toast: string) => void;
};

function ReviewDrawer({ atelier, owner, lang, onClose, onActionDone }: DrawerProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState(atelier.rejected_reason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const place = provinceMeta(atelier.province, lang);
  const kindLabel = KIND_LABELS[atelier.kind][lang];
  const bio = pickLocalised(
    lang === "tr" ? atelier.bio_tr : atelier.bio_en,
    lang === "tr" ? atelier.bio_en : atelier.bio_tr,
  );
  const story = pickLocalised(
    lang === "tr" ? atelier.story_tr : atelier.story_en,
    lang === "tr" ? atelier.story_en : atelier.story_tr,
  );

  const hasContact =
    !!atelier.contact_email ||
    !!atelier.contact_phone ||
    !!atelier.website ||
    !!atelier.instagram;

  const handleResult = (result: ActionResult, toast: string) => {
    if (result.ok) {
      onActionDone(toast);
    } else {
      setError(result.error);
    }
  };

  const onApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveAtelier(atelier.id);
      handleResult(result, T.toast.approved[lang]);
    });
  };

  const onReject = () => {
    setError(null);
    startTransition(async () => {
      const result = await rejectAtelier(atelier.id, reason);
      handleResult(result, T.toast.rejected[lang]);
    });
  };

  const onRevert = () => {
    setError(null);
    startTransition(async () => {
      const result = await revertAtelier(atelier.id);
      handleResult(result, T.toast.reverted[lang]);
    });
  };

  return (
    <div
      className="atelier-admin-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={T.drawer.review[lang]}
      onClick={onClose}
    >
      <aside
        className="atelier-admin-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="atelier-admin-drawer-head">
          <div className="atelier-admin-drawer-titlewrap">
            <span className={`atelier-admin-drawer-status status-${atelier.status}`}>
              {T.filterLabel[atelier.status as Filter]?.[lang] ?? atelier.status}
            </span>
            <h2 className="atelier-admin-drawer-title">{atelier.name}</h2>
            <p className="atelier-admin-drawer-meta">
              <span>{kindLabel}</span>
              {place ? (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>
                    <span className="atelier-admin-card-plate">{place.plate}</span>{" "}
                    {place.name}
                    {place.regionLabel ? (
                      <>
                        {" "}
                        <span className="atelier-admin-drawer-region">
                          ({place.regionLabel})
                        </span>
                      </>
                    ) : null}
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            className="atelier-admin-drawer-close"
            onClick={onClose}
            aria-label={T.drawer.close[lang]}
          >
            ✕
          </button>
        </header>

        {atelier.cover_image_url ? (
          <div
            className="atelier-admin-drawer-cover has-image"
            style={{ backgroundImage: `url(${atelier.cover_image_url})` }}
            aria-hidden="true"
          />
        ) : null}

        <div className="atelier-admin-drawer-body">
          <section className="atelier-admin-drawer-section">
            <h3 className="atelier-admin-drawer-h3">{T.drawer.owner[lang]}</h3>
            <p className="atelier-admin-drawer-line">
              {owner?.displayName ?? "—"}
              {owner?.email ? (
                <>
                  {" · "}
                  <a
                    className="atelier-admin-drawer-link"
                    href={`mailto:${owner.email}`}
                  >
                    {owner.email}
                  </a>
                </>
              ) : null}
            </p>
            <p className="atelier-admin-drawer-line atelier-admin-drawer-line-faint">
              <span>
                {T.card.updated[lang]}: {formatDate(atelier.updated_at, lang)}
              </span>
              {atelier.approved_at ? (
                <>
                  {" · "}
                  {T.card.approvedAt[lang]}:{" "}
                  {formatDate(atelier.approved_at, lang)}
                </>
              ) : null}
            </p>
          </section>

          <section className="atelier-admin-drawer-section">
            <h3 className="atelier-admin-drawer-h3">{T.drawer.bio[lang]}</h3>
            <p className="atelier-admin-drawer-prose">
              {bio ?? (
                <span className="atelier-admin-drawer-empty">
                  {T.drawer.bioMissing[lang]}
                </span>
              )}
            </p>
          </section>

          {story ? (
            <section className="atelier-admin-drawer-section">
              <h3 className="atelier-admin-drawer-h3">{T.drawer.story[lang]}</h3>
              <div className="atelier-admin-drawer-prose">
                {story.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ) : null}

          <section className="atelier-admin-drawer-section">
            <h3 className="atelier-admin-drawer-h3">{T.drawer.contact[lang]}</h3>
            {hasContact ? (
              <ul className="atelier-admin-drawer-contact">
                {atelier.contact_email ? (
                  <li>
                    <span>E-posta</span>
                    <a
                      className="atelier-admin-drawer-link"
                      href={`mailto:${atelier.contact_email}`}
                    >
                      {atelier.contact_email}
                    </a>
                  </li>
                ) : null}
                {atelier.contact_phone ? (
                  <li>
                    <span>Telefon</span>
                    <a
                      className="atelier-admin-drawer-link"
                      href={`tel:${atelier.contact_phone.replace(/\s+/g, "")}`}
                    >
                      {atelier.contact_phone}
                    </a>
                  </li>
                ) : null}
                {atelier.website ? (
                  <li>
                    <span>Web</span>
                    <a
                      className="atelier-admin-drawer-link"
                      href={atelier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {atelier.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                ) : null}
                {atelier.instagram ? (
                  <li>
                    <span>Instagram</span>
                    <a
                      className="atelier-admin-drawer-link"
                      href={`https://instagram.com/${atelier.instagram.replace(/^@+/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{atelier.instagram.replace(/^@+/, "")}
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="atelier-admin-drawer-empty">
                {T.drawer.contactMissing[lang]}
              </p>
            )}
          </section>

          {atelier.status === "rejected" && atelier.rejected_reason ? (
            <section className="atelier-admin-drawer-section atelier-admin-drawer-section-rejected">
              <h3 className="atelier-admin-drawer-h3">
                {T.drawer.rejectedReason[lang]}
              </h3>
              <blockquote className="atelier-admin-drawer-rejected">
                {atelier.rejected_reason}
              </blockquote>
            </section>
          ) : null}
        </div>

        {showRejectForm ? (
          <div className="atelier-admin-drawer-rejectform">
            <label
              className="atelier-admin-drawer-label"
              htmlFor="atelier-admin-reason"
            >
              {T.reject.label[lang]}
            </label>
            <textarea
              id="atelier-admin-reason"
              className="atelier-admin-drawer-textarea"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={T.reject.placeholder[lang]}
              maxLength={600}
              autoFocus
            />
            <p className="atelier-admin-drawer-hint">
              {T.reject.hint[lang]} · {reason.trim().length}/600
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="atelier-admin-drawer-error" role="alert">
            {error}
          </p>
        ) : null}

        <footer className="atelier-admin-drawer-actions">
          <Link
            href={`/atelier/${atelier.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="atelier-admin-drawer-btn ghost"
          >
            {T.drawer.visit[lang]}
          </Link>

          {showRejectForm ? (
            <>
              <button
                type="button"
                className="atelier-admin-drawer-btn ghost"
                disabled={pending}
                onClick={() => {
                  setShowRejectForm(false);
                  setError(null);
                }}
              >
                {T.buttons.cancelReject[lang]}
              </button>
              <button
                type="button"
                className="atelier-admin-drawer-btn danger"
                disabled={pending || reason.trim().length < 10}
                onClick={onReject}
              >
                {pending ? "…" : T.buttons.confirmReject[lang]}
              </button>
            </>
          ) : (
            <>
              {(atelier.status === "approved" ||
                atelier.status === "rejected") && (
                <button
                  type="button"
                  className="atelier-admin-drawer-btn ghost"
                  disabled={pending}
                  onClick={onRevert}
                >
                  {pending ? "…" : T.buttons.revert[lang]}
                </button>
              )}
              {atelier.status !== "rejected" && (
                <button
                  type="button"
                  className="atelier-admin-drawer-btn danger"
                  disabled={pending}
                  onClick={() => setShowRejectForm(true)}
                >
                  {T.buttons.reject[lang]}
                </button>
              )}
              {atelier.status !== "approved" && (
                <button
                  type="button"
                  className="atelier-admin-drawer-btn primary"
                  disabled={pending}
                  onClick={onApprove}
                >
                  {pending ? "…" : T.buttons.approve[lang]}
                </button>
              )}
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}

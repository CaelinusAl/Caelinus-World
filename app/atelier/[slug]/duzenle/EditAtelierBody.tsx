"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PROVINCE_REGIONS } from "@/data/provinces";
import { supabaseConfigured } from "@/lib/env";
import {
  ATELIER_KINDS,
  KIND_LABELS,
  atelierEditSchema,
  emptyToNull,
  provincesInRegion,
} from "@/lib/atelier/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  AtelierKind,
  AtelierRow,
  AtelierStatus,
} from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../../_components/AtelierMatrix";
import ImageUploadField from "../../_components/ImageUploadField";

type Tab = "general" | "story" | "contact" | "images";

type Props = {
  atelier: AtelierRow;
};

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  back: { tr: "← Tezgâhıma dön", en: "← Back to my bench" },
  view: { tr: "Atelier sayfasını gör", en: "View atelier page" },

  tabs: {
    general:  { tr: "Genel",      en: "General" },
    story:    { tr: "Hikâye",     en: "Story" },
    contact:  { tr: "İletişim",   en: "Contact" },
    images:   { tr: "Görseller",  en: "Images" },
  },

  general: {
    title: { tr: "Genel bilgiler", en: "General info" },
    name: { tr: "Atelier adı", en: "Atelier name" },
    kind: { tr: "Üretim türü", en: "Maker type" },
    region: { tr: "Bölge", en: "Region" },
    province: { tr: "İl", en: "Province" },
    bioTr: { tr: "Kısa hikâye (Türkçe)", en: "Short story (Turkish)" },
    bioEn: { tr: "Kısa hikâye (English)", en: "Short story (English)" },
    bioHint: {
      tr: "Müşterinin kartında ilk göreceği iki-üç cümle.",
      en: "The two-three lines a visitor sees first on your card.",
    },
  },

  story: {
    title: { tr: "Uzun hikâyen", en: "Your long story" },
    intro: {
      tr: "Atelier sayfanda alttaki bölümde görünür. Geleneğin, yöntemin, niyetin — uzun uzun anlatabileceğin yer.",
      en: "Shown lower on your atelier page. Lineage, method, intention — the place to go long.",
    },
    storyTr: { tr: "Hikâye (Türkçe)", en: "Story (Turkish)" },
    storyEn: { tr: "Hikâye (English)", en: "Story (English)" },
  },

  contact: {
    title: { tr: "İletişim ve linkler", en: "Contact & links" },
    intro: {
      tr: "Bunları doldurmak isteğe bağlı — ama dolu olanlar atölye sayfanda görünür.",
      en: "These are optional — but whatever you fill shows up on your atelier page.",
    },
    email: { tr: "İletişim e-postası", en: "Contact email" },
    phone: { tr: "Telefon", en: "Phone" },
    website: { tr: "Web sitesi (https://…)", en: "Website (https://…)" },
    instagram: { tr: "Instagram kullanıcı adı", en: "Instagram handle" },
    instagramHint: {
      tr: "@ olmadan, sadece kullanıcı adı.",
      en: "Without the @, just the handle.",
    },
  },

  images: {
    title: { tr: "Atelier görselleri", en: "Atelier visuals" },
    intro: {
      tr: "Kapak — atelier sayfanın başında geniş yatay bant. Avatar — kart ve listelerde dairesel sembol.",
      en: "Cover — the wide banner at the top of your page. Avatar — the round mark used in cards and lists.",
    },
    cover: { tr: "Kapak görseli", en: "Cover image" },
    coverHint: {
      tr: "Yatay, en az 1600×900 önerilir. JPG/PNG/WEBP, 10 MB'a kadar.",
      en: "Wide, 1600×900 minimum recommended. JPG/PNG/WEBP, up to 10 MB.",
    },
    avatar: { tr: "Avatar", en: "Avatar" },
    avatarHint: {
      tr: "Kare, en az 512×512. Kartlarda dairesel kırpılır.",
      en: "Square, 512×512 minimum. Cropped to a circle in cards.",
    },
  },

  status: {
    title: { tr: "Başvurunun durumu", en: "Application status" },
    draft:    { tr: "Taslak",          en: "Draft" },
    pending:  { tr: "İncelemede",      en: "In review" },
    approved: { tr: "Açık",            en: "Open" },
    rejected: { tr: "Geri gönderildi", en: "Returned" },
    submit: {
      tr: "Başvurumu incelemeye gönder",
      en: "Submit application for review",
    },
    submitting: { tr: "Gönderiliyor…", en: "Submitting…" },
    requirements: {
      tr: "Gönderebilmek için ad, bölge, il, kısa hikâye ve kapak görseli dolu olmalı.",
      en: "To submit, you'll need a name, region, province, short story and a cover image.",
    },
    pendingHint: {
      tr: "Başvurun Caelinus kütüphanesinde inceleniyor. Onay sonrası atelierin halka açılır.",
      en: "Your application is being reviewed by the Caelinus librarians. Once approved, your bench opens to the public.",
    },
    approvedHint: {
      tr: "Atelierin onaylı ve açık. Aşağıdaki düzenlemeler kaydedildikten sonra anında yayında.",
      en: "Your bench is approved and live. Edits below go public the moment you save.",
    },
    rejectedHint: {
      tr: "Caelinus kütüphanesi bir not bıraktı. İçeriği gözden geçirip 'Yeniden gönder' diyebilirsin.",
      en: "The Caelinus librarians left a note. Revise the content and resubmit when ready.",
    },
    rejectedNote: { tr: "Geri bildirim", en: "Feedback" },
    resubmit: { tr: "Yeniden gönder", en: "Resubmit" },
  },

  save: { tr: "Değişiklikleri kaydet", en: "Save changes" },
  saving: { tr: "Kaydediliyor…", en: "Saving…" },
  saved: { tr: "Kaydedildi.", en: "Saved." },
  notConfigured: {
    tr: "Supabase ortam değişkenleri henüz dolmamış. .env.local'i hazırla, sonra tekrar dene.",
    en: "Supabase environment isn't wired up yet. Fill .env.local and try again.",
  },
  generic: {
    tr: "Bir şey ters gitti. Bir saniye sonra tekrar dene.",
    en: "Something went wrong. Try again in a moment.",
  },
} as const;

const TABS: { id: Tab; key: keyof typeof T.tabs }[] = [
  { id: "general", key: "general" },
  { id: "story", key: "story" },
  { id: "contact", key: "contact" },
  { id: "images", key: "images" },
];

export default function EditAtelierBody({ atelier }: Props) {
  const router = useRouter();
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const configured = supabaseConfigured();

  const [tab, setTab] = useState<Tab>("general");

  // ── form state, seeded from server-fetched row ───────────────
  const [name, setName] = useState(atelier.name);
  const [kind, setKind] = useState<AtelierKind>(atelier.kind);
  const [region, setRegion] = useState<string>(
    atelier.region ?? PROVINCE_REGIONS[0].id,
  );
  const [province, setProvince] = useState<string>(atelier.province ?? "");
  const [bioTr, setBioTr] = useState(atelier.bio_tr ?? "");
  const [bioEn, setBioEn] = useState(atelier.bio_en ?? "");
  const [storyTr, setStoryTr] = useState(atelier.story_tr ?? "");
  const [storyEn, setStoryEn] = useState(atelier.story_en ?? "");
  const [contactEmail, setContactEmail] = useState(atelier.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(atelier.contact_phone ?? "");
  const [website, setWebsite] = useState(atelier.website ?? "");
  const [instagram, setInstagram] = useState(atelier.instagram ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(
    atelier.cover_image_url ?? null,
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    atelier.avatar_image_url ?? null,
  );
  const [status, setStatus] = useState<AtelierStatus>(atelier.status);
  const [rejectedReason] = useState<string | null>(
    atelier.rejected_reason ?? null,
  );

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ── cascading region → province dropdown ─────────────────────
  const provinces = useMemo(() => provincesInRegion(region), [region]);
  useEffect(() => {
    if (!provinces.find((p) => p.id === province)) {
      setProvince(provinces[0]?.id ?? "");
    }
  }, [provinces, province]);

  // ── derived: can we submit for review? ───────────────────────
  // Mirror the rules in T.status.requirements so the UI doesn't lie.
  const submittable =
    name.trim().length > 0 &&
    !!region &&
    !!province &&
    bioTr.trim().length >= 20 &&
    !!coverUrl;

  function buildPayload() {
    return {
      name: name.trim(),
      kind,
      region,
      province,
      bio_tr: bioTr.trim() || undefined,
      bio_en: bioEn.trim() || undefined,
      story_tr: storyTr.trim() || undefined,
      story_en: storyEn.trim() || undefined,
      contact_email: contactEmail.trim() || undefined,
      contact_phone: contactPhone.trim() || undefined,
      website: website.trim() || undefined,
      instagram: instagram.trim() || undefined,
      cover_image_url: coverUrl ?? undefined,
      avatar_image_url: avatarUrl ?? undefined,
    };
  }

  function validate(): boolean {
    const result = atelierEditSchema.safeParse(buildPayload());
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "_");
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  }

  /**
   * Persist current form state to the row, optionally also flipping
   * `status`. We do everything through a single update so we don't end
   * up with half-applied state if one part fails.
   */
  async function persist(opts: { newStatus?: AtelierStatus } = {}) {
    if (!configured) {
      setGlobalError(T.notConfigured[L]);
      return false;
    }
    if (!validate()) return false;

    const supabase = createSupabaseBrowserClient();
    // Typed as Partial<AtelierRow> so we don't lose Supabase's update
    // surface to `never` — same fix pattern as dashboard/page.tsx.
    const update: Partial<AtelierRow> = {
      name: name.trim(),
      kind,
      region: emptyToNull(region) ?? region,
      province: emptyToNull(province),
      bio_tr: emptyToNull(bioTr),
      bio_en: emptyToNull(bioEn),
      story_tr: emptyToNull(storyTr),
      story_en: emptyToNull(storyEn),
      contact_email: emptyToNull(contactEmail),
      contact_phone: emptyToNull(contactPhone),
      website: emptyToNull(website),
      instagram: emptyToNull(instagram),
      cover_image_url: coverUrl,
      avatar_image_url: avatarUrl,
    };
    if (opts.newStatus) update.status = opts.newStatus;

    const { data, error } = await supabase
      .from("ateliers")
      // The generated row type marks columns as non-nullable text, but
      // our partial only sets a subset; cast to `never` to satisfy the
      // overly strict generic without changing the runtime payload.
      .update(update as never)
      .eq("id", atelier.id)
      .select("status")
      .single();

    if (error) {
      setGlobalError(error.message || T.generic[L]);
      return false;
    }

    const row = data as { status: AtelierStatus } | null;
    if (row) setStatus(row.status);
    return true;
  }

  async function onSave() {
    setGlobalError(null);
    setSaved(false);
    setSaving(true);
    try {
      const ok = await persist();
      if (ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function onSubmitForReview() {
    if (!submittable) return;
    setGlobalError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const ok = await persist({ newStatus: "pending" });
      if (ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── status block ─────────────────────────────────────────────
  const statusLabel = T.status[status][L];
  const statusHint =
    status === "pending"
      ? T.status.pendingHint[L]
      : status === "approved"
        ? T.status.approvedHint[L]
        : status === "rejected"
          ? T.status.rejectedHint[L]
          : T.status.requirements[L];

  return (
    <div className="atelier-shell">
      <AtelierMatrix intensity="soft" />
      <div className="atelier-shell-vignette" aria-hidden="true" />

      <header className="atelier-ribbon">
        <Link href="/atelier" className="atelier-ribbon-brand">
          <span className="atelier-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="atelier-ribbon-name">{T.brand[L]}</span>
        </Link>
        <div className="atelier-ribbon-actions">
          <Link href="/atelier/dashboard" className="atelier-ribbon-btn">
            {T.back[L]}
          </Link>
          {status === "approved" ? (
            <Link
              href={`/atelier/${atelier.slug}`}
              className="atelier-ribbon-btn"
            >
              {T.view[L]}
            </Link>
          ) : null}
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

      <main className="atelier-edit">
        <header className="atelier-edit-head">
          <h1 className="atelier-edit-title">{name || atelier.name}</h1>
          <p className="atelier-edit-handle">caelinus.world/atelier/{atelier.slug}</p>
        </header>

        {/* ── status card ─────────────────────────────────────── */}
        <section className={`atelier-edit-status is-${status}`}>
          <div className="atelier-edit-status-row">
            <h2 className="atelier-edit-status-title">{T.status.title[L]}</h2>
            <span className={`atelier-dash-card-status status-${status}`}>
              {statusLabel}
            </span>
          </div>
          <p className="atelier-edit-status-hint">{statusHint}</p>
          {status === "rejected" && rejectedReason ? (
            <blockquote className="atelier-edit-status-note">
              <span className="atelier-edit-status-note-label">
                {T.status.rejectedNote[L]}
              </span>
              <p>{rejectedReason}</p>
            </blockquote>
          ) : null}

          {(status === "draft" || status === "rejected") && submittable ? (
            <button
              type="button"
              className="atelier-btn atelier-btn-primary"
              onClick={onSubmitForReview}
              disabled={submitting || saving || !configured}
            >
              {submitting
                ? T.status.submitting[L]
                : status === "rejected"
                  ? T.status.resubmit[L]
                  : T.status.submit[L]}
            </button>
          ) : null}
        </section>

        {!configured ? (
          <div className="atelier-alert is-warn">{T.notConfigured[L]}</div>
        ) : null}
        {globalError ? (
          <div className="atelier-alert is-error">{globalError}</div>
        ) : null}
        {saved ? <div className="atelier-alert is-info">{T.saved[L]}</div> : null}

        {/* ── tab nav ─────────────────────────────────────────── */}
        <nav className="atelier-edit-tabs" role="tablist">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              className={
                "atelier-edit-tab" + (tab === entry.id ? " is-active" : "")
              }
              onClick={() => setTab(entry.id)}
            >
              {T.tabs[entry.key][L]}
            </button>
          ))}
        </nav>

        {/* ── tab panels ──────────────────────────────────────── */}
        <section className="atelier-edit-panel">
          {tab === "general" ? (
            <>
              <h2 className="atelier-edit-h2">{T.general.title[L]}</h2>

              <label className="atelier-field">
                <span className="atelier-field-label">{T.general.name[L]}</span>
                <input
                  className="atelier-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                />
                {errors.name ? (
                  <p className="atelier-field-error">{errors.name}</p>
                ) : null}
              </label>

              <div className="atelier-form-row">
                <label className="atelier-field">
                  <span className="atelier-field-label">{T.general.kind[L]}</span>
                  <select
                    className="atelier-input"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as AtelierKind)}
                  >
                    {ATELIER_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABELS[k][L]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="atelier-field">
                  <span className="atelier-field-label">{T.general.region[L]}</span>
                  <select
                    className="atelier-input"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    {PROVINCE_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name[L]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="atelier-field">
                <span className="atelier-field-label">{T.general.province[L]}</span>
                <select
                  className="atelier-input"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                >
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name[L]} · {p.plate}
                    </option>
                  ))}
                </select>
              </label>

              <label className="atelier-field">
                <span className="atelier-field-label">{T.general.bioTr[L]}</span>
                <textarea
                  className="atelier-input atelier-textarea"
                  value={bioTr}
                  onChange={(e) => setBioTr(e.target.value)}
                  maxLength={800}
                  rows={5}
                />
                <p className="atelier-field-hint">
                  {T.general.bioHint[L]} — {bioTr.trim().length}/800
                </p>
                {errors.bio_tr ? (
                  <p className="atelier-field-error">{errors.bio_tr}</p>
                ) : null}
              </label>

              <label className="atelier-field">
                <span className="atelier-field-label">{T.general.bioEn[L]}</span>
                <textarea
                  className="atelier-input atelier-textarea"
                  value={bioEn}
                  onChange={(e) => setBioEn(e.target.value)}
                  maxLength={800}
                  rows={4}
                />
                {errors.bio_en ? (
                  <p className="atelier-field-error">{errors.bio_en}</p>
                ) : null}
              </label>
            </>
          ) : null}

          {tab === "story" ? (
            <>
              <h2 className="atelier-edit-h2">{T.story.title[L]}</h2>
              <p className="atelier-edit-intro">{T.story.intro[L]}</p>

              <label className="atelier-field">
                <span className="atelier-field-label">{T.story.storyTr[L]}</span>
                <textarea
                  className="atelier-input atelier-textarea"
                  value={storyTr}
                  onChange={(e) => setStoryTr(e.target.value)}
                  maxLength={4000}
                  rows={10}
                />
                <p className="atelier-field-hint">
                  {storyTr.trim().length}/4000
                </p>
                {errors.story_tr ? (
                  <p className="atelier-field-error">{errors.story_tr}</p>
                ) : null}
              </label>

              <label className="atelier-field">
                <span className="atelier-field-label">{T.story.storyEn[L]}</span>
                <textarea
                  className="atelier-input atelier-textarea"
                  value={storyEn}
                  onChange={(e) => setStoryEn(e.target.value)}
                  maxLength={4000}
                  rows={8}
                />
                <p className="atelier-field-hint">
                  {storyEn.trim().length}/4000
                </p>
                {errors.story_en ? (
                  <p className="atelier-field-error">{errors.story_en}</p>
                ) : null}
              </label>
            </>
          ) : null}

          {tab === "contact" ? (
            <>
              <h2 className="atelier-edit-h2">{T.contact.title[L]}</h2>
              <p className="atelier-edit-intro">{T.contact.intro[L]}</p>

              <div className="atelier-form-row">
                <label className="atelier-field">
                  <span className="atelier-field-label">{T.contact.email[L]}</span>
                  <input
                    className="atelier-input"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                  {errors.contact_email ? (
                    <p className="atelier-field-error">{errors.contact_email}</p>
                  ) : null}
                </label>
                <label className="atelier-field">
                  <span className="atelier-field-label">{T.contact.phone[L]}</span>
                  <input
                    className="atelier-input"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </label>
              </div>

              <label className="atelier-field">
                <span className="atelier-field-label">{T.contact.website[L]}</span>
                <input
                  className="atelier-input"
                  type="url"
                  placeholder="https://"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                {errors.website ? (
                  <p className="atelier-field-error">{errors.website}</p>
                ) : null}
              </label>

              <label className="atelier-field">
                <span className="atelier-field-label">
                  {T.contact.instagram[L]}
                </span>
                <input
                  className="atelier-input"
                  type="text"
                  placeholder="caelinus.world"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
                <p className="atelier-field-hint">
                  {T.contact.instagramHint[L]}
                </p>
                {errors.instagram ? (
                  <p className="atelier-field-error">{errors.instagram}</p>
                ) : null}
              </label>
            </>
          ) : null}

          {tab === "images" ? (
            <>
              <h2 className="atelier-edit-h2">{T.images.title[L]}</h2>
              <p className="atelier-edit-intro">{T.images.intro[L]}</p>

              <ImageUploadField
                atelierId={atelier.id}
                slot="cover"
                value={coverUrl}
                onChange={setCoverUrl}
                label={T.images.cover[L]}
                hint={T.images.coverHint[L]}
                shape="wide"
                disabled={saving || submitting}
              />

              <ImageUploadField
                atelierId={atelier.id}
                slot="avatar"
                value={avatarUrl}
                onChange={setAvatarUrl}
                label={T.images.avatar[L]}
                hint={T.images.avatarHint[L]}
                shape="square"
                disabled={saving || submitting}
              />
            </>
          ) : null}
        </section>

        {/* ── save bar ────────────────────────────────────────── */}
        <div className="atelier-edit-savebar">
          <button
            type="button"
            className="atelier-btn atelier-btn-primary"
            onClick={onSave}
            disabled={saving || submitting || !configured}
          >
            {saving ? T.saving[L] : T.save[L]}
          </button>
        </div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PROVINCE_REGIONS } from "@/data/provinces";
import { supabaseConfigured } from "@/lib/env";
import {
  ATELIER_KINDS,
  KIND_LABELS,
  atelierApplicationSchema,
  emptyToNull,
  provincesInRegion,
  slugify,
  slugSchema,
} from "@/lib/atelier/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { AtelierKind, AtelierRow } from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../_components/AtelierMatrix";

type Props = {
  email: string | null;
};

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  title: { tr: "Atelier Başvurusu", en: "Atelier Application" },
  lead: {
    tr: "Birkaç soru — kim olduğunu, ne ürettiğini, hangi toprağa bağlı olduğunu anlat. Bunu sonradan istediğin zaman geliştirebilirsin.",
    en: "A few questions — who you are, what you craft, which soil you're tied to. You can always refine this later.",
  },
  signedInAs: { tr: "Giriş yapıldı: ", en: "Signed in as: " },
  fields: {
    name: { tr: "Atelier adı", en: "Atelier name" },
    nameHint: {
      tr: "Müşterilerin göreceği isim. Sonra değiştirebilirsin.",
      en: "The name customers will see. You can change it later.",
    },
    slug: { tr: "Tezgâh kısa adı (URL)", en: "Bench handle (URL)" },
    slugHint: {
      tr: "caelinus.ai/atelier/<kısa-ad> içinde görünür. Sadece küçük harf, rakam ve tire.",
      en: "Appears in caelinus.ai/atelier/<handle>. Lowercase letters, digits, and dashes only.",
    },
    kind: { tr: "Üretim türü", en: "Maker type" },
    region: { tr: "Bölge", en: "Region" },
    province: { tr: "İl", en: "Province" },
    provinceHint: {
      tr: "Toprağına en yakın hissettiğin il. Bu, atölyeni Anadolu Atlas'ında konumlandırır.",
      en: "The province you feel closest to. This places your bench on the Anatolia Atlas.",
    },
    bioTr: { tr: "Kısa hikâye (Türkçe)", en: "Short story (Turkish)" },
    bioEn: { tr: "Kısa hikâye (English, opsiyonel)", en: "Short story (English, optional)" },
    bioHint: {
      tr: "20–800 karakter. Ne ürettiğini, hangi geleneğe bağlı olduğunu anlat.",
      en: "20–800 characters. Tell us what you make and which lineage you draw from.",
    },
  },
  consent: {
    tr: "Başvuru taslak olarak kaydedilir. Düzenleme sayfasında detaylar ve görsellerle zenginleştirip gönderirsin.",
    en: "Your application is saved as a draft. Enrich it with details and images on the edit page, then submit it.",
  },
  submit: { tr: "Taslağı oluştur", en: "Create draft" },
  submitting: { tr: "Oluşturuluyor…", en: "Creating…" },
  back: { tr: "← Tezgâhıma dön", en: "← Back to my bench" },
  notConfigured: {
    tr: "Supabase ortam değişkenleri henüz dolmamış. .env.local'i hazırla, sonra tekrar dene.",
    en: "Supabase environment isn't wired up yet. Fill .env.local and try again.",
  },
  duplicateSlug: {
    tr: "Bu kısa ad zaten alınmış. Başka bir tane dene.",
    en: "This handle is already taken. Try another one.",
  },
  generic: {
    tr: "Bir şey ters gitti. Bir saniye sonra tekrar dene.",
    en: "Something went wrong. Try again in a moment.",
  },
} as const;

export default function BasvuruForm({ email }: Props) {
  const router = useRouter();
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const configured = supabaseConfigured();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  // Once the user has manually edited the slug, stop auto-deriving it
  // from the name — otherwise typing into name would clobber their
  // chosen handle.
  const [slugTouched, setSlugTouched] = useState(false);
  const [kind, setKind] = useState<AtelierKind>("artisan");
  const [region, setRegion] = useState<string>(PROVINCE_REGIONS[0].id);
  const [province, setProvince] = useState<string>(
    provincesInRegion(PROVINCE_REGIONS[0].id)[0]?.id ?? "",
  );
  const [bioTr, setBioTr] = useState("");
  const [bioEn, setBioEn] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Auto-fill slug from name until the user touches the slug field.
  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(name));
  }, [name, slugTouched]);

  // Whenever region changes, reset province to the first one in that
  // region so the dropdown can never land in an invalid combination.
  const provinces = useMemo(() => provincesInRegion(region), [region]);
  useEffect(() => {
    if (!provinces.find((p) => p.id === province)) {
      setProvince(provinces[0]?.id ?? "");
    }
  }, [provinces, province]);

  function validateClient(): boolean {
    const result = atelierApplicationSchema.safeParse({
      name: name.trim(),
      slug: slug.trim(),
      kind,
      region,
      province,
      bio_tr: bioTr.trim(),
      bio_en: bioEn.trim() || undefined,
    });
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!configured) {
      setGlobalError(T.notConfigured[L]);
      return;
    }
    if (!validateClient()) return;

    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/atelier/giris?next=/atelier/basvuru");
        return;
      }

      // Typed insert payload — same `as never` shim as the edit page,
      // because `@supabase/supabase-js` v2.104+ narrows `.insert()` to
      // `never` when the inferred Row has any non-nullable column.
      const insertPayload: Partial<AtelierRow> & {
        owner_user_id: string;
        name: string;
        slug: string;
      } = {
        owner_user_id: user.id,
        name: name.trim(),
        slug: slug.trim(),
        kind,
        region,
        province,
        bio_tr: emptyToNull(bioTr),
        bio_en: emptyToNull(bioEn),
      };

      const { data, error } = await supabase
        .from("ateliers")
        .insert(insertPayload as never)
        .select("slug")
        .single();

      if (error) {
        // 23505 = unique_violation → most likely the slug.
        if (error.code === "23505") {
          setErrors((prev) => ({ ...prev, slug: T.duplicateSlug[L] }));
        } else {
          setGlobalError(error.message || T.generic[L]);
        }
        return;
      }

      const created = data as { slug: string } | null;
      const targetSlug = created?.slug ?? slug.trim();
      router.push(`/atelier/${targetSlug}/duzenle`);
      router.refresh();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : T.generic[L]);
    } finally {
      setSubmitting(false);
    }
  }

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

      <main className="atelier-auth">
        <div className="atelier-auth-card atelier-auth-card-wide">
          <h1 className="atelier-auth-title">{T.title[L]}</h1>
          <p className="atelier-auth-subtitle">{T.lead[L]}</p>

          {email ? (
            <p className="atelier-fineprint">
              {T.signedInAs[L]}
              <strong>{email}</strong>
            </p>
          ) : null}

          {!configured ? (
            <div className="atelier-alert is-warn">{T.notConfigured[L]}</div>
          ) : null}
          {globalError ? (
            <div className="atelier-alert is-error">{globalError}</div>
          ) : null}

          <form className="atelier-form" onSubmit={onSubmit} noValidate>
            <label className="atelier-field">
              <span className="atelier-field-label">{T.fields.name[L]}</span>
              <input
                className="atelier-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
                autoFocus
              />
              <p className="atelier-field-hint">{T.fields.nameHint[L]}</p>
              {errors.name ? (
                <p className="atelier-field-error">{errors.name}</p>
              ) : null}
            </label>

            <label className="atelier-field">
              <span className="atelier-field-label">{T.fields.slug[L]}</span>
              <div className="atelier-input-prefix">
                <span className="atelier-input-prefix-tag">
                  caelinus.ai/atelier/
                </span>
                <input
                  className="atelier-input atelier-input-bare"
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    // Soft-normalise on input so "Ada Tasarım" → "ada-tasarim"
                    // even when the user types into the slug field directly.
                    const raw = e.target.value;
                    const normalised = slugSchema.safeParse(raw).success
                      ? raw
                      : slugify(raw);
                    setSlug(normalised);
                  }}
                  maxLength={64}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>
              <p className="atelier-field-hint">{T.fields.slugHint[L]}</p>
              {errors.slug ? (
                <p className="atelier-field-error">{errors.slug}</p>
              ) : null}
            </label>

            <div className="atelier-form-row">
              <label className="atelier-field">
                <span className="atelier-field-label">{T.fields.kind[L]}</span>
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
                {errors.kind ? (
                  <p className="atelier-field-error">{errors.kind}</p>
                ) : null}
              </label>

              <label className="atelier-field">
                <span className="atelier-field-label">{T.fields.region[L]}</span>
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
                {errors.region ? (
                  <p className="atelier-field-error">{errors.region}</p>
                ) : null}
              </label>
            </div>

            <label className="atelier-field">
              <span className="atelier-field-label">{T.fields.province[L]}</span>
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
              <p className="atelier-field-hint">{T.fields.provinceHint[L]}</p>
              {errors.province ? (
                <p className="atelier-field-error">{errors.province}</p>
              ) : null}
            </label>

            <label className="atelier-field">
              <span className="atelier-field-label">{T.fields.bioTr[L]}</span>
              <textarea
                className="atelier-input atelier-textarea"
                value={bioTr}
                onChange={(e) => setBioTr(e.target.value)}
                maxLength={800}
                rows={5}
                required
              />
              <p className="atelier-field-hint">
                {T.fields.bioHint[L]} — {bioTr.trim().length}/800
              </p>
              {errors.bio_tr ? (
                <p className="atelier-field-error">{errors.bio_tr}</p>
              ) : null}
            </label>

            <label className="atelier-field">
              <span className="atelier-field-label">{T.fields.bioEn[L]}</span>
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

            <p className="atelier-fineprint">{T.consent[L]}</p>

            <button
              type="submit"
              className="atelier-btn atelier-btn-primary"
              disabled={submitting || !configured}
            >
              {submitting ? T.submitting[L] : T.submit[L]}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

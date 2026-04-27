"use client";

/**
 * CAELINUS — Atelier item form (create + edit).
 *
 * Shared client body for both `/duzenle/urun/yeni` and
 * `/duzenle/urun/[productId]`. Mode-switched via the `mode` prop.
 *
 * Writes go through the RLS-bound browser client — same pattern as
 * `EditAtelierBody`. Ownership is already enforced server-side by the
 * page wrapper, so we don't re-check it here.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { supabaseConfigured } from "@/lib/env";
import {
  ITEM_CURRENCIES,
  ITEM_STATUSES,
  ITEM_STATUS_LABELS,
  formatMinorUnits,
  itemEditSchema,
  parseMinorUnits,
  slugify,
  type ItemCurrency,
} from "@/lib/atelier/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  AtelierItemRow,
  AtelierRow,
  ItemStatus,
} from "@/lib/supabase/types";
import { useLangStore } from "@/stores/lang-store";

import AtelierMatrix from "../../../../_components/AtelierMatrix";
import ImageUploadField from "../../../../_components/ImageUploadField";

const IMAGE_SLOTS = 4;

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  atelier: Pick<AtelierRow, "id" | "slug" | "name">;
  item?: AtelierItemRow;
};

const T = {
  brand: { tr: "Caelinus · Atelier", en: "Caelinus · Atelier" },
  back: { tr: "← Koleksiyona dön", en: "← Back to collection" },
  newTitle: { tr: "Yeni ürün", en: "New item" },
  editTitle: { tr: "Ürünü düzenle", en: "Edit item" },
  intro: {
    tr: "Atölyenden bir parça. Yayında olduğunda ziyaretçilerin ilk göreceği şey görsel ve isim — onlardan başla.",
    en: "A piece from your bench. When published, visitors see the image and name first — start there.",
  },

  fields: {
    titleTr: { tr: "Ürün adı (Türkçe)", en: "Item name (Turkish)" },
    titleEn: { tr: "Ürün adı (English)", en: "Item name (English)" },
    slug: { tr: "Bağlantı yolu", en: "URL slug" },
    slugHint: {
      tr: "Atölye sayfanda ürünü bulan adres. İstersen otomatik oluşturulanı tut.",
      en: "How visitors will find this item under your atelier. Auto-filled from the title.",
    },
    descTr: { tr: "Kısa açıklama (Türkçe)", en: "Short description (Turkish)" },
    descEn: { tr: "Kısa açıklama (English)", en: "Short description (English)" },
    descHint: {
      tr: "Kart üzerinde göreceğin iki-üç cümlelik özet.",
      en: "Two-three sentences shown on the card.",
    },
    storyTr: { tr: "Hikâyesi (Türkçe)", en: "Story (Turkish)" },
    storyEn: { tr: "Hikâyesi (English)", en: "Story (English)" },
    storyHint: {
      tr: "Ürün sayfasında uzun anlatı için yer.",
      en: "Long-form text on the item page.",
    },
    intent: { tr: "Niyet / kullanım", en: "Intent / use" },
    intentHint: {
      tr: "Tek satırda ürünün niyetini özetle (örn. \"derin uyku için lavanta\").",
      en: "One line summarising what this is for (e.g. 'lavender for deep sleep').",
    },
    moods: { tr: "Etiketler / mood'lar", en: "Tags / moods" },
    moodsHint: {
      tr: "Virgülle ayır (örn. uyku, sakinlik, lavanta).",
      en: "Comma-separated (e.g. sleep, calm, lavender).",
    },
    price: { tr: "Fiyat", en: "Price" },
    priceHint: {
      tr: "Boş bırakırsan kart 'fiyat için iletişim' yazar.",
      en: "Leave blank to show 'inquire for price' on the card.",
    },
    currency: { tr: "Para birimi", en: "Currency" },
    images: { tr: "Görseller", en: "Images" },
    imagesHint: {
      tr: "İlk görsel kapak. En az birini ekle ki yayında çıkabilsin. JPG/PNG/WEBP, 10 MB'a kadar.",
      en: "The first image is the cover. Add at least one before publishing. JPG/PNG/WEBP, up to 10 MB.",
    },
    status: { tr: "Yayın durumu", en: "Publish status" },
    statusHint: {
      tr: "Yayın yalnızca atölyen onaylandıktan sonra ziyaretçilere görünür.",
      en: "Publishing only goes public once your atelier itself is approved.",
    },
  },

  submit: { tr: "Kaydet", en: "Save" },
  submitting: { tr: "Kaydediliyor…", en: "Saving…" },
  saved: { tr: "Kaydedildi.", en: "Saved." },
  delete: { tr: "Bu ürünü sil", en: "Delete this item" },
  deleting: { tr: "Siliniyor…", en: "Deleting…" },
  deleteConfirm: {
    tr: "Bu ürünü kalıcı olarak silmek istediğinden emin misin?",
    en: "Permanently delete this item?",
  },

  notConfigured: {
    tr: "Supabase ortam değişkenleri henüz dolmamış. .env.local'i hazırla, sonra tekrar dene.",
    en: "Supabase environment isn't wired up yet. Fill .env.local and try again.",
  },
  generic: {
    tr: "Bir şey ters gitti. Bir saniye sonra tekrar dene.",
    en: "Something went wrong. Try again in a moment.",
  },
} as const;

export default function ItemFormBody({ mode, atelier, item }: Props) {
  const router = useRouter();
  const { lang, hydrated, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  const configured = supabaseConfigured();

  const [titleTr, setTitleTr] = useState(item?.title_tr ?? "");
  const [titleEn, setTitleEn] = useState(item?.title_en ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [descTr, setDescTr] = useState(item?.description_tr ?? "");
  const [descEn, setDescEn] = useState(item?.description_en ?? "");
  const [storyTr, setStoryTr] = useState(item?.story_tr ?? "");
  const [storyEn, setStoryEn] = useState(item?.story_en ?? "");
  const [intent, setIntent] = useState(item?.intent ?? "");
  const [moodsRaw, setMoodsRaw] = useState((item?.moods ?? []).join(", "));
  const [currency, setCurrency] = useState<ItemCurrency>(
    (item?.currency as ItemCurrency) ?? "TRY",
  );
  const [priceRaw, setPriceRaw] = useState(
    item?.price_amount ? formatMinorUnits(item.price_amount, "tr") : "",
  );
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? "draft");

  // 4 fixed image slots, seeded from existing item.images.
  const initialImages = useMemo(() => {
    const arr: (string | null)[] = Array(IMAGE_SLOTS).fill(null);
    (item?.images ?? []).slice(0, IMAGE_SLOTS).forEach((url, i) => {
      arr[i] = url ?? null;
    });
    return arr;
  }, [item?.images]);
  const [images, setImages] = useState<(string | null)[]>(initialImages);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Auto-slug from title until the user explicitly edits it.
  useEffect(() => {
    if (!slugTouched && titleTr) {
      setSlug(slugify(titleTr));
    }
  }, [titleTr, slugTouched]);

  // Stable suffix for storage paths in `create` mode — keeps each form
  // session's uploads in their own folder so an abandoned new-item draft
  // doesn't collide with the next one.
  const tempId = useMemo(() => {
    if (item?.id) return item.id.slice(0, 8);
    return Math.random().toString(36).slice(2, 10);
  }, [item?.id]);

  function buildPayload() {
    const cleanImages = images.filter((u): u is string => !!u && u.length > 0);
    const moods = moodsRaw
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
    const priceMinor = parseMinorUnits(priceRaw);
    return {
      slug: slug.trim(),
      title_tr: titleTr.trim(),
      title_en: titleEn.trim(),
      description_tr: descTr.trim(),
      description_en: descEn.trim(),
      story_tr: storyTr.trim(),
      story_en: storyEn.trim(),
      currency,
      price_amount: priceMinor ?? 0,
      moods,
      intent: intent.trim(),
      plant_ids: [] as string[],
      images: cleanImages,
      status,
      position: item?.position ?? 0,
      collection_id: item?.collection_id ?? null,
      frequency_hz: item?.frequency_hz ?? null,
    };
  }

  function validate(payload: ReturnType<typeof buildPayload>): boolean {
    const result = itemEditSchema.safeParse(payload);
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

  async function onSave() {
    setGlobalError(null);
    setSaved(false);
    if (!configured) {
      setGlobalError(T.notConfigured[L]);
      return;
    }

    const payload = buildPayload();
    if (!validate(payload)) return;

    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const dbPayload = {
        atelier_id: atelier.id,
        slug: payload.slug,
        title_tr: payload.title_tr,
        title_en: payload.title_en || null,
        description_tr: payload.description_tr || null,
        description_en: payload.description_en || null,
        story_tr: payload.story_tr || null,
        story_en: payload.story_en || null,
        currency: payload.currency,
        price_amount: payload.price_amount,
        moods: payload.moods,
        intent: payload.intent || null,
        plant_ids: payload.plant_ids,
        images: payload.images,
        status: payload.status,
        position: payload.position,
        collection_id: payload.collection_id,
        frequency_hz: payload.frequency_hz,
      };

      if (mode === "create") {
        const { data, error } = await supabase
          .from("atelier_items")
          .insert(dbPayload as never)
          .select("id, slug")
          .single();

        if (error) {
          setGlobalError(error.message || T.generic[L]);
          return;
        }
        const row = data as { id: string; slug: string } | null;
        if (row) {
          router.push(`/atelier/${atelier.slug}/duzenle/urun/${row.id}`);
          router.refresh();
        }
      } else {
        if (!item) return;
        const { error } = await supabase
          .from("atelier_items")
          .update(dbPayload as never)
          .eq("id", item.id);

        if (error) {
          setGlobalError(error.message || T.generic[L]);
          return;
        }
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    if (typeof window !== "undefined" && !window.confirm(T.deleteConfirm[L])) {
      return;
    }
    setGlobalError(null);
    setDeleting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("atelier_items")
        .delete()
        .eq("id", item.id);
      if (error) {
        setGlobalError(error.message || T.generic[L]);
        return;
      }
      router.push(`/atelier/${atelier.slug}/duzenle?tab=items`);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  function setImageAt(index: number, url: string | null) {
    setImages((prev) => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
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
          <Link
            href={`/atelier/${atelier.slug}/duzenle`}
            className="atelier-ribbon-btn"
          >
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

      <main className="atelier-edit">
        <header className="atelier-edit-head">
          <h1 className="atelier-edit-title">
            {mode === "create" ? T.newTitle[L] : T.editTitle[L]}
          </h1>
          <p className="atelier-edit-handle">
            {atelier.name} · caelinus.world/atelier/{atelier.slug}
          </p>
          <p className="atelier-edit-intro" style={{ marginTop: 8 }}>
            {T.intro[L]}
          </p>
        </header>

        {!configured ? (
          <div className="atelier-alert is-warn">{T.notConfigured[L]}</div>
        ) : null}
        {globalError ? (
          <div className="atelier-alert is-error">{globalError}</div>
        ) : null}
        {saved ? <div className="atelier-alert is-info">{T.saved[L]}</div> : null}

        <section className="atelier-edit-panel">
          {/* ── images ───────────────────────────────────────── */}
          <h2 className="atelier-edit-h2">{T.fields.images[L]}</h2>
          <p className="atelier-edit-intro">{T.fields.imagesHint[L]}</p>
          <div className="atelier-item-images-grid">
            {Array.from({ length: IMAGE_SLOTS }).map((_, i) => (
              <ImageUploadField
                key={i}
                atelierId={atelier.id}
                slot={`item-${tempId}-${i}`}
                value={images[i]}
                onChange={(url) => setImageAt(i, url)}
                label={
                  i === 0
                    ? L === "tr"
                      ? "Kapak"
                      : "Cover"
                    : `${L === "tr" ? "Görsel" : "Image"} ${i + 1}`
                }
                shape={i === 0 ? "wide" : "square"}
                disabled={saving || deleting}
              />
            ))}
          </div>
          {errors.images ? (
            <p className="atelier-field-error">{errors.images}</p>
          ) : null}

          {/* ── title / slug ─────────────────────────────────── */}
          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.titleTr[L]}</span>
            <input
              className="atelier-input"
              type="text"
              value={titleTr}
              onChange={(e) => setTitleTr(e.target.value)}
              maxLength={120}
              required
            />
            {errors.title_tr ? (
              <p className="atelier-field-error">{errors.title_tr}</p>
            ) : null}
          </label>

          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.titleEn[L]}</span>
            <input
              className="atelier-input"
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              maxLength={120}
            />
          </label>

          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.slug[L]}</span>
            <input
              className="atelier-input"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              maxLength={64}
            />
            <p className="atelier-field-hint">{T.fields.slugHint[L]}</p>
            {errors.slug ? (
              <p className="atelier-field-error">{errors.slug}</p>
            ) : null}
          </label>

          {/* ── price / currency ─────────────────────────────── */}
          <div className="atelier-form-row">
            <label className="atelier-field">
              <span className="atelier-field-label">{T.fields.price[L]}</span>
              <input
                className="atelier-input"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={priceRaw}
                onChange={(e) => setPriceRaw(e.target.value)}
              />
              <p className="atelier-field-hint">{T.fields.priceHint[L]}</p>
              {errors.price_amount ? (
                <p className="atelier-field-error">{errors.price_amount}</p>
              ) : null}
            </label>

            <label className="atelier-field">
              <span className="atelier-field-label">
                {T.fields.currency[L]}
              </span>
              <select
                className="atelier-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as ItemCurrency)}
              >
                {ITEM_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* ── description ──────────────────────────────────── */}
          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.descTr[L]}</span>
            <textarea
              className="atelier-input atelier-textarea"
              value={descTr}
              onChange={(e) => setDescTr(e.target.value)}
              maxLength={800}
              rows={4}
            />
            <p className="atelier-field-hint">
              {T.fields.descHint[L]} — {descTr.trim().length}/800
            </p>
            {errors.description_tr ? (
              <p className="atelier-field-error">{errors.description_tr}</p>
            ) : null}
          </label>

          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.descEn[L]}</span>
            <textarea
              className="atelier-input atelier-textarea"
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              maxLength={800}
              rows={3}
            />
          </label>

          {/* ── intent / moods ───────────────────────────────── */}
          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.intent[L]}</span>
            <input
              className="atelier-input"
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              maxLength={120}
            />
            <p className="atelier-field-hint">{T.fields.intentHint[L]}</p>
          </label>

          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.moods[L]}</span>
            <input
              className="atelier-input"
              type="text"
              value={moodsRaw}
              onChange={(e) => setMoodsRaw(e.target.value)}
            />
            <p className="atelier-field-hint">{T.fields.moodsHint[L]}</p>
          </label>

          {/* ── story ────────────────────────────────────────── */}
          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.storyTr[L]}</span>
            <textarea
              className="atelier-input atelier-textarea"
              value={storyTr}
              onChange={(e) => setStoryTr(e.target.value)}
              maxLength={4000}
              rows={6}
            />
            <p className="atelier-field-hint">
              {T.fields.storyHint[L]} — {storyTr.trim().length}/4000
            </p>
          </label>

          <label className="atelier-field">
            <span className="atelier-field-label">{T.fields.storyEn[L]}</span>
            <textarea
              className="atelier-input atelier-textarea"
              value={storyEn}
              onChange={(e) => setStoryEn(e.target.value)}
              maxLength={4000}
              rows={5}
            />
          </label>

          {/* ── status ───────────────────────────────────────── */}
          <fieldset className="atelier-field atelier-status-field">
            <legend className="atelier-field-label">
              {T.fields.status[L]}
            </legend>
            <p className="atelier-field-hint">{T.fields.statusHint[L]}</p>
            <div className="atelier-status-radio-row">
              {ITEM_STATUSES.map((s) => (
                <label
                  key={s}
                  className={
                    "atelier-status-radio" +
                    (status === s ? " is-active" : "")
                  }
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                  />
                  <span>{ITEM_STATUS_LABELS[s][L]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <div className="atelier-edit-savebar">
          {mode === "edit" && item ? (
            <button
              type="button"
              className="atelier-btn atelier-btn-ghost"
              onClick={onDelete}
              disabled={saving || deleting || !configured}
            >
              {deleting ? T.deleting[L] : T.delete[L]}
            </button>
          ) : null}
          <button
            type="button"
            className="atelier-btn atelier-btn-primary"
            onClick={onSave}
            disabled={saving || deleting || !configured}
          >
            {saving ? T.submitting[L] : T.submit[L]}
          </button>
        </div>
      </main>
    </div>
  );
}

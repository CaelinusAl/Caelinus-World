"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useLangStore } from "@/stores/lang-store";
import { useProfileStore } from "@/stores/profile-store";
import { useSanctumStore } from "@/stores/sanctum-store";
import {
  plants,
  MOOD_LABELS,
  type Mood,
  type GaiaPlant,
} from "@/data/gaia";
import {
  groupEntriesByDate,
  todayDate,
} from "@/lib/sanctum/selectors";
import {
  toSanctumDate,
  type JournalEntry,
} from "@/lib/sanctum/types";

/* ───── i18n strings ───── */
const T = {
  ribbonMark: { tr: "CAELINUS · SANCTUM · DEFTER", en: "CAELINUS · SANCTUM · JOURNAL" },
  back: { tr: "Sanctum'a dön", en: "Back to Sanctum" },
  langAria: { tr: "Dil", en: "Language" },

  composerTitle: { tr: "Yeni sayfa", en: "New page" },
  composerHint: {
    tr: "Bugün toprak sana ne fısıldadı?",
    en: "What did the soil whisper to you today?",
  },
  fieldDate: { tr: "Tarih", en: "Date" },
  fieldPlant: { tr: "Bitki", en: "Plant" },
  fieldPlantNone: { tr: "— bitki seçme (sadece mood) —", en: "— no plant (mood only) —" },
  fieldHz: { tr: "Frekans (Hz)", en: "Frequency (Hz)" },
  fieldMoods: { tr: "Mood", en: "Mood" },
  fieldTitle: { tr: "Başlık (opsiyonel)", en: "Title (optional)" },
  fieldBody: { tr: "Defterin", en: "Your page" },
  bodyPlaceholder: {
    tr: "Birkaç cümle yeter… nefes, koku, ses, hatıra, niyet.",
    en: "A few lines are enough… breath, scent, sound, memory, intent.",
  },
  submit: { tr: "Sayfayı kaydet", en: "Save page" },
  submitting: { tr: "Yazılıyor…", en: "Writing…" },
  cancelEdit: { tr: "Vazgeç", en: "Cancel" },
  saveChanges: { tr: "Değişikliği kaydet", en: "Save changes" },

  emptyTitle: { tr: "Henüz hiçbir sayfa yazılmadı", en: "No pages have been written yet" },
  emptyBody: {
    tr: "İlk satır en zor olandır. Bir nefes al, bir bitkiye dokun, geri dön — yaz.",
    en: "The first line is the hardest. Take a breath, touch a plant, return — write.",
  },

  edit: { tr: "Düzenle", en: "Edit" },
  remove: { tr: "Sil", en: "Delete" },
  removeConfirm: {
    tr: "Bu sayfayı kalıcı olarak silmek istediğinden emin misin?",
    en: "Are you sure you want to permanently delete this page?",
  },
  noTitle: { tr: "(başlıksız)", en: "(untitled)" },
  noPlant: { tr: "—", en: "—" },

  errorBody: {
    tr: "En az birkaç kelime yaz lütfen.",
    en: "Please write at least a few words.",
  },
  errorMood: {
    tr: "En az bir mood seç.",
    en: "Pick at least one mood.",
  },

  saved: { tr: "Sayfa kaydedildi.", en: "Page saved." },
  updated: { tr: "Sayfa güncellendi.", en: "Page updated." },
};

/* Plants sorted alphabetically per locale for the picker. */
function sortedPlantsFor(lang: "tr" | "en"): GaiaPlant[] {
  return [...plants].sort((a, b) =>
    a.name[lang].localeCompare(b.name[lang], lang === "tr" ? "tr" : "en")
  );
}

/* All 8 canonical moods in display order. */
const ALL_MOODS: Mood[] = [
  "sleep",
  "focus",
  "heart",
  "cleansing",
  "awakening",
  "clarity",
  "grounding",
  "joy",
];

const PLANTS_BY_ID = new Map(plants.map((p) => [p.id, p]));

type FormState = {
  date: string;
  plantId: string; // "" = none
  frequency: string; // string for input control; parsed on submit
  moods: Mood[];
  title: string;
  body: string;
};

const EMPTY_FORM = (): FormState => ({
  date: todayDate(),
  plantId: "",
  frequency: "",
  moods: [],
  title: "",
  body: "",
});

export default function SanctumDefterPage() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const langHydrate = useLangStore((s) => s.hydrate);

  const profile = useProfileStore((s) => s.profile);
  const profileHydrate = useProfileStore((s) => s.hydrate);

  const entries = useSanctumStore((s) => s.entries);
  const sanctumHydrated = useSanctumStore((s) => s.hydrated);
  const sanctumHydrate = useSanctumStore((s) => s.hydrate);
  const addEntry = useSanctumStore((s) => s.addEntry);
  const updateEntry = useSanctumStore((s) => s.updateEntry);
  const removeEntry = useSanctumStore((s) => s.removeEntry);

  useEffect(() => {
    langHydrate();
    profileHydrate();
    sanctumHydrate();
  }, [langHydrate, profileHydrate, sanctumHydrate]);

  /* ─── COMPOSER STATE ─── */
  const [form, setForm] = useState<FormState>(EMPTY_FORM());
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  /* When a plant is selected and Hz is empty, autofill plant.frequency.
     When the profile exists and *both* are empty, fall back to profile.frequency. */
  function handlePlantChange(nextPlantId: string) {
    setForm((cur) => {
      const next = { ...cur, plantId: nextPlantId };
      if (cur.frequency.trim() === "") {
        if (nextPlantId) {
          const p = PLANTS_BY_ID.get(nextPlantId);
          if (p) next.frequency = String(p.frequency);
        } else if (profile) {
          next.frequency = String(profile.frequency);
        }
      }
      return next;
    });
  }

  function toggleMood(m: Mood) {
    setForm((cur) => {
      const has = cur.moods.includes(m);
      return {
        ...cur,
        moods: has ? cur.moods.filter((x) => x !== m) : [...cur.moods, m],
      };
    });
  }

  function startEdit(entry: JournalEntry) {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      plantId: entry.plantId ?? "",
      frequency:
        typeof entry.frequency === "number" ? String(entry.frequency) : "",
      moods: entry.moods,
      title: entry.title ?? "",
      body: entry.body,
    });
    setError(null);
    setFlash(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM());
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = form.body.trim();
    if (body.length < 4) {
      setError(T.errorBody[lang]);
      return;
    }
    if (form.moods.length === 0) {
      setError(T.errorMood[lang]);
      return;
    }
    const freq = form.frequency.trim()
      ? Number(form.frequency.replace(",", "."))
      : null;

    const payload = {
      date: form.date || todayDate(),
      plantId: form.plantId || null,
      frequency:
        typeof freq === "number" && Number.isFinite(freq) ? freq : null,
      moods: form.moods,
      body,
      title: form.title.trim() || undefined,
      ritualOfPlantId: null,
      imageDataUrl: null,
    };

    if (editingId) {
      updateEntry(editingId, payload);
      setFlash(T.updated[lang]);
    } else {
      addEntry(payload);
      setFlash(T.saved[lang]);
    }
    setForm(EMPTY_FORM());
    setEditingId(null);
    setError(null);
  }

  function handleRemove(id: string) {
    if (typeof window !== "undefined") {
      const ok = window.confirm(T.removeConfirm[lang]);
      if (!ok) return;
    }
    removeEntry(id);
    if (editingId === id) cancelEdit();
  }

  const plantOptions = useMemo(() => sortedPlantsFor(lang), [lang]);
  const grouped = useMemo(() => groupEntriesByDate(entries), [entries]);

  /* Format date for the day header — locale-aware */
  function formatDay(d: string): string {
    try {
      const dt = new Date(`${d}T00:00:00`);
      return dt.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return d;
    }
  }

  return (
    <main className="sanctum-page">
      <div className="sanctum-bg" aria-hidden="true" />
      <div className="sanctum-overlay" aria-hidden="true" />
      <div className="sanctum-vignette" aria-hidden="true" />
      <div className="sanctum-glow sanctum-glow-a" aria-hidden="true" />
      <div className="sanctum-glow sanctum-glow-b" aria-hidden="true" />

      <header className="sanctum-ribbon">
        <Link href="/universe/sanctum" className="sanctum-ribbon-back">
          ← {T.back[lang]}
        </Link>
        <div className="sanctum-ribbon-mark">{T.ribbonMark[lang]}</div>
        <div
          className="sanctum-lang-switch"
          role="group"
          aria-label={T.langAria[lang]}
        >
          <button
            type="button"
            className={`sanctum-lang-btn ${lang === "tr" ? "is-active" : ""}`}
            aria-pressed={lang === "tr"}
            onClick={() => setLang("tr")}
          >
            TR
          </button>
          <span className="sanctum-lang-divider" aria-hidden="true">·</span>
          <button
            type="button"
            className={`sanctum-lang-btn ${lang === "en" ? "is-active" : ""}`}
            aria-pressed={lang === "en"}
            onClick={() => setLang("en")}
          >
            EN
          </button>
        </div>
      </header>

      <section className="sanctum-shell">
        {/* COMPOSER */}
        <form
          className={`sanctum-composer ${editingId ? "is-editing" : ""}`}
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="sanctum-composer-head">
            <div className="sanctum-composer-title">{T.composerTitle[lang]}</div>
            <div className="sanctum-composer-hint">{T.composerHint[lang]}</div>
          </div>

          <div className="sanctum-composer-row">
            <label className="sanctum-field">
              <span className="sanctum-field-label">{T.fieldDate[lang]}</span>
              <input
                className="sanctum-input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                max={todayDate()}
              />
            </label>

            <label className="sanctum-field sanctum-field-grow">
              <span className="sanctum-field-label">{T.fieldPlant[lang]}</span>
              <select
                className="sanctum-input sanctum-select"
                value={form.plantId}
                onChange={(e) => handlePlantChange(e.target.value)}
              >
                <option value="">{T.fieldPlantNone[lang]}</option>
                {plantOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name[lang]} · {p.frequency} Hz
                  </option>
                ))}
              </select>
            </label>

            <label className="sanctum-field sanctum-field-narrow">
              <span className="sanctum-field-label">{T.fieldHz[lang]}</span>
              <input
                className="sanctum-input"
                type="number"
                inputMode="numeric"
                placeholder="528"
                min={1}
                max={20000}
                step={1}
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
              />
            </label>
          </div>

          <div className="sanctum-field">
            <span className="sanctum-field-label">{T.fieldMoods[lang]}</span>
            <div className="sanctum-mood-row">
              {ALL_MOODS.map((m) => {
                const lbl = MOOD_LABELS[m];
                const active = form.moods.includes(m);
                return (
                  <button
                    type="button"
                    key={m}
                    className={`sanctum-mood-chip ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                    onClick={() => toggleMood(m)}
                  >
                    <span className="sanctum-mood-symbol" aria-hidden="true">
                      {lbl.symbol}
                    </span>
                    <span>{lbl[lang]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="sanctum-field">
            <span className="sanctum-field-label">{T.fieldTitle[lang]}</span>
            <input
              className="sanctum-input"
              type="text"
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <label className="sanctum-field">
            <span className="sanctum-field-label">{T.fieldBody[lang]}</span>
            <textarea
              className="sanctum-input sanctum-textarea"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder={T.bodyPlaceholder[lang]}
              rows={5}
            />
          </label>

          {error ? (
            <div className="sanctum-error" role="alert">
              {error}
            </div>
          ) : null}
          {flash ? (
            <div className="sanctum-flash" role="status">
              {flash}
            </div>
          ) : null}

          <div className="sanctum-composer-actions">
            <button type="submit" className="sanctum-btn sanctum-btn-primary">
              {editingId ? T.saveChanges[lang] : T.submit[lang]}
            </button>
            {editingId ? (
              <button
                type="button"
                className="sanctum-btn sanctum-btn-ghost"
                onClick={cancelEdit}
              >
                {T.cancelEdit[lang]}
              </button>
            ) : null}
          </div>
        </form>

        {/* LIST */}
        {sanctumHydrated && entries.length === 0 ? (
          <div className="sanctum-empty">
            <div className="sanctum-empty-glyph" aria-hidden="true">
              ☾
            </div>
            <div className="sanctum-empty-title">{T.emptyTitle[lang]}</div>
            <div className="sanctum-empty-body">{T.emptyBody[lang]}</div>
          </div>
        ) : null}

        {grouped.map((day) => (
          <section key={day.date} className="sanctum-day">
            <div className="sanctum-day-head">
              <div className="sanctum-day-line" aria-hidden="true" />
              <div className="sanctum-day-label">{formatDay(day.date)}</div>
              <div className="sanctum-day-line" aria-hidden="true" />
            </div>

            <div className="sanctum-day-entries">
              {day.items.map((entry) => {
                const plant = entry.plantId ? PLANTS_BY_ID.get(entry.plantId) : null;
                return (
                  <article key={entry.id} className="sanctum-entry">
                    <header className="sanctum-entry-head">
                      <div className="sanctum-entry-title">
                        {entry.title || T.noTitle[lang]}
                      </div>
                      <div className="sanctum-entry-meta">
                        {plant ? (
                          <Link
                            className="sanctum-entry-plant"
                            href={`/universe/gaia/plants/${plant.id}`}
                          >
                            {plant.name[lang]}
                          </Link>
                        ) : (
                          <span className="sanctum-entry-plant is-none">
                            {T.noPlant[lang]}
                          </span>
                        )}
                        {typeof entry.frequency === "number" ? (
                          <span className="sanctum-entry-hz">
                            {entry.frequency} Hz
                          </span>
                        ) : null}
                      </div>
                    </header>

                    <div className="sanctum-entry-moods">
                      {entry.moods.map((m) => {
                        const lbl = MOOD_LABELS[m];
                        if (!lbl) return null;
                        return (
                          <span key={m} className="sanctum-entry-mood">
                            {lbl.symbol} {lbl[lang]}
                          </span>
                        );
                      })}
                    </div>

                    <p className="sanctum-entry-body">{entry.body}</p>

                    <footer className="sanctum-entry-foot">
                      <button
                        type="button"
                        className="sanctum-entry-action"
                        onClick={() => startEdit(entry)}
                      >
                        {T.edit[lang]}
                      </button>
                      <button
                        type="button"
                        className="sanctum-entry-action is-danger"
                        onClick={() => handleRemove(entry.id)}
                      >
                        {T.remove[lang]}
                      </button>
                    </footer>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}

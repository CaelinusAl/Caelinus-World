"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { joinNetwork } from "@/lib/members/actions";
import {
  MEMBER_ROLE_LABEL,
  normalizeHandle,
  type MemberRole,
} from "@/lib/members/types";
import { ZODIAC_LABEL } from "@/lib/frequency";
import { useProfileStore } from "@/stores/profile-store";

import styles from "../network.module.css";

const SELECTABLE_ROLES: MemberRole[] = [
  "writer",
  "artist",
  "designer",
  "producer",
];

export default function JoinForm({
  initialHandle,
  initialRoles,
  initialHomeCode,
  alreadyInNetwork,
}: {
  initialHandle: string;
  initialRoles: MemberRole[];
  initialHomeCode: number | null;
  alreadyInNetwork: boolean;
}) {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const hydrate = useProfileStore((s) => s.hydrate);

  const [handle, setHandle] = useState(initialHandle);
  const [roles, setRoles] = useState<MemberRole[]>(
    initialRoles.filter((r) => r !== "seeker"),
  );
  const [homeCode, setHomeCode] = useState<string>(
    initialHomeCode ? String(initialHomeCode) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function toggleRole(r: MemberRole) {
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  }

  async function submit() {
    setError(null);
    const h = normalizeHandle(handle);
    if (h.length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalı.");
      return;
    }
    setBusy(true);
    const res = await joinNetwork({
      handle: h,
      roles: roles.length ? roles : ["seeker"],
      homeCode: homeCode ? Number(homeCode) : null,
      frequencyProfile: profile ?? null,
    });
    setBusy(false);
    if (res.ok) {
      router.push(`/u/${res.data.handle}`);
    } else {
      setError(res.error);
    }
  }

  const zodiac = profile?.zodiac ? ZODIAC_LABEL[profile.zodiac] : null;

  return (
    <main className={styles.page}>
      <div className={styles.formWrap}>
        <header className={styles.hero} style={{ marginBottom: 32 }}>
          <div className={styles.kicker}>✦ Frekans Ağı ✦</div>
          <h1 className={styles.title} style={{ fontSize: "clamp(28px,5vw,46px)" }}>
            {alreadyInNetwork ? "Profilini güncelle" : "Ağa katıl"}
          </h1>
          <p className={styles.subtitle}>
            Bir kullanıcı adı seç, ne ürettiğini söyle. Frekansın varsa
            kimliğine bağlanır — yoksa sonra eklersin.
          </p>
        </header>

        <div className={styles.formCard}>
          {profile && (
            <div className={styles.freqNote}>
              <span>✦</span>
              <span>
                Frekansın bağlanacak: {zodiac ? `${zodiac.symbol} ${zodiac.tr}` : ""}
                {profile.frequency ? ` · ${profile.frequency} Hz` : ""}
              </span>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Kullanıcı adı</label>
            <div className={styles.handleField}>
              <span className={styles.handlePrefix}>@</span>
              <input
                className={styles.handleInput}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="frekansin"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={30}
              />
            </div>
            <p className={styles.hint}>
              Küçük harf, rakam ve alt çizgi · 3–30 karakter · profilin:
              /u/{normalizeHandle(handle) || "..."}
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Rollerin</label>
            <div className={styles.roleGrid}>
              {SELECTABLE_ROLES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={`${styles.roleChip} ${
                    roles.includes(r) ? styles.roleChipOn : ""
                  }`}
                >
                  {MEMBER_ROLE_LABEL[r].tr}
                </button>
              ))}
            </div>
            <p className={styles.hint}>
              Birden çok seçebilirsin. Hiçbiri seçili değilse “Arayıcı” olarak
              katılırsın.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Yuva kodu (opsiyonel)</label>
            <input
              className={styles.input}
              value={homeCode}
              onChange={(e) =>
                setHomeCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
              }
              placeholder="SANRI haritasında bir kod · 1–81 (örn. 42)"
              inputMode="numeric"
            />
            <p className={styles.hint}>
              SANRI 81 şehir-kodundan birinde “yuvalan” (örn. 42 · Konya · Dönüş).
            </p>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="button"
            className={styles.btnPrimary}
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            disabled={busy}
            onClick={submit}
          >
            {busy
              ? "Bağlanıyor…"
              : alreadyInNetwork
                ? "Güncelle"
                : "Ağa katıl"}
          </button>

          <Link href="/network" className={styles.backLink}>
            ← Ağa dön
          </Link>
        </div>
      </div>
    </main>
  );
}

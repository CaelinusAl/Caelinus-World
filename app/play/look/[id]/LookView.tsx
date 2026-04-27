"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CinemaCTA, StageHero } from "@/app/_stage";
import {
  ARCHETYPES,
  SCENES,
  ZODIACS,
  type ArchetypeId,
  type SceneId,
  type ZodiacId,
} from "@/data/play-assets";
import { useLangStore } from "@/stores/lang-store";

type Props = {
  id: string;
  archetype: string;
  zodiac: string;
  scene: string;
  renderUrl: string;
  createdAt: string;
  shareUrl: string;
  /** Cache-row id behind this saved look — likes attach to play_renders. */
  renderId: string;
  initialLikes: number;
  initialLiked: boolean;
};

const ARCHETYPE_BY_ID = new Map(ARCHETYPES.map((a) => [a.id as string, a]));
const ZODIAC_BY_ID = new Map(ZODIACS.map((z) => [z.id as string, z]));
const SCENE_BY_ID = new Map(SCENES.map((s) => [s.id as string, s]));

export default function LookView({
  archetype,
  zodiac,
  scene,
  renderUrl,
  createdAt,
  shareUrl,
  renderId,
  initialLikes,
  initialLiked,
}: Props) {
  const { lang, hydrated, hydrate, toggle } = useLangStore();
  const L = hydrated ? lang : "tr";

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const a = ARCHETYPE_BY_ID.get(archetype as ArchetypeId);
  const z = ZODIAC_BY_ID.get(zodiac as ZodiacId);
  const s = SCENE_BY_ID.get(scene as SceneId);
  const tone = z?.tone ?? "magenta";

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Optimistic like state. Server is the source of truth; we reconcile
  // with the response payload after each toggle.
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [likePending, setLikePending] = useState(false);

  const onToggleLike = async () => {
    if (likePending) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));
    setLikePending(true);
    try {
      const res = await fetch("/api/play/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderId }),
      });
      if (res.status === 401) {
        // Roll back then bounce to login with a return path.
        setLiked(wasLiked);
        setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
        const next = window.location.pathname + window.location.search;
        window.location.href = `/atelier/giris?next=${encodeURIComponent(next)}`;
        return;
      }
      if (!res.ok) throw new Error("like failed");
      const j = (await res.json()) as { liked: boolean; count: number };
      setLiked(j.liked);
      setLikeCount(j.count);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
      setToast(L === "tr" ? "Beğeni gönderilemedi." : "Couldn't send like.");
    } finally {
      setLikePending(false);
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast(L === "tr" ? "Bağlantı panoya kopyalandı." : "Link copied.");
    } catch {
      setToast(L === "tr" ? "Kopyalanamadı." : "Copy failed.");
    }
  };

  const onShareNative = async () => {
    if (typeof navigator === "undefined" || !("share" in navigator)) {
      onCopy();
      return;
    }
    try {
      await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
        title: `${z?.label[L] ?? zodiac} · Caelinus Play`,
        url: shareUrl,
      });
    } catch {
      // user cancel — silent
    }
  };

  const formattedDate = new Date(createdAt).toLocaleDateString(
    L === "tr" ? "tr-TR" : "en-GB",
    { day: "2-digit", month: "long", year: "numeric" },
  );

  return (
    <div className="play-shell">
      <header className="play-ribbon">
        <Link href="/play" className="play-ribbon-brand">
          <span className="play-ribbon-mark" aria-hidden="true">⌖</span>
          <span className="play-ribbon-name">Caelinus · Play</span>
        </Link>
        <div className="play-ribbon-actions">
          <Link href="/play" className="play-ribbon-btn">
            {L === "tr" ? "Stüdyo" : "Studio"}
          </Link>
          <button
            type="button"
            className="play-ribbon-lang"
            onClick={toggle}
            aria-label="Toggle language"
          >
            <span className={L === "tr" ? "is-active" : ""}>TR</span>
            <span className="play-ribbon-lang-divider">·</span>
            <span className={L === "en" ? "is-active" : ""}>EN</span>
          </button>
        </div>
      </header>

      <main className="play-main">
        <StageHero
          layout="compact"
          tone={tone}
          eyebrow={L === "tr" ? "Caelinus · Play" : "Caelinus · Play"}
          title={z?.label[L] ?? zodiac}
          lead={[a?.label[L], s?.label[L]].filter(Boolean).join(" · ") || undefined}
        />

        <section className="play-look-showcase">
          <div className="play-look-image-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={renderUrl} alt={z?.label[L] ?? zodiac} />
          </div>

          <p className="play-look-meta">
            <span>
              <b>{a?.label[L] ?? archetype}</b>
            </span>
            <span>·</span>
            <span>
              <b>{z?.label[L] ?? zodiac}</b>
            </span>
            <span>·</span>
            <span>
              <b>{s?.label[L] ?? scene}</b>
            </span>
            <span>·</span>
            <span>{formattedDate}</span>
          </p>

          <div className="play-look-likebar">
            <button
              type="button"
              className={"play-look-like" + (liked ? " is-liked" : "")}
              onClick={onToggleLike}
              aria-pressed={liked}
              aria-label={
                liked
                  ? L === "tr"
                    ? "Beğenmekten vazgeç"
                    : "Unlike"
                  : L === "tr"
                    ? "Beğen"
                    : "Like"
              }
            >
              <span className="play-look-like-icon" aria-hidden="true">
                {liked ? "♥" : "♡"}
              </span>
              <span className="play-look-like-count">{likeCount}</span>
              <span className="play-look-like-label">
                {likeCount === 1
                  ? L === "tr"
                    ? "beğeni"
                    : "like"
                  : L === "tr"
                    ? "beğeni"
                    : "likes"}
              </span>
            </button>
          </div>

          <div className="play-look-actions">
            <CinemaCTA
              variant="primary"
              tone={tone}
              trailingGlyph="↗"
              onClick={onShareNative}
            >
              {L === "tr" ? "Paylaş" : "Share"}
            </CinemaCTA>
            <CinemaCTA
              variant="ghost"
              tone="cosmic"
              trailingGlyph="❏"
              onClick={onCopy}
            >
              {L === "tr" ? "Bağlantıyı kopyala" : "Copy link"}
            </CinemaCTA>
            <CinemaCTA
              href="/play"
              variant="ghost"
              tone="gold"
              trailingGlyph="→"
            >
              {L === "tr" ? "Kendi görünümünü oluştur" : "Make your own"}
            </CinemaCTA>
          </div>

          {toast ? (
            <p className="play-actions-toast" role="status">
              {toast}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}

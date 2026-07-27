"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ArchiveBootstrap,
  ArchiveSectionDetail,
  ArchiveView,
} from "@/lib/codex/experience-contract";
import { universeUrl } from "@/lib/public-domains";

import AmbientAudio from "./AmbientAudio";
import type { ArchiveCameraState } from "./ArchiveCamera";
import CinematicIntro from "./CinematicIntro";
import ImageVaultViewer from "./ImageVaultViewer";
import KnowledgeGraphViewer from "./KnowledgeGraphViewer";
import LivingBook from "./LivingBook";
import PageTransition from "./PageTransition";

type ArchiveExperienceProps = {
  bootstrap: ArchiveBootstrap;
};

const NAV: Array<{ id: ArchiveView; label: string; glyph: string }> = [
  { id: "home", label: "Eşik", glyph: "✶" },
  { id: "book", label: "Living Book", glyph: "▤" },
  { id: "graph", label: "Relation Atlas", glyph: "⌘" },
  { id: "vault", label: "Image Vault", glyph: "◇" },
];

export default function ArchiveExperience({ bootstrap }: ArchiveExperienceProps) {
  const firstBible = bootstrap.bibles.find((bible) => bible.sections.length) ?? bootstrap.bibles[0];
  const firstSection = firstBible.sections[0] ?? null;
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState<ArchiveView>("home");
  const [transitionKey, setTransitionKey] = useState(0);
  const [activeBibleId, setActiveBibleId] = useState(firstBible.id);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [section, setSection] = useState<ArchiveSectionDetail | null>(null);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [camera, setCamera] = useState<ArchiveCameraState>({ x: 0, y: 0, zoom: 1 });
  const sceneRef = useRef<HTMLDivElement>(null);
  const sectionRequestRef = useRef(0);

  const entityLabels = useMemo(
    () => new Map(bootstrap.graph.nodes.map((node) => [node.id, node.label])),
    [bootstrap.graph.nodes],
  );

  const openView = useCallback((next: ArchiveView) => {
    setView(next);
    setTransitionKey((current) => current + 1);
    requestAnimationFrame(() => sceneRef.current?.focus({ preventScroll: true }));
  }, []);

  const openSection = useCallback(async (
    sectionId: string,
    bibleId?: string,
    navigate = true,
  ) => {
    const requestId = ++sectionRequestRef.current;
    if (bibleId) setActiveBibleId(bibleId);
    setActiveSectionId(sectionId);
    setSectionLoading(true);
    if (navigate) openView("book");
    try {
      const response = await fetch(`/api/archive/section/${encodeURIComponent(sectionId)}`);
      if (!response.ok) throw new Error("section unavailable");
      const nextSection = await response.json() as ArchiveSectionDetail;
      if (requestId === sectionRequestRef.current) setSection(nextSection);
    } catch {
      if (requestId === sectionRequestRef.current) setSection(null);
    } finally {
      if (requestId === sectionRequestRef.current) setSectionLoading(false);
    }
  }, [openView]);

  const beginMilestone = useCallback(() => {
    if (firstSection) void openSection(firstSection.id, firstBible.id, false);
  }, [firstBible.id, firstSection, openSection]);

  const enterMilestone = useCallback(() => {
    setView("book");
    setTransitionKey((current) => current + 1);
    setEntered(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedEntityId) setSelectedEntityId(null);
      if (!event.altKey) return;
      const index = Number(event.key) - 1;
      if (NAV[index]) openView(NAV[index].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openView, selectedEntityId]);

  if (!entered) {
    return <CinematicIntro onBegin={beginMilestone} onEnter={enterMilestone} />;
  }

  return (
    <main className={`archive-experience is-${view}`}>
      <div className="archive-world" aria-hidden="true">
        <div className="archive-world__horizon" />
        <div className="archive-world__vault" />
      </div>

      <header className="archive-hud">
        <button type="button" className="archive-brand" onClick={() => openView("home")}>
          <span aria-hidden="true">☉</span>
          <span>
            <strong>CAELINUS CODEX</strong>
            <small>Canon {bootstrap.canonVersion}</small>
          </span>
        </button>
        <nav aria-label="Codex deneyimleri">
          {NAV.map((item, index) => (
            <button
              type="button"
              key={item.id}
              aria-current={view === item.id ? "page" : undefined}
              className={view === item.id ? "is-active" : undefined}
              onClick={() => openView(item.id)}
              title={`Alt+${index + 1}`}
            >
              <span aria-hidden="true">{item.glyph}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="archive-hud__actions">
          <a href={universeUrl("temple")}>CAELINUS.AI ↗</a>
          <AmbientAudio />
        </div>
      </header>

      <PageTransition transitionKey={transitionKey} sceneRef={sceneRef}>
        {view === "home" ? (
          <section className="archive-home" aria-labelledby="archive-home-title">
            <div className="archive-home__hero">
              <p className="archive-kicker">THE LIVING DIGITAL TWIN OF TÜRKİYE</p>
              <h1 id="archive-home-title">Bilgi burada okunmaz.<br />Hatırlanır.</h1>
              <p>{bootstrap.meta.subtitle}</p>
            </div>

            <div className="archive-home__stats" aria-label="Codex istatistikleri">
              {[
                [bootstrap.meta.bibleCount, "Cilt"],
                [bootstrap.meta.sectionCount, "Bölüm"],
                [bootstrap.meta.entityCount, "Varlık"],
                [bootstrap.meta.imageCount, "Görsel"],
              ].map(([value, label]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="archive-home__portals">
              <button type="button" onClick={() => openView("book")}>
                <span aria-hidden="true">▤</span>
                <small>01 · OKU</small>
                <strong>Living Book</strong>
                <p>On altı ciltlik kanonun sayfalarını aç.</p>
              </button>
              <button type="button" onClick={() => openView("graph")}>
                <span aria-hidden="true">⌘</span>
                <small>02 · BAĞLAN</small>
                <strong>Relation Atlas</strong>
                <p>Mesleklerin, yerlerin ve ilkelerin yaşayan ağında gezin.</p>
              </button>
              <button type="button" onClick={() => openView("vault")}>
                <span aria-hidden="true">◇</span>
                <small>03 · GÖR</small>
                <strong>Image Vault</strong>
                <p>Production Bible’ın 132 görsel hafıza yuvasına gir.</p>
              </button>
            </div>

            <p className="archive-home__health">
              {bootstrap.meta.gapCount} açık kanon boşluğu · Kaynaklar donduruldu · Silme yok
            </p>
          </section>
        ) : null}

        {view === "book" ? (
          <LivingBook
            bibles={bootstrap.bibles}
            activeBibleId={activeBibleId}
            activeSectionId={activeSectionId}
            section={section}
            loading={sectionLoading}
            entityLabels={entityLabels}
            onBible={(bibleId) => {
              setActiveBibleId(bibleId);
              setActiveSectionId(null);
              setSection(null);
            }}
            onSection={(sectionId) => void openSection(sectionId)}
            onEntity={(entityId) => {
              setSelectedEntityId(entityId);
              openView("graph");
            }}
          />
        ) : null}

        {view === "graph" ? (
          <KnowledgeGraphViewer
            nodes={bootstrap.graph.nodes}
            edges={bootstrap.graph.edges}
            chains={bootstrap.graph.chains}
            occurrences={bootstrap.graph.occurrences}
            selectedId={selectedEntityId}
            camera={camera}
            onCamera={setCamera}
            onSelect={setSelectedEntityId}
            onSection={(sectionId, bibleId) => void openSection(sectionId, bibleId)}
          />
        ) : null}

        {view === "vault" ? <ImageVaultViewer images={bootstrap.images} /> : null}
      </PageTransition>

      <footer className="archive-statusline">
        <span>Experience Engine {bootstrap.experienceVersion}</span>
        <span>Canon-safe · Read only</span>
        <span>{view === "graph" ? `Camera ${Math.round(camera.zoom * 100)}%` : NAV.find((item) => item.id === view)?.label}</span>
      </footer>
    </main>
  );
}

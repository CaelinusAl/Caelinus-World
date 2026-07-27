"use client";

import { useMemo } from "react";

import type {
  ArchiveGraphChain,
  ArchiveGraphEdge,
  ArchiveGraphNode,
  ArchiveOccurrence,
} from "@/lib/codex/experience-contract";

import ArchiveCamera, {
  ARCHIVE_CAMERA_LIMITS,
  constrainCamera,
  type ArchiveCameraState,
} from "./ArchiveCamera";

type KnowledgeGraphViewerProps = {
  nodes: ArchiveGraphNode[];
  edges: ArchiveGraphEdge[];
  chains: ArchiveGraphChain[];
  occurrences: Record<string, ArchiveOccurrence[]>;
  selectedId: string | null;
  camera: ArchiveCameraState;
  onCamera: (camera: ArchiveCameraState) => void;
  onSelect: (id: string | null) => void;
  onSection: (sectionId: string, bibleId: string) => void;
};

const WIDTH = 1000;
const HEIGHT = 650;

function layoutNodes(nodes: ArchiveGraphNode[]) {
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;
  const golden = Math.PI * (3 - Math.sqrt(5));
  return new Map(nodes.map((node, index) => {
    const radius = 92 + Math.sqrt(index / Math.max(nodes.length - 1, 1)) * 220;
    const angle = index * golden - Math.PI / 2;
    return [node.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius * 0.72,
    }];
  }));
}

export default function KnowledgeGraphViewer({
  nodes,
  edges,
  chains,
  occurrences,
  selectedId,
  camera,
  onCamera,
  onSelect,
  onSection,
}: KnowledgeGraphViewerProps) {
  const positions = useMemo(() => layoutNodes(nodes), [nodes]);
  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const neighbors = selected
    ? edges
      .filter((edge) => edge.a === selected.id || edge.b === selected.id)
      .sort((a, b) => Number(b.canonical) - Number(a.canonical) || b.weight - a.weight)
      .slice(0, 16)
      .map((edge) => ({
        edge,
        node: nodes.find((node) => node.id === (edge.a === selected.id ? edge.b : edge.a)),
      }))
      .filter((item): item is { edge: ArchiveGraphEdge; node: ArchiveGraphNode } => Boolean(item.node))
    : [];

  const changeZoom = (delta: number) => {
    onCamera(constrainCamera({ ...camera, zoom: camera.zoom + delta }));
  };

  return (
    <section className="knowledge-graph" aria-labelledby="knowledge-graph-title">
      <div className="knowledge-graph__stage">
        <header>
          <div>
            <p className="archive-kicker">CANONICAL RELATION ATLAS</p>
            <h2 id="knowledge-graph-title">Knowledge Graph</h2>
          </div>
          <ArchiveCamera camera={camera} onCamera={onCamera} />
        </header>

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          tabIndex={0}
          aria-label={`${nodes.length} varlık ve ${edges.length} ilişki içeren kanonik bilgi grafiği`}
          onWheel={(event) => {
            event.preventDefault();
            changeZoom(event.deltaY > 0 ? -0.08 : 0.08);
          }}
          onKeyDown={(event) => {
            const step = ARCHIVE_CAMERA_LIMITS.panStep;
            const delta = event.key === "ArrowLeft" ? { x: step, y: 0 }
              : event.key === "ArrowRight" ? { x: -step, y: 0 }
                : event.key === "ArrowUp" ? { x: 0, y: step }
                  : event.key === "ArrowDown" ? { x: 0, y: -step }
                    : null;
            if (!delta) return;
            event.preventDefault();
            onCamera(constrainCamera({ ...camera, x: camera.x + delta.x, y: camera.y + delta.y }));
          }}
        >
          <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
            {edges.map((edge) => {
              const a = positions.get(edge.a);
              const b = positions.get(edge.b);
              if (!a || !b) return null;
              return (
                <line
                  key={`${edge.a}-${edge.b}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  className={edge.canonical ? "is-canonical" : undefined}
                  opacity={selectedId && edge.a !== selectedId && edge.b !== selectedId ? 0.08 : undefined}
                  strokeWidth={Math.min(3, 0.5 + Math.log2(edge.weight + 1) * 0.35)}
                />
              );
            })}
            {nodes.map((node) => {
              const point = positions.get(node.id);
              if (!point) return null;
              const isSelected = node.id === selectedId;
              return (
                <g
                  key={node.id}
                  className={`knowledge-node${isSelected ? " is-selected" : ""}`}
                  transform={`translate(${point.x} ${point.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.label}, ${node.type}, ${node.sections} bölüm`}
                  onClick={() => onSelect(isSelected ? null : node.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(isSelected ? null : node.id);
                    }
                  }}
                >
                  <circle r={isSelected ? 13 : 7 + Math.min(6, Math.log2(node.total + 1))} fill={node.color} />
                  {(isSelected || node.total > 20) ? <text y={-16}>{node.label}</text> : null}
                </g>
              );
            })}
          </g>
        </svg>

        <div className="knowledge-graph__chains" aria-label="Kanonik zincirler">
          {chains.map((chain) => (
            <button
              type="button"
              key={chain.id}
              onClick={() => onSelect(chain.steps.find((step) => positions.has(step)) ?? null)}
            >
              {chain.label}
            </button>
          ))}
        </div>
      </div>

      <aside className="relation-explorer" aria-label="İlişki gezgini">
        {selected ? (
          <>
            <button type="button" className="relation-explorer__close" onClick={() => onSelect(null)} aria-label="İlişki panelini kapat">×</button>
            <span className="relation-explorer__glyph" style={{ color: selected.color }} aria-hidden="true">◉</span>
            <p className="archive-kicker">{selected.type}</p>
            <h2>{selected.label}</h2>
            <p>{selected.total} geçiş · {selected.sections} bölüm</p>

            <h3>Yakın ilişkiler</h3>
            <div className="relation-explorer__neighbors">
              {neighbors.map(({ edge, node }) => (
                <button type="button" key={node.id} onClick={() => onSelect(node.id)}>
                  <span style={{ background: node.color }} />
                  <strong>{node.label}</strong>
                  <small>{edge.canonical ? "kanonik" : `${edge.weight} bağ`}</small>
                </button>
              ))}
            </div>

            <h3>Arşivde geçtiği yerler</h3>
            <div className="relation-explorer__occurrences">
              {(occurrences[selected.id] ?? []).slice(0, 12).map((item) => (
                <button
                  type="button"
                  key={`${item.sectionId}-${item.bibleId}`}
                  onClick={() => onSection(item.sectionId, item.bibleId)}
                >
                  <small>{item.bibleId}</small>
                  <span>{item.sectionTitle}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="relation-explorer__empty">
            <span aria-hidden="true">⌘</span>
            <h2>Bir varlık seç</h2>
            <p>Meslekler, malzemeler, yerler ve ilkeler arasındaki yaşayan ağı aç.</p>
          </div>
        )}
      </aside>
    </section>
  );
}

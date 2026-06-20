"use client";

/**
 * WorldShell — Caelinus dünya iskeleti (Bible §9 page-wrapper).
 *
 * Her dünya (bölge) aynı çerçeveyi giyer → "izole sayfa" değil, bir
 * uygarlığın bölgesi hissi. Kayıttan (lib/world/worlds.ts) imza renk + sembol
 * + duygu çeker; eşik (geri dönüş) JourneyProvider veil'iyle dünya renginde
 * geçiş yapar; tipografi/renk tokens.css'ten gelir.
 *
 * İçerik (children) sayfanın kendi gövdesidir — WorldShell yalnızca çerçeve,
 * atmosfer, ribbon ve hero'yu standartlaştırır.
 */
import type { CSSProperties, ReactNode } from "react";
import JourneyLink from "@/components/journey/JourneyLink";
import { Icon } from "@/components/icons";
import { getWorld, type WorldKey } from "@/lib/world/worlds";
import "./WorldShell.css";

type Props = {
  world: WorldKey;
  locale: "tr" | "en";
  /** Eşik — evrene/üst dünyaya dönüş (JourneyLink ile renkli geçiş). */
  back?: { href: string; label: string };
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Ribbon sağ slotu (örn. dil değiştirici). */
  aside?: ReactNode;
  children: ReactNode;
};

export default function WorldShell({
  world,
  locale,
  back,
  kicker,
  title,
  subtitle,
  aside,
  children,
}: Props) {
  const w = getWorld(world);
  const styleVars = {
    ["--world-accent"]: w.accent,
    ["--world-glow"]: w.glow,
  } as CSSProperties;

  return (
    <main className="world-shell" data-world={world} style={styleVars}>
      <div className="world-shell-backdrop" aria-hidden="true">
        <div className="world-shell-glow world-shell-glow-a" />
        <div className="world-shell-glow world-shell-glow-b" />
        <div className="world-shell-grain" />
      </div>

      <header className="world-shell-ribbon">
        {back ? (
          <JourneyLink
            href={back.href}
            color={w.accent}
            className="world-shell-back"
          >
            ← {back.label}
          </JourneyLink>
        ) : (
          <span aria-hidden="true" />
        )}

        <div className="world-shell-mark">
          <Icon name={w.symbol} size={15} className="world-shell-mark-icon" />
          <span className="world-shell-mark-name">{w.name[locale]}</span>
        </div>

        <div className="world-shell-aside">{aside}</div>
      </header>

      <section className="world-shell-inner">
        <div className="world-shell-hero">
          <div className="world-shell-emblem" aria-hidden="true">
            <Icon name={w.symbol} size={38} />
          </div>
          {kicker ? <div className="world-shell-kicker">{kicker}</div> : null}
          <h1 className="world-shell-title">{title}</h1>
          {subtitle ? (
            <p className="world-shell-subtitle">{subtitle}</p>
          ) : null}
          <div className="world-shell-emotion">{w.emotion[locale]}</div>
        </div>

        <div className="world-shell-content">{children}</div>
      </section>
    </main>
  );
}

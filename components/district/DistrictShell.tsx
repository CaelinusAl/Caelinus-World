"use client";

/**
 * DistrictShell — District Engine kabuk (yaşayan modül çerçevesi).
 *
 * `WorldShell`'in registry-tabanlı genellemesi: bir district'i 8 sütunundan
 * (hero, lore, portal, accent...) besler. Hero görseli CSS arka plan katmanı
 * olarak çizilir (kırık <img> riski yok); portallar tier'a göre kapılanır.
 *
 * İçerik (children) sayfanın kendi gövdesidir — kabuk yalnızca çerçeve,
 * atmosfer, ribbon, lore-hero ve portalları standartlaştırır.
 */

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import type { District, Tier } from "@/lib/district/types";
import DistrictPortals from "./DistrictPortals";
import "./DistrictShell.css";

type Props = {
  district: District;
  locale: "tr" | "en";
  tier: Tier;
  /** Eşik — evrene dönüş. */
  back?: { href: string; label: string };
  /** Portalları gizle (sayfa kendi gövdesini kullanıyorsa). */
  hidePortals?: boolean;
  /**
   * Yaşayan 3B district sahnesi (DistrictBlenderScene). Verilirse CSS hero
   * görseli yerine arka plan stage katmanı olarak çizilir; lore/portal
   * içeriği bunun üstünde kalır.
   */
  scene?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
};

export default function DistrictShell({
  district,
  locale,
  tier,
  back = { href: "/universe", label: locale === "en" ? "Universe" : "Evren" },
  hidePortals = false,
  scene,
  aside,
  children,
}: Props) {
  const styleVars = {
    ["--district-accent"]: district.hero.accent,
    ["--district-glow"]: district.hero.glow,
    ["--district-hero"]: `url("${district.hero.image}")`,
  } as CSSProperties;

  return (
    <main className="district-shell" data-district={district.key} style={styleVars}>
      {scene && <div className="district-shell-stage">{scene}</div>}

      <div className="district-shell-backdrop" aria-hidden="true">
        {!scene && <div className="district-shell-hero-img" />}
        <div className="district-shell-glow district-shell-glow-a" />
        <div className="district-shell-glow district-shell-glow-b" />
        <div className="district-shell-grain" />
      </div>

      <header className="district-shell-ribbon">
        <Link href={back.href} className="district-shell-back">
          ← {back.label}
        </Link>

        <div className="district-shell-mark">
          <Icon name={district.hero.symbol} size={15} className="district-shell-mark-icon" />
          <span className="district-shell-mark-name">{district.name[locale]}</span>
        </div>

        <div className="district-shell-aside">{aside}</div>
      </header>

      <section className="district-shell-inner">
        <div className="district-shell-lede">
          <div className="district-shell-emblem" aria-hidden="true">
            <Icon name={district.hero.symbol} size={38} />
          </div>
          <div className="district-shell-kicker">{district.lore.kicker}</div>
          <h1 className="district-shell-title">{district.lore.title[locale]}</h1>
          <p className="district-shell-intro">{district.lore.intro[locale]}</p>
          <div className="district-shell-emotion">{district.emotion[locale]}</div>
        </div>

        {!hidePortals && (
          <DistrictPortals district={district} locale={locale} tier={tier} />
        )}

        {children && <div className="district-shell-content">{children}</div>}

        {district.lore.mythos && (
          <p className="district-shell-mythos">{district.lore.mythos}</p>
        )}
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FrequencyBadge from "./FrequencyBadge";

// v1 yumuşak lansman kapsamı — yalnızca tamamlanmış çekirdek alanlar menüde.
// Gaia / Ağ / Ask gibi deneysel alanlar geçici olarak gizli (rotalar yaşıyor
// ama menüden link verilmiyor; hazır oldukça geri eklenir).
const NAV_ITEMS = [
  { href: "/universe", label: "Universe" },
  { href: "/universe/shop", label: "Shop" },
  { href: "/atelier", label: "Atelier" },
  { href: "/manifesto", label: "Manifesto" },
];

const HIDDEN_PATHS = ["/", "/universe", "/onboarding"];

export default function TopBar() {
  const pathname = usePathname() ?? "/";

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <header className="cae-topbar" aria-label="Caelinus navigation">
      <Link href="/" className="cae-topbar-brand">
        <span className="cae-topbar-brand-mark">✦</span>
        <span>CAELINUS</span>
      </Link>

      <nav className="cae-topbar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`cae-topbar-link ${isActive ? "is-active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="cae-topbar-aside">
        <FrequencyBadge />
      </div>
    </header>
  );
}

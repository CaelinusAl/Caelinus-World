"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FrequencyBadge from "./FrequencyBadge";

const NAV_ITEMS = [
  { href: "/universe", label: "Universe" },
  { href: "/universe/shop", label: "Shop" },
  { href: "/universe/gaia", label: "Gaia" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/ai", label: "Ask" },
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

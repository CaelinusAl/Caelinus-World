"use client";

/**
 * LuxButton — Caelinus AI sayfalarının ortak buton language'i.
 *
 * Üç ton:
 *   • gold (default)  — siyah zemin üstünde altın kabartmalı, primary CTA
 *   • nude            — bej dolgu, ikincil aksiyon
 *   • ghost           — transparan + altın kontur, üçüncül
 *
 * Erişebilirlik: standart <button>, disabled state'i CSS'le solduruluyor.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "gold" | "nude" | "ghost";
type Size = "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeading?: ReactNode;
};

export default function LuxButton({
  variant = "gold",
  size = "md",
  loading = false,
  iconLeading,
  className = "",
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      className={`lux-btn lux-btn--${variant} lux-btn--${size} ${
        loading ? "is-loading" : ""
      } ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="lux-btn-spinner" aria-hidden="true" />}
      {!loading && iconLeading && (
        <span className="lux-btn-icon" aria-hidden="true">
          {iconLeading}
        </span>
      )}
      <span className="lux-btn-label">{children}</span>
    </button>
  );
}

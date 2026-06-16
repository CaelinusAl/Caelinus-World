"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { CartItemExtended, OrderItem, OrderMetadata, SceneId } from "@/types/play";
import { loadCart, removeItemFromCart, clearCart, cartTotal } from "@/lib/cart-storage";
import { loadAvatarConfig } from "@/lib/avatar-storage";
import PriceDual from "@/components/shop/PriceDual";

type CheckoutStep = "cart" | "address" | "confirm";

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItemExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("Turkey");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    setItems(loadCart());
    setLoading(false);
  }, []);

  const total = useMemo(() => cartTotal(items), [items]);

  const handleRemove = useCallback((productId: string, size: string) => {
    setItems((prev) =>
      removeItemFromCart(prev, productId, size as never)
    );
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!fullName || !emailValid) return;
    setSubmitting(true);
    setOrderError(null);

    const orderItems: OrderItem[] = items.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      size: i.size,
      qty: i.qty,
      unitPrice: i.product.numericPrice,
      tryOnContext: i.tryOnContext,
    }));

    const avatarCfg = loadAvatarConfig();
    const stagesUsed = [...new Set(
      items
        .map((i) => i.tryOnContext?.selectedStage)
        .filter(Boolean)
    )] as SceneId[];

    const metadata: OrderMetadata = {
      tryOnUsageCount: items.filter((i) => i.tryOnContext?.tryOnUsed).length,
      stagesUsed,
      avatarPreset: avatarCfg.bodyType,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          email,
          address: { fullName, phone, line1, line2, city, zip, country },
          metadata,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOrderId(data.order.id);
        setItems(clearCart());
        setStep("confirm");
      } else {
        setOrderError("Ön sipariş oluşturulamadı. Lütfen tekrar deneyin.");
      }
    } catch {
      setOrderError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }, [fullName, email, phone, line1, line2, city, zip, country, items, emailValid]);

  /* ── Confirmation screen ── */
  if (step === "confirm" && orderId) {
    return (
      <main className="checkout-page">
        <div className="checkout-page-bg" />
        <div className="checkout-shell">
          <section className="checkout-confirm-card">
            <div className="checkout-confirm-icon">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="rgba(110,255,180,0.92)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div className="checkout-kicker">CAELINUS · ÖN SİPARİŞ</div>
            <h1 className="checkout-confirm-title">
              Ön Siparişin Alındı!
            </h1>
            <div className="checkout-confirm-order-id">{orderId}</div>
            <p className="checkout-confirm-desc">
              Frekansın kaydedildi. Ekibimiz kısa süre içinde e-posta ile
              seninle iletişime geçecek. Henüz herhangi bir ödeme alınmadı.
            </p>
            <div className="checkout-confirm-actions">
              <Link href="/universe/shop" className="checkout-back-link">
                Shop&apos;a Don
              </Link>
              <Link href="/universe" className="checkout-back-link">
                Evrene Don
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <main className="checkout-page">
        <div className="checkout-page-bg" />
        <div className="checkout-shell">
          <section className="checkout-hero">
            <div className="checkout-kicker">CAELINUS · ÖN SİPARİŞ</div>
            <h1 className="checkout-title">ÖN SİPARİŞ</h1>
          </section>
          <div className="checkout-card">
            <div className="ux-skeleton-panel">
              <div className="ux-skeleton-line w100" />
              <div className="ux-skeleton-line w80" />
              <div className="ux-skeleton-line w60" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-page-bg" />

      <div className="checkout-shell">
        <section className="checkout-hero">
          <div className="checkout-kicker">CAELINUS · ÖN SİPARİŞ</div>
          <h1 className="checkout-title">ÖN SİPARİŞ</h1>
        </section>

        {items.length === 0 ? (
          <div className="checkout-card">
            <div className="ux-empty-state">
              <div className="ux-empty-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              </div>
              <div className="ux-empty-title">Sepetin bos</div>
              <div className="ux-empty-desc">
                Urun eklemek icin Shop&apos;a don ve frekansini sec.
              </div>
              <Link href="/universe/shop" className="checkout-back-link" style={{ marginTop: 8 }}>
                Shop&apos;a Don
              </Link>
            </div>
          </div>
        ) : (
          <div className="checkout-layout">
            {/* Cart Summary */}
            <div className="checkout-card">
              <h2 className="checkout-card-title">
                Sepet Ozeti
                <span className="checkout-card-count">{items.length}</span>
              </h2>
              <div className="checkout-items">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="checkout-item"
                  >
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">
                        {item.product.name}
                      </span>
                      <span className="checkout-item-meta">
                        Beden: {item.size} · Adet: {item.qty}
                      </span>
                      {item.tryOnContext?.tryOnUsed && (
                        <span className="checkout-item-tryon">
                          Try-On: {item.tryOnContext.selectedStage} · {item.tryOnContext.avatarPreset}
                        </span>
                      )}
                    </div>
                    <div className="checkout-item-right">
                      <span className="checkout-item-price">
                        <PriceDual usd={item.product.numericPrice * item.qty} />
                      </span>
                      <button
                        className="checkout-remove-btn"
                        onClick={() => handleRemove(item.product.id, item.size)}
                        aria-label="Kaldir"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-total-row">
                <span className="checkout-total-label">Toplam</span>
                <span className="checkout-total-amount">
                  <PriceDual usd={total} />
                </span>
              </div>
            </div>

            {/* Address & Payment */}
            <div className="checkout-card">
              <h2 className="checkout-card-title">İletişim &amp; Teslimat</h2>
              <div className="checkout-form">
                <input
                  className="checkout-input"
                  placeholder="Ad Soyad"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ gridColumn: "1 / -1" }}
                />
                <input
                  className="checkout-input"
                  type="email"
                  placeholder="E-posta (ekibimiz buradan ulaşacak)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ gridColumn: "1 / -1" }}
                />
                <input
                  className="checkout-input"
                  type="tel"
                  placeholder="Telefon (opsiyonel)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ gridColumn: "1 / -1" }}
                />
                <input
                  className="checkout-input"
                  placeholder="Adres Satırı 1 (opsiyonel)"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  style={{ gridColumn: "1 / -1" }}
                />
                <input
                  className="checkout-input"
                  placeholder="Adres Satiri 2 (opsiyonel)"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  style={{ gridColumn: "1 / -1" }}
                />
                <div className="checkout-form-row">
                  <input
                    className="checkout-input"
                    placeholder="Sehir"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <input
                    className="checkout-input"
                    placeholder="Posta Kodu"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                  />
                </div>
                <select
                  className="checkout-select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="Turkey">Turkiye</option>
                  <option value="USA">ABD</option>
                  <option value="UK">Ingiltere</option>
                  <option value="Germany">Almanya</option>
                  <option value="Other">Diger</option>
                </select>

                <div className="checkout-presale-note">
                  <strong>Bu bir ön sipariştir.</strong> Şu an herhangi bir
                  ödeme alınmaz. Ön siparişini aldıktan sonra ekibimiz e-posta
                  ile seninle iletişime geçecek.
                </div>

                {orderError && (
                  <div className="checkout-error-msg">{orderError}</div>
                )}

                <button
                  className="checkout-place-btn"
                  onClick={handlePlaceOrder}
                  disabled={submitting || !fullName || !emailValid}
                >
                  {submitting ? "Gönderiliyor..." : "Ön Siparişi Tamamla"}
                </button>
              </div>
            </div>
          </div>
        )}

        <Link href="/universe/shop" className="checkout-back-link">
          Shop&apos;a Don
        </Link>
      </div>
    </main>
  );
}

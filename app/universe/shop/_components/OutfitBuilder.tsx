"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useWardrobeStore, useDressedCount } from "@/stores/wardrobe-store";
import { useCartStore } from "@/stores/cart-store";
import { useSceneStore } from "@/stores/scene-store";
import { productsExtended } from "@/data/products";
import { cartTotal } from "@/lib/cart-storage";
import type { OutfitSlot } from "@/types/play";

const SLOT_LABELS: Record<OutfitSlot, string> = {
  top: "Ust (Bikini)",
  bottom: "Alt (Pareo)",
  bag: "Canta",
  shoes: "Ayakkabi",
  accessory: "Aksesuar",
};

export default function OutfitBuilder() {
  const dressedSlots = useWardrobeStore((s) => s.dressedSlots);
  const undressSlot = useWardrobeStore((s) => s.undressSlot);
  const dressedCount = useDressedCount();

  const items = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const showCart = useSceneStore((s) => s.showCart);
  const toggleCart = useSceneStore((s) => s.toggleCart);

  const total = cartTotal(items);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addOutfitToCart = () => {
    for (const product of Object.values(dressedSlots)) {
      if (!product) continue;
      const ext = productsExtended.find((p) => p.id === product.id);
      if (ext) addToCart(ext, "M");
    }
  };

  return (
    <div className="shop-outfit-panel">
      <div className="shop-outfit-card">
        <h3 className="shop-outfit-title">
          ✨ Kombin Olustur
          {dressedCount > 0 && <span className="shop-outfit-count">{dressedCount}</span>}
        </h3>
        <div className="shop-outfit-slots">
          {(["top", "bottom", "bag", "shoes", "accessory"] as OutfitSlot[]).map((slot) => {
            const item = dressedSlots[slot];
            return (
              <div key={slot} className={`shop-outfit-slot ${item ? "filled" : ""}`}>
                <div className="shop-outfit-slot-label">{SLOT_LABELS[slot]}</div>
                {item ? (
                  <div className="shop-outfit-slot-content">
                    <span className="shop-outfit-slot-name">{item.name}</span>
                    <span className="shop-outfit-slot-price">{item.price}</span>
                    <button className="shop-outfit-slot-remove" onClick={() => undressSlot(slot)}>✕</button>
                  </div>
                ) : (
                  <div className="shop-outfit-slot-empty">Urun sec ve giydir</div>
                )}
              </div>
            );
          })}
        </div>
        {dressedCount > 0 && (
          <button className="shop-add-outfit-btn" onClick={addOutfitToCart}>
            🛒 Tum Kombini Sepete At
          </button>
        )}
      </div>

      <div className="shop-tryon-card">
        <h3 className="shop-tryon-title">📸 Fotograf Try-On</h3>
        <p className="shop-tryon-desc">Fotografini yukle, AI urunleri uzerine giydirsin</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="shop-tryon-input"
          onChange={handlePhotoUpload}
        />
        <button className="shop-tryon-btn" onClick={() => fileRef.current?.click()}>
          {uploadedPhoto ? "📷 Fotografı Degistir" : "📷 Fotograf Yukle"}
        </button>
        {uploadedPhoto && <p className="shop-tryon-active">✓ Fotografin sahnede gorunuyor!</p>}
      </div>

      <div className="shop-mini-cart">
        <button className="shop-cart-toggle" onClick={toggleCart}>
          <span>🛒 Sepet</span>
          {items.length > 0 && <span className="shop-cart-badge">{items.length}</span>}
        </button>
        {showCart && (
          <div className="shop-cart-dropdown">
            {items.length === 0 ? (
              <p className="shop-cart-empty">Sepet bos</p>
            ) : (
              <>
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="shop-cart-item">
                    <span className="shop-cart-item-name">{item.product.name}</span>
                    <span className="shop-cart-item-qty">{item.size} x{item.qty}</span>
                    <span className="shop-cart-item-price">${item.product.numericPrice}</span>
                  </div>
                ))}
                <div className="shop-cart-total">
                  Toplam: <strong>${total.toFixed(0)}</strong>
                </div>
                <Link href="/universe/shop/checkout" className="shop-checkout-btn">
                  Satin Al
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

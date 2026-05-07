"use client";

/**
 * QRPanel — Desktop'ta QR kodunu gösterir + session status banner'ı.
 *
 * Akış:
 *   • Backend session yaratır, mobileUrl döndürür
 *   • Bu component QR'ı render eder, status'a göre alt yazıyı değiştirir
 *   • "Bağlantıyı sıfırla" CTA'sı parent'a delegasyon eder
 */

import { QRCodeSVG } from "qrcode.react";

import LuxButton from "@/components/caelinus-ai/LuxButton";
import type { AvatarSession, SessionStatus } from "@/lib/caelinus-avatar-core";

const STATUS_COPY: Record<SessionStatus, { kicker: string; title: string; body: string }> = {
  pending: {
    kicker: "✦ Hazır",
    title: "QR'ı telefonunla tara",
    body: "Telefonunda Caelinus mobil capture sayfası açılacak. Kameranı ya da galerini kullan, selfie'ni yolla — buradaki sahnen bedeninle dolacak.",
  },
  "mobile-connected": {
    kicker: "◌ Telefon bağlandı",
    title: "Selfie'ni hazırla",
    body: "Telefonunda capture sayfası açıldı. Yüzünü çerçevele — geri kalanını biz örüyoruz.",
  },
  "selfie-uploading": {
    kicker: "↑ Yükleniyor",
    title: "Selfie aktarılıyor…",
    body: "Görselin Caelinus'a geliyor. Sayfayı kapatma.",
  },
  "selfie-received": {
    kicker: "✓ Geldi",
    title: "Selfie alındı",
    body: "Caelinus seni okumaya başlıyor — birkaç saniye içinde 6 farklı arketip sunacağız.",
  },
  generating: {
    kicker: "✶ Atölye açık",
    title: "Caelinus seni örüyor",
    body: "Yüzün, stilin ve frekansın bir araya geliyor. Sahnen birazdan dolu olacak.",
  },
  ready: {
    kicker: "✦ Hazır",
    title: "Bedenin geldi",
    body: "Aşağıda 3D bedenin var. Outfit ve animasyon ile dene.",
  },
  error: {
    kicker: "× Hata",
    title: "Bir şeyler aksadı",
    body: "Bağlantıyı sıfırlayıp yeniden dene.",
  },
  expired: {
    kicker: "◷ Zaman aşımı",
    title: "Session süresi doldu",
    body: "10 dakikalık QR penceresi kapandı. Yenisini aç.",
  },
};

type Props = {
  session: AvatarSession | null;
  loading?: boolean;
  onReset?: () => void;
};

export default function QRPanel({ session, loading, onReset }: Props) {
  if (loading || !session) {
    return (
      <div className="cav-qr-panel">
        <div className="cav-qr-panel-skeleton">
          <div className="cav-qr-panel-skeleton-pulse" />
          <span>QR hazırlanıyor…</span>
        </div>
      </div>
    );
  }

  const copy = STATUS_COPY[session.status] ?? STATUS_COPY.pending;
  const showQr =
    session.status !== "ready" &&
    session.status !== "error" &&
    session.status !== "expired";

  return (
    <div className={`cav-qr-panel cav-qr-panel--${session.status}`}>
      <div className="cav-qr-panel-status">
        <span className="cav-qr-panel-kicker">{copy.kicker}</span>
        <h3 className="cav-qr-panel-title">{copy.title}</h3>
        <p className="cav-qr-panel-body">{copy.body}</p>
      </div>

      {showQr && (
        <div className="cav-qr-panel-qr-wrapper">
          <div className="cav-qr-panel-qr-frame">
            <QRCodeSVG
              value={session.mobileUrl}
              size={232}
              fgColor="#0a0806"
              bgColor="#f4e7d0"
              level="M"
              imageSettings={{
                src: "",
                height: 0,
                width: 0,
                excavate: false,
              }}
            />
          </div>
          <div className="cav-qr-panel-qr-mark">✦ CAELINUS</div>
          <div className="cav-qr-panel-link" title={session.mobileUrl}>
            {session.mobileUrl}
          </div>
        </div>
      )}

      <div className="cav-qr-panel-meta">
        <div className="cav-qr-panel-meta-row">
          <span>Session</span>
          <code>{session.id}</code>
        </div>
        <div className="cav-qr-panel-meta-row">
          <span>Geçerlilik</span>
          <span>10 dk</span>
        </div>
      </div>

      {onReset && (
        <LuxButton variant="ghost" size="md" onClick={onReset}>
          ↻ Bağlantıyı Sıfırla
        </LuxButton>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

// Caelinus3DScene `.cai-canvas-*` class'larını kullanır — bu stiller
// `caelinus-ai.css`'de yaşar. Avatar Core sayfasında aynı sahne
// kullanıldığı için bu CSS'i de yüklemek zorundayız, aksi hâlde swap-veil
// ve try-on tag overlay'leri default akışta her zaman görünür kalır
// (kullanıcı "avatar görünmüyor" rapor etti — overlay'ler canvas'ı yutuyor).
import "../caelinus-ai/caelinus-ai.css";
import "./caelinus-avatar.css";

export const metadata: Metadata = {
  title: "Caelinus Avatar Core",
  description:
    "QR ile telefondan selfie, masaüstünde 3D avatar — Caelinus'in kendi avatar platformu.",
};

export default function CaelinusAvatarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cav-shell">
      <div className="cav-shell-bg" aria-hidden="true">
        <div className="cav-shell-bg-grain" />
        <div className="cav-shell-bg-glow" />
      </div>

      <header className="cav-header">
        <Link href="/caelinus-avatar/create" className="cav-header-mark">
          <span className="cav-header-mark-glyph">✦</span>
          <span className="cav-header-mark-name">CAELINUS · AVATAR CORE</span>
        </Link>
        <nav className="cav-header-nav" aria-label="Caelinus Avatar Core">
          <Link href="/caelinus-avatar/create" className="cav-header-link">
            Oluştur
          </Link>
          <Link href="/caelinus-ai/try-on" className="cav-header-link">
            Try-on
          </Link>
          <Link href="/universe" className="cav-header-link cav-header-link--ghost">
            Universe
          </Link>
        </nav>
      </header>

      <main className="cav-main">{children}</main>

      <footer className="cav-footer">
        <span className="cav-footer-line">
          ✦ Caelinus Avatar Core — QR transport, provider-pluggable
        </span>
        <span className="cav-footer-tech">
          MockProvider · MediaPipe · React Three Fiber
        </span>
      </footer>
    </div>
  );
}

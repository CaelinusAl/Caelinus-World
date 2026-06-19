/**
 * CAELINUS AVATAR STUDIO — Doğuş Deneyimi (Phase 1A MVP).
 *
 * Rota: /universe/avatar — ilk canlı Caelinus Avatar doğumu.
 * Kaynak: CAELINUS_AVATAR_EXPERIENCE_BIBLE.md §1–§2.
 *
 * Bu sayfa mevcut /avatar (Stack A), /universe/shop/avatar (Stack C) ve
 * MirrorGate akışlarına DOKUNMAZ — kendi içinde kapalı yeni bir deneyimdir.
 * Kalıcılık localStorage; Supabase migration YOK (Phase 1A kapsamı).
 */

import type { Metadata } from "next";

import AvatarBirthFlow from "./_components/AvatarBirthFlow";
import "./avatar-studio.css";

export const metadata: Metadata = {
  title: "Caelinus Avatar · Doğuş",
  description:
    "Yüzünü ver — sana bir tanrıça geri dönsün. Kendin kalacaksın, ama en parlak frekansında.",
};

export default function AvatarStudioPage() {
  return (
    <main className="av-page">
      <div className="av-bg" aria-hidden="true">
        <div className="av-bg-veil" />
        <div className="av-bg-glow" />
      </div>

      <header className="av-masthead">
        <p className="av-masthead-kicker">CAELINUS · DOĞUŞ</p>
        <h1 className="av-masthead-title">Aynaya yaklaş</h1>
        <p className="av-masthead-whisper">
          Bu evrende bir bedenin olacak. Yüzünü ver — sana bir tanrıça geri dönsün.
        </p>
      </header>

      <AvatarBirthFlow />
    </main>
  );
}

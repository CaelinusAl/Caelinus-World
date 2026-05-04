/**
 * /universe/moodboard — Caelinus AI Moodboard
 *
 * Vizyon: kullanıcı tek satırlık bir his yazar; Caelinus dört editöryel
 * kareyi (atmosfer · doku · figür · nesne) ve beş paragraflık okumayı
 * paralel açar. Görseller `caelinus-moodboards/<hash>/` altında
 * Supabase Storage'da content-addressed cache'lenir; aynı vibe
 * tekrar girildiğinde sıfır maliyetle anında geri gelir.
 *
 * Sayfa server component (metadata + ilk render); etkileşim
 * `MoodboardClient`'da.
 */

import type { Metadata } from "next";

import "./moodboard.css";
import MoodboardClient from "./MoodboardClient";

export const metadata: Metadata = {
  title: "AI Moodboard · Caelinus",
  description:
    "Bir his yaz — Caelinus dört katmanlı sayfa açsın. Atmosfer, doku, figür, nesne; ve paletten söze uzanan beş başlıklı bir okuma.",
  openGraph: {
    title: "AI Moodboard · Caelinus",
    description:
      "Bir his yaz — Caelinus dört katmanlı sayfa açsın. Atmosfer · doku · figür · nesne.",
  },
};

export default function MoodboardPage() {
  return <MoodboardClient />;
}

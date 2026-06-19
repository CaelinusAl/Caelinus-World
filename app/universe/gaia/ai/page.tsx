"use client";

/**
 * CAELINUS GAIA AI — "Plant Oracle / Toprak Hafızası" sayfası.
 *
 * Sohbet yaşam döngüsü ve sayfa iskeleti District Engine motorundan
 * (`DistrictAIChat`) gelir; AI rotası registry'den `resolveAssistant`
 * ile çözülür. Bu sayfa yalnızca Gaia'ya özgü slotları (arka plan, yan
 * araçlar, bitki kütüphanesi) doldurur. UI dili: karanlık su zemini,
 * yeşil-altın glow, "Toprak Hafızası" hissi.
 */

import { getDistrict } from "@/lib/district/registry";
import { resolveAssistant } from "@/lib/district/ai";
import DistrictAIChat from "@/components/district/DistrictAIChat";
import { plants } from "@/data/gaia";
import GaiaAIChat from "@/components/gaia/GaiaAIChat";
import PlantOracleCard from "@/components/gaia/PlantOracleCard";
import PlantDiagnosisUpload from "@/components/gaia/PlantDiagnosisUpload";
import MoonPlantingCalendar from "@/components/gaia/MoonPlantingCalendar";
import "./gaia-ai.css";

const FEATURED = plants.slice(0, 6);
const ASSISTANT = resolveAssistant(getDistrict("gaia"));

export default function GaiaAIPage() {
  return (
    <DistrictAIChat
      classPrefix="gaia-ai"
      apiRoute={ASSISTANT.route}
      hero={{
        kicker: "CAELINUS GAIA · PLANT ORACLE",
        title: "Toprak Hafızası",
        lede:
          "Bitkini sor, toprağını oku, ekim zamanını bul. Bilge ve sakin bir doğa rehberi — kesin teşhis yerine olasılık ve belirti diliyle.",
      }}
      foot={{
        backHref: "/universe/gaia",
        backLabel: "Gaia’ya Dön",
        whisper: "Toprak, insan kalbinin unuttuğunu hatırlar.",
      }}
      backdrop={
        <div className="gaia-ai-bg" aria-hidden="true">
          <div className="gaia-ai-water" />
          <div className="gaia-ai-roots" />
          <div className="gaia-ai-glow" />
        </div>
      }
      renderChat={({ messages, busy, submitted, hasError, onSend }) => (
        <GaiaAIChat
          messages={messages}
          busy={busy}
          submitted={submitted}
          hasError={hasError}
          onSend={onSend}
        />
      )}
      renderAside={(onSend) => (
        <>
          <MoonPlantingCalendar onAsk={onSend} />
          <PlantDiagnosisUpload onAsk={onSend} />
        </>
      )}
      renderSections={(onSend) => (
        <section className="gaia-ai-oracle-section" aria-labelledby="gaia-ai-oracle-title">
          <h2 id="gaia-ai-oracle-title" className="gaia-ai-section-title">
            Kütüphaneden bir bitki seç
          </h2>
          <div className="gaia-ai-oracle-grid">
            {FEATURED.map((p) => (
              <PlantOracleCard key={p.id} plant={p} onAsk={onSend} />
            ))}
          </div>
        </section>
      )}
    />
  );
}

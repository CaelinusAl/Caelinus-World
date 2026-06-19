"use client";

/**
 * CAELINUS MODA AI — "Mirror Stylist / Frekans Stilisti" sayfası.
 *
 * Sohbet yaşam döngüsü ve sayfa iskeleti District Engine motorundan
 * (`DistrictAIChat`) gelir; AI rotası registry'den `resolveAssistant`
 * ile çözülür. Bu sayfa yalnızca Bazaar'a özgü slotları (arka plan, burç
 * danışmanı, tanrıça seçici, sanal deneme, frekans kartları) doldurur.
 * UI dili: ayna / mor-altın frekans, Mirror Gate ile uyumlu.
 */

import { getDistrict } from "@/lib/district/registry";
import { resolveAssistant } from "@/lib/district/ai";
import DistrictAIChat from "@/components/district/DistrictAIChat";
import { products } from "@/data/products";
import FashionAIChat from "@/components/fashion/FashionAIChat";
import ZodiacStyleAdvisor from "@/components/fashion/ZodiacStyleAdvisor";
import GoddessSelector from "@/components/fashion/GoddessSelector";
import VirtualTryOnEntry from "@/components/fashion/VirtualTryOnEntry";
import FrequencyStyleCard from "@/components/fashion/FrequencyStyleCard";
import "./fashion-ai.css";

const FEATURED = products.filter((p) => p.category === "bikini").slice(0, 6);
const ASSISTANT = resolveAssistant(getDistrict("fashion"));

export default function FashionAIPage() {
  return (
    <DistrictAIChat
      classPrefix="moda-ai"
      apiRoute={ASSISTANT.route}
      hero={{
        kicker: "CAELINUS BAZAAR · MIRROR STYLIST",
        title: "Frekans Stilisti",
        lede:
          "Sana sadece kıyafet önermem — kimliğini, frekansını ve o günkü hâlini giydiririm. Burcunu söyle, tanrıça arketipini seç, aynada dene.",
      }}
      foot={{
        backHref: "/universe/shop",
        backLabel: "Mirror Gate'e Dön",
        whisper: "Giysi bir örtü değil; frekansının yüzeyidir.",
      }}
      backdrop={
        <div className="moda-ai-bg" aria-hidden="true">
          <div className="moda-ai-mirror" />
          <div className="moda-ai-mist" />
          <div className="moda-ai-glow" />
        </div>
      }
      renderChat={({ messages, busy, submitted, hasError, onSend }) => (
        <FashionAIChat
          messages={messages}
          busy={busy}
          submitted={submitted}
          hasError={hasError}
          onSend={onSend}
        />
      )}
      renderAside={(onSend) => (
        <>
          <ZodiacStyleAdvisor onAsk={onSend} />
          <VirtualTryOnEntry onAsk={onSend} />
        </>
      )}
      renderSections={(onSend) => (
        <>
          <section className="moda-ai-goddess-section">
            <GoddessSelector onAsk={onSend} />
          </section>

          <section className="moda-ai-style-section" aria-labelledby="moda-ai-style-title">
            <h2 id="moda-ai-style-title" className="moda-ai-section-title">
              Koleksiyondan bir frekans seç
            </h2>
            <div className="moda-ai-style-grid">
              {FEATURED.map((p) => (
                <FrequencyStyleCard key={p.id} product={p} onAsk={onSend} />
              ))}
            </div>
          </section>
        </>
      )}
    />
  );
}

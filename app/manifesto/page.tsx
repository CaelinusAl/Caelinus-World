/**
 * /manifesto — Caelinus'un ne olduğunu ve ne olmadığını söyleyen sayfa.
 *
 * "Caelinus bir moda markası değil. Bir deneyim." vizyonu burada
 * editoryal olarak konuşur; ana sayfa (warp), evren hub (portal grid)
 * ve atelier (üretici tarafı) ile birlikte üçüncü ayağı oluşturur.
 *
 * Server component — statik metin, hidrasyon yok. CSS sayfa scope'lu.
 */

import type { Metadata } from "next";
import Link from "next/link";

import { absoluteUrl } from "@/lib/i18n/locale";
import { buildLocaleMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

import "./manifesto.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isTr = locale === "tr";
  const title = isTr
    ? "Manifesto — Bir moda markası değil. Bir deneyim."
    : "Manifesto — Not a fashion brand. An experience.";
  const description = isTr
    ? "Avatarınla giydiğin, AI ile seçtiğin, hikâyesini yaşadığın ürünler. Caelinus, modayı görünür değil hissedilir kılar."
    : "Garments you wear with your avatar, choose with AI and live the story of. Caelinus makes fashion not just seen — felt.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl(locale, "/manifesto"),
      type: "article",
    },
    ...buildLocaleMetadata(locale, "/manifesto"),
  };
}

export default async function ManifestoPage() {
  const locale = await getLocale();
  const isTr = locale === "tr";

  return (
    <main className="manifesto-scene">
      <div className="manifesto-shell">
        <p className="manifesto-kicker">
          ✦ {isTr ? "Caelinus Manifestosu" : "The Caelinus Manifesto"} ✦
        </p>

        <h1 className="manifesto-title">
          {isTr ? (
            <>
              Caelinus bir moda markası
              <br />
              değil. Bir deneyim.
            </>
          ) : (
            <>
              Caelinus is not a fashion brand.
              <br />
              It is an experience.
            </>
          )}
        </h1>

        <div className="manifesto-divider" />

        <p className="manifesto-stanza">
          {isTr ? (
            <>
              <strong>Avatarınla</strong> giydiğin,
              <br />
              <strong>AI ile</strong> seçtiğin,
              <br />
              <strong>hikâyesini</strong> yaşadığın ürünler.
            </>
          ) : (
            <>
              Garments you wear with your <strong>avatar</strong>,
              <br />
              choose with <strong>AI</strong>,
              <br />
              and live the <strong>story</strong> of.
            </>
          )}
        </p>

        <p className="manifesto-stanza">
          {isTr ? (
            <>
              Moda artık sadece görünmez.
              <br />
              <strong>Hissedilir.</strong>
            </>
          ) : (
            <>
              Fashion is no longer only seen.
              <br />
              It is <strong>felt</strong>.
            </>
          )}
        </p>

        <div className="manifesto-divider" />

        <section className="manifesto-pillars" aria-label={isTr ? "Vizyon sütunları" : "Vision pillars"}>
          <article className="manifesto-pillar">
            <div className="manifesto-pillar-symbol">✦</div>
            <h2 className="manifesto-pillar-title">{isTr ? "Bilinç & Frekans" : "Consciousness & Frequency"}</h2>
            <p className="manifesto-pillar-text">
              {isTr
                ? "Her parça bir Solfeggio bandına ve bir niyete bağlı. Stil, sloganla değil, titreşimle anlatılır."
                : "Every piece is tuned to a Solfeggio band and an intent. Style speaks through vibration, not slogans."}
            </p>
          </article>

          <article className="manifesto-pillar">
            <div className="manifesto-pillar-symbol">⌖</div>
            <h2 className="manifesto-pillar-title">{isTr ? "Yalnız Hikâyeli Ürün" : "Story-Only Goods"}</h2>
            <p className="manifesto-pillar-text">
              {isTr
                ? "Vitrindeki her ürünün bir kökeni, bir tasarımcısı, bir hikâyesi vardır. Düz envanter yerine anlatı ticareti."
                : "Each product on the shelf has an origin, a designer, a story. Narrative commerce, not anonymous inventory."}
            </p>
          </article>

          <article className="manifesto-pillar">
            <div className="manifesto-pillar-symbol">∞</div>
            <h2 className="manifesto-pillar-title">{isTr ? "Avatar & AI" : "Avatar & AI"}</h2>
            <p className="manifesto-pillar-text">
              {isTr
                ? "Yüz fotoğrafından doğan kendi 3D avatarın. AI'nin önerdiği, senin onayladığın günlük kombinler."
                : "Your own 3D avatar born from a selfie. Daily looks proposed by AI and confirmed by you."}
            </p>
          </article>

          <article className="manifesto-pillar">
            <div className="manifesto-pillar-symbol">◐</div>
            <h2 className="manifesto-pillar-title">{isTr ? "Topluluk Ağı" : "Community Graph"}</h2>
            <p className="manifesto-pillar-text">
              {isTr
                ? "Sanatçı, zanaatkar, tasarımcı ve üreticinin birbirini takip ettiği, ticaret ile iç içe geçmiş bir ağ."
                : "A network where artists, artisans, designers and producers follow each other — woven into commerce itself."}
            </p>
          </article>
        </section>

        <div className="manifesto-cta-row">
          <Link href="/universe" className="manifesto-cta manifesto-cta--primary">
            {isTr ? "Evrene Gir" : "Enter the Universe"}
          </Link>
          <Link href="/play" className="manifesto-cta">
            {isTr ? "Avatarını Yarat" : "Create Your Avatar"}
          </Link>
          <Link href="/atelier" className="manifesto-cta">
            {isTr ? "Atölye Ağı" : "The Atelier Network"}
          </Link>
        </div>

        <p className="manifesto-signature">
          ✦ {isTr ? "Frekansını giy, evrenle dans et." : "Wear your frequency, dance with the cosmos."} ✦
        </p>
      </div>
    </main>
  );
}

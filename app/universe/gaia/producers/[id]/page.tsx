import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  producers,
  getProducer,
  getPlantsForProducer,
  getRegion,
  PRODUCER_KIND_LABELS,
  MOOD_LABELS,
} from "@/data/gaia";

export function generateStaticParams() {
  return producers.map((p) => ({ id: p.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const producer = getProducer(id);
  if (!producer) return { title: "Üretici bulunamadı" };

  return {
    title: producer.name.tr,
    description: producer.story.tr,
    openGraph: {
      title: `${producer.name.tr} · Caelinus Gaia`,
      description: producer.story.tr,
      type: "article",
    },
  };
}

export default async function ProducerDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const producer = getProducer(id);
  if (!producer) notFound();

  const plants = getPlantsForProducer(producer.id);
  const region = getRegion(producer.region);

  return (
    <main className="prod-root">
      <div className="prod-bg" aria-hidden="true" />
      <div className="prod-vignette" aria-hidden="true" />

      <header className="prod-ribbon">
        <Link href="/universe/gaia/producers" className="prod-ribbon-back">
          ← Üretici Ağı
        </Link>
        <div className="prod-ribbon-mark">
          CAELINUS · GAIA · {producer.name.tr.toUpperCase()}
        </div>
        <Link href="/universe/gaia" className="prod-ribbon-link">
          Gaia
        </Link>
      </header>

      {/* HERO */}
      <section className="prod-hero">
        <div className="prod-hero-kicker">
          ✦ {PRODUCER_KIND_LABELS[producer.kind].tr.toUpperCase()} ·{" "}
          {region?.name.tr.toUpperCase() ?? ""}
        </div>
        <h1 className="prod-hero-title">{producer.name.tr}</h1>
        <div className="prod-hero-meta">
          <span>{producer.city}</span>
          {producer.district && <span>· {producer.district}</span>}
          <span>· {producer.since}&apos;den beri</span>
        </div>

        {producer.certifications && producer.certifications.length > 0 && (
          <div className="prod-certs">
            {producer.certifications.map((c) => (
              <span key={c} className="prod-cert">✓ {c}</span>
            ))}
          </div>
        )}
      </section>

      <section className="prod-content">
        <div className="prod-grid">
          {/* STORY */}
          <article className="prod-card prod-card-wide">
            <div className="prod-card-kicker">Hikâye</div>
            <p className="prod-text-large">{producer.story.tr}</p>
          </article>

          <article className="prod-card">
            <div className="prod-card-kicker">Yöntem</div>
            <p className="prod-text">{producer.method.tr}</p>
          </article>

          {region && (
            <article className="prod-card">
              <div className="prod-card-kicker">{region.name.tr} Toprağı</div>
              <p className="prod-text">{region.signature.tr}</p>
              <div className="prod-cities">
                {region.cities.map((c) => (
                  <span key={c} className="prod-city">{c}</span>
                ))}
              </div>
            </article>
          )}
        </div>

        {/* PLANTS */}
        <section className="prod-plants-section">
          <div className="prod-section-head">
            <div className="prod-section-kicker">✦ ÜRETTİĞİ BİTKİLER ✦</div>
            <h2 className="prod-section-title">Bu ellerin yetiştirdiği konuşan bitkiler</h2>
          </div>

          <div className="prod-plants-grid">
            {plants.map((plant) => (
              <Link
                key={plant.id}
                href={`/universe/gaia/plants/${plant.id}`}
                className="prod-plant-link"
              >
                <article className="prod-plant-card">
                  <div className="prod-plant-image-wrap">
                    <img
                      src={plant.image}
                      alt={plant.name.tr}
                      draggable={false}
                    />
                    <span className="prod-plant-hz">{plant.frequency} Hz</span>
                  </div>
                  <div className="prod-plant-info">
                    <h3 className="prod-plant-name">{plant.name.tr}</h3>
                    <div className="prod-plant-sci">{plant.scientific}</div>
                    <p className="prod-plant-poetic">
                      &ldquo;{plant.poetic.tr}&rdquo;
                    </p>
                    <div className="prod-plant-moods">
                      {plant.moods.slice(0, 3).map((m) => (
                        <span key={m} className="prod-plant-mood">
                          {MOOD_LABELS[m].symbol} {MOOD_LABELS[m].tr}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="prod-cta-section">
          <div className="prod-cta-card">
            <div className="prod-cta-kicker">✦ AĞ İLE BAĞLAN ✦</div>
            <h3 className="prod-cta-title">
              {producer.name.tr} ile yan yana ol
            </h3>
            <p className="prod-cta-text">
              Bu üreticinin ürünleri Caelinus Shop&apos;ta yer alacak. Bekle, gör,
              dokun. Önce bahçeyi gez, sonra senin frekansındakileri keşfet.
            </p>
            <div className="prod-cta-row">
              <Link href="/universe/gaia/plants" className="prod-cta-primary">
                Bitkileri Gez
              </Link>
              <Link href="/universe/shop" className="prod-cta-secondary">
                Caelinus Shop&apos;a Geç →
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

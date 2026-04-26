import Link from "next/link";
import type { Metadata } from "next";
import {
  producers,
  getPlantsForProducer,
  PRODUCER_KIND_LABELS,
  regions,
} from "@/data/gaia";

export const metadata: Metadata = {
  title: "Üretici Ağı",
  description:
    "Caelinus Gaia üretici ağı: Anadolu'nun farklı bölgelerinden bitkileri yetiştiren kooperatifler, köyler ve aile çiftlikleri. Toprağın hafızasını paylaşan bir ekosistem.",
  openGraph: {
    title: "Caelinus · Gaia Üretici Ağı",
    description:
      "Anadolu toprağının canlı ekosistemi. Üreticileri tanı, hikâyeleri dinle, ağa katıl.",
  },
};

export default function ProducersPage() {
  const total = producers.length;
  const cooperatives = producers.filter((p) => p.kind === "cooperative").length;

  return (
    <main className="producers-page">
      <div className="producers-bg-image" />
      <div className="producers-bg-overlay" />
      <div className="matrix-rain" aria-hidden="true" />

      <div className="producers-green-aura producers-green-aura-left" aria-hidden="true" />
      <div className="producers-green-aura producers-green-aura-right" aria-hidden="true" />

      <section className="producers-shell">
        {/* HERO */}
        <div className="producers-hero">
          <div className="producers-kicker">✦ GAIA · ÜRETİCİ AĞI ✦</div>
          <h1 className="producers-title">Toprağı Bilen Eller</h1>
          <p className="producers-subtitle">
            Caelinus, üreticiyi sergilemez — onunla aynı masaya oturur. Anadolu&apos;nun
            farklı bölgelerinden {total} kayıtlı üretici, {cooperatives} kooperatif
            ve {regions.length} bölge bu ağda yaşıyor.
          </p>

          <div className="producers-stats">
            <div className="producers-stat">
              <div className="producers-stat-num">{total}</div>
              <div className="producers-stat-label">Aktif Üretici</div>
            </div>
            <div className="producers-stat">
              <div className="producers-stat-num">{cooperatives}</div>
              <div className="producers-stat-label">Kooperatif</div>
            </div>
            <div className="producers-stat">
              <div className="producers-stat-num">{regions.filter((r) => r.plantIds.length > 0).length}</div>
              <div className="producers-stat-label">Bölge</div>
            </div>
          </div>
        </div>

        {/* PRODUCER DIRECTORY — by region */}
        <section className="producers-directory">
          {regions
            .filter((r) => producers.some((p) => p.region === r.id))
            .map((region) => {
              const list = producers.filter((p) => p.region === region.id);
              return (
                <div key={region.id} className="producers-region-block">
                  <div className="producers-region-head">
                    <h2 className="producers-region-name">{region.name.tr}</h2>
                    <p className="producers-region-sig">
                      &ldquo;{region.signature.tr}&rdquo;
                    </p>
                  </div>

                  <div className="producers-region-grid">
                    {list.map((producer) => {
                      const plants = getPlantsForProducer(producer.id);
                      return (
                        <Link
                          key={producer.id}
                          href={`/universe/gaia/producers/${producer.id}`}
                          className="producers-card-link"
                        >
                          <article className="producers-card-tile">
                            <div className="producers-card-tile-head">
                              <div className="producers-card-tile-kicker">
                                {PRODUCER_KIND_LABELS[producer.kind].tr} · {producer.since}
                              </div>
                              <h3 className="producers-card-tile-name">
                                {producer.name.tr}
                              </h3>
                              <div className="producers-card-tile-place">
                                {producer.city}
                                {producer.district && <> · {producer.district}</>}
                              </div>
                            </div>

                            <p className="producers-card-tile-story">
                              {producer.story.tr}
                            </p>

                            <div className="producers-card-tile-foot">
                              <div className="producers-card-tile-plants">
                                {plants.slice(0, 3).map((p) => (
                                  <span key={p.id} className="producers-card-tile-plant">
                                    {p.name.tr}
                                  </span>
                                ))}
                              </div>
                              <span className="producers-card-tile-arrow">→</span>
                            </div>
                          </article>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </section>

        {/* JOIN THE NETWORK */}
        <section className="producers-join">
          <div className="producers-join-head">
            <div className="producers-join-kicker">✦ AĞA KATIL ✦</div>
            <h2 className="producers-join-title">Sen de bu masaya otur.</h2>
            <p className="producers-join-text">
              Toprakla yapan, üreten, paylaşan herkes Caelinus ağına katılabilir.
              Bilgilerini bırak; bölgesel temsilci seninle iletişime geçsin.
            </p>
          </div>

          <div className="producers-grid">
            <div className="producers-card producers-form-card">
              <div className="producers-card-head">
                <h3>Üretici Frekans Formu</h3>
                <p>
                  Birkaç dakikada doldur — ağ seninle nefes almaya başlasın.
                </p>
              </div>

              <form className="producers-form">
                <input type="text" placeholder="Ad Soyad" />
                <input type="text" placeholder="Telefon / WhatsApp" />
                <input type="text" placeholder="Şehir" />
                <input type="text" placeholder="İlçe / Bölge" />
                <input type="text" placeholder="Üretim Türü" />
                <input type="text" placeholder="Arazi Büyüklüğü" />
                <input
                  type="text"
                  placeholder="Yetiştirdiği Ürünler"
                  className="full"
                />
                <textarea
                  placeholder="Kısa notun: destek ihtiyacı, satış hedefi, üretim modeli..."
                  rows={5}
                  className="full"
                />
                <button type="button" className="producers-submit full">
                  Ağa Katıl
                </button>
              </form>
            </div>

            <div className="producers-side">
              <div className="producers-card">
                <h3>Bu ağın içinde ne var?</h3>
                <ul className="producers-list">
                  <li>• Bölgesel üreticileri bir araya getiren canlı topluluk</li>
                  <li>• Toprak ve ürün bazlı akıllı yönlendirme</li>
                  <li>• Satış ve görünürlük köprüsü</li>
                  <li>• Caelinus AI ile tarım danışmanı desteği</li>
                </ul>
              </div>

              <div className="producers-card">
                <h3>Bir sonraki adım</h3>
                <p className="producers-side-text">
                  Form gerçek başvuru sistemine bağlanacak. Üretici verileri panelde
                  toplanacak; Ask Caelinus tarım zekâsı gibi çalışacak.
                </p>
                <Link href="/universe/gaia" className="producers-back-link">
                  Gaia alanına dön
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

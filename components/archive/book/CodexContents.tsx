import Image from "next/image";
import Link from "next/link";

import type { LivingBookPublicModel } from "@/lib/codex/experience-contract";

const FEATURED_SLUGS = [
  "genesis",
  "world-bible",
  "living-civilization",
  "production-bible",
  "npc-bible",
  "engineering-bible",
  "art-direction",
  "image-archive",
  "canon-decisions",
] as const;

const CHAPTER_DESCRIPTIONS: Record<string, string> = {
  genesis: "Başlangıç, Kaynak, Niyet",
  "world-bible": "Dünya Haritası, Zaman ve Evren",
  "living-civilization": "Anadolu’nun Yaşayan Uygarlığı",
  "production-bible": "Üretim Paketleri ve Teknoloji",
  "npc-bible": "Karakterler, Meslekler, Hikâyeler",
  "engineering-bible": "Sistemler, Mekanikler, Akışlar",
  "art-direction": "Sanat Dili, Estetik, Referanslar",
  "image-archive": "Tüm Görsel Arşiv ve Referanslar",
  "canon-decisions": "Onaylar, Kurallar, İlkeler",
};

const RIGHT_RAIL = [
  ["⌑", "Harita"],
  ["✥", "Meslekler"],
  ["⌂", "Mekânlar"],
  ["✶", "Simgeler"],
  ["⌘", "Kodlar"],
  ["♙", "NPC’ler"],
  ["☾", "Ritüeller"],
  ["✧", "Sanat"],
  ["◈", "Malzemeler"],
  ["⌁", "Tarihler"],
  ["▱", "Notlarım"],
] as const;

export default function CodexContents({ book }: { book: LivingBookPublicModel }) {
  const featuredChapters = FEATURED_SLUGS.map((slug) =>
    book.chapters.find((chapter) => chapter.slug === slug),
  ).filter((chapter) => chapter !== undefined);
  const genesisPages = book.pages.filter((page) =>
    page.canonIds.includes("CN-00"),
  );
  const visualForChapter = (canonId: string | null, index: number) =>
    (canonId
      ? book.pages.find((page) => page.canonIds.includes(canonId))
      : undefined) ??
    book.pages[(index * 13) % book.pages.length];

  return (
    <main className="codex-book codex-contents codex-contents-dashboard">
      <aside className="codex-contents-rail" aria-label="Codex navigation">
        <Link href="/archive" className="codex-contents-brand">
          <strong>CAELINUS<br />CODEX</strong>
          <span>THE LIVING BOOK<br />OF ANATOLIA</span>
          <i aria-hidden="true">⌘</i>
        </Link>
        <nav aria-label="Library tools">
          <Link href="/archive/contents#volume-list">⌕ <span>Search</span></Link>
          <Link href="/archive/contents#bookmarks">☆ <span>Bookmarks</span></Link>
        </nav>
        <div id="bookmarks" className="codex-contents-rail__list">
          <b>Bookmarks</b>
          <span>★ En Sevdiğim Sayfalar</span>
          <span>◷ Son Okunan</span>
          <span>▱ Notlarım</span>
          <span>⌁ Tasarımlar</span>
          <span>♙ NPC’ler</span>
          <span>⌂ Mekânlar</span>
          <span>✶ Simgeler</span>
          <span>⌘ Kodlar</span>
          <span>✥ Haritalar</span>
        </div>
        <fieldset>
          <legend>Dil / Language</legend>
          <button type="button" aria-pressed="true">TR</button>
          <button type="button">EN</button>
          <button type="button">AR</button>
        </fieldset>
        <blockquote>
          “Anadolu bir toprak değil,<br />bir hafızadır.<br />
          Bu kitap o hafızanın<br />yaşayan hâlidir.”
          <cite>Selin Irmak</cite>
        </blockquote>
      </aside>

      <header className="codex-contents-toolbar">
        <span>01</span>
        <b>Genesis</b>
        <span aria-hidden="true">›</span>
        <span>Bölüm 1: İlk Nefes</span>
        <nav aria-label="Page tools">
          <Link href="/archive/contents">İçindekiler</Link>
          <Link href="#volume-list">⌕ Arama</Link>
          <Link href="#bookmarks">＋ Not Ekle</Link>
          <Link href="#codex-place-index">⌖ Yer İmleri</Link>
        </nav>
      </header>

      <section className="codex-contents-stage" aria-label="Open CAELINUS Codex">
        <div className="codex-contents-spread">
          <article className="codex-contents-leaf codex-contents-leaf--index">
            <header>
              <span aria-hidden="true">✣ CAELINUS CODEX ✣</span>
              <h1 id="codex-contents-title">Table of Contents</h1>
              <p>THE LIVING BOOK OF ANATOLIA</p>
            </header>
            <ol id="volume-list">
              {featuredChapters.map((chapter, index) => {
                const visual = visualForChapter(chapter.canonId, index);
                return (
                  <li key={chapter.slug}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Link href={`/archive/chapter/${chapter.slug}`}>
                      <span>
                        <strong>{chapter.title}</strong>
                        <small>{CHAPTER_DESCRIPTIONS[chapter.slug] ?? chapter.subtitle}</small>
                      </span>
                      <em>
                        {chapter.wordCount
                          ? `${chapter.wordCount.toLocaleString("tr-TR")} kelime`
                          : `${chapter.availablePages} sayfa`}
                      </em>
                      {visual ? (
                        <span className="codex-contents-volume-art">
                          <Image
                            src={visual.imageSrc}
                            alt=""
                            fill
                            sizes="160px"
                            unoptimized
                          />
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ol>
            <footer>Hatırla. Keşfet. Üret. Yaşa.</footer>
          </article>

          <article className="codex-contents-leaf codex-contents-leaf--genesis">
            <header>
              <span aria-hidden="true">✣</span>
              <h2>GENESIS</h2>
              <b>BÖLÜM 1: İLK NEFES</b>
              <p>“Her şey bir nefesle başladı.<br />Anadolu, o nefesi hatırlayanların evidir.”</p>
            </header>
            <Link
              href="/archive/chapter/genesis"
              className="codex-contents-genesis-hero"
              aria-label="Genesis bölümünü aç"
            >
              <Image
                src="/api/archive/reference/genesis-visual"
                alt="Anadolu’da gün doğumunu izleyen figürler ve kadim zeytin ağacı"
                fill
                priority
                sizes="(max-width: 900px) 90vw, 42vw"
                unoptimized
              />
            </Link>
            <section className="codex-contents-genesis-copy">
              <div>
                <h3>1.1 &nbsp; Anadolu’nun Kodu</h3>
                <p>
                  Anadolu, 12.000 yıllık kesintisiz hafızadır. Toprak değil;
                  bilgi alanıdır. Her taş bir cümle, her su bir kelime, her
                  insan bu harfin bu büyük kitabın içinde.
                </p>
              </div>
              <div className="codex-contents-genesis-relief">
                {genesisPages[1] ? (
                  <Image
                    src={genesisPages[1].imageSrc}
                    alt=""
                    fill
                    sizes="220px"
                    unoptimized
                  />
                ) : (
                  <span aria-hidden="true">⌘</span>
                )}
              </div>
            </section>
            <section className="codex-contents-genesis-cards">
              {[
                ["1.2", "Zaman Döngüsü"],
                ["1.3", "Yaşam Ağacı"],
                ["1.4", "İlk Uygarlıklar"],
              ].map(([number, title], index) => {
                const visual = genesisPages[index + 2] ?? book.pages[index + 2];
                return (
                  <figure key={number}>
                    <span>
                      {visual ? (
                        <Image
                          src={visual.imageSrc}
                          alt=""
                          fill
                          sizes="180px"
                          unoptimized
                        />
                      ) : null}
                    </span>
                    <figcaption>{number} &nbsp; {title}</figcaption>
                  </figure>
                );
              })}
            </section>
            <footer>
              <div><b>ÖZET</b><span>Genesis, yaratılışın öyküsünü değil, hatırlayışın kaydını tutar.</span></div>
              <div><b>ANAHTAR KELİMELER</b><span>Nefes · Toprak · Hafıza · Su · Işık · Zaman · Dil · Kod · Yaşam · Sevgi</span></div>
              <i aria-hidden="true">⌘</i>
            </footer>
          </article>
        </div>
      </section>

      <aside id="codex-place-index" className="codex-contents-right-rail" aria-label="Codex indexes">
        {RIGHT_RAIL.map(([glyph, label]) => (
          <Link href="/archive/chapter/image-archive" key={label}>
            <span aria-hidden="true">{glyph}</span>
            <small>{label}</small>
          </Link>
        ))}
      </aside>

      <nav className="codex-contents-filmstrip" aria-label="Codex page previews">
        <span aria-hidden="true">‹</span>
        {book.pages.slice(0, 14).map((page) => (
          <Link href={`/archive/read/${page.pageNumber}`} key={page.assetId}>
            <Image
              src={page.imageSrc}
              alt={`${page.publicTitle}, sayfa ${page.pageNumber}`}
              fill
              sizes="90px"
              unoptimized
            />
          </Link>
        ))}
        <span aria-hidden="true">›</span>
      </nav>
      <p className="codex-contents-folio" aria-hidden="true">— 01 —</p>
    </main>
  );
}

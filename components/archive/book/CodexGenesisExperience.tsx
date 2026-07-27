import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { PROVINCES } from "@/data/provinces";
import { TURKEY_SVG_PATHS, TURKEY_VIEW_BOX } from "@/data/turkey-svg-paths";
import { GENESIS_EXPERIENCE_CHAPTERS } from "@/lib/codex/genesis-experience-copy";
import type {
  CodexChapterDocument,
  CodexChapterReference,
} from "@/lib/codex/experience-contract";

import CodexChapterTools from "./CodexChapterTools";

const REFERENCE_LABELS = {
  environment: "Places & Environments",
  npc: "People & NPCs",
  profession: "Professions",
  "production-volume": "Production Volumes",
  "text-image-bridge": "Text & Image Bridges",
} as const;

const PROVINCE_BY_PLATE = new Map(
  PROVINCES.map((province) => [province.plate, province]),
);

const PLAYER_JOURNEY_SECTION_ID = "genesis-3-oyuncunun-yolculugu";
const REAL_WORLD_SECTION_ID = "genesis-7-gercek-dunya-ile-baglanti";
const GENESIS_FIVE_SECTION_ID = "genesis-20-genesis-005";

const FIRST_BREATH_TIMELINE = [
  ["Niyet", "Başlangıç"],
  ["Işık", "Doğuş"],
  ["Hafıza", "Oluşum"],
  ["Kod", "Şekilleniş"],
  ["Anlam", "Uyanış"],
  ["Yaşam", "Devam"],
] as const;

function groupReferences(references: CodexChapterReference[]) {
  return Object.entries(
    references.reduce<
      Partial<Record<CodexChapterReference["type"], CodexChapterReference[]>>
    >((groups, reference) => {
      const group = groups[reference.type] ?? [];
      group.push(reference);
      groups[reference.type] = group;
      return groups;
    }, {}),
  );
}

export default function CodexGenesisExperience({
  chapter,
}: {
  chapter: CodexChapterDocument;
}) {
  const playerJourneyIndex = chapter.sections.findIndex(
    (section) => section.id === PLAYER_JOURNEY_SECTION_ID,
  );
  const realWorldIndex = chapter.sections.findIndex(
    (section) => section.id === REAL_WORLD_SECTION_ID,
  );
  const genesisFiveIndex = chapter.sections.findIndex(
    (section) => section.id === GENESIS_FIVE_SECTION_ID,
  );
  const openingSourceSections = chapter.sections.slice(
    0,
    playerJourneyIndex < 0 ? 0 : playerJourneyIndex,
  );
  const journeySourceSections = chapter.sections.slice(
    playerJourneyIndex < 0 ? 0 : playerJourneyIndex,
    realWorldIndex < 0 ? playerJourneyIndex : realWorldIndex + 1,
  );
  const foundationSourceSections = chapter.sections.slice(
    realWorldIndex < 0 ? 0 : realWorldIndex + 1,
    genesisFiveIndex < 0 ? realWorldIndex + 1 : genesisFiveIndex,
  );
  const remainingSourceIds = new Set(
    chapter.sections
      .slice(genesisFiveIndex < 0 ? 0 : genesisFiveIndex)
      .map((section) => section.id),
  );
  const remainingExperienceChapters = GENESIS_EXPERIENCE_CHAPTERS.filter(
    (experienceChapter) =>
      remainingSourceIds.has(experienceChapter.sourceSectionId),
  );
  const sections = [
    { id: "genesis-first-breath", title: "Bölüm 1 — İlk Nefes" },
    { id: "genesis-player-journey", title: "Bölüm 2 — Oyuncunun Yolculuğu" },
    { id: "genesis-real-world", title: "Bölüm 3 — Gerçek Dünya ile Bağlantı" },
    { id: "genesis-eighty-one-cities", title: "Bölüm 4 — 81 Şehir, Tek Hafıza" },
    { id: "genesis-first-gate", title: "Bölüm 5 — Adana, İlk Kapı" },
    { id: "genesis-citizen", title: "Genesis 004 — Oyuncu Değil, Vatandaş" },
    ...remainingExperienceChapters.map((experienceChapter) => ({
      id: experienceChapter.sourceSectionId,
      title: `Genesis ${experienceChapter.number} — ${experienceChapter.title}`,
    })),
  ];
  const remainingExperiencePairs = Array.from(
    { length: Math.ceil(remainingExperienceChapters.length / 2) },
    (_, index) => remainingExperienceChapters.slice(index * 2, index * 2 + 2),
  );
  const referencesByType = groupReferences(chapter.references);
  const placeEntities = chapter.entities.filter((entity) => entity.type === "place");
  const entityById = new Map(chapter.entities.map((entity) => [entity.id, entity]));
  const placeIds = new Set(placeEntities.map((entity) => entity.id));
  const linkedProvinces = PROVINCES.filter((province) => placeIds.has(province.id));
  const linkedProvinceIds = new Set(linkedProvinces.map((province) => province.id));
  const peopleAssets = chapter.assets.filter(
    (asset) => asset.npc || asset.profession,
  );
  const firstBreathEntities = ["hafiza", "isik", "ilknefes", "digitaltwin"]
    .map((entityId) => entityById.get(entityId))
    .filter((entity) => entity !== undefined);

  return (
    <main
      className="codex-book codex-document codex-genesis"
      style={{ "--chapter-accent": chapter.accent } as CSSProperties}
    >
      <CodexChapterTools
        chapterSlug={chapter.slug}
        chapterTitle={chapter.title}
        sections={sections}
      />

      <header className="codex-document__bar">
        <Link href="/archive/contents">Contents</Link>
        <span>{chapter.canonId} · The Living Book of Anatolia</span>
        <Link href="#genesis-relations">Relations</Link>
      </header>

      <section className="genesis-opening" aria-labelledby="genesis-title">
        <aside className="genesis-rail genesis-rail--left" aria-label="Codex identity">
          <Link href="/archive">
            <span aria-hidden="true">✣</span>
            <strong>CAELINUS<br />CODEX</strong>
            <small>THE LIVING BOOK<br />OF ANATOLIA</small>
          </Link>
          <p>Canonical volume</p>
          <strong>{chapter.canonId}</strong>
        </aside>

        <div id="genesis-first-breath" className="genesis-opening__book" data-codex-section>
          {openingSourceSections.map((section) => (
            <span className="genesis-source-anchor" id={section.id} key={section.id} />
          ))}

          <article className="genesis-opening__page genesis-first-breath__prose">
            <header>
              <span>GENESIS</span>
              <h1 id="genesis-title">Bölüm 1<br />İlk Nefes</h1>
              <p>Başlangıç, Niyet ve İlk Oluşum</p>
            </header>

            <section>
              <h2><span>1.1</span> Başlangıç</h2>
              <p>
                Her şey bir nefesle başladı.<br />
                Caelinus Evreni, yokluktan değil; niyetten doğdu.
              </p>
              <p>
                Bu niyet, Anadolu’nun kadim bilgeliğini, kültürünü, yaşam biçimini
                ve ruhunu dijital bir aynada yaşatma arzusuydu.
              </p>
              <p>
                Işık, sessizlik ve titreşim bir araya geldi.<br />
                Zaman akmadan önce hafıza doğdu.<br />
                Hafıza, şekil almadan önce kod doğdu.<br />
                Kod, isim almadan önce anlam doğdu.
              </p>
              <blockquote>
                “Başlangıç bir tarih değildir,<br />
                bir hatırlayıştır.<br />
                Hatırlayış bir görevdir.<br />
                Caelinus bir hatırlayışın ürünüdür.”
              </blockquote>
            </section>

            <section>
              <h2><span>1.2</span> Niyet</h2>
              <p>
                Niyet, bu evrenin çekirdeğidir.<br />
                Niyet olmadan şekil olmaz.<br />
                Niyet olmadan yaşam olmaz.<br />
                Niyet olmadan hikâye olmaz.<br />
                Niyet olmadan Caelinus olmaz.
              </p>
              <p>Bu niyet:</p>
              <ul>
                <li>Anadolu’nun ruhunu onurlandırmak,</li>
                <li>Kültürü geleceğe taşımak,</li>
                <li>İnsanları bir araya getirmek,</li>
                <li>Gerçek üretimi teşvik etmek,</li>
                <li>Bilgiyi yaşayan bir sisteme saklamaktır.</li>
              </ul>
            </section>

            <small className="genesis-first-breath__status">
              Experience Layer açılış anlatısı · Frozen canonical kaynak değiştirilmedi
            </small>
          </article>

          <article className="genesis-opening__page genesis-first-breath__visuals">
            <section>
              <h2><span>1.3</span> Görsel Anlatım</h2>
              <figure>
                <Image
                  src="/api/archive/reference/genesis-visual"
                  alt="Anadolu üzerinde doğan ilk ışığı izleyen dört figür ve kadim zeytin ağacı"
                  width={820}
                  height={610}
                  priority
                  unoptimized
                  sizes="(max-width: 760px) 92vw, 50vw"
                />
                <figcaption>
                  Işık, Anadolu’nun üzerine ilk kez böyle doğdu.<br />
                  Ve bir nefes, binlerce yıllık bir hikâyeyi başlattı.
                </figcaption>
              </figure>
            </section>

            <section>
              <h2><span>1.4</span> Zaman Çizgisi</h2>
              <ol className="genesis-first-breath__timeline">
                {FIRST_BREATH_TIMELINE.map(([label, state]) => (
                  <li key={label}>
                    <i aria-hidden="true" />
                    <strong>{label}</strong>
                    <small>{state}</small>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2><span>1.5</span> İlişkili Varlıklar</h2>
              <ul className="genesis-first-breath__entities">
                {firstBreathEntities.map((entity) => (
                  <li key={entity.id}>
                    <span aria-hidden="true">✦</span>
                    <small>{entity.type}</small>
                    <strong>{entity.label}</strong>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2><span>1.6</span> İlgili Bilgiler</h2>
              <nav className="genesis-first-breath__relations" aria-label="Related volumes">
                {chapter.crossReferences.length
                  ? chapter.crossReferences.slice(0, 4).map((reference) => (
                      <Link href={`/archive/chapter/${reference.slug}`} key={reference.canonId}>
                        <span>{reference.canonId}</span>
                        <strong>{reference.title}</strong>
                      </Link>
                    ))
                  : chapter.references.slice(0, 4).map((reference) => (
                      <div key={reference.id}>
                        <span>{reference.type}</span>
                        <strong>{reference.label}</strong>
                      </div>
                    ))}
              </nav>
            </section>

            <a className="genesis-opening__continue" href="#genesis-text">
              <span>Oyuncunun yolculuğuna devam et</span>
              <span aria-hidden="true">↓</span>
            </a>
          </article>
        </div>

        <nav className="genesis-rail genesis-rail--right" aria-label="Genesis experience">
          <a href="#genesis-text">Metin</a>
          <a href="#genesis-timeline">Zaman</a>
          <a href="#genesis-atlas">Yerler</a>
          <a href="#genesis-assets">Görseller</a>
          <a href="#genesis-people">NPC</a>
          <a href="#genesis-relations">İlişkiler</a>
        </nav>
      </section>

      <section className="genesis-curated" aria-label="Genesis experience narrative">
        {journeySourceSections.map((section) => (
          <span className="genesis-source-anchor" id={section.id} key={section.id} />
        ))}
        <div className="genesis-reading-spread genesis-curated__spread">
          <article
            id="genesis-player-journey"
            className="genesis-reading-page genesis-curated-page"
            data-codex-section
          >
            <header>
              <p>{chapter.canonId} · Experience Chapter 2</p>
              <span>02</span>
              <h3>Oyuncunun Yolculuğu</h3>
              <small>Merak, hafıza ve aidiyet</small>
            </header>

            <div className="genesis-reading-page__block">
              <h4>2.1 Uyanış</h4>
              <p>
                Oyuncu oyuna başlamaz.<br />
                Bir şehrin sabahına uyanır.
              </p>
              <p>
                Karşısında yüzyıllık bir zeytin ağacı vardır. Taş avludan geçen
                rüzgârı, uzaktaki suyu ve henüz adını bilmediği hayatın sesini duyar.
              </p>
              <p>
                Ekranda görev yoktur. Yol gösteren bir ok yoktur. Dünya, oyuncudan
                önce konuşmaya başlar.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>2.2 Merak</h4>
              <p>
                Caelinus’ta ilk hareketi bir komut değil, merak doğurur. Bir ışık,
                yarım kalmış bir iz, uzaktan gelen bir ezgi… Her ayrıntı “burada ne
                yaşandı?” sorusunu sessizce çağırır.
              </p>
              <blockquote>
                “Merak, yolculuğun ilk mekaniğidir.”
              </blockquote>
            </div>

            <div className="genesis-reading-page__block">
              <h4>2.3 Hafızaya Dokunmak</h4>
              <p>
                Oyuncu bir Hafıza Taşı’na dokunduğunda ödül toplamaz; bir tanıklığa
                yaklaşır. Taş, o yerde yaşamış insanların sesini, emeğini ve
                hatırasını taşır.
              </p>
              <p>
                O anda şehir bir dekor olmaktan çıkar. Hatırlayan, anlatan ve
                oyuncuyla bağ kuran yaşayan bir varlığa dönüşür.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>2.4 Oyuncu Ne Yapar?</h4>
              <ul>
                <li>Keşfeder; çünkü her yolun bir hafızası vardır.</li>
                <li>Öğrenir; çünkü bilgi dünyanın içinde yaşar.</li>
                <li>İnsanlarla tanışır; çünkü şehir, insanlarıyla anlam kazanır.</li>
                <li>Üretime katılır; çünkü emek yalnız izlenmez, paylaşılır.</li>
                <li>İz bırakır; çünkü hatırlamak da bir sorumluluktur.</li>
              </ul>
            </div>
          </article>

          <article
            id="genesis-real-world"
            className="genesis-reading-page genesis-curated-page"
            data-codex-section
          >
            <header>
              <p>{chapter.canonId} · Experience Chapter 3</p>
              <span>03</span>
              <h3>Gerçek Dünya ile Bağlantı</h3>
              <small>Dijital şehir ↔ Gerçek şehir</small>
            </header>

            <div className="genesis-reading-page__block">
              <h4>3.1 Eşiğin İki Tarafı</h4>
              <p>
                Caelinus’taki dijital dünya, gerçeğin yerine geçmez. Gerçek dünyaya
                açılan bir eşik olur. Oyuncunun ekranda gördüğü toprak, ürün, ezgi
                ve hikâye; yaşayan bir karşılığa bağlanır.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>3.2 Bu Toprağın İnsanları</h4>
              <p>
                Bir zeytinyağı üreticisi, bir bakır ustası, bir müzisyen, bir müze
                ve bir festival arka plan süsü değildir. Her biri kendi bilgisinin,
                emeğinin ve hafızasının taşıyıcısıdır.
              </p>
              <p>
                Oyuncu onları bir görev listesindeki isimler olarak değil, şehrin
                yaşayan bağları olarak tanır.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>3.3 Yaşayan Döngü</h4>
              <ol>
                <li>Oyuncu dijital dünyada bir izi keşfeder.</li>
                <li>İzin ardındaki insanı ve üretimi tanır.</li>
                <li>Bilginin gerçek coğrafyadaki karşılığına ulaşır.</li>
                <li>Hikâye yeniden görülür, duyulur ve paylaşılır.</li>
              </ol>
              <p>
                Böylece dijital deneyim tüketilen bir görüntü olarak kalmaz; gerçek
                kültürü görünür kılan canlı bir köprüye dönüşür.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>3.4 Tek Ekosistem</h4>
              <p>
                Şehir, insan, kültür, üretim ve hafıza birbirinden ayrı sayfalar
                değildir. Aynı yaşayan sistemin birbirine bağlı parçalarıdır.
              </p>
              <blockquote>
                “Dijital şehir gerçeği kopyalamaz.<br />
                Gerçeğin sesini daha uzağa taşır.”
              </blockquote>
            </div>

            <small className="genesis-first-breath__status">
              Experience Layer anlatısı · Frozen canonical kaynak değiştirilmedi
            </small>
          </article>
        </div>
      </section>

      <section className="genesis-curated genesis-curated--foundation" aria-label="Genesis foundation narrative">
        {foundationSourceSections.map((section) => (
          <span className="genesis-source-anchor" id={section.id} key={section.id} />
        ))}

        <div className="genesis-reading-spread genesis-curated__spread">
          <article
            id="genesis-eighty-one-cities"
            className="genesis-reading-page genesis-curated-page"
            data-codex-section
          >
            <header>
              <p>{chapter.canonId} · Experience Chapter 4</p>
              <span>04</span>
              <h3>81 Şehir, Tek Hafıza</h3>
              <small>Her şehir kendi sesiyle yaşar</small>
            </header>

            <div className="genesis-reading-page__block">
              <h4>4.1 Harita Değil, Karakter</h4>
              <p>
                Caelinus, Türkiye’yi tek renge boyanmış büyük bir harita olarak
                görmez. Her şehir; sesi, ışığı, ritmi, üretimi, mimarisi, mevsimi ve
                hafızasıyla ayrı bir karakterdir.
              </p>
              <p>
                Oyuncu şehir değiştirdiğinde yalnızca koordinat değiştirmez. Havanın,
                anlatının ve dünyanın ona verdiği hissin değiştiğini fark eder.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>4.2 Görünmeyen Teknoloji</h4>
              <p>
                Teknoloji bu dünyanın önüne geçmez; onu ayakta tutar. Gerçek zamanlı
                dünya, yapay zekâ, bulut altyapısı ve modüler içerik sistemi
                oyuncunun karşısına bir özellik listesi olarak çıkmaz.
              </p>
              <p>
                Hepsi, şehrin hatırlamasını ve değişirken kendi kimliğini korumasını
                sağlayan görünmez bir omurga olur.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>4.3 Bir Şehirden Bir Ülkeye</h4>
              <p>
                Yolculuk Adana’da başlar. İlk deneyim kendi dilini bulduğunda yeni
                şehirler aynı kalıba sokulmadan sisteme katılır. Her yeni şehir,
                ortak hafızayı büyütürken kendi ruhunu korur.
              </p>
              <blockquote>
                “Biz 81 harita yapmıyoruz.<br />
                Birbirini duyan 81 şehir kuruyoruz.”
              </blockquote>
            </div>

            <div className="genesis-reading-page__block">
              <h4>4.4 Etki</h4>
              <ul>
                <li>Bir çocuk yaşadığı şehrin geçmişini deneyimler.</li>
                <li>Bir ziyaretçi gördüğü yerin hikâyesini öğrenir.</li>
                <li>Bir üretici ve sanatçı kendi emeğiyle görünür olur.</li>
                <li>Bir şehir, hafızasını gelecek kuşaklara taşıyabilir.</li>
              </ul>
            </div>
          </article>

          <article
            id="genesis-first-gate"
            className="genesis-reading-page genesis-curated-page"
            data-codex-section
          >
            <header>
              <p>{chapter.canonId} · Genesis 003</p>
              <span>05</span>
              <h3>Adana, İlk Kapı</h3>
              <small>Her yolculuk bir yerden nefes alır</small>
            </header>

            <div className="genesis-reading-page__block">
              <h4>5.1 Neden Adana?</h4>
              <p>
                Başlangıç için en çok anlatılan şehri değil, en güçlü başlangıç
                duygusunu aradık. Adana; toprağı, üretimi, bereketi ve sıcağın içinde
                yaşamayı sürdüren insanlarıyla bu kapıyı açtı.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>5.2 Şehrin Dili</h4>
              <p>
                Pamuk, narenciye ve zeytin; Seyhan’ın akışı, Taş Köprü’nün katmanları,
                sabah sisi ve toprağın rengi aynı cümleyi kurar: “Burası Adana.”
              </p>
              <p>
                Bunu ekrana yazmak gerekmez. Şehir, kendi ayrıntılarıyla kendini
                anlatır.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>5.3 İlk Avlu</h4>
              <p>
                Oyuncu dev bir meydanda değil, küçük bir avluda başlar. Çünkü aidiyet
                uzaktan görülen bir manzara değil; yakından duyulan su, taş, rüzgâr
                ve insan sesidir.
              </p>
              <p>
                Dünya bu avludan büyür. Adana bir teknoloji demosu değil, Caelinus’un
                kültürel ve deneyimsel ölçüsünü belirleyen ilk referans şehirdir.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>5.4 Kökten Dala</h4>
              <p>
                Adana’dan sonra yol Mersin’e, Konya’ya, Trabzon’a ve Kars’a uzanır.
                Ama büyümek, ilk şehri geride bırakmak değildir. Her yeni şehir,
                köklerde öğrenilen özeni yanında taşır.
              </p>
              <blockquote>
                “Küresel olmak için önce yerel olmayı öğrenmek gerekir.”
              </blockquote>
            </div>
          </article>
        </div>

        <div className="genesis-reading-spread genesis-curated__spread genesis-curated__spread--continuation">
          <article
            id="genesis-citizen"
            className="genesis-reading-page genesis-curated-page"
            data-codex-section
          >
            <header>
              <p>{chapter.canonId} · Genesis 004</p>
              <span>06</span>
              <h3>Oyuncu Değil, Vatandaş</h3>
              <small>Tüketmekten ait olmaya</small>
            </header>

            <div className="genesis-reading-page__block">
              <h4>6.1 Dünyanın Dışında Değil</h4>
              <p>
                Klasik bir dünyada oyuncu gelir, görevini tamamlar ve gider.
                Caelinus’ta ise yaptığı her seçim, kurduğu her bağ ve öğrendiği her
                hikâye onu dünyanın biraz daha içine alır.
              </p>
              <p>
                Oyuncu şehri tüketen bir ziyaretçi değil; onu dinleyen, anlayan ve
                yaşamına katılan bir vatandaşa dönüşür.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>6.2 Aidiyet</h4>
              <p>
                Aidiyet bir unvanla verilmez. Bir ustanın emeğini tanımakla, bir
                hikâyeyi unutmamakla, toprağın döngüsüne saygı duymakla ve ortak
                hafızaya özen göstermekle oluşur.
              </p>
              <blockquote>
                “Bu dünya sana ait değildir.<br />
                Sen, bu dünyanın hatırlayan bir parçasısın.”
              </blockquote>
            </div>
          </article>

          <article className="genesis-reading-page genesis-curated-page">
            <header>
              <p>{chapter.canonId} · Genesis 004</p>
              <span>06</span>
              <h3>Yaşayan Vatandaşlık</h3>
              <small>Katılım, emek ve sorumluluk</small>
            </header>

            <div className="genesis-reading-page__block">
              <h4>6.3 Katılmak</h4>
              <p>
                Vatandaş keşfeder, öğrenir ve üretir. Yerel insanlarla bağ kurar;
                kaybolmaya yüz tutan bilgiyi görünür kılar; yaşadığı dünyanın
                değişimine yalnız seyirci kalmaz.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>6.4 Dünyanın Cevabı</h4>
              <p>
                Şehir oyuncuyu yalnızca puanla karşılamaz. Yeni bir ses, açılan bir
                kapı, paylaşılan bir tarif veya hatırlanan bir isimle cevap verir.
                İlerleme, dünyanın oyuncuyu tanımaya başlamasıdır.
              </p>
            </div>

            <div className="genesis-reading-page__block">
              <h4>6.5 Ortak Hafıza</h4>
              <p>
                Her vatandaşın bıraktığı anlamlı iz, tek bir kişinin başarısından
                daha büyük bir şeye bağlanır. Şehrin ortak hafızası büyür; geçmiş,
                bugün ve gelecek aynı yaşayan sistemde buluşur.
              </p>
              <blockquote>
                “Şehir kurmuyorsun.<br />
                Hafızayı yaşatıyorsun.”
              </blockquote>
            </div>

            <small className="genesis-first-breath__status">
              Experience Layer anlatısı · Frozen canonical kaynak değiştirilmedi
            </small>
          </article>
        </div>
      </section>

      <section id="genesis-text" className="genesis-reader" aria-labelledby="genesis-text-title">
        <header className="genesis-section-heading">
          <p>Genesis · The Living Codex Edition</p>
          <h2 id="genesis-text-title">Yaşayan Uygarlık</h2>
          <span>
            Genesis 005’ten kurucunun yeminine uzanan tutarlı Experience Layer anlatısı.
          </span>
        </header>

        {remainingExperiencePairs.map((pair) => (
          <div className="genesis-reading-spread" key={pair[0].sourceSectionId}>
            {pair.map((experienceChapter) => (
              <article
                id={experienceChapter.sourceSectionId}
                key={experienceChapter.sourceSectionId}
                className="genesis-reading-page genesis-curated-page"
                data-codex-section
              >
                <header>
                  <p>{chapter.canonId} · Genesis {experienceChapter.number}</p>
                  <span>{experienceChapter.number}</span>
                  <h3>{experienceChapter.title}</h3>
                  <small>{experienceChapter.subtitle}</small>
                </header>
                {experienceChapter.passages.map((passage) => (
                  <div
                    className="genesis-reading-page__block"
                    key={`${experienceChapter.sourceSectionId}-${passage.title}`}
                  >
                    <h4>{passage.title}</h4>
                    {passage.paragraphs?.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {passage.bullets?.length ? (
                      <ul>
                        {passage.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                      </ul>
                    ) : null}
                    {passage.quote ? <blockquote>“{passage.quote}”</blockquote> : null}
                  </div>
                ))}
                <small className="genesis-first-breath__status">
                  Experience Layer anlatısı · Frozen canonical kaynak değiştirilmedi
                </small>
              </article>
            ))}
            {pair.length === 1 ? (
              <aside className="genesis-reading-page genesis-colophon" aria-label="Genesis colophon">
                <span aria-hidden="true">✣</span>
                <p>CAELINUS CODEX</p>
                <h3>Hatırla.<br />Keşfet.<br />Üret.<br />Yaşa.</h3>
                <small>THE LIVING BOOK OF ANATOLIA</small>
                <Link href="/archive/contents">İçindekilere dön</Link>
              </aside>
            ) : null}
          </div>
        ))}
      </section>

      <section id="genesis-timeline" className="genesis-timeline" aria-labelledby="genesis-timeline-title">
        <header className="genesis-section-heading">
          <p>Source order · 01—{String(chapter.sections.length).padStart(2, "0")}</p>
          <h2 id="genesis-timeline-title">Canonical sequence</h2>
          <span>Genesis bölümlerinin kaynakta tanımlı okuma izi.</span>
        </header>
        <ol>
          {chapter.sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{section.title}</strong>
                <small>{section.kind}</small>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section id="genesis-atlas" className="genesis-atlas" aria-labelledby="genesis-atlas-title">
        <header className="genesis-section-heading">
          <p>Canonical place entities</p>
          <h2 id="genesis-atlas-title">Anadolu atlası</h2>
          <span>Yalnız Genesis metninde açıkça indekslenen yerler vurgulanır.</span>
        </header>
        <div className="genesis-atlas__layout">
          <svg viewBox={TURKEY_VIEW_BOX} role="img" aria-labelledby="genesis-map-title">
            <title id="genesis-map-title">
              Türkiye map with Genesis-linked provinces highlighted
            </title>
            {Object.entries(TURKEY_SVG_PATHS).map(([plate, path]) => {
              const province = PROVINCE_BY_PLATE.get(plate);
              const linked = province ? linkedProvinceIds.has(province.id) : false;
              return (
                <path
                  key={plate}
                  d={path}
                  className={linked ? "is-linked" : undefined}
                  aria-label={linked && province ? province.name.tr : undefined}
                />
              );
            })}
          </svg>
          <div>
            <p>Indexed geography</p>
            <ul>
              {placeEntities.map((entity) => (
                <li key={entity.id}>
                  <span style={{ backgroundColor: entity.color }} aria-hidden="true" />
                  <strong>{entity.label}</strong>
                  <small>
                    {linkedProvinceIds.has(entity.id) ? "Province" : "Place entity"}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="genesis-assets" className="genesis-assets" aria-labelledby="genesis-assets-title">
        <header className="genesis-section-heading">
          <p>Editorial Runtime · {chapter.assets.length} linked plates</p>
          <h2 id="genesis-assets-title">Visual archive</h2>
          <span>Asset ve Canon ID bağları frozen editorial runtime’dan okunur.</span>
        </header>
        <div className="genesis-assets__grid">
          {chapter.assets.map((asset) => (
            <figure key={asset.assetId}>
              <Link href={asset.imageSrc} target="_blank">
                <Image
                  src={asset.imageSrc}
                  alt={asset.publicTitle}
                  width={900}
                  height={560}
                  sizes="(max-width: 760px) 92vw, 30vw"
                />
              </Link>
              <figcaption>
                <small>{asset.assetId} · {asset.primaryCanonId}</small>
                <h3>{asset.publicTitle}</h3>
                {asset.subtitle ? <p>{asset.subtitle}</p> : null}
                {asset.description ? <p>{asset.description}</p> : null}
                {asset.relatedSystems.length ? (
                  <ul>
                    {asset.relatedSystems.map((system) => <li key={system}>{system}</li>)}
                  </ul>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="genesis-people" className="genesis-people" aria-labelledby="genesis-people-title">
        <header className="genesis-section-heading">
          <p>Editorial identity boundary</p>
          <h2 id="genesis-people-title">People & NPC records</h2>
          <span>Doğrulanmamış kayıtların statüsü değiştirilmeden gösterilir.</span>
        </header>
        {peopleAssets.length ? (
          <ul>
            {peopleAssets.map((asset) => (
              <li key={asset.assetId}>
                <span>{asset.assetId}</span>
                <strong>{asset.npc ?? asset.profession}</strong>
                <small>{asset.publicTitle}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="genesis-empty">Genesis için bağlı kişi veya NPC kaydı yok.</p>
        )}
      </section>

      <section id="genesis-relations" className="genesis-relations" aria-labelledby="genesis-relations-title">
        <header className="genesis-section-heading">
          <p>Canonical Knowledge Graph</p>
          <h2 id="genesis-relations-title">Related knowledge</h2>
          <span>Yalnız graph içinde açıkça bulunan bağlar.</span>
        </header>
        <div className="genesis-relations__grid">
          {referencesByType.map(([type, references]) => (
            <section key={type}>
              <h3>{REFERENCE_LABELS[type as keyof typeof REFERENCE_LABELS] ?? type}</h3>
              <ul>
                {references?.map((reference) => (
                  <li key={reference.id}>
                    <strong>{reference.label}</strong>
                    {reference.assetIds.length ? <span>{reference.assetIds.join(" · ")}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {chapter.crossReferences.length ? (
          <nav aria-label="Cross-referenced canonical volumes">
            {chapter.crossReferences.map((reference) => (
              <Link href={`/archive/chapter/${reference.slug}`} key={reference.canonId}>
                <span>{reference.canonId}</span>
                <strong>{reference.title}</strong>
                <small>{reference.sharedAssetIds.length} shared assets</small>
              </Link>
            ))}
          </nav>
        ) : null}
      </section>

      <nav className="codex-document__pagination" aria-label="Adjacent volumes">
        <span />
        {chapter.next ? (
          <Link href={`/archive/chapter/${chapter.next.slug}`}>
            <span>Next volume</span>
            {chapter.next.title}
          </Link>
        ) : <span />}
      </nav>
    </main>
  );
}

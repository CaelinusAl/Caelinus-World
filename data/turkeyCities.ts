export type Product = {
  name: string;
  freq: number;
};

export type City = {
  name: string;
  region: string;
  soil: string;
  climate: string;
  water: string;
  history: string;
  plants: Product[];
  sowing: string;
  harvest: string;
  energy: string;
};

export const cities: City[] = [
  {
    name: "İzmir",
    region: "Ege",
    soil: "Tınlı, kireçli, taşlı",
    climate: "Akdeniz karakteri, uzun güneş alan",
    water: "Orta seviye kontrollü sulama",
    history:
      "İzmir ve çevresi binlerce yıldır zeytin, üzüm ve aromatik bitkilerin üretim alanıdır.",
    plants: [
      { name: "Lavanta", freq: 118 },
      { name: "Adaçayı", freq: 432 },
      { name: "Zeytin", freq: 528 },
      { name: "Biberiye", freq: 256 },
      { name: "Kekik", freq: 320 },
    ],
    sowing: "İlkbahar ve sonbahar geçişleri güçlüdür",
    harvest: "Yaz sonu ve sonbahar",
    energy:
      "Kuraklığa dayanıklı aromatik bitkiler için güçlü frekans alanı",
  },

  {
    name: "Isparta",
    region: "Akdeniz",
    soil: "Kireçli ve mineralli",
    climate: "Serin gece sıcaklıkları",
    water: "Dengeli yeraltı su kaynakları",
    history:
      "Dünyanın en güçlü gül üretim merkezlerinden biri. Gül yağı ve aromatik bitkilerle bilinir.",
    plants: [
      { name: "Gül", freq: 320 },
      { name: "Lavanta", freq: 118 },
      { name: "Adaçayı", freq: 432 },
    ],
    sowing: "İlkbahar",
    harvest: "Mayıs – Haziran",
    energy:
      "Yüksek aromatik frekans ve şifa bitkileri için güçlü enerji alanı",
  },

  {
    name: "Antalya",
    region: "Akdeniz",
    soil: "Alüvyonlu ve verimli",
    climate: "Sıcak ve nemli",
    water: "Güçlü yeraltı su kaynakları",
    history:
      "Seracılık ve tropikal üretim için Türkiye'nin en güçlü bölgelerinden biri.",
    plants: [
      { name: "Fesleğen", freq: 256 },
      { name: "Narenciye", freq: 432 },
      { name: "Zencefil", freq: 528 },
    ],
    sowing: "İlkbahar",
    harvest: "Yaz",
    energy: "Canlı büyüme frekansı yüksek tropikal üretim alanı",
  },

  {
    name: "Trabzon",
    region: "Karadeniz",
    soil: "Humuslu ve organik",
    climate: "Yağışlı ve serin",
    water: "Çok güçlü doğal su kaynakları",
    history:
      "Doğal bitki örtüsü ve şifalı otların yoğun olduğu bölge.",
    plants: [
      { name: "Karayemiş", freq: 432 },
      { name: "Isırgan", freq: 528 },
      { name: "Karadeniz Çayı", freq: 256 },
    ],
    sowing: "İlkbahar",
    harvest: "Yaz",
    energy: "Su frekansı güçlü doğal şifa alanı",
  },

  {
    name: "Ankara",
    region: "İç Anadolu",
    soil: "Killi ve mineral zengin",
    climate: "Kara iklimi",
    water: "Sınırlı yağış",
    history:
      "Tahıl ve dayanıklı bitkilerin üretildiği tarihsel tarım alanı.",
    plants: [
      { name: "Buğday", freq: 256 },
      { name: "Arpa", freq: 256 },
      { name: "Kimyon", freq: 320 },
    ],
    sowing: "İlkbahar",
    harvest: "Yaz",
    energy: "Toprak frekansı güçlü dayanıklı üretim alanı",
  },

  {
    name: "Gaziantep",
    region: "Güneydoğu",
    soil: "Kireçli ve kurak",
    climate: "Sıcak ve kuru",
    water: "Az yağış",
    history:
      "Fıstık ve baharat üretimi ile bilinen güçlü tarım bölgesi.",
    plants: [
      { name: "Antep Fıstığı", freq: 432 },
      { name: "Sumak", freq: 256 },
      { name: "Kimyon", freq: 320 },
    ],
    sowing: "İlkbahar",
    harvest: "Sonbahar",
    energy: "Baharat frekansı güçlü üretim alanı",
  },
];
# CAELINUS CODEX — Living Codex Engine

> "Bir ülkenin sadece haritasını değil; hafızasını, kültürünü ve insanlarını yaşatan arşiv."

Bu, dağınık Bible metinlerini **tek bir yaşayan dijital ansiklopediye** dönüştüren
motordur. Amaç PDF üretmek değil; her bilginin birbirine bağlandığı, tekrarların
tespit edildiği, eksiklerin raporlandığı bir arşiv. `caelinus.ai`'ın çekirdeği.

## Ne yapar?

1. **Ingest** — 5 Bible metnini `Cilt → (alt-cilt / meslek) → Bölüm → Blok` yapısına ayrıştırır.
2. **Cross-link** — 37 varlığı (meslek, ürün, yer, sistem, ilke) tüm bölümlerde bulur,
   birbirine bağlar ve canonical zincirleri (Pamuk→Çiftçi→Dokumacı→…) grafiğe çizer.
3. **Analyze** — 132 görsel için indeks slotları açar, tekrarları ve eksik ciltleri raporlar.
4. **Read** — sinematik, oyunun içindeymiş hissi veren bir okuyucu (TR içerik / EN arayüz).

## Çalıştırma

```bash
# 1. Arşivi yeniden derle (metinler değişince)
node codex/engine/build.mjs

# 2. Sunucuyu başlat
node codex/server.mjs
# → http://localhost:4173/codex/web/
```

## Klasör yapısı

```
codex/
  engine/
    config.mjs     ← TEK gerçek kaynağı: kaynaklar, parse profilleri, varlık sözlüğü, zincirler
    ingest.mjs     ← metin → yapılandırılmış ağaç
    entities.mjs   ← varlık tarama + ilişki grafiği
    analyze.mjs    ← görsel manifesti + tekrar + eksik raporu
    build.mjs      ← hepsini çalıştırır → data/*.json
  data/            ← ÜRETİLEN (codex.json, images.json, report.json)
  web/             ← sinematik okuyucu (index.html, styles.css, app.js)
  server.mjs       ← sıfır-bağımlılık statik sunucu
```

## "Yeni içerik eklediğimde otomatik yerleşsin" — nasıl?

Genesis Directive'in çekirdek isteği. Motor bunu şöyle karşılar:

- **Yeni bir Bible metni eklemek:** dosyayı arşive koy, `config.mjs → SOURCES`'a bir
  girdi ekle (hangi cilde ait + parse profili). `build.mjs` çalışınca metin otomatik
  doğru cilde yerleşir, varlıkları taranır, ilişkileri kurulur.
- **İlişkiler otomatik kurulur:** her bölümdeki varlıklar taranır; aynı bölümde geçen
  varlıklar arasında kenar oluşur. Canonical zincirler `config.mjs → CHAINS`'te tanımlı.
- **Tekrarlar tespit edilir:** `analyze.mjs` imza-tabanlı yinelenen bölümleri ve
  tekrarlayan paragrafları "Codex Health" altında listeler.
- **Eksikler önerilir:** yazılmamış ciltler (World, NPC), eksik meslek sayfaları
  (386 boş sayfa) ve ince ciltler otomatik raporlanır.

## Yeni varlık / zincir eklemek

`config.mjs`:
- `ENTITIES`'e `{ id, label, type, aliases }` ekle → her yerde otomatik tıklanabilir olur.
- `CHAINS`'e adım listesi ekle → Relation Atlas'ta canonical omurga olarak çizilir.

## Görseller (sonraki faz)

`data/images.json` şu an 132 görsel için **boş slotlar** tutar
(`status: "unanalyzed"`, çok-kategorili, çok-Bible referanslı). Sonraki AI-Vision
geçişi her görselin `description / keywords / bibles / entities / npc` alanlarını
dolduracak; okuyucu ve grafik bunları otomatik gösterecek. Görseller *resim değil,
Production Bible'ın sayfalarıdır.*

## Şu anki durum (özet)

| | |
|---|---|
| Bibles | 7 (5 yazılı + World & NPC eksik) |
| Sections | 148 |
| Entities | 37 (271 ilişki, 4 canonical zincir) |
| Images | 132 (indeks slotu hazır, analiz sonraki faz) |

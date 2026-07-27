<!-- CAELINUS — UNIFORM BIBLE TEMPLATE v1.0 · 2026-07-27
     "Bütün Bible'ları aynı şablona getir." Her cilt bu şablonu izler. -->

# BIBLE TEMPLATE — tüm ciltlerin ortak şablonu

Her Bible (CN-xx) hem `codex.json` içinde hem yeni yazımda **aynı şekle** sahiptir.
Yeni bir cilt yazarken bu iskeleti kullan; motor otomatik yerine oturtur.

## Makine şekli (codex.json içinde, motor üretir)
```json
{
  "id": "CN-04.2",
  "title": "Production · Engineering",
  "tr": "Prodüksiyon · Mühendislik",
  "status": "PARTIAL",
  "sources": ["CAELINUS PRODUCTION BIBLE.txt"],
  "subVolumes": ["ENGINEERING BIBLE"],
  "professions": ["ÇİFTÇİ"],
  "sectionCount": 18,
  "sections": [ { "id","num","title","kind","subVolume","profession",
                  "canonBible","blocks":[{heading,text}],"entities":[...] } ]
}
```

## Metin kaynağı şekli (yeni cilt yazarken .txt)
Motorun doğru ayrıştırması için **marker standardı** (CN-15 kararı):
```
CAELINUS PRODUCTION BIBLE          ← banner (opsiyonel, noise sayılır)
MESLEK <no> — <AD>                 ← meslek dosyasıysa
CİLT <no> — <BIBLE ADI>            ← hangi kanon cilde gider (CILT_TO_CANON)
SAYFA <no> — <BAŞLIK>              ← her sayfa = bir section
<ALLCAPS ALT BAŞLIK>              ← blok başlığı
...gövde...
```
> Büyük/küçük harf: motor artık `CİLT/Cilt`, `MESLEK/Meslek`, `SAYFA/Sayfa` ikisini de
> tanır. Yine de tutarlılık için **UPPERCASE** tercih edilir.

## Bir cilt eklemek (3 adım)
1. `.txt` dosyasını arşive koy (marker standardına uy).
2. `engine/config.mjs → SOURCES`'a bir girdi ekle: `{ id, bible:'CN-xx', file, profile }`.
   - Meslek dosyasıysa `profile: PROFESSIONS_PROFILE` (cilt yönlendirmesi otomatik).
3. `node engine/build.mjs` — içerik doğru cilde yerleşir, varlıkları taranır,
   ilişkiler kurulur, eksikler raporlanır. `CANON_MANIFEST.md` + `canon.json`'u güncelle.

## Statü lejantı
`PRESENT` · `PARTIAL` · `SCATTERED` · `MISSING` — kaynak: `canon.json` (otoriter).

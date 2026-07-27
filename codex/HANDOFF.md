<!-- CAELINUS CODEX — PHASE 5 HANDOFF · 2026-07-27
     Bu belge projeyi devralan mühendis/agent (Cursor) içindir. Temiz veri
     sözleşmesi + teknik durum + kurallar + sıradaki iş. -->

# CAELINUS CODEX — TEKNİK TESLİM (HANDOFF)

> **Ne bu?** Türkiye'nin yaşayan dijital ikizi Caelinus'un tüm Bible/metin/görsel
> arşivini tek bir yapılandırılmış, çapraz-bağlı, sinematik dijital ansiklopediye
> (caelinus.ai çekirdeği) çeviren **Living Codex Engine** + okuyucu.
> Sıfır bağımlılık, saf Node.js (v20). Derle → sun → oku.

---

## 0. 60 saniyede çalıştır
```bash
node codex/engine/build.mjs     # arşiv → data/*.json (yeniden üretir)
node codex/server.mjs           # → http://localhost:4173/codex/web/
```
Diğer üreticiler (build'den bağımsız, read-only):
```bash
node codex/engine/audit.mjs     # 8 denetim raporu → codex/audit/
node codex/engine/relmap.mjs    # ilişki grafiği → codex/canon/relation_map.json
node codex/engine/freeze.mjs 2026-07-27   # PHASE 0 yedek + SHA256
```

## 1. Otorite sırası (çakışırsa hangisi kazanır)
1. **Kaynak `.txt`** (DONDURULDU — asla değiştirilmez) — gerçeğin ham hâli.
2. **`canon/CANON_MANIFEST.md` + `canon/canon.json`** — yapı otoritesi (Selin/Aura sahibi).
3. **`engine/config.mjs`** — makine yapılandırması (kaynak→bible eşleme, cilt yönlendirme, varlık sözlüğü).
4. **`data/*.json`** — ÜRETİLMİŞ çıktı (elle düzenleme; her build'de üzerine yazılır).
5. **`web/`** — okuyucu; yalnızca `data/*.json` tüketir.

## 2. Dizin haritası
```
codex/
  engine/
    config.mjs    ← TEK yapılandırma: BIBLES(16 cilt), SOURCES(5), CILT_TO_CANON, ENTITIES(37), CHAINS
    ingest.mjs    ← .txt → Cilt/Meslek/Sayfa/Blok ağacı (case-tolerant markerlar)
    entities.mjs  ← 37 varlık taraması + co-occurrence grafiği + canonical zincirler
    analyze.mjs   ← görsel manifesti + tekrar + eksik(gap) raporu
    build.mjs     ← orkestratör → data/codex.json + images.json + report.json
    audit.mjs     ← 8 denetim raporu (read-only)
    relmap.mjs    ← MASTER RELATION MAP (read-only)
    freeze.mjs    ← PHASE 0 yedek + bütünlük
  canon/          ← ANAYASA: CANON_MANIFEST.md, canon.json, BIBLE_TEMPLATE.md,
                    MASTER_RELATION_MAP.md, relation_map.json
  audit/          ← üretilen 8 rapor .md
  data/           ← üretilen codex.json (3.3MB) / images.json / report.json
  web/            ← index.html + styles.css + app.js (sinematik okuyucu, TR içerik/EN arayüz)
  _freeze/2026-07-27/  ← dondurulmuş kaynak kopyası + checksums.sha256
  server.mjs      ← sıfır-bağımlılık statik sunucu (ARCHIVE_ROOT servis eder)
```

## 3. VERİ SÖZLEŞMESİ (`data/codex.json`)
```jsonc
{
  "meta": { canonVersion:"2.0", bibleCount, sourceCount, sectionCount:148,
            imageCount:132, entityCount:37, generatedAt },
  "bibles": [ {            // 16-cilt uniform şablon (bazıları parent/child)
     "id":"CN-04.2", "title","tr","glyph","accent","order","parent":"CN-04",
     "status":"PARTIAL",   // PRESENT|PARTIAL|SCATTERED|MISSING  (canon.json otorite)
     "hasSource":true, "sources":[...], "subVolumes":[...], "professions":[...],
     "sectionCount":18,
     "sections":[ {
        "id","num","title","kind","subVolume","profession",
        "canonBible":"CN-04.2",           // bu bölümün ait olduğu cilt
        "blocks":[{ "heading","text" }],  // ALLCAPS alt başlıklarla bölünmüş gövde
        "text","excerpt","wordCount",
        "entities":["ciftci","toprak",...], // bu bölümde geçen varlık id'leri
        "sourceId","sourceFile"           // izlenebilirlik
     } ]
  } ],
  "volumes": [ ... ],   // kaynak-bazlı ham gruplama (audit/relmap kullanır; okuyucu KULLANMAZ)
  "graph": {
     "nodes":[{id,label,type,color,total,sections}],   // 37 varlık
     "edges":[{a,b,weight,canonical}],                 // co-occurrence + canonical
     "chains":[{id,label,steps:[entityId...]}],
     "occurrences":{ entityId:[{sectionId,bibleId,volumeTitle,sectionTitle,count}] },
     "types":{...}
  }
}
```
`images.json`: `{ total:132, analyzed:0, images:[{ id:"img-001", file, path, bytes,
status:"unanalyzed", title,description,keywords[],bibles[],volume,entities[],npc,relations[] }] }`
→ **boş slotlar Phase 3 AI-Vision'ın dolduracağı yer.**

`report.json`: `{ duplicates:{duplicates[],boilerplate[]}, gaps:{gaps[]} }`

## 4. KANON — 16 cilt (bkz. CANON_MANIFEST.md)
`CN-00 Genesis · CN-01 Founder Vision · CN-02 World · CN-03 Living Civilization
· CN-04 Production{.1 NPC/.2 Engineering/.3 Gameplay/.4 Environment/.5 AI}
· CN-05 Economy · CN-06 Architecture · CN-07 Mastery · CN-08 Civilization Design
· CN-09 Art · CN-10 Audio · CN-11 Cinematic · CN-12 UI/UX · CN-13 Unreal
· CN-14 History · CN-15 Canon Decisions`

**Cilt yönlendirme (Selin kararı):** Meslek dosyalarının her SAYFA'sı, kaynaktaki
CİLT etiketiyle bir bible'a yönlenir — `CILT_TO_CANON` (config.mjs):
`NPC BIBLE→CN-04.1 · ENGINEERING BIBLE→CN-04.2 · CIVILIZATION DESIGN→CN-08 · USTALIK→CN-07`.

## 5. MEVCUT DURUM
- **Yazılı:** Genesis(34), Founder(8), Art(9), Çiftçi→NPC(1)+Engineering(18), Fırıncı→CivDesign(28)+Mastery(50). Toplam 148 bölüm.
- **Meslek:** 2 yazılı (09 Çiftçi, 10 Fırıncı). 01–08 yok.
- **Görsel:** 132, file-level indeksli (IMG-CAEL-xxxx, boyut/oran/seri), **deep analiz YOK**.
- **Boş ciltler:** World, Economy, Architecture, Audio, Cinematic, UI/UX, Unreal, History, Gameplay.
- **Zincirler:** Buğday→Ekonomi 9/10 · Pamuk→Anadolu 6/9 · Maden→Savunma 1/6.
- **En zayıf katmanlar:** Blueprint/Animation/Sound/ConceptArt ~yok; 132 görsel UNLINKED.

## 6. SIRADAKİ İŞ (öncelik sırası — CODEX_REPAIR_PLAN.md)
1. **PHASE 3 — Image Intelligence:** 132 görseli AI-Vision ile analiz et → her görselin
   `images.json` slotunu doldur (description/keywords/bibles/entities/npc/volume). Yapı hazır:
   `IMG-0038 → CN-04 → NPC → Çiftçi → Harvest → Page` bağlanabilir. Okuyucu Image Vault + Atlas otomatik gösterir.
2. **Boş ciltleri yaz** (BIBLE_TEMPLATE.md standardıyla): World, Economy... 
3. **Zincir eksik meslekleri** (Dokumacı, Boyacı, Terzi, Değirmenci, Madenci, Demirci...).
4. **Deploy:** Vercel (statik — `web/` + `data/`; `server.mjs` yalnızca yerel).

## 7. DEĞİŞMEZ KURALLAR
- Kaynak `.txt` ve 132 görsel **değiştirilmez** (FREEZE). Yeni içerik = yeni dosya.
- Hiçbir şey otomatik **silinmez/birleştirilmez**; yalnızca öneri + insan onayı.
- Yapı değişikliği → önce `CANON_MANIFEST.md`/`canon.json`, sonra `config.mjs`, sonra build.
- Emin değilsen **UNVERIFIED** işaretle ve Selin'e sor. Kanon sahibi Selin/Aura; motor üretir.
- Her kanon kararı **CN-15 Canon Decisions**'a işlenir.

## 8. BİLİNEN NOTLAR
- `meta.bibleCount=21` alt-ciltler dahil sayar (16 üst + 5 Production çocuğu). Üst cilt = 16.
- Görsel tekrar tespiti byte-yakınlığıyla güvenilmez (116/132 aynı boyut) → Phase 3 perceptual hash.
- Marker büyük/küçük harf tutarsızlığı kaynakta var; motor toleranslı ama standart UPPERCASE (CN-15).
- `web/` `fetch('../data/...')` kullanır → mutlaka HTTP üzerinden servis et (server.mjs), `file://` olmaz.
```
```
_Devir tamam. Sorular için: CANON_MANIFEST.md (yapı), README.md (motor), CODEX_REPAIR_PLAN.md (yol haritası)._

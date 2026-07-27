<!-- CAELINUS CANON MANIFEST — v2.0 · 2026-07-27
     Kanon sahibi: Selin (vizyon) / Aura (yaratıcı yön). Claude = üretim motoru.
     16 cilt. Kaynak metinler DONDURULDU (PHASE 0). Machine mirror: canon.json -->

# CAELINUS — CANON MANIFEST v2.0

> "Kanonu düzeltmeden önce kanonu tanımla." — Yapı burada **sabitlendi**.
> Motor (ingest/entity/görsel/relation) bu ağaca göre çalışır. Değişiklik yalnızca
> Selin/Aura onayıyla; her değişiklik `CN-15 Canon Decisions`'a işlenir.

## 0. Yasalar
1. **FREEZE:** Kaynak `.txt` + 132 görsel değiştirilmez (`_freeze/2026-07-27/`).
2. **Tek ağaç:** Aşağıdaki 16 cilt bağlayıcıdır.
3. **Kayıpsız:** Silme/birleştirme yok; yalnızca doğru cilde işaret.
4. **Belirsizse UNVERIFIED** ve sorulur.

---

## 1. KANONİK AĞAÇ — 16 CİLT (bağlayıcı)

```
CN-00  GENESIS ····························· [PRESENT]    CAELINUS-genesis.txt
CN-01  FOUNDER VISION ····················· [PRESENT]    FOUNDER DATA ROOM.txt
│         └ Founder Letter · One Law · Covenant
CN-02  WORLD BIBLE ······················· [SCATTERED]  (Genesis'ten çıkarılacak)
CN-03  LIVING CIVILIZATION ··············· [PARTIAL]    meslek rosteri (Çiftçi·Fırıncı)
CN-04  PRODUCTION BIBLE ·················· [PARTIAL]
│         ├ CN-04.1 NPC ················· ← cilt "NPC BIBLE"
│         ├ CN-04.2 Engineering ········· ← cilt "ENGINEERING BIBLE"
│         ├ CN-04.3 Gameplay ············ [SCATTERED]
│         ├ CN-04.4 Environment ········· [PARTIAL]
│         └ CN-04.5 AI ·················· [PARTIAL]
CN-05  ECONOMY BIBLE ····················· [SCATTERED]
CN-06  ARCHITECTURE BIBLE ················ [MISSING]
CN-07  MASTERY BIBLE ····················· [PARTIAL]    ← cilt "USTALIK SİSTEMLERİ"
CN-08  CIVILIZATION DESIGN BIBLE ········· [PARTIAL]    ← cilt "CIVILIZATION DESIGN BIBLE"
CN-09  ART DIRECTION BIBLE ··············· [PRESENT]    CAELINUS ART BIBLE 001.txt
CN-10  AUDIO BIBLE ······················· [MISSING]
CN-11  CINEMATIC BIBLE ··················· [MISSING]
CN-12  UI/UX CODEX ······················· [MISSING]
CN-13  UNREAL IMPLEMENTATION ············· [SCATTERED]
CN-14  HISTORICAL BIBLE ·················· [SCATTERED]
CN-15  CANON DECISIONS ··················· [PARTIAL]
```

## 2. İÇERİK → CİLT YÖNLENDİRME (Selin kararı)

Meslekler **CN-03 Living Civilization**'da bir roster olarak yaşar; her mesleğin her
SAYFA'sı **CİLT etiketiyle** ilgili sistem-cildine yönlenir. Mastery ve Civilization
Design **çapraz** (tüm meslekler ortak kullanır → Demirci·Marangoz·Çömlekçi·Terzi hepsi):

| Cilt etiketi (kaynakta) | → Kanon |
|---|---|
| NPC BIBLE | CN-04.1 |
| ENGINEERING BIBLE | CN-04.2 |
| CIVILIZATION DESIGN BIBLE | **CN-08** |
| USTALIK SİSTEMLERİ | **CN-07** |

- **Çiftçi (MESLEK 09)** → NPC + Engineering ciltleri → CN-04.1 / CN-04.2
- **Fırıncı (MESLEK 10)** → Civilization Design + Ustalık → CN-08 / CN-07

## 3. UNIFORM BIBLE ŞABLONU

Her cilt aynı şablona getirildi:
```
{ id, title(EN/TR), status, sources[], subVolumes[], sections[], summary }
```
`bible/BIBLE_TEMPLATE.md` yeni cilt yazımının standardıdır.

## 4. Sonraki adım
Kanon sabit → motor bu ağaca göre yeniden ingest edildi (C1 parse). Sıra: ilişki
grafiği genişletme → görsel indeks → eksik rapor (hepsi bu turda). Deep vision = Phase 3.

_Makine kopyası: `canon.json`. Değişiklik → CN-15._

# CAELINUS CODEX — Phase 3 Vision Pilot

## Karar

Bu pilot yalnızca `IMG-CAEL-0001`, `IMG-CAEL-0038` ve `IMG-CAEL-0132`
görsellerini analiz eder. Kalan 129 görsel, Selin/Aura kalite onayı olmadan
işlenmez.

Pilot çıktısı `data/vision-pilot.json` dosyasındadır. Kanonik kaynaklar,
`data/images.json` ve freeze değiştirilmez. Pilot şeması onaylanmadan kalıcı
Image Vault veri sözleşmesine eklenmez.

## Mimari

1. Tam görsel ve dört bölgesel yakın görünüm, yüksek ayrıntı ayarıyla Vision
   modeline verilir.
2. İlk geçiş yalnızca görülebilir kanıtı, OCR metnini ve belirsizlikleri çıkarır.
3. İkinci geçiş yalnızca mevcut Codex Bible/entity taksonomisi ve otomatik
   seçilen bölüm adaylarıyla ilişki kurar.
4. Kanonda bulunmayan gameplay, ekonomi ve Unreal üretim önerileri
   `unverified` kalır. Hiçbir kayıt otomatik `verified` olmaz.
5. Her görselden sonra çıktı atomik yazılır; yarım çalışma kaybolmaz.

## Çalıştırma

Repo kökünden:

```bash
node --env-file=.env.local codex/engine/vision-pilot.mjs
```

Ortam değişkenleri:

- `OPENAI_API_KEY` zorunlu.
- `CODEX_VISION_MODEL` isteğe bağlı; varsayılan `gpt-5.4`.
- `CODEX_ASSET_DIR` isteğe bağlı; taşınabilir görsel dizini override'ı.

## Çıktı sözleşmesi

Her `results[]` kaydı şunları taşır:

- `asset`: kimlik, dosya, SHA-256, boyut, model ve prompt provenance.
- `observation`: başlık, Türkçe açıklama, OCR, nesne/karakter/çevre/malzeme ve
  görsel kanıt.
- `tags`: normalize edilmiş etiketler.
- `canon.relatedBibles` ve `canon.relatedEntities`: kanıt, güven ve statü.
- `npc`, `gameplay`, `economy`, `unrealAssets`: ayrı ilişki listeleri.
- `confidence`: alan bazlı ve genel güven ile açık belirsizlikler.
- `usage`: pilot maliyet denetimi için token kullanımı.

Statüler: `observed`, `canon_match`, `unverified`.

## Onay kapısı

Pilot çıktısı editoryal olarak incelendikten sonra şu kararlar ayrıca alınır:

1. Genişletilmiş şemanın `images.json` sözleşmesine nasıl taşınacağı.
2. Model/prompt sürümünün 129 görsel için dondurulması.
3. İnsan doğrulama akışı ve `verified` statüsünün sahibi.

Bu üç karar alınmadan toplu Vision çalıştırılmaz.

## Image Intelligence v2 kalite kapısı

Production adayı sözleşme `schema/image-asset.v2.schema.json`, üç kayıtlık örnek
ise `data/vision-pilot.v2.json` dosyasındadır. Bu iki dosya `data/images.json`
sözleşmesinden bağımsızdır.

Katman sınırları:

- `rawAi`: değişmez AI çıktısı ve model provenance.
- `candidateMetadata`: yalnızca `analyzed` durumundaki AI adayları.
- `canonicalMetadata`: insan kontrollü alan; migrasyonda boş.
- `semanticLayer` / `indexing`: çok dilli arama, graph ve gelecekteki vector
  index için hazırlık; henüz hiçbir harici indexe yazmaz.

Doğrulama:

```bash
node codex/engine/migrate-vision-v2.mjs
node codex/engine/validate-vision-v2.mjs
```

## Onay sonrası migration

1. Schema ve üç pilot kayıt Selin/Aura tarafından onaylanır.
2. Model/prompt sürümü ile insan review sorumlusu dondurulur.
3. Production consumer önce feature flag arkasında çift-okuma moduna alınır:
   legacy `images.json` otorite, v2 yalnız karşılaştırma kaynağıdır.
4. 129 görsel ayrı ve açık bir onayla işlenir.
5. Schema validation, referans bütünlüğü ve insan review tamamlanmadan v2
   production otoritesi olamaz.
6. Cutover sonrasında legacy sözleşme en az bir release boyunca read-only
   fallback olarak tutulur.

## Rollback

1. V2 feature flag/consumer kapatılır.
2. Okuma yolu yalnız `data/images.json`a döndürülür.
3. `vision-pilot.v2.json` indexleme girdisi olmaktan çıkarılır.
4. `vision-pilot.json`, freeze ve kaynak görseller korunur.
5. `node codex/engine/build.mjs` çalıştırılıp legacy toplam/statü doğrulanır.

V2 henüz hiçbir production consumer'a bağlı olmadığı için mevcut rollback,
yalnız v2 dosyasını devre dışı bırakmaktır; ters veri migrasyonu gerekmez.

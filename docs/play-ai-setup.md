# Play Studio · Gerçek AI Kurulumu

`/play` rotası bir tanrıça posteri üretir: **arşetip × burç × sahne** üçlüsünden.
Geliştirme modunda yerel bir SVG yer tutucu (stub) dönüyor — gerçek bir
AI sağlayıcısına bağlanmak için tek yapman gereken `.env.local`'a iki
değişken yazıp dev server'ı yeniden başlatmak.

## 1. Sağlayıcı seç

| Sağlayıcı | Kalite | Süre | Maliyet (~) | Ne zaman? |
|-----------|--------|------|-------------|-----------|
| `stub`        | Düşük (yer tutucu) | <1s  | Bedava   | UI/demo |
| `replicate`   | Yüksek (SDXL)      | 10–25s | ~$0.003/render | **Üretim önerisi** |
| `openai`      | Yüksek (gpt-image-1) | 5–15s | ~$0.020/render | Düşük gecikme isteyince |

> Caelinus tarafında her benzersiz üçlü Supabase'te cache'leniyor —
> ikinci `(arşetip, burç, sahne)` çağrısı sağlayıcıya hiç gitmiyor.
> Yani toplam maliyet pratik kullanımda her üçlü için **bir kez**.

## 2. Replicate (önerilen)

1. https://replicate.com → kayıt ol → kart bilgisi gir (5 USD ücretsiz başlangıç verir).
2. **Account → API tokens** → "Create token" → adı `caelinus` ver, ortaya çıkan `r8_...` değerini kopyala.
3. `.env.local`'a ekle:

```bash
PLAY_AI_PROVIDER=replicate
PLAY_AI_API_KEY=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Opsiyonel — model değişikliği:
# PLAY_AI_REPLICATE_MODEL=stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b

# Opsiyonel — saatlik IP başına render bütçesi (default 60):
# PLAY_AI_HOURLY_BUDGET=60
```

4. Dev server'ı yeniden başlat: `npm run dev`.
5. `/play` → bir üçlü seç → "Tanrıça çiziliyor..." sonra ~15s içinde poster ekrana düşer.

### Model güncelleme

`PLAY_AI_REPLICATE_MODEL` `slug:version` biçiminde olmalı. Yeni bir
model denerken Replicate model sayfasından "API → Use this model"
sekmesindeki `version` SHA'sını kopyala. Caelinus polling'i 60s'lik bir
deadline'la yapıyor — bu süre içinde dönmezse hata düşer.

## 3. OpenAI (alternatif)

```bash
PLAY_AI_PROVIDER=openai
PLAY_AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

## 4. Stub (varsayılan)

Hiçbir şey yazmazsan otomatik olarak `stub`'a düşer. Hata vermez,
deterministik renkli bir SVG döner. Production'da da eğer
`PLAY_AI_API_KEY` boşsa kod sessizce stub'a fallback eder — kullanıcı
hata görmez ama gerçek AI çıkmaz.

## 5. Bütçe koruması

`/api/play/render` cache miss durumunda IP başına saatlik render
sayar. Limit aşıldığında `429` döner ve frontend "Saatlik render
limitine ulaştın" mesajını gösterir. Default 60 — viral demolardan önce
düşürmek istersen `PLAY_AI_HOURLY_BUDGET`'i kullan.

> Sayaç **per-instance bellekte**. Birden çok serverless instance varsa
> efektif limit çoğalır. Production'da Upstash Redis'e geçmek için
> `lib/play/rate-limit.ts`'i değiştirmek yeterli.

## 6. Teşhis ipuçları

| Hata | Sebep | Çözüm |
|------|-------|-------|
| 503 + "service-role key missing" | `SUPABASE_SERVICE_ROLE_KEY` boş | Supabase → Settings → API'den al |
| 502 + "Replicate start failed: 401" | `PLAY_AI_API_KEY` hatalı/eksik | Yeni token üret |
| 502 + "did not succeed (status=timeout)" | Replicate 60s'de bitiremedi | Tekrar dene; sürekliyse model'i değiştir |
| 429 + "quota_exceeded" | IP saatlik limiti aştı | Bekle veya `PLAY_AI_HOURLY_BUDGET` artır |
| Sürekli stub posteri | Provider seti `stub` ya da key boş | `.env.local`'ı doğrula, dev server'ı kapat-aç |

## 7. Kullanım takibi

`play_renders` tablosu her benzersiz üçlüyü ve hangi sağlayıcıdan
geldiğini tutar. Süpervizyon için Supabase Studio'da:

```sql
select provider, count(*) renders
from play_renders
group by provider;
```

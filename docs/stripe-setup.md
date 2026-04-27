# Stripe Setup — Caelinus E-ticaret

Bu rehber, Caelinus'ta **gerçek satış** akışını çalıştırmak için Stripe
entegrasyonunun nasıl yapılandırılacağını anlatır.

> **TL;DR**: Stripe hesabı aç → API key + webhook secret al → `.env.local`'e
> ekle → migration'ları uygula → test kartıyla sipariş ver. ⌖

---

## 1. Stripe hesabı

1. https://dashboard.stripe.com/register adresinden hesap aç (Türkçe destekli).
2. **Test mode** açık olsun — sol üstteki anahtardan "Test mode" seçili olduğunu doğrula.
3. Para birimi olarak **TRY (Türk Lirası)** desteği için Stripe'ın
   o ülkede aktivasyon vermesi gerekir. Türkiye için Stripe doğrudan
   etkin değil, dolayısıyla:
   - Geliştirme/test için ABD/AB hesabı + USD/EUR kullanılabilir.
   - Canlıya çıkmadan önce Stripe TR ortağıyla (örn. iyzico, PayTR) gözden
     geçir; Caelinus kodu Stripe Checkout iken kolayca başka bir
     gateway'e taşınabilir.

## 2. API anahtarları

Stripe Dashboard → **Developers → API keys**:

- `Publishable key` → istemcide kullanılmıyor (Caelinus, Checkout
  redirect modu kullandığı için yalnızca server tarafına gerek var).
- `Secret key` → `STRIPE_SECRET_KEY` olarak `.env.local`'e ekle.

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY_DEFAULT=TRY        # ürünlerde currency yoksa fallback
```

## 3. Webhook secret

Stripe **Developers → Webhooks → Add endpoint**:

- **Endpoint URL**:
  - **Local**: `http://localhost:3000/api/stripe/webhook` (Stripe CLI ile, aşağıya bak)
  - **Prod**: `https://<domain>/api/stripe/webhook`
- **Events to listen for** (en az):
  - `checkout.session.completed`
  - `payment_intent.succeeded`

Endpoint kaydedildikten sonra **Signing secret** (`whsec_...`) görünür.
`.env.local`'e ekle:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

> Webhook secret yoksa `route.ts` `signature verification failed`
> dönerek 400 verir — bu istenen davranış (sahte istekler düşmesin).

### Local test için Stripe CLI

```bash
# Bir kez kurulum (https://stripe.com/docs/stripe-cli)
stripe login

# Tüm webhook eventlerini local route'a forward et
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

CLI başlattığında ekrana bir test secret yazar (örn.
`whsec_1a2b3c...`); o secret'ı geçici olarak `.env.local`'e koy ve
`npm run dev`'i restart et.

## 4. Veritabanı migration'ları

Sırayla çalıştır:

```bash
# Production / staging Supabase üzerinde:
supabase db push

# Veya SQL dosyalarını manuel uygula:
supabase/migrations/0006_orders.sql      # tablolar + RLS
supabase/migrations/0007_orders_tracking.sql  # tracking + lifecycle
```

Tablolar oluştuğunda RLS otomatik etkin:

| Tablo                  | Kim okur                              | Kim yazar                     |
| ---------------------- | ------------------------------------- | ----------------------------- |
| `atelier_orders`       | alıcı (kendisi), atölye sahibi        | webhook (service-role) + sahip (status) |
| `atelier_order_items`  | parent order'a göre piggyback         | yalnızca service-role          |

## 5. Akış kontrolü

Caelinus'taki entegrasyonun sırası:

```
Buyer (Atelier sayfası) ──► [Satın al] form action
   │
   ▼
startItemCheckout (server action)
   │ – item & atelier doğrula
   │ – Stripe Checkout Session yarat
   ▼
Stripe Hosted Checkout ──► Buyer ödemeyi yapar
   │
   ▼ (Stripe → bizim webhook)
/api/stripe/webhook
   │ – signature doğrula
   │ – session.completed → atelier_orders + items upsert
   │ – payment_intent.succeeded → status='paid' + maker e-posta
   ▼
Buyer  → /atelier/<slug>/checkout/basarili?session_id=...
        → /hesap/siparislerim/<orderId>
Maker  → /atelier/dashboard/siparisler
        → "Kargolandı" → buyer'a e-posta + tracking
```

## 6. Test kartları

| Senaryo               | Kart no              | Tarih      | CVC |
| --------------------- | -------------------- | ---------- | --- |
| Başarılı ödeme        | `4242 4242 4242 4242`| ileri tarih| 123 |
| 3D Secure isteyen     | `4000 0027 6000 3184`| ileri tarih| 123 |
| Reddedilen            | `4000 0000 0000 9995`| ileri tarih| 123 |

Tüm test kartları için **isim/adres alanları serbest** — gerçek
TC kimliği gerekmez.

## 7. Sipariş yönetimi

- **Üretici tarafı**: `/atelier/dashboard/siparisler`
  - Filtre çipleri: All · Paid · Shipped · Delivered · Cancelled
  - "Kargolandı" formu → kargo firması + takip no + URL + müşteri notu
  - Submit → status `shipped`, `shipped_at` damgalanır, alıcıya **otomatik
    e-posta** gider (RESEND_API_KEY varsa, yoksa server log'a düşer).
  - "Teslim edildi" tek tıkla, "İptal et" opsiyonel sebep ile.
- **Alıcı tarafı**: `/hesap/siparislerim`
  - Status timeline (paid → shipped → delivered)
  - Tracking link
  - Detay: `/hesap/siparislerim/<orderId>`

## 8. Production checklist

- [ ] Stripe **live** API key (`sk_live_...`) ayrı `.env.production` dosyasına
- [ ] Live webhook secret (`whsec_live_...`)
- [ ] Production domain'i Stripe webhook endpoint'ine eklenmiş
- [ ] `NEXT_PUBLIC_SITE_URL` production URL'sine ayarlı (`https://...`)
- [ ] Resend (veya SMTP) gerçek mail için yapılandırılmış (`docs/email-setup.md`)
- [ ] Supabase RLS policy'lerinin migration'ları prod'a uygulanmış
- [ ] Para birimi onayı: TRY desteği varsa `STRIPE_CURRENCY_DEFAULT=TRY`,
      yoksa USD/EUR — atelier item formundaki currency dropdown'unu da güncelle.
- [ ] KVKK/aydınlatma metni & mesafeli satış sözleşmesi linki Caelinus
      checkout süreciyle uyumlu (Stripe Checkout `terms_of_service_url`
      override edilebilir; `_actions/checkout.ts`'e ekle).

## 9. Sık karşılaşılan hatalar

### `Stripe oturumu açılamadı`

- API key yanlış (test/live karışmış olabilir).
- Currency Stripe hesabınca desteklenmiyor (örn. TRY ama TR onayı yok).
- Item resmi yerel `localhost` URL — Stripe Checkout uzaktan erişebilir
  bir cover URL bekler. Lokalde test ederken `images` boş bırakmayı dene.

### Webhook 400 (`signature verification failed`)

- `STRIPE_WEBHOOK_SECRET` yanlış / eski.
- `req.text()` yerine `req.json()` ile body okumaya çalışmışsın → bizim
  `route.ts` zaten doğru, ama proxy/middleware body'yi değiştiriyor olabilir.

### Sipariş gelmiyor ama Stripe başarılı

- Webhook ulaşmıyor olabilir → `stripe listen` veya Stripe Dashboard
  → Webhooks → Endpoint detayında "Recent deliveries" sekmesinde
  status'e bak.
- Service-role key (`SUPABASE_SERVICE_ROLE_KEY`) eksik → webhook RLS'i
  bypass edemiyor → log'da `permission denied for table` görünür.

### Alıcıya kargo bildirimi gitmiyor

- `RESEND_API_KEY` yok → konsola düştü, gerçek mail için key ekle.
- `auth.users.email` boş ve `buyer_email` de boş → Stripe Checkout
  `customer_email` doldurmadan tamamlandı (eski test session'ı).

## 10. Geliştirme döngüsü

```bash
# 1. dev server
npm run dev

# 2. ayrı terminalde Stripe CLI
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# 3. tarayıcıdan /atelier/<slug> → "Satın al" → test kartıyla öde
# 4. /atelier/dashboard/siparisler → kargolandı işaretle
# 5. console + /hesap/siparislerim → durumu doğrula
```

⌖ — Caelinus

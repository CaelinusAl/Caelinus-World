# CAELINUS · Supabase Kurulum Rehberi

Bu klasör, Caelinus'un sunucu tarafı altyapısını barındırır:

```
supabase/
├── migrations/
│   ├── 0001_init.sql              # tablolar + enum'lar
│   ├── 0002_triggers.sql          # otomatik profile + updated_at + admin helper
│   ├── 0003_rls.sql               # row-level security politikaları
│   ├── 0004_storage.sql           # depolama bucket'ları + politikaları
│   ├── 0005–0010                  # play renders, sipariş, atelier, profil ekleri
│   ├── 0011_caelinus_avatar.sql   # caelinus_avatar_url / zodiac / updated_at
│   ├── 0012_caelinus_ai_studio.sql # caelinus_ai_jobs / _events / _avatars (AI studio)
│   ├── 0013_avatar_base.sql       # caelinus_avatar_base (silk|bodysuit|veil)
│   ├── 0014_caelinus_avatar_session.sql  # QR mobil selfie oturumu
│   ├── 0015_members_network.sql   # frekans ağı (roller, handle, public_members view)
│   ├── 0016_contributions.sql     # üye katkıları + public_contributions view
│   └── 0017_preorders.sql         # yumuşak lansman ön siparişleri (service-role yazar, RLS kapalı)
└── README.md                      # bu dosya
```

Migration'lar idempotent yazıldı — `if not exists` ve `drop policy if exists` kullanır, bu yüzden tekrar çalıştırmak güvenlidir. Boş bir projeyi sıfırdan kurmak için migration'ları `0001`'den itibaren sırayla SQL Editor'de çalıştır.

---

## 1) Yeni bir Supabase projesi açma

1. <https://supabase.com> → **New project**
2. Bölge: **Frankfurt (eu-central-1)** (Türkiye'ye en yakın hızlı veri merkezi)
3. **Organization**, **DB password**, **Region** seçimi yap → Create.
4. Proje açıldıktan sonra:
   - **Project Settings → API** sekmesinden:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` (⚠️ gizli) → `SUPABASE_SERVICE_ROLE_KEY`
   - **Authentication → URL Configuration**:
     - **Site URL** = `http://localhost:3000` (geliştirme) ya da `https://caelinus.ai` (prod)
     - **Redirect URLs** → şunları ekle:
       ```
       http://localhost:3000/auth/callback
       https://caelinus.ai/auth/callback
       ```
   - **Authentication → Providers → Email**:
     - **Enable Email Signups** ✅
     - **Confirm email** ✅ (production'da şart)
     - **Secure email change** ✅

---

## 2) Anahtarları yerel ortama yapıştırma

Proje kök dizinindeki `.env.example` dosyasını `.env.local` olarak kopyala ve yukarıda topladığın değerleri doldur.

Windows (PowerShell):

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Doldurulması gereken minimum alanlar:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
CAELINUS_ADMIN_EMAILS=senin@mail.com
```

> `.env.local` git tarafından izlenmez (`.gitignore` içinde). Asla commit'leme.

---

## 3) Migration'ları çalıştırma

Üç yol var. Hangisi sana uygunsa onu seç.

### A) Hızlı yol — Supabase Dashboard SQL Editor

1. Supabase paneli → **SQL Editor** → **+ New query**
2. `supabase/migrations/0001_init.sql` içeriğini yapıştır → **Run**
3. Sırasıyla `0002_triggers.sql`, `0003_rls.sql`, `0004_storage.sql` için tekrar et.

> **Önemli:** sırayı bozma. Trigger'lar tabloları, RLS de helper fonksiyonları gerektirir.

### B) Supabase CLI

```bash
npm i -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

CLI, `supabase/migrations/` altındaki dosyaları sıralı şekilde uygular.

### C) `psql` ile doğrudan

`Project Settings → Database → Connection string` altından **URI** alıp:

```bash
psql "<connection-uri>" -f supabase/migrations/0001_init.sql
psql "<connection-uri>" -f supabase/migrations/0002_triggers.sql
psql "<connection-uri>" -f supabase/migrations/0003_rls.sql
psql "<connection-uri>" -f supabase/migrations/0004_storage.sql
```

---

## 4) İlk admin'i tanımlama

İki yol birden destekleniyor — birini seç:

**a) Tablo tabanlı (önerilen):**

```sql
insert into public.caelinus_admins (email, note)
values ('senin@mail.com', 'Caelinus core team');
```

**b) Env tabanlı (sadece sunucu kontrolleri için yeterli):**

`.env.local` içine:

```env
CAELINUS_ADMIN_EMAILS=senin@mail.com, ortagin@mail.com
```

> Tablo, RLS politikalarında kullanılır (DB seviyesinde admin yetkisi). Env, Next.js sunucu tarafı kontrollerinde kullanılır (sayfa erişimi vs.). Pratikte ikisini de aynı kümede tutmak en güvenlisidir.

---

## 5) Smoke testleri

Geliştirme sunucusunu başlat:

```bash
npm run dev
```

Sonra başka bir terminalden:

```powershell
# Auth & atelier sayfalarının 200 dönmesi
powershell -ExecutionPolicy Bypass -File scripts/smoke-atelier-http.ps1
```

Beklenen çıktı:

```
[OK] /atelier              200
[OK] /atelier/giris        200
[OK] /atelier/kayit        200
```

---

## 6) Sık karşılaşılan hatalar

| Belirti                                              | Çözüm                                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `[CAELINUS] Invalid public environment` build hatası | `.env.local` doldurulmamış. Adım 2'yi yap.                                                          |
| Magic link tıklanınca `Auth callback error`          | Supabase **URL Configuration → Redirect URLs** listesinde `/auth/callback` yok. Adım 1'i kontrol et. |
| `new row violates row-level security policy`         | Migration sırası bozulmuş. `0001 → 0002 → 0003 → 0004` sırasıyla tekrar çalıştır.                   |
| `permission denied for table ateliers`               | Anahtar olarak `service_role` yerine `anon` kullanıyorsan normal — RLS bekleneni yapıyor.           |
| Yüklenen görsel public görünmüyor                    | Bucket'ın `public = true` olduğunu kontrol et (`0004_storage.sql` bunu garantiler).                |

---

## 7) Yeni migration eklerken

1. Yeni dosyayı `0005_xxx.sql` gibi sıralı isimlendir.
2. Sadece **idempotent** SQL yaz:
   - `create table if not exists`
   - `create or replace function`
   - `drop policy if exists … ; create policy …`
3. `lib/supabase/types.ts` içindeki `Database` tipini güncelle (ya da `supabase gen types` ile yeniden üret).
4. Migration'ı dashboard / CLI ile uygula.

---

Toprak, dijital de olsa, hatırlar.

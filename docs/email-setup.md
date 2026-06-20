# Caelinus E-posta Kurulumu (Resend)

Caelinus üreticilere atölye onayı/red'i hakkında e-posta yollar
(`/atelier/admin` → Onayla / Geri gönder).

Sağlayıcı: **Resend** (https://resend.com). Tek bir provider'a bağlı
kalmamak için `lib/email/sender.ts`'i değiştirip Postmark, SES, SMTP ne
istersen onu koyabilirsin — interface aynı.

## 1. Resend hesabı

1. https://resend.com → kayıt ol (ücretsiz: ay 3K mail / gün 100 mail).
2. **Domains** → "Add Domain" → kullanmak istediğin domain'i gir, örn.
   `mail.caelinus.ai`. Resend sana 4 DNS satırı verir
   (DKIM + Return-Path); bunları DNS sağlayıcına ekle.
3. Resend domain durumu "Verified" olduğunda devam et.
4. **API Keys** → "Create API Key" → scope: **Sending access** seç →
   `re_...` token'ını kopyala.

## 2. Caelinus tarafı

`.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Caelinus <hello@mail.caelinus.ai>"
NEXT_PUBLIC_SITE_URL=https://caelinus.ai
```

> `EMAIL_FROM`'daki adres, doğruladığın domain'de olmalı; aksi halde
> Resend `from address not allowed` hatası döner. Domain henüz
> doğrulanmadıysa testler için
> `Caelinus <onboarding@resend.dev>` kullanabilirsin — bu adres yalnızca
> Resend hesabına kayıtlı kullanıcıya gönderir.

## 3. Çalışma mantığı

`app/atelier/admin/actions.ts` içinde:

- `approveAtelier(id)` çağrıldığında `atelierApprovedEmail` template'i
  ile mail gider.
- `rejectAtelier(id, reason)` çağrıldığında `atelierRejectedEmail`
  template'i ile reddetme notu birebir aktarılır.

E-postalar best-effort: gönderim başarısız olursa karar geri alınmaz,
sadece sunucu logunda `[atelier.admin] decision mail failed: …` görürsün.

Locale: `profiles.locale` (üreticinin dili) ne ise template o dilde
render eder; varsayılan `tr`.

## 4. Test

`RESEND_API_KEY` boşken bile sistem hata vermez — terminale yazdırır:

```
[email.sender] (no RESEND_API_KEY) would have sent {
  "to": "...",
  "from": "Caelinus <onboarding@resend.dev>",
  "subject": "..."
}
```

Bu sayede CI'da, lokal demoda ya da test kullanıcılarda gerçek mail
trafiği yaratmadan akışı doğrulayabilirsin.

Gerçek bir gönderim denemesi için:

1. Test atölyesi oluştur (`/atelier/basvuru` → form gönder).
2. Admin olarak `/atelier/admin` → "Onayla" → tezgâh sahibi mail
   gelmiş mi kontrol et.

## 5. Yeni şablon eklemek

Yeni bir transactional mail için (örn. "ürünün satıldı"):

1. `lib/email/templates/<konu>.ts` aç, `subject/html/text` döndüren
   fonksiyon yaz.
2. Çağırmak istediğin server action'da:
   ```ts
   const tpl = newTemplate({...});
   await sendEmail({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
   ```
3. `text` fallback'i ihmal etme — Gmail "Show original" görünümünde HTML
   düzgün açılmazsa kullanıcının kurtarılması bu satırla olur.

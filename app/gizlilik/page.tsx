import type { Metadata } from "next";
import LegalShell from "@/components/legal/LegalShell";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK Aydınlatma Metni · Caelinus",
  description:
    "Caelinus kişisel verilerin korunması, gizlilik politikası ve KVKK aydınlatma metni.",
};

export default function GizlilikPage() {
  return (
    <LegalShell title="Gizlilik ve KVKK Aydınlatma Metni">
      <p>
        {COMPANY.brand} olarak ({COMPANY.legalName}) kişisel verilerinizin
        gizliliğine önem veriyoruz. Bu metin, 6698 sayılı Kişisel Verilerin
        Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu sıfatıyla
        hangi verilerinizi, hangi amaçlarla ve nasıl işlediğimizi açıklar.
      </p>

      <h2>1. Veri Sorumlusu</h2>
      <p>
        <strong>{COMPANY.dataController}</strong>
        <br />
        Adres: {COMPANY.address}
        <br />
        Vergi Dairesi / No: {COMPANY.taxOffice} · {COMPANY.taxId}
        <br />
        E-posta: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </p>

      <h2>2. İşlenen Kişisel Veriler</h2>
      <p>Hizmetlerimizi sunarken aşağıdaki kişisel verileri işleyebiliriz:</p>
      <ul>
        <li>
          <strong>Kimlik ve iletişim:</strong> ad-soyad, e-posta adresi,
          telefon numarası, teslimat/fatura adresi.
        </li>
        <li>
          <strong>Hesap verileri:</strong> üyelik/giriş bilgileri, tercihleriniz
          (örn. frekans/burç seçimi).
        </li>
        <li>
          <strong>İşlem verileri:</strong> ön sipariş ve talep kayıtları, sepet
          içeriği.
        </li>
        <li>
          <strong>Teknik veriler:</strong> IP adresi, tarayıcı/cihaz bilgisi,
          çerezler aracılığıyla toplanan kullanım verileri (bkz.{" "}
          <a href="/cerez-politikasi">Çerez Politikası</a>).
        </li>
        <li>
          <strong>Biyometrik / görüntü verileri (yalnızca avatar özelliğini
          kullanırsanız):</strong> Avatar oluşturmak için isteğe bağlı olarak
          yüklediğiniz fotoğraf/selfie görüntüleri ve bunlardan üretilen avatar
          modeli. Bu veriler <strong>yalnızca açık rızanızla</strong> işlenir.
        </li>
      </ul>

      <h2>2.1. Yüz / Selfie Görüntülerinin İşlenmesi (Özel Nitelikli Veri)</h2>
      <p>
        Avatar oluşturma özelliği opsiyoneldir. Bu özelliği kullanmayı
        seçerseniz yüklediğiniz görüntü, KVKK kapsamında özel nitelikli kişisel
        veri sayılabilir ve <strong>yalnızca açık rızanızla</strong>, sadece
        avatarınızı üretmek amacıyla işlenir. Görüntüler:
      </p>
      <ul>
        <li>üçüncü kişilerle pazarlama amacıyla paylaşılmaz,</li>
        <li>yalnızca avatar üretimi için gerekli süre boyunca saklanır ve
          işlem tamamlandığında veya talebiniz üzerine silinir,</li>
        <li>rızanızı dilediğiniz an geri çekebilirsiniz; geri çektiğinizde
          ilgili görüntü ve türetilmiş veriler silinir.</li>
      </ul>
      <p>
        Bu özelliği kullanmadığınız sürece herhangi bir biyometrik/görüntü
        verisi işlenmez.
      </p>

      <h2>3. İşleme Amaçları</h2>
      <ul>
        <li>Ön sipariş ve taleplerinizi alıp sizinle iletişime geçmek,</li>
        <li>Üyelik ve hesap işlemlerini yürütmek, kimlik doğrulamak,</li>
        <li>Ürün/hizmetlerimizi sunmak, geliştirmek ve kişiselleştirmek,</li>
        <li>Yasal yükümlülüklerimizi yerine getirmek,</li>
        <li>İzin vermeniz hâlinde sizi kampanya ve gelişmelerden haberdar etmek.</li>
      </ul>

      <h2>4. Hukuki Sebepler</h2>
      <p>
        Kişisel verileriniz KVKK m.5 kapsamında; bir sözleşmenin kurulması veya
        ifası, hukuki yükümlülüğün yerine getirilmesi, meşru menfaat ve gerekli
        hâllerde açık rızanıza dayanılarak işlenir.
      </p>

      <h2>5. Verilerin Aktarımı</h2>
      <p>
        Verileriniz; hizmet aldığımız barındırma (hosting), e-posta gönderimi,
        ödeme ve altyapı sağlayıcıları ile yalnızca hizmetin gerektirdiği ölçüde
        ve gerekli güvenlik tedbirleri alınarak paylaşılabilir. Yurt dışında
        sunucusu bulunan tedarikçiler kullanıldığında aktarım KVKK&apos;ya uygun
        şekilde gerçekleştirilir.
      </p>

      <h2>6. Saklama Süresi</h2>
      <p>
        Kişisel verileriniz, işleme amacının gerektirdiği süre ve ilgili
        mevzuatta öngörülen yasal süreler boyunca saklanır; sürenin sonunda
        silinir, yok edilir veya anonim hâle getirilir.
      </p>

      <h2>7. KVKK Kapsamındaki Haklarınız</h2>
      <p>KVKK m.11 uyarınca veri sorumlusuna başvurarak:</p>
      <ul>
        <li>Kişisel verinizin işlenip işlenmediğini öğrenme,</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
        <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,</li>
        <li>Eksik/yanlış işlenmişse düzeltilmesini isteme,</li>
        <li>Silinmesini veya yok edilmesini isteme,</li>
        <li>İşlemenin münhasıran otomatik sistemlerle analizine itiraz etme,</li>
        <li>Zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
      </ul>
      <p>haklarına sahipsiniz.</p>

      <h2>8. Başvuru</h2>
      <p>
        Haklarınızı kullanmak için taleplerinizi{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> adresine
        iletebilirsiniz. Başvurularınız en geç 30 gün içinde sonuçlandırılır.
      </p>
    </LegalShell>
  );
}

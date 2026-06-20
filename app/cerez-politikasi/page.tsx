import type { Metadata } from "next";
import LegalShell from "@/components/legal/LegalShell";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Çerez Politikası · Caelinus",
  description: "Caelinus web sitesinde kullanılan çerezler hakkında bilgilendirme.",
};

export default function CerezPolitikasiPage() {
  return (
    <LegalShell title="Çerez Politikası">
      <p>
        {COMPANY.brand} olarak web sitemizde deneyiminizi iyileştirmek ve siteyi
        analiz etmek için çerezler ve benzeri teknolojiler kullanıyoruz. Bu
        politika hangi çerezleri ne amaçla kullandığımızı açıklar.
      </p>

      <h2>1. Çerez Nedir?</h2>
      <p>
        Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza
        kaydedilen küçük metin dosyalarıdır. Siteyi tekrar ziyaret ettiğinizde
        tercihlerinizin hatırlanmasını ve sitenin düzgün çalışmasını sağlar.
      </p>

      <h2>2. Kullandığımız Çerez Türleri</h2>
      <ul>
        <li>
          <strong>Zorunlu çerezler:</strong> Sitenin temel işlevleri (oturum,
          güvenlik, dil/bölge tercihi, sepet) için gereklidir.
        </li>
        <li>
          <strong>Tercih çerezleri:</strong> Seçimlerinizi (örn. dil, frekans)
          hatırlar.
        </li>
        <li>
          <strong>Analitik çerezler:</strong> Ziyaretçi sayısı ve sayfa
          performansını anonim olarak ölçmemize yardımcı olur.
        </li>
      </ul>

      <h2>3. Çerezleri Yönetme</h2>
      <p>
        Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz.
        Ancak zorunlu çerezleri devre dışı bırakmanız hâlinde sitenin bazı
        bölümleri düzgün çalışmayabilir.
      </p>

      <h2>4. İletişim</h2>
      <p>
        Çerez kullanımı hakkında sorularınız için{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> adresinden bize
        ulaşabilirsiniz. Kişisel verilerin işlenmesine ilişkin detaylar için{" "}
        <a href="/gizlilik">Gizlilik ve KVKK Aydınlatma Metni</a> sayfamıza
        bakabilirsiniz.
      </p>
    </LegalShell>
  );
}

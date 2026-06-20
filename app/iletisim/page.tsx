import type { Metadata } from "next";
import LegalShell from "@/components/legal/LegalShell";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "İletişim · Caelinus",
  description: "Caelinus iletişim ve resmî şirket bilgileri.",
};

export default function IletisimPage() {
  return (
    <LegalShell title="İletişim" showUpdated={false}>
      <p>
        Sorularınız, ön sipariş talepleriniz veya işbirlikleri için bize
        ulaşabilirsiniz. Ekibimiz en kısa sürede yanıt verir.
      </p>

      <dl className="legal-contact-card">
        <dt>Ticari Ünvan</dt>
        <dd>{COMPANY.legalName}</dd>

        <dt>Adres</dt>
        <dd>{COMPANY.address}</dd>

        <dt>E-posta</dt>
        <dd>
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </dd>

        <dt>Telefon</dt>
        <dd>
          <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>
        </dd>

        <dt>Vergi Dairesi / No</dt>
        <dd>
          {COMPANY.taxOffice} · {COMPANY.taxId}
        </dd>
      </dl>

      <p>
        Kişisel verilerinizle ilgili talepleriniz için{" "}
        <a href="/gizlilik">Gizlilik ve KVKK Aydınlatma Metni</a> sayfamızı
        inceleyebilirsiniz.
      </p>
    </LegalShell>
  );
}

/**
 * Caelinus'u işleten tüzel kişiye ait resmî bilgiler.
 *
 * Yasal sayfalar (Gizlilik/KVKK, Çerez, İletişim, ileride Mesafeli Satış)
 * ve yapılandırılmış veri (JSON-LD) buradan beslenir — tek kaynak.
 *
 * NOT: Adres resmî/tescilli adrestir (vergi levhası). Ofis fiziksel olarak
 * taşınsa da, ticaret sicili + vergi dairesi güncellenene kadar yasal
 * metinlerde tescilli adres kullanılır.
 */

export const COMPANY = {
  /** Marka adı (görünen). */
  brand: "Caelinus",
  /** Resmî ticaret ünvanı. */
  legalName: "CR Yapım Teknolojileri Reklam Ajansı Tic. Ltd. Şti.",
  /** Vergi dairesi. */
  taxOffice: "Kadıköy",
  /** Vergi kimlik numarası. */
  taxId: "6220627067",
  /** Tescilli merkez adresi. */
  address:
    "Rasimpaşa Mah. Uzun Hafız Sk. Uzunal No: 2 İç Kapı No: 11 Kadıköy / İstanbul",
  /** İletişim e-postası. */
  email: "hello@caelinus.ai",
  /** İletişim telefonu (görünen format). */
  phone: "0533 022 22 21",
  /** Telefon tel: linki için sade format. */
  phoneHref: "+905330222221",
  /** Kanonik site. */
  site: "https://caelinus.ai",
  /** KVKK veri sorumlusu (tüzel kişi). */
  dataController: "CR Yapım Teknolojileri Reklam Ajansı Tic. Ltd. Şti.",
} as const;

/** Son güncelleme tarihi (yasal metin başlıkları için). */
export const LEGAL_LAST_UPDATED = "16 Haziran 2026";

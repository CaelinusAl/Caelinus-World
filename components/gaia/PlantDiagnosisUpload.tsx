"use client";

/**
 * PlantDiagnosisUpload — "Fotoğrafla Teşhis Et".
 *
 * Kullanıcı bir yaprak/bitki fotoğrafı seçer (yalnızca tarayıcıda önizleme,
 * hiçbir yere yüklenmez) + belirtileri yazar. Gönderince Gaia AI'ya
 * OLASILIKLI teşhis için yapılandırılmış bir soru gider (onAsk).
 *
 * Güvenlik: kesin teşhis vaadi yok; açık izin + privacy notu gösterilir.
 */

import { useRef, useState } from "react";

type Props = {
  onAsk: (prompt: string) => void;
};

export default function PlantDiagnosisUpload({ onAsk }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [consent, setConsent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Sadece yerel önizleme — dosya hiçbir sunucuya gönderilmez.
    const url = URL.createObjectURL(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
  }

  function submit() {
    const desc = symptoms.trim();
    if (!desc) return;
    onAsk(
      `Bitkimde şu belirtileri görüyorum: "${desc}". Bu neyin belirtisi olabilir? ` +
        `Lütfen kesin teşhis koyma; olası nedenleri olasılık sırasına göre söyle ve ` +
        `ışık, sulama, toprak ve nem açısından neyi kontrol etmem gerektiğini sor.`,
    );
  }

  return (
    <div className="plant-dx-card">
      <p className="plant-dx-kicker">Fotoğrafla Teşhis Et</p>
      <p className="plant-dx-sub">
        Bir yaprak/bitki fotoğrafı seç ve belirtileri yaz. Gaia kesin teşhis
        koymaz — olası nedenleri ve kontrol etmen gerekenleri söyler.
      </p>

      <div className="plant-dx-row">
        <button
          type="button"
          className="plant-dx-pick"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? "Fotoğrafı Değiştir" : "📷 Fotoğraf Seç"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          hidden
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="plant-dx-preview" src={preview} alt="Seçilen bitki fotoğrafı" />
        )}
      </div>

      <textarea
        className="plant-dx-symptoms"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        placeholder="Belirtileri yaz: ör. alt yapraklar sararıyor, uçlar kahverengi, toprak sürekli nemli…"
        rows={3}
      />

      <label className="plant-dx-consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          Fotoğrafımın yalnızca tarayıcımda önizlendiğini, hiçbir sunucuya
          yüklenmediğini anladım.
        </span>
      </label>

      <button
        type="button"
        className="plant-dx-submit"
        onClick={submit}
        disabled={!symptoms.trim() || !consent}
      >
        Olasılıkla Teşhis Et
      </button>

      <p className="plant-dx-privacy">
        Gizlilik: Yüklediğin görsel cihazından çıkmaz. Teşhis bir kesinlik
        değil, bir yön göstergesidir.
      </p>
    </div>
  );
}

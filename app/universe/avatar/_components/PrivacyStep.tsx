"use client";

/**
 * [2] GİZLİLİK ONAYI — Experience Bible §2[2].
 *
 * Bir uyarı kutusu değil, bir SÖZ. MVP'de yüz yalnızca cihazında
 * (localStorage) tutulur; hiçbir sunucuya gönderilmez. İstediğin an
 * silinir. Yüz verilmediyse bu eşik bilgilendirici geçilir.
 */

type Props = {
  hasFace: boolean;
  onBack: () => void;
  onAccept: () => void;
};

export default function PrivacyStep({ hasFace, onBack, onAccept }: Props) {
  return (
    <div className="av-step av-step-privacy">
      <p className="av-kicker">EŞİK II · GİZLİLİK SÖZÜ</p>
      <h2 className="av-step-title">Yüzün kutsaldır</h2>

      <div className="av-vow">
        <p>
          {hasFace
            ? "Yüzün yalnızca tanrıçanı doğurmak için kullanılır. Şu an bu cihazından çıkmıyor — hiçbir sunucuya gönderilmiyor, kimseyle paylaşılmıyor. İstediğin an silebilirsin."
            : "Yüzsüz doğmayı seçtin. Tanrıçan bir silüet olarak belirecek; dilersen sonra yüzünü verip yeniden doğabilirsin."}
        </p>
      </div>

      <div className="av-actions">
        <button type="button" className="av-btn av-btn-ghost" onClick={onBack}>
          Geri
        </button>
        <button type="button" className="av-btn av-btn-primary" onClick={onAccept}>
          {hasFace ? "Kabul ediyorum" : "Anladım, devam"}
        </button>
      </div>
    </div>
  );
}

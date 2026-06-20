/**
 * AvatarsInProduction — "Avatarlar yapımda" boş-durum kartı.
 *
 * Beden kütüphanesi boşken (AVATARS_IN_PRODUCTION) tüm 3D avatar
 * yüzeylerinin (configurator, try-on, AI sahnesi) yerine gösterilir.
 * Sahne sarmalayıcısının kapladığı alanı doldurur; `className` ile
 * çağıran kendi konteyner sınıfını geçer (boyut/yerleşim korunur).
 */

type Props = {
  className?: string;
  /** Kısa varyant — küçük alanlar (carousel/body picker) için. */
  compact?: boolean;
};

export default function AvatarsInProduction({
  className = "",
  compact = false,
}: Props) {
  return (
    <div className={`avatars-in-production ${className}`.trim()} role="status">
      <div className="aip-inner">
        <span className="aip-glyph" aria-hidden="true">
          ✦
        </span>
        <h3 className="aip-title">Avatarlar yapımda</h3>
        {!compact && (
          <p className="aip-sub">
            Caelinus bedenleri sıfırdan yeniden dokunuyor. Yeni tanrıça
            gövdeleri çok yakında burada olacak.
          </p>
        )}
      </div>
    </div>
  );
}

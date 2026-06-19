"use client";

/**
 * Avatar Vatandaşlık Kimliği Kartı — çok katmanlı kimlik (Civilization §8).
 *
 * Üç dik eksen tek kartta, ASLA karışmadan:
 *   Arketip: Selene      (kim — data/goddess-archetypes)
 *   Düzen:   Oracle Circle (yol — data/orders; yoksa Gezgin)
 *   Rank:    İnisiye       (basamak — resolveRankLabel)
 *
 * Gallery ve karşılaşma ekranı bu bileşeni yeniden kullanır. Gezgin
 * (order yok) onurlu gösterilir — "boş" değil (canon: Wanderer kutsaldır).
 */

import { getGoddess } from "@/data/goddess-archetypes";
import { getOrder, resolveRankLabel } from "@/data/orders";
import type { BornAvatar } from "@/lib/avatar/birth-types";

type Props = {
  avatar: BornAvatar;
  /** Portreyi kartta göster (gallery için true). */
  showPortrait?: boolean;
};

export default function AvatarIdentityCard({ avatar, showPortrait = false }: Props) {
  const goddess = getGoddess(avatar.goddess);
  const order = avatar.order ? getOrder(avatar.order) : null;
  const rankLabel = resolveRankLabel(avatar.rank ?? "reflection", order);

  const sigil = order?.sigil ?? "✶";
  const sigilGlow = order?.robePalette.sigilGlow ?? goddess.palette.accent;

  return (
    <article
      className="av-id-card"
      style={{ "--id-glow": sigilGlow } as React.CSSProperties}
    >
      {showPortrait && (
        <div className="av-id-portrait">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar.portraitDataUrl} alt={goddess.name} />
          <span className="av-id-sigil" aria-hidden="true">
            {sigil}
          </span>
        </div>
      )}

      <dl className="av-id-lines">
        <div className="av-id-row">
          <dt>Arketip</dt>
          <dd>{goddess.name}</dd>
        </div>
        <div className="av-id-row">
          <dt>Düzen</dt>
          <dd>
            {order ? (
              <>
                <span className="av-id-sigil-inline" aria-hidden="true">
                  {order.sigil}
                </span>
                {order.title}
              </>
            ) : (
              <span className="av-id-wanderer">Gezgin</span>
            )}
          </dd>
        </div>
        <div className="av-id-row">
          <dt>Rank</dt>
          <dd>{rankLabel}</dd>
        </div>
      </dl>
    </article>
  );
}

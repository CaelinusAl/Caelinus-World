/**
 * CAELINUS — Avatar Kimlik Bağlamı · SANRI köprüsü ŞEMASI (hazırlık).
 *
 * Bu dosya YALNIZCA şema + saf derleyicidir. Henüz SANRI'ye (`/api/sanri`,
 * `lib/sanri`) bağlanmaz — tam entegrasyon sonraki dilim. Amaç: SANRI'nin
 * okumalarına vatandaşlık kimliğini katacak veri sözleşmesini sabitlemek.
 *
 * Canon: Soul Bible (ruh boyutları) + Civilization Bible (düzen/yol).
 *   okuma = ruh_boyutları(archetype) × ton(district) × odak(modül) × yol(order, rank)
 *
 * ÜÇ DİK EKSEN korunur: archetype (kim) ≠ order (yol) ≠ district (bağlam).
 * SANRI bu üçünü AYRI bağlam olarak alır; birleştirmez.
 */

import { getGoddess, type GoddessId } from "@/data/goddess-archetypes";
import {
  getAvatarDistrict,
  type AvatarDistrictId,
} from "@/data/avatar-districts";
import {
  getOrder,
  resolveRankLabel,
  type AvatarRank,
  type OrderId,
} from "@/data/orders";
import type { BornAvatar } from "./birth-types";

/**
 * SANRI'ye verilecek kimlik bağlamı sözleşmesi. Kalıcı değil — runtime
 * okuma derlemesinin girdisi (Soul Bible "SANRI okuma derlemesi" deseni).
 */
export interface AvatarIdentityContext {
  /** Kim — tanrıça arketibi (kimlik DNA'sı). */
  archetype: {
    id: GoddessId;
    name: string;
    frequency: string;
  };
  /** Nerede — aktif district bağlamı (ruh tonunu modüle eder). */
  district: {
    id: AvatarDistrictId;
    name: string;
  };
  /** Hangi yol — düzen/vokasyon (yoksa Gezgin). */
  order: {
    id: OrderId;
    title: string;
    lesson: string;
    avatarTitle: string;
  } | null;
  /** Rank basamağı + görünen etiket. */
  rank: {
    id: AvatarRank;
    label: string;
  };
  /** Çağrı durumu — okuma tonu için (wanderer = "yol seçilmedi, kutsal"). */
  callingStatus: "wanderer" | "called" | "initiated";
}

/**
 * Doğmuş avatardan SANRI kimlik bağlamını derler. Tam entegrasyonda bu
 * nesne `/api/sanri` proxy'sine veya prompt derleyicisine girdi olur.
 */
export function buildIdentityContext(avatar: BornAvatar): AvatarIdentityContext {
  const goddess = getGoddess(avatar.goddess);
  const district = getAvatarDistrict(avatar.district);
  const order = avatar.order ? getOrder(avatar.order) : null;
  const rank: AvatarRank = avatar.rank ?? "reflection";

  return {
    archetype: {
      id: goddess.id,
      name: goddess.name,
      frequency: goddess.frequency,
    },
    district: {
      id: district.id,
      name: district.name,
    },
    order: order
      ? {
          id: order.id,
          title: order.title,
          lesson: order.lesson,
          avatarTitle: order.avatarTitle,
        }
      : null,
    rank: {
      id: rank,
      label: resolveRankLabel(rank, order),
    },
    callingStatus: avatar.callingStatus ?? "wanderer",
  };
}

/**
 * İnsan-okunur kimlik cümlesi (etik sınır: SANRI "atamaz", eşlik eder).
 * Örn: "Sen Selene'sin ve Oracle Circle yolunda, İnisiye olarak yürüyorsun."
 * Gezgin: "Sen Selene'sin; henüz bir yol seçmedin — bu da kutsal."
 *
 * Şimdilik yalnızca hazırlık/önizleme; SANRI prompt'una sonraki dilimde girer.
 */
export function describeIdentity(ctx: AvatarIdentityContext): string {
  const base = `Sen ${ctx.archetype.name}'sin`;
  if (!ctx.order) {
    return `${base}; henüz bir yol seçmedin — bu da kutsal.`;
  }
  return `${base} ve ${ctx.order.title} yolunda, ${ctx.rank.label} olarak yürüyorsun.`;
}

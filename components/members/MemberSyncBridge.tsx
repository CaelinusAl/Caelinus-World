"use client";

/**
 * Sessiz kimlik köprüsü — kullanıcı giriş yaptığında tarayıcısındaki
 * frekans profilini bir kez hesabına taşır. Hiçbir şey render etmez;
 * sadece `useMemberSync` hook'unu app boyunca canlı tutmak için
 * root layout'a yerleştirilir.
 */

import { useMemberSync } from "@/lib/members/use-member-sync";

export default function MemberSyncBridge() {
  useMemberSync();
  return null;
}

/**
 * Caelinus WebGL Dünyası — global yapılandırma.
 *
 * Vizyon: tüm sitede "içine giriliyormuş" hissi veren kalıcı bir WebGL
 * katmanı. App Router'da root layout route geçişlerinde remount olmadığı
 * için, global canvas bir kez mount edilir ve geçişlerde context'ini
 * korur (sahne yumuşakça değişir, yeniden yüklenmez).
 *
 * Bu dosya tek gerçek-kaynak:
 *   • WORLD_ENABLED   — global kill-switch (sorun olursa tek satırla kapat).
 *   • WorldSceneId    — desteklenen dünya sahneleri.
 *   • sceneForPath()  — hangi route'ta hangi sahne (utility sayfalarda "off").
 *
 * NOT (Şeyma entegrasyonu): repo geldiğinde sahne grafiği
 * components/world/scenes/ altına eklenir, WorldScenes registry'sine
 * bağlanır ve aşağıdaki route eşlemesi genişletilir. İskelet repo-bağımsız.
 */

/** Global kill-switch — false yapılırsa tüm WebGL dünya katmanı kapanır. */
export const WORLD_ENABLED = true;

export type WorldSceneId = "cosmos" | "gaia" | "sanctum" | "off";

/**
 * Route → sahne eşlemesi.
 *
 * Faz 0 (iskelet): yalnızca `/cosmos` testbed'inde görünür; diğer tüm
 * route'lar "off" → mevcut 58 sayfa hiç etkilenmez. Şeyma'nın sahnesi
 * geldikçe deneyimsel route'lar (landing, /universe, gaia, sanctum)
 * tek tek açılır.
 */
export function sceneForPath(pathname: string): WorldSceneId {
  if (pathname === "/cosmos") return "cosmos";

  // — Faz 1+ için hazır eşleme (şimdilik kapalı) —
  // if (pathname === "/") return "cosmos";
  // if (pathname.startsWith("/universe/gaia")) return "gaia";
  // if (pathname.startsWith("/universe/sanctum")) return "sanctum";
  // if (pathname.startsWith("/universe")) return "cosmos";

  return "off";
}

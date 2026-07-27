/**
 * Public entrance contract.
 *
 * Both origins point at the same deployment, APIs and canonical data. Keep
 * presentation links and host routing aligned by importing these constants.
 */
const normalizeOrigin = (value: string) => value.replace(/\/+$/, "");

export const PUBLIC_ORIGINS = {
  universe: normalizeOrigin(
    process.env.NEXT_PUBLIC_CAELINUS_ORIGIN || "https://caelinus.ai",
  ),
  codex: normalizeOrigin(
    process.env.NEXT_PUBLIC_CODEX_ORIGIN || "https://templeofsilence.com",
  ),
} as const;

export const PUBLIC_HOSTS = {
  universe: new URL(PUBLIC_ORIGINS.universe).hostname,
  codex: new URL(PUBLIC_ORIGINS.codex).hostname,
} as const;

export const LOCAL_PUBLIC_HOSTS = {
  universe: "caelinus.localhost",
  codex: "templeofsilence.localhost",
} as const;

export const isCodexPresentationHost = (host: string) =>
  host === PUBLIC_HOSTS.codex ||
  host === `www.${PUBLIC_HOSTS.codex}` ||
  host === LOCAL_PUBLIC_HOSTS.codex;

export const isUniversePresentationHost = (host: string) =>
  host === PUBLIC_HOSTS.universe ||
  host === `www.${PUBLIC_HOSTS.universe}` ||
  host === LOCAL_PUBLIC_HOSTS.universe;

export function codexUrl(source: "caelinus" | "direct" = "direct") {
  const url = new URL("/", PUBLIC_ORIGINS.codex);
  if (source === "caelinus") url.searchParams.set("from", "caelinus");
  return url.toString();
}

export function universeUrl(source: "temple" | "direct" = "direct") {
  const url = new URL("/", PUBLIC_ORIGINS.universe);
  if (source === "temple") url.searchParams.set("from", "temple");
  return url.toString();
}

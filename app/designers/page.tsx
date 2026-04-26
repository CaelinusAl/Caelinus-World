import { redirect } from "next/navigation";

/**
 * `/designers` is the legacy URL for what is now the Atelier.
 *
 * The portal in `/universe` used to point here and showed a single
 * placeholder line. The real product — Caelinus · Atelier (üretici
 * tezgâhı) — lives at `/atelier`, so we permanently forward both the
 * portal click and any old bookmarks / outbound links to it.
 *
 * 308 (permanent) tells crawlers and clients to update their cached
 * URLs; using `next/navigation`'s `redirect()` from a server component
 * is the idiomatic way to issue this in the App Router.
 */
export default function DesignersPage(): never {
  redirect("/atelier");
}

/**
 * Legacy `/universe/gaia/map` route — superseded by the 81-province
 * Atlas (`/universe/gaia/atlas`). Kept as a server-side redirect so old
 * links keep working.
 */

import { redirect } from "next/navigation";

export default function LegacyMapPage(): never {
  redirect("/universe/gaia/atlas");
}

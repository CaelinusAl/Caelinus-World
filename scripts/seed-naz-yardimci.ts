/**
 * scripts/seed-naz-yardimci.ts — first signature designer atelier.
 *
 * Seeds Caelinus Atelier with the launch designer **Naz Yardımcı**
 * (Constantinople). Idempotent: safe to run multiple times. Skips
 * the auth user creation if the email already exists, and `upsert`s
 * the atelier row by slug.
 *
 * Why a script and not a SQL migration:
 *   • The `ateliers.owner_user_id` FK references `public.profiles(id)`,
 *     which itself is wired to `auth.users(id)`. We can't INSERT into
 *     `auth.users` from a regular SQL migration in Supabase — those
 *     have to go through the Auth Admin API. A Node script using the
 *     service-role key is the canonical way.
 *   • Auth.users insert auto-fires `handle_new_user()` (see migration
 *     0002), which creates the `profiles` row. After that we just
 *     upsert the atelier and we're done.
 *
 * What this script does (in order):
 *   1. Loads `.env.local` (if present) so SUPABASE_SERVICE_ROLE_KEY
 *      and NEXT_PUBLIC_SUPABASE_URL come from the same place the dev
 *      server uses.
 *   2. If a user with email = ATELIER_NAZ_OWNER_EMAIL doesn't exist,
 *      creates one via auth.admin.createUser. The trigger creates the
 *      matching profile automatically.
 *   3. Upserts the `ateliers` row with status = 'approved' so the
 *      designer is visible in `/atelier/kesfet` immediately.
 *
 * Usage:
 *   npm run atelier:seed:naz                        # default
 *   ATELIER_NAZ_OWNER_EMAIL=naz@example.com \
 *     ATELIER_NAZ_OWNER_PASSWORD=… \
 *     npm run atelier:seed:naz                      # custom owner
 *   npm run atelier:seed:naz -- --dry-run           # plan only
 *
 * Required env (read from .env.local or process env):
 *   • NEXT_PUBLIC_SUPABASE_URL
 *   • SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional env (defaults supplied):
 *   • ATELIER_NAZ_OWNER_EMAIL    (default: naz.yardimci@atelier.caelinus.local)
 *   • ATELIER_NAZ_OWNER_PASSWORD (default: random 32-char temp password)
 *   • ATELIER_NAZ_OWNER_NAME     (default: "Naz Yardımcı")
 *
 * Cost: $0. Just a couple of writes to Supabase.
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

/* ─── env loader ─────────────────────────────────────────────── */
// Tiny zero-dep .env parser (same flavour as warm-play-bikinis.ts).

function loadDotenv(path: string) {
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotenv(".env.local");
loadDotenv(".env");

/* ─── flags ───────────────────────────────────────────────────── */

const DRY_RUN = process.argv.includes("--dry-run");

/* ─── config ─────────────────────────────────────────────────── */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "[atelier:seed:naz] Missing env. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "SUPABASE_SERVICE_ROLE_KEY in .env.local first.",
  );
  process.exit(1);
}

const OWNER_EMAIL =
  process.env.ATELIER_NAZ_OWNER_EMAIL ??
  "naz.yardimci@atelier.caelinus.local";
const OWNER_PASSWORD =
  process.env.ATELIER_NAZ_OWNER_PASSWORD ?? randomBytes(24).toString("base64url");
const OWNER_NAME = process.env.ATELIER_NAZ_OWNER_NAME ?? "Naz Yardımcı";

/** Atelier payload — mirror of the columns surfaced by `/atelier/kesfet`. */
const ATELIER_SLUG = "n-yardimci";
const ATELIER_PAYLOAD = {
  slug: ATELIER_SLUG,
  name: "N. Yardımcı",
  kind: "designer" as const,
  region: "marmara",
  province: "istanbul",
  bio_tr:
    "Constantinople'dan çağdaş bir tasarım atölyesi. N. Yardımcı, kadının duruşunu mimari net çizgilerle örerek sade ama derin parçalar üretir — her kıyafet bir manifesto, her kumaş bir hatıra.",
  bio_en:
    "A contemporary design atelier from Constantinople. N. Yardımcı weaves the woman's stance with architectural clean lines, producing minimal yet profound pieces — each garment a manifesto, each fabric a memory.",
  story_tr:
    "Caelinus'un ilk imza tasarımcısı olarak N. Yardımcı, geleneksel Anadolu tekstilini modern silüetlerle harmanlıyor. Stüdyosu Constantinople'da; sürdürülebilir kumaşlar ve sınırlı seri üretimle çalışıyor.",
  story_en:
    "As Caelinus's inaugural signature designer, N. Yardımcı blends traditional Anatolian textiles with modern silhouettes. The studio is based in Constantinople and works with sustainable fabrics and limited-run production.",
  cover_image_url: "/atelier/n-yardimci/cover.png",
  avatar_image_url: "/atelier/n-yardimci/cover.png",
  status: "approved" as const,
  approved_at: new Date().toISOString(),
};

/* ─── main ───────────────────────────────────────────────────── */

async function main() {
  const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(
    `[atelier:seed:naz] target=${SUPABASE_URL} owner=${OWNER_EMAIL} dry=${DRY_RUN}`,
  );

  // 1. Look up the auth user; create if missing.
  let userId: string | null = null;

  // Supabase JS doesn't expose `getUserByEmail` for service-role, so
  // we list and filter. With `perPage: 1` and a precise email it's a
  // cheap O(1) DB lookup on the auth side.
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000, // a project never has millions of users in practice
  });
  if (listErr) {
    console.error(`[atelier:seed:naz] list users failed: ${listErr.message}`);
    process.exit(1);
  }
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase(),
  );

  if (existing) {
    userId = existing.id;
    console.log(`[atelier:seed:naz] user exists → id=${userId}`);
  } else {
    if (DRY_RUN) {
      console.log(
        `[atelier:seed:naz] DRY: would create user email=${OWNER_EMAIL} display_name=${OWNER_NAME}`,
      );
      console.log(
        `[atelier:seed:naz] DRY: would upsert atelier slug=${ATELIER_SLUG}`,
      );
      return;
    }
    const { data: created, error: createErr } =
      await supabase.auth.admin.createUser({
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: OWNER_NAME },
      });
    if (createErr || !created.user) {
      console.error(
        `[atelier:seed:naz] create user failed: ${createErr?.message ?? "no user"}`,
      );
      process.exit(1);
    }
    userId = created.user.id;
    console.log(
      `[atelier:seed:naz] created user id=${userId} (temp password printed below — store securely)`,
    );
    console.log(`[atelier:seed:naz] TEMP_PASSWORD=${OWNER_PASSWORD}`);
  }

  if (!userId) {
    console.error("[atelier:seed:naz] no user id after auth step");
    process.exit(1);
  }

  // 2. Upsert the atelier row by slug. The `handle_new_user()`
  //    trigger has already inserted the matching profile, so the FK
  //    is satisfied.
  if (DRY_RUN) {
    console.log(
      `[atelier:seed:naz] DRY: would upsert atelier slug=${ATELIER_SLUG} owner=${userId}`,
    );
    return;
  }

  const { data: upserted, error: upsertErr } = await supabase
    .from("ateliers")
    .upsert(
      { ...ATELIER_PAYLOAD, owner_user_id: userId },
      { onConflict: "slug", ignoreDuplicates: false },
    )
    .select("id, slug, name, status, approved_at")
    .single();

  if (upsertErr || !upserted) {
    console.error(
      `[atelier:seed:naz] upsert failed: ${upsertErr?.message ?? "no row"}`,
    );
    process.exit(1);
  }

  console.log(
    `[atelier:seed:naz] OK slug=${upserted.slug} status=${upserted.status} id=${upserted.id}`,
  );
  console.log(
    `[atelier:seed:naz] Visit /atelier/${upserted.slug} or /atelier/kesfet to see the designer card.`,
  );
}

main().catch((err) => {
  console.error("[atelier:seed:naz] FATAL", err);
  process.exit(1);
});

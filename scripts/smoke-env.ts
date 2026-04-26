/**
 * Caelinus · Phase 3 — env validator smoke test.
 *
 *   npx tsx scripts/smoke-env.ts
 *
 * Verifies that lib/env.ts:
 *   • boots in dev mode without keys (placeholder fallback + warn)
 *   • exposes adminEmails() / isAdminEmail() correctly
 *   • flags supabaseConfigured() = false when running on placeholders
 */

let pass = 0;
let fail = 0;

function assert(cond: unknown, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    pass++;
  } else {
    console.log(`  ✗ ${label}`);
    fail++;
  }
}

async function main() {
  console.log("\n── env: dev-mode boot with no keys ──");

  // Force dev so the validator falls back to placeholders instead of
  // throwing.
  process.env.NODE_ENV = "development";
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.CAELINUS_ADMIN_EMAILS = "ADA@caelinus.world, selin@caelinus.world";

  // Quiet the expected warn so the smoke output stays clean.
  const originalWarn = console.warn;
  console.warn = () => {};

  const mod = await import("../lib/env");

  console.warn = originalWarn;

  assert(
    mod.clientEnv.NEXT_PUBLIC_SUPABASE_URL === "https://placeholder.supabase.co",
    "clientEnv falls back to placeholder URL"
  );
  assert(
    mod.clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ===
      "placeholder-anon-key-not-real",
    "clientEnv falls back to placeholder anon key"
  );
  assert(
    mod.supabaseConfigured() === false,
    "supabaseConfigured() is false on placeholders"
  );

  const admins = mod.adminEmails();
  assert(admins.length === 2, "adminEmails() parses two entries");
  assert(
    admins.includes("ada@caelinus.world"),
    "adminEmails() lowercases the first entry"
  );
  assert(
    mod.isAdminEmail("Ada@Caelinus.World"),
    "isAdminEmail() is case-insensitive"
  );
  assert(
    !mod.isAdminEmail("intruder@example.com"),
    "isAdminEmail() rejects unknown email"
  );
  assert(!mod.isAdminEmail(null), "isAdminEmail(null) is false");
  assert(!mod.isAdminEmail(""), "isAdminEmail('') is false");

  console.log("");
  if (fail > 0) {
    console.log(`✗ ${pass} passed, ${fail} failed`);
    process.exit(1);
  } else {
    console.log(`✓ ${pass} passed`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

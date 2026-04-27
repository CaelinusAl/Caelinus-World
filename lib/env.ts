/**
 * CAELINUS — Type-safe environment access.
 *
 * Two strict schemas:
 *
 *   • `serverEnv` — full set, only readable on the server. Throws at
 *     module load if any required key is missing in production.
 *
 *   • `clientEnv` — public-only subset (NEXT_PUBLIC_*). Safe to access
 *     from the browser; bundled at build time by Next.js.
 *
 * The validator is **lazy** for build-time safety: importing this
 * module on the server during `next build` reads `process.env` once
 * and freezes the result. If a required value is missing in
 * `production`, the build fails — not the runtime.
 *
 * Usage:
 *   import { serverEnv, clientEnv } from "@/lib/env";
 *   const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
 *
 * NEVER `import { serverEnv } from "@/lib/env"` in a client component.
 * If you do, Next.js will warn — but more importantly, the secret keys
 * become reachable from the bundle. Use the SUPABASE_SERVICE_ROLE_KEY
 * exclusively from server-only modules (route handlers, server actions,
 * server components, lib/supabase/admin.ts).
 */

import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

/* ─── Schemas ─────────────────────────────────────── */

/**
 * Public env vars — they are exposed to the browser. They MUST be
 * prefixed with NEXT_PUBLIC_ to be inlined by Next.js.
 */
const ClientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY looks too short to be a real key"),
  /** Public site URL used to build absolute links (auth callbacks, OG, etc.). */
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL")
    .default("http://localhost:3000"),
});

/**
 * Server-only env vars — secrets and config never sent to the browser.
 * Reading any of these from a client component is a hard error.
 */
const ServerEnvSchema = z.object({
  /* Service-role key (server only). Bypasses RLS — keep it secret. */
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, "SUPABASE_SERVICE_ROLE_KEY looks too short to be a real key")
    .optional(),
  /* Comma-separated list of admin emails (lower-cased on read). */
  CAELINUS_ADMIN_EMAILS: z.string().optional().default(""),
  /* ElevenLabs (build-time TTS). */
  ELEVEN_API_KEY: z.string().optional(),
  ELEVEN_VOICE_ID: z.string().optional(),
  ELEVEN_MODEL_ID: z.string().optional().default("eleven_multilingual_v2"),
  /* /play AI image generation. Provider switch + secret. When the
     provider is "stub" (or unset), the render route returns a styled
     placeholder image instead of calling out — useful in dev. */
  PLAY_AI_PROVIDER: z
    .enum(["replicate", "openai", "stub"])
    .optional()
    .default("stub"),
  PLAY_AI_API_KEY: z.string().optional(),
  /* Replicate model slug used when PLAY_AI_PROVIDER=replicate. Defaults
     to SDXL — overridable for experimentation. */
  PLAY_AI_REPLICATE_MODEL: z
    .string()
    .optional()
    .default(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    ),
  /* Cost guard: max fresh renders per IP per hour. Cache hits don't
     count, so 60/hour is plenty for normal play. */
  PLAY_AI_HOURLY_BUDGET: z.coerce.number().int().min(1).max(1000).default(60),
  /* Transactional email (Resend). When `RESEND_API_KEY` is set we send
     real notifications (atelier approval, password reset hand-offs).
     Without it the sender falls back to console logging — useful in dev
     and CI without leaking real mail. */
  RESEND_API_KEY: z.string().optional(),
  /* Mailbox we send FROM. Must be a verified Resend domain. Example:
     "Caelinus <hello@mail.caelinus.world>". */
  EMAIL_FROM: z.string().optional(),
  /* Stripe (atelier e-commerce). Three keys:
     - STRIPE_SECRET_KEY      sk_live_… / sk_test_… (server only)
     - STRIPE_WEBHOOK_SECRET  whsec_… signing secret for /api/stripe/webhook
     - STRIPE_CURRENCY_DEFAULT  ISO 4217 used as a fallback when the
                                 listing didn't set its own. Default TRY. */
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CURRENCY_DEFAULT: z.string().length(3).optional().default("TRY"),
});

/* ─── Friendly error formatting ────────────────────── */

function flatten(error: z.ZodError): string {
  return error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n");
}

/* ─── Parsers ─────────────────────────────────────── */

function parseClientEnv() {
  const parsed = ClientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!parsed.success) {
    if (isProduction) {
      // Hard-fail the build / serverless cold-start in production.
      throw new Error(
        `[CAELINUS] Invalid public environment:\n${flatten(parsed.error)}\n` +
          `Set the variables in .env.local (dev) or your hosting dashboard (prod).`
      );
    }
    // In dev, allow placeholder values so the app can still boot.
    // The Supabase client modules will refuse to connect with a clear hint.
    if (typeof console !== "undefined") {
      console.warn(
        `[CAELINUS] Missing public env (dev mode — running with placeholders):\n${flatten(
          parsed.error
        )}`
      );
    }
    return {
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key-not-real",
      NEXT_PUBLIC_SITE_URL:
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    };
  }
  return parsed.data;
}

function parseServerEnv() {
  const parsed = ServerEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CAELINUS_ADMIN_EMAILS: process.env.CAELINUS_ADMIN_EMAILS,
    ELEVEN_API_KEY: process.env.ELEVEN_API_KEY,
    ELEVEN_VOICE_ID: process.env.ELEVEN_VOICE_ID,
    ELEVEN_MODEL_ID: process.env.ELEVEN_MODEL_ID,
    PLAY_AI_PROVIDER: process.env.PLAY_AI_PROVIDER,
    PLAY_AI_API_KEY: process.env.PLAY_AI_API_KEY,
    PLAY_AI_REPLICATE_MODEL: process.env.PLAY_AI_REPLICATE_MODEL,
    PLAY_AI_HOURLY_BUDGET: process.env.PLAY_AI_HOURLY_BUDGET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_CURRENCY_DEFAULT: process.env.STRIPE_CURRENCY_DEFAULT,
  });
  if (!parsed.success) {
    throw new Error(
      `[CAELINUS] Invalid server environment:\n${flatten(parsed.error)}`
    );
  }
  return parsed.data;
}

/* ─── Public API ───────────────────────────────────── */

/** Cached, validated public env. Safe everywhere. */
export const clientEnv = Object.freeze(parseClientEnv());

/**
 * Cached, validated server env. Throws when ANY property is *read* on
 * the client — but **not** at import time. We use a lazy Proxy so that
 * client modules which only need `clientEnv` / `supabaseConfigured`
 * don't accidentally trip the guard just by sharing this file.
 *
 * Server-side: the first property access parses + freezes the schema
 * and caches it for the rest of the process.
 *
 * Client-side: the first property access throws loudly, so any real
 * leak (someone actually reading `serverEnv.SECRET`) still fails fast.
 */
type ServerEnv = z.infer<typeof ServerEnvSchema>;

let _serverEnvCache: ServerEnv | null = null;

function readServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    // Defensive: this should never run client-side. If a tree-shaking
    // mistake actually *reads* a server secret, fail loudly rather
    // than silently exposing it.
    throw new Error(
      "[CAELINUS] serverEnv was imported into the browser. " +
        "Use clientEnv for public values, and keep secrets in server-only modules."
    );
  }
  if (!_serverEnvCache) {
    _serverEnvCache = Object.freeze(parseServerEnv());
  }
  return _serverEnvCache;
}

export const serverEnv: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop, receiver) {
    return Reflect.get(readServerEnv() as object, prop, receiver);
  },
  has(_target, prop) {
    return Reflect.has(readServerEnv() as object, prop);
  },
  ownKeys() {
    return Reflect.ownKeys(readServerEnv() as object);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(
      readServerEnv() as object,
      prop
    );
  },
});

/* ─── Helpers ─────────────────────────────────────── */

/** Lower-cased, trimmed list of admin emails. */
export function adminEmails(): string[] {
  if (!serverEnv.CAELINUS_ADMIN_EMAILS) return [];
  return serverEnv.CAELINUS_ADMIN_EMAILS
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** True if the supplied email is a Caelinus admin. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

/**
 * Whether Supabase looks usable at runtime (not the placeholder URL).
 * Useful for graceful "Yakında" UI when running locally without keys.
 */
export function supabaseConfigured(): boolean {
  return (
    clientEnv.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-anon-key-not-real"
  );
}

/**
 * Browser-side Supabase client.
 *
 * Use this from client components, hooks, and `"use client"` modules.
 * The auth state is persisted in cookies by `@supabase/ssr`, so the
 * server middleware (`middleware.ts`) and server clients
 * (`lib/supabase/server.ts`) all see the same session automatically.
 *
 * Singleton: returns the same instance per browser tab to keep the
 * realtime connection and auth listeners alive across page nav.
 */

"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { clientEnv } from "@/lib/env";
import type { Database } from "./types";

let _client: SupabaseClient<Database> | null = null;

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  if (_client) return _client;
  _client = createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return _client;
}

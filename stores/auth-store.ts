/**
 * Caelinus auth store — client-side only.
 *
 * Source of truth is still the Supabase session (cookies). This store
 * is just a thin React-friendly mirror so components can subscribe
 * without each one wiring up `supabase.auth.onAuthStateChange`.
 *
 * Usage:
 *
 *   "use client";
 *   import { useAuthStore } from "@/stores/auth-store";
 *
 *   function Header() {
 *     const { user, hydrated } = useAuthStore();
 *     if (!hydrated) return null;
 *     return user ? <SignedInMenu /> : <SignInButton />;
 *   }
 *
 *   // Mount the listener once at the app root:
 *   useEffect(() => useAuthStore.getState().init(), []);
 */

"use client";

import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthState = {
  user: User | null;
  session: Session | null;
  /** True once the first session lookup has resolved. */
  hydrated: boolean;
  /** Wire up the auth listener. Idempotent — returns its own cleanup fn. */
  init: () => () => void;
  /** Sign out via the API route so cookies are wiped server-side too. */
  signOut: () => Promise<void>;
};

let _initialized = false;
let _unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  hydrated: false,

  init: () => {
    if (_initialized && _unsubscribe) return _unsubscribe;
    _initialized = true;

    const supabase = createSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        hydrated: true,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        hydrated: true,
      });
    });

    _unsubscribe = () => {
      subscription.unsubscribe();
      _initialized = false;
      _unsubscribe = null;
    };
    return _unsubscribe;
  },

  signOut: async () => {
    // Server route clears cookies + Supabase session atomically.
    await fetch("/auth/signout", { method: "POST", credentials: "include" });
    set({ user: null, session: null });
    if (typeof window !== "undefined") {
      window.location.href = "/atelier";
    }
  },
}));

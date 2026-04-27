/**
 * Stripe — single shared instance.
 *
 * Server-only. We pin the API version so updates to the Stripe Node SDK
 * never silently change the wire format we depend on. When you bump
 * `apiVersion` here, also bump the version in your Stripe dashboard
 * webhook configuration so signature checks keep matching.
 */

import "server-only";

import Stripe from "stripe";

import { serverEnv } from "@/lib/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = serverEnv.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "[stripe] STRIPE_SECRET_KEY is not set. Add it to .env.local before " +
        "calling getStripe().",
    );
  }
  _stripe = new Stripe(key, {
    typescript: true,
    appInfo: {
      name: "caelinus",
      url: "https://caelinus.world",
    },
  });
  return _stripe;
}

/** Returns true if Stripe is configured enough to take real payments. */
export function stripeReady(): boolean {
  return Boolean(serverEnv.STRIPE_SECRET_KEY);
}

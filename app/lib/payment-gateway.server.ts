import { randomInt, randomUUID } from "node:crypto";

import { env } from "~/env.server";
import { DEMO_GATEWAY } from "~/orpc/checkout/constants";

/*===== Payment Gateway =====*/
// One place that talks to the card gateway, so a real one (Zarinpal, IDPay, …) replaces the demo without touching the
// checkout flow. The flow is the usual Iranian one: start a payment for an amount and get an authority token and a URL to
// send the customer to; the gateway sends them back to our callback, where the payment is verified server-side before
// anything is trusted.
//
// Showcase mode has no gateway : "starting" returns our own callback URL straight away, and
// verifying always succeeds, so a demo payment runs exactly the success path a real verified callback would.

export type StartedPayment = {
  /** The token the payment is found by when the gateway calls back. */
  authority: string;
  /** Where to send the customer to pay. */
  redirectUrl: string;
};

export type PaymentVerification =
  { ok: true; referenceId: string; cardNumberMasked: string | null } | { ok: false; reason: string };

export type PaymentGateway = {
  /** Stored on each Payment row. */
  name: string;
  start: (input: { amount: number; callbackUrl: string }) => Promise<StartedPayment>;
  /**
   * Asks the gateway whether the payment really happened, for the amount we expect. Called once per callback; the
   * caller makes repeated callbacks harmless.
   */
  verify: (input: {
    authority: string;
    amount: number;
    callbackParams: URLSearchParams;
  }) => Promise<PaymentVerification>;
};

/*===== Demo Gateway =====*/
const demoGateway: PaymentGateway = {
  name: DEMO_GATEWAY,

  start: async ({ callbackUrl }) => {
    const authority = `DEMO-${randomUUID()}`;
    const url = new URL(callbackUrl);
    url.searchParams.set("Authority", authority);
    url.searchParams.set("Status", "OK");
    return { authority, redirectUrl: `${url.pathname}${url.search}` };
  },

  // A callback with `Status=NOK` stands for a customer who cancelled on the gateway page, so the failure path can be
  // tried by hand.
  verify: async ({ callbackParams }) =>
    callbackParams.get("Status") === "OK"
      ? {
          ok: true,
          referenceId: String(randomInt(100_000_000, 999_999_999)),
          cardNumberMasked: "6037-99**-****-1234",
        }
      : { ok: false, reason: "پرداخت در درگاه لغو شد." },
};

/**
 * The gateway payments go through.
 *
 * @throws Error outside showcase mode: no real gateway is wired yet, and a demo one must never take real orders.
 */
export function getPaymentGateway(): PaymentGateway {
  if (!env.SHOWCASE_MODE) throw new Error("No payment gateway is configured. Set SHOWCASE_MODE=true for the demo.");
  return demoGateway;
}

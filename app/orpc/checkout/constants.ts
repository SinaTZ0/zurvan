import { m } from "~/paraglide/messages";

/*===== Checkout Constants =====*/
// Browser-safe values shared by the API, the cart and the Purchases page. docs/app-spec.md, F5.
// Labels are getters over the messages (`messages/shared/`), read while rendering in the page's language; the Admin's
// pages are Persian only, so they read Persian.

/*===== Payment Status =====*/
// pending → paid | failed, exactly once.
export const PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  get pending() {
    return m.shared_payment_status_pending();
  },
  get paid() {
    return m.shared_payment_status_paid();
  },
  get failed() {
    return m.shared_payment_status_failed();
  },
};

/*===== Cart =====*/
/** The cart lives in the browser (F5); this is a ceiling against a hand-made request, not a business rule. */
export const CART_MAX_ITEMS = 20;

/** The Cart page (F5): where «دیدن سبد» and the gateway's callback send the customer. */
export const CART_PATH = "/account/cart";

/**
 * Where the gateway sends the customer back to, with `?payment=paid|failed` for the banner. The Cart is where the
 * result is shown (F5).
 */
export const CART_RESULT_PATH = CART_PATH;

/**
 * The callback URL's query parameter that names the language the customer paid from (`?lang=en`; absent for Persian),
 * so the gateway's return lands on the cart in that language.
 */
export const PAYMENT_LOCALE_PARAM = "lang";

/** The Purchases page (F5): past payments and the enrollments each one bought. */
export const PURCHASES_PATH = "/account/purchases";

/*===== Gateway =====*/
/** The fake gateway of showcase mode: it always succeeds (`SHOWCASE_MODE`). */
export const DEMO_GATEWAY = "demo";

/*===== Checkout Constants =====*/
// Browser-safe values shared by the API, the cart and the Purchases page. docs/app-spec.md, F5.

/*===== Payment Status =====*/
// pending → paid | failed, exactly once.
export const PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شد",
  failed: "ناموفق",
};

/*===== Cart =====*/
/** The cart lives in the browser (F5); this is a ceiling against a hand-made request, not a business rule. */
export const CART_MAX_ITEMS = 20;

/**
 * Where the gateway sends the customer back to, with `?payment=paid|failed` for the banner. The Cart is where the
 * result is shown (F5); until that page is rebuilt it lands on the account home.
 */
export const CART_RESULT_PATH = "/account";

/*===== Gateway =====*/
/** The fake gateway of showcase mode: it always succeeds (`SHOWCASE_MODE`). */
export const DEMO_GATEWAY = "demo";

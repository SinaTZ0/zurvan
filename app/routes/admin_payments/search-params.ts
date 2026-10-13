import { parseAsInteger, parseAsStringLiteral } from "nuqs/server";

/*===== Constants =====*/
/** The filters on the Payments page. `flagged` is the paid-but-not-enrolled list (F5). */
export const PAYMENT_VIEWS = ["all", "paid", "flagged", "failed", "pending"] as const;

export type PaymentView = (typeof PAYMENT_VIEWS)[number];

/** Payments per page: a screen of slips on a phone. */
export const PAGE_SIZE = 15;

/*===== Parsers =====*/
// Both params are read by the component, not the loader (the loader returns the whole list), so they are shallow:
// changing a filter or a page doesn't run the loader again.
export const paymentsSearchParams = {
  view: parseAsStringLiteral(PAYMENT_VIEWS).withDefault("all"),
  page: parseAsInteger.withDefault(1),
};

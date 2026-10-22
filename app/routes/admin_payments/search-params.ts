import { z } from "zod";

/*===== Constants =====*/
/** The filters on the Payments page. `flagged` is the paid-but-not-enrolled list (F5). */
export const PAYMENT_VIEWS = ["all", "paid", "flagged", "failed", "pending"] as const;

export type PaymentView = (typeof PAYMENT_VIEWS)[number];

/** The view an absent `?view=` means; links leave it out of the URL. */
export const DEFAULT_PAYMENT_VIEW = "all" satisfies PaymentView;

/** Payments per page: a screen of slips on a phone. */
export const PAGE_SIZE = 15;

/*===== Search Schema =====*/
// Both are read by the component, not the loader (the loader reads the whole list), so neither is a loader dep:
// changing a filter or a page doesn't fetch again. `page` is 1-based; absent means the first page. A hand-typed bad
// value is dropped (`.catch`) instead of failing the page.
export const paymentsSearchSchema = z.object({
  view: z.enum(PAYMENT_VIEWS).optional().catch(undefined),
  page: z.number().int().optional().catch(undefined),
});

import { m } from "~/paraglide/messages";

/*===== Refund Constants =====*/
// Browser-safe values shared by the API, the Admin's payments page and the Purchases page. docs/app-spec.md, F5.
// Labels are getters over the messages (`messages/shared/`), read while rendering in the page's language; the Admin's
// pages are Persian only, so they read Persian.

/** pending → paid | cancelled, once. A paid refund can't be cancelled: the money has gone. */
export const REFUND_STATUSES = ["pending", "paid", "cancelled"] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  get pending() {
    return m.shared_refund_status_pending();
  },
  get paid() {
    return m.shared_refund_status_paid();
  },
  get cancelled() {
    return m.shared_refund_status_cancelled();
  },
};

export const REFUND_REASON_MAX_LENGTH = 300;
export const REFUND_REFERENCE_MAX_LENGTH = 100;

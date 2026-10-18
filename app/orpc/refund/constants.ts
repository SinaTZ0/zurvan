/*===== Refund Constants =====*/
// Browser-safe values shared by the API, the Admin's payments page and the Purchases page. docs/app-spec.md, F5.

/** pending → paid | cancelled, once. A paid refund can't be cancelled: the money has gone. */
export const REFUND_STATUSES = ["pending", "paid", "cancelled"] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شد",
  cancelled: "لغو شد",
};

export const REFUND_REASON_MAX_LENGTH = 300;
export const REFUND_REFERENCE_MAX_LENGTH = 100;

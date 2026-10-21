import type { AdminPayment } from "~/orpc/checkout/contract";

import type { PaymentView } from "./search-params";

/*===== Filters =====*/
/** A payment the trainer has to act on: paid, and at least one of its items got no enrollment (F5). */
export function isFlagged(payment: AdminPayment): boolean {
  return payment.paidNotEnrolledCount > 0;
}

/** Whether a payment belongs in a view. `paid` keeps the flagged ones too: they are paid. */
export function matchesView(payment: AdminPayment, view: PaymentView): boolean {
  switch (view) {
    case "all":
      return true;
    case "paid":
      return payment.status === "paid";
    case "flagged":
      return isFlagged(payment);
    case "failed":
      return payment.status === "failed";
    case "pending":
      return payment.status === "pending";
  }
}

/*===== Counts =====*/
/** Each view's count over the whole list (not the filtered one), so the pills show what each filter would hold. */
export function countByView(payments: readonly AdminPayment[]): Record<PaymentView, number> {
  return {
    all: payments.length,
    paid: payments.filter((payment) => matchesView(payment, "paid")).length,
    flagged: payments.filter((payment) => matchesView(payment, "flagged")).length,
    failed: payments.filter((payment) => matchesView(payment, "failed")).length,
    pending: payments.filter((payment) => matchesView(payment, "pending")).length,
  };
}

/*===== Flag Totals =====*/
/** How many paid items got no enrollment over the whole list, and what they cost together (Rial), for the flag. */
export function flagTotals(payments: readonly AdminPayment[]): { count: number; total: number } {
  const count = payments.reduce((sum, payment) => sum + payment.paidNotEnrolledCount, 0);
  const total = payments
    .flatMap((payment) => payment.items.filter((item) => item.paidNotEnrolled))
    .reduce((sum, item) => sum + item.price, 0);
  return { count, total };
}

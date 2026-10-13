import { cn } from "cn";

import { PAYMENT_STATUS_LABELS, type PaymentStatus } from "~/orpc/checkout/constants";

/*===== Tones =====*/
// Same pill as `EnrollmentStatusBadge`, in its language: green for money that arrived, gold for what is still waiting
// on the gateway, and the failed ending stays quiet because it needs nothing from the reader (no money moved).
const TONES: Record<PaymentStatus, string> = {
  paid: "border-success/40 bg-success/10 text-success",
  pending: "border-primary/50 bg-primary/10 text-primary",
  failed: "border-transparent bg-muted text-muted-foreground",
};

/*===== Payment Status Badge =====*/
/** A payment's status as a small pill with its Persian label. */
export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap",
        TONES[status],
        className,
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

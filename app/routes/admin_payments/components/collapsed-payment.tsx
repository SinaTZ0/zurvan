import { useId } from "react";

import { CustomerContact } from "~/components/customer-contact";
import { PaymentStatusBadge } from "~/components/payment-status-badge";
import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminPayment } from "~/orpc/checkout/contract";

/*===== Collapsed Payment =====*/
/**
 * A failed or pending payment, as one quiet line. Neither bought anything, so there are no items to show, and nothing
 * here asks the Admin to act: the reason is all there is to say.
 */
export function CollapsedPayment({ payment }: { payment: AdminPayment }) {
  const titleId = useId();
  const moment = payment.paidAt ?? payment.createdAt;
  const reason = payment.status === "failed" ? (payment.failureReason ?? "پرداخت کامل نشد") : "در انتظار درگاه";

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border bg-card/60 p-4"
    >
      <time id={titleId} dateTime={moment.toISOString()} className="text-sm font-bold">
        {formatJalaliTimestamp(moment)}
      </time>
      <CustomerContact name={payment.customer.name} phoneNumber={payment.customer.phoneNumber} />
      <p className="text-sm font-bold tabular-nums">{formatToman(payment.amount)}</p>
      <PaymentStatusBadge status={payment.status} />
      <p className="w-full text-sm text-pretty text-muted-foreground sm:ms-auto sm:w-auto sm:text-end">{reason}</p>
    </article>
  );
}

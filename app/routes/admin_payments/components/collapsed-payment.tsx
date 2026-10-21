import { cn } from "cn";
import { useId } from "react";

import { CustomerContact } from "~/components/customer-contact";
import { PaymentStatusBadge } from "~/components/payment-status-badge";
import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminPayment } from "~/orpc/checkout/contract";

/*===== Collapsed Payment =====*/
/**
 * A failed or pending payment, as one thin, muted stub: the date and status in the same 16rem start column as a slip's
 * stub (so the ledger reads down one edge), then the customer, the amount and the reason. Neither bought anything, so
 * there are no lines, and nothing here asks the Admin to act.
 */
export function CollapsedPayment({
  payment,
  className,
  style,
}: {
  payment: AdminPayment;
  className?: string;
  style?: React.CSSProperties;
}) {
  const titleId = useId();
  const moment = payment.paidAt ?? payment.createdAt;
  const reason = payment.status === "failed" ? (payment.failureReason ?? "پرداخت کامل نشد") : "منتظر جواب درگاهه";

  return (
    <article
      aria-labelledby={titleId}
      style={style}
      className={cn(
        "grid overflow-hidden rounded-2xl border border-foreground/10 bg-sunken/50 lg:grid-cols-[16rem_minmax(0,1fr)]",
        className,
      )}
    >
      {/*------ Stub ------*/}
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-foreground/15 px-5 py-3 lg:border-e lg:border-b-0 lg:px-6">
        <h3 id={titleId} className="text-sm font-bold text-foreground/80">
          <time dateTime={moment.toISOString()}>{formatJalaliTimestamp(moment)}</time>
        </h3>
        <PaymentStatusBadge status={payment.status} />
      </div>

      {/*------ Who, How Much, Why ------*/}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 lg:px-6">
        <CustomerContact name={payment.customer.name} phoneNumber={payment.customer.phoneNumber} />
        <p className="text-sm font-bold whitespace-nowrap text-muted-foreground">{formatToman(payment.amount)}</p>
        <p className="w-full text-sm text-pretty text-muted-foreground sm:ms-auto sm:w-auto sm:text-end">{reason}</p>
      </div>
    </article>
  );
}

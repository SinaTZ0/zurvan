import { cn } from "cn";
import { Undo2Icon } from "lucide-react";

import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { Payment } from "~/orpc/checkout/contract";
import { REFUND_STATUS_LABELS } from "~/orpc/refund/constants";
import type { MyRefund } from "~/orpc/refund/contract";

/*===== Refund List =====*/
/**
 * «بازپرداخت»: what was given back on this payment, as a small sub-slip at the foot of its lines. Each refund's amount,
 * its state (in words; paid is green like the payment badge, still to come is gold), the day it was paid and the bank
 * transfer's reference. Never the Admin's reason (the API leaves it out), never a cancelled one (the caller filters).
 * A refund for one course names it.
 */
export function RefundList({ refunds, items }: { refunds: readonly MyRefund[]; items: Payment["items"] }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-foreground/25 bg-background/50 p-4 sm:p-5">
      <p className="flex items-center gap-2 font-bold">
        <Undo2Icon aria-hidden className="size-4 text-primary" />
        بازپرداخت
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {refunds.map((refund) => {
          const course = items.find((item) => item.id === refund.paymentItemId)?.course.title;
          return (
            <li
              key={refund.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-foreground/10 pt-3 text-sm first:border-t-0 first:pt-0"
            >
              <span className="text-base font-bold whitespace-nowrap tabular-nums">{formatToman(refund.amount)}</span>
              <span
                className={cn(
                  "inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap",
                  refund.status === "paid"
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-primary/50 bg-primary/10 text-primary",
                )}
              >
                {REFUND_STATUS_LABELS[refund.status]}
              </span>
              {course && <span className="text-muted-foreground">برای {course}</span>}
              {refund.paidAt && (
                <span className="text-muted-foreground">واریز {formatJalaliTimestamp(refund.paidAt)}</span>
              )}
              {refund.reference && (
                <span className="text-muted-foreground">
                  کد پیگیری{" "}
                  <bdi dir="ltr" className="font-bold text-foreground">
                    {refund.reference}
                  </bdi>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

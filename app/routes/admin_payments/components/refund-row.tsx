import { cn } from "cn";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminPayment } from "~/orpc/checkout/contract";
import { REFUND_STATUS_LABELS, type RefundStatus } from "~/orpc/refund/constants";
import type { Refund } from "~/orpc/refund/contract";

/*===== Tones =====*/
// The payment badge's pill. Paid is green like money that arrived; a pending refund is plain ink, because its gold is
// the «پرداخت شد» button beside it (one gold per row); a cancelled one is quiet, it needs nothing.
const TONES: Record<RefundStatus, string> = {
  pending: "border-foreground/25 text-foreground",
  paid: "border-success/40 bg-success/10 text-success",
  cancelled: "border-transparent bg-muted text-muted-foreground",
};

/*===== Refund Row =====*/
/**
 * One refund under its slip: the amount, its state, the course it is for (when it is for one), the Admin's reason, the
 * day it was recorded and the transfer's reference once paid. A pending one carries «پرداخت شد» and «لغو»; a cancelled
 * one is dimmed with its amount struck through, since it no longer counts against what can be given back.
 *
 * Motion: a row recorded while the page is open rises in (`arrived`); a chip whose state changed while the page is
 * open is pressed in (`pm-stamp`), keyed by the state so each answer replays it.
 */
export function RefundRow({
  refund,
  items,
  arrived,
  onPay,
  onCancel,
}: {
  refund: Refund;
  items: AdminPayment["items"];
  /** Recorded after this slip was first drawn. */
  arrived: boolean;
  onPay: () => void;
  onCancel: () => void;
}) {
  const [firstStatus] = useState(refund.status);
  const item = items.find((entry) => entry.id === refund.paymentItemId);
  const cancelled = refund.status === "cancelled";

  return (
    <li className={cn("flex flex-wrap items-center gap-x-4 gap-y-2.5 py-3", arrived && "answer-in")}>
      <div className={cn("min-w-0 flex-1 basis-64", cancelled && "opacity-70")}>
        {/*------ Amount and State ------*/}
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span
            className={cn(
              "text-sm font-bold whitespace-nowrap",
              cancelled && "text-muted-foreground line-through decoration-foreground/40",
            )}
          >
            {formatToman(refund.amount)}
          </span>
          <span
            key={refund.status}
            className={cn(
              "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap",
              TONES[refund.status],
              refund.status !== firstStatus && "pm-stamp",
            )}
          >
            {REFUND_STATUS_LABELS[refund.status]}
          </span>
          {item && (
            <span className="text-xs text-muted-foreground">
              برای {item.course.title} · <bdi>{item.dog.name}</bdi>
            </span>
          )}
        </p>

        {/*------ Reason, Date, Reference ------*/}
        <p className="mt-1 text-xs leading-relaxed text-pretty text-muted-foreground">
          {refund.reason} · {formatJalaliTimestamp(refund.createdAt)}
          {refund.reference && (
            <>
              {" "}
              · کد پیگیری{" "}
              <bdi dir="ltr" className="font-bold text-foreground tabular-nums">
                {refund.reference}
              </bdi>
            </>
          )}
        </p>
      </div>

      {/*------ Answers ------*/}
      {refund.status === "pending" && (
        <div className="flex w-full gap-2 sm:w-auto">
          <Button type="button" size="sm" className="max-sm:h-11 max-sm:flex-1" onClick={onPay}>
            پرداخت شد
          </Button>
          <Button type="button" variant="ghost" size="sm" className="max-sm:h-11 max-sm:flex-1" onClick={onCancel}>
            لغو
          </Button>
        </div>
      )}
    </li>
  );
}

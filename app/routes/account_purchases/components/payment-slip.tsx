import { useId } from "react";

import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { Payment } from "~/orpc/checkout/contract";

import { PaymentLine } from "./payment-line";
import { PaymentStatusBadge } from "~/components/payment-status-badge";

/*===== Payment Slip =====*/
/**
 * One payment as a slip with a stub: the stub carries the date, status, total and the gateway's reference; a dashed
 * rule separates it from the lines it paid for. Desktop puts the stub at the start (4/12) and the lines beside it
 * (8/12); on phones the stub becomes the slip's header and the dashed rule runs under it.
 */
export function PaymentSlip({ payment }: { payment: Payment }) {
  const titleId = useId();
  const moment = payment.paidAt ?? payment.createdAt;

  return (
    <article
      aria-labelledby={titleId}
      className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:grid-cols-12"
    >
      {/*===== Stub =====*/}
      <div className="flex flex-col gap-4 border-b border-dashed border-border bg-sunken p-5 sm:p-6 lg:col-span-4 lg:border-e lg:border-b-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 id={titleId} className="font-sans text-lg font-extrabold">
            {formatJalaliTimestamp(moment)}
          </h2>
          <PaymentStatusBadge status={payment.status} />
        </div>

        <p className="text-2xl font-black text-primary">{formatToman(payment.amount)}</p>

        {/*------ Failure ------*/}
        {payment.status === "failed" && (
          <p className="text-sm text-pretty text-muted-foreground">{payment.failureReason ?? "پرداخت کامل نشد"}</p>
        )}

        {/*------ Gateway Details ------*/}
        {(payment.referenceId || payment.cardNumberMasked) && (
          <dl className="grid gap-2 text-sm">
            {payment.referenceId && (
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt className="text-muted-foreground">شماره‌ی پیگیری</dt>
                <dd dir="ltr" className="font-bold">
                  {payment.referenceId}
                </dd>
              </div>
            )}
            {payment.cardNumberMasked && (
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt className="text-muted-foreground">کارت</dt>
                <dd dir="ltr" className="font-bold">
                  {payment.cardNumberMasked}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/*===== Lines =====*/}
      <ul className="flex flex-col divide-y divide-border p-5 sm:p-6 lg:col-span-8 lg:p-8">
        {payment.items.map((item) => (
          <PaymentLine key={item.id} item={item} paymentStatus={payment.status} />
        ))}
      </ul>
    </article>
  );
}

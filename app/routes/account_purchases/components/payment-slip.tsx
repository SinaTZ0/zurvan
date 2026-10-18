import { useId } from "react";

import { formatToman } from "~/lib/course-format";
import { describeBalance, describeDeposit } from "~/lib/deposit-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { describeWhenFree } from "~/lib/when-free-format";
import type { Payment } from "~/orpc/checkout/contract";
import type { MyRefund } from "~/orpc/refund/contract";
import { REFUND_STATUS_LABELS } from "~/orpc/refund/constants";

import { PaymentLine } from "./payment-line";
import { PaymentStatusBadge } from "~/components/payment-status-badge";

/*===== Payment Slip =====*/
/**
 * One payment as a slip with a stub: the stub carries the date, status, total and the gateway's reference; a dashed
 * rule separates it from the lines it paid for. Desktop puts the stub at the start (4/12) and the lines beside it
 * (8/12); on phones the stub becomes the slip's header and the dashed rule runs under it.
 */
export function PaymentSlip({ payment, refunds }: { payment: Payment; refunds: readonly MyRefund[] }) {
  // A refund the trainer withdrew before paying it was never owed to anyone: only the ones still to come or already paid show.
  const shownRefunds = refunds.filter((entry) => entry.status !== "cancelled");
  const titleId = useId();
  const moment = payment.paidAt ?? payment.createdAt;
  const whenFree = describeWhenFree({ days: payment.availableDays, periods: payment.availablePeriods });

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

        <div>
          <p className="text-2xl font-black text-primary">{formatToman(payment.amount)}</p>
          {/* A deposit says what it is a share of and what is left, which is settled when the lessons are arranged. */}
          {describeDeposit(payment) && (
            <p className="mt-1 text-sm text-pretty text-muted-foreground">
              {describeDeposit(payment)}؛ {describeBalance(payment)} موقع هماهنگی با مربی.
            </p>
          )}
        </div>

        {/*------ When I'm Free ------*/}
        {whenFree && (
          <p className="text-sm text-pretty text-muted-foreground">
            <span className="font-bold text-foreground">وقت‌های آزاد برای هماهنگی:</span> {whenFree}
          </p>
        )}

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
        {shownRefunds.length > 0 && (
          <li className="flex flex-col gap-2 pt-4">
            <p className="font-bold">بازپرداخت</p>
            <ul className="flex flex-col gap-1.5">
              {shownRefunds.map((entry) => (
                <li key={entry.id} className="text-sm text-pretty text-muted-foreground">
                  <span className="font-bold text-foreground tabular-nums">{formatToman(entry.amount)}</span> ·{" "}
                  {REFUND_STATUS_LABELS[entry.status]}
                  {entry.paidAt && ` ${formatJalaliTimestamp(entry.paidAt)}`}
                  {entry.reference && (
                    <>
                      {" "}
                      · کد پیگیری <bdi dir="ltr">{entry.reference}</bdi>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </article>
  );
}

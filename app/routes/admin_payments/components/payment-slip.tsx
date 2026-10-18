import { useId } from "react";

import { CustomerContact } from "~/components/customer-contact";
import { PaymentStatusBadge } from "~/components/payment-status-badge";
import { formatToman } from "~/lib/course-format";
import { describeBalance, describeDeposit } from "~/lib/deposit-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { describeWhenFree } from "~/lib/when-free-format";
import type { AdminPayment } from "~/orpc/checkout/contract";
import type { Refund } from "~/orpc/refund/contract";

import { isFlagged } from "../payment-views";
import { PaymentItemRow } from "./payment-item-row";
import { RefundSection } from "./refund-section";

/*===== Payment Slip =====*/
/**
 * A paid payment as a slip. Desktop reads in one line (date, customer, total, status, gateway) with the items under a
 * dashed rule; on phones the date and status form the header, the total and customer follow, and the gateway details
 * close the slip. A slip with a flagged item gets a 2px destructive mark on its start edge so it shows while scrolling.
 */
export function PaymentSlip({ payment, refunds }: { payment: AdminPayment; refunds: readonly Refund[] }) {
  const titleId = useId();
  const moment = payment.paidAt ?? payment.createdAt;
  const flagged = isFlagged(payment);
  const whenFree = describeWhenFree({ days: payment.availableDays, periods: payment.availablePeriods });

  return (
    <article aria-labelledby={titleId} className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {flagged && <span aria-hidden className="absolute inset-y-0 start-0 w-0.5 bg-destructive" />}

      {/*===== Stub =====*/}
      <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6">
        {/*------ Date and Status ------*/}
        {/* `contents` on desktop lets these join the one line; on phones they are the slip's header. */}
        <div className="flex items-center justify-between gap-3 lg:contents">
          <time id={titleId} dateTime={moment.toISOString()} className="text-sm font-bold lg:order-1">
            {formatJalaliTimestamp(moment)}
          </time>
          <PaymentStatusBadge status={payment.status} className="lg:order-4" />
        </div>

        <p className="order-2 text-base font-bold tabular-nums lg:order-3">
          {formatToman(payment.amount)}
          {describeDeposit(payment) && (
            <span className="ms-2 text-xs font-normal text-muted-foreground">
              {describeDeposit(payment)} · {describeBalance(payment)}
            </span>
          )}
        </p>

        <CustomerContact
          name={payment.customer.name}
          phoneNumber={payment.customer.phoneNumber}
          className="order-3 lg:order-2"
        />

        {/*------ Gateway Details ------*/}
        {(payment.referenceId || payment.cardNumberMasked) && (
          <p className="order-4 flex flex-wrap gap-x-3 text-xs text-muted-foreground lg:order-5 lg:ms-auto">
            {payment.referenceId && <span dir="ltr">{payment.referenceId}</span>}
            {payment.cardNumberMasked && <span dir="ltr">{payment.cardNumberMasked}</span>}
          </p>
        )}
      </div>

      {/*===== When The Customer Is Free =====*/}
      {whenFree && (
        <p className="-mt-1 px-4 pb-4 text-sm text-muted-foreground sm:px-5">
          <span className="font-bold text-foreground">وقت‌های آزاد مشتری برای هماهنگی:</span> {whenFree}
        </p>
      )}

      {/*===== Items =====*/}
      <ul className="divide-y divide-border border-t border-dashed border-border px-4 sm:px-5">
        {payment.items.map((item) => (
          <PaymentItemRow key={item.id} item={item} customer={payment.customer} />
        ))}
      </ul>

      {/*===== Refunds =====*/}
      <RefundSection payment={payment} refunds={refunds} />
    </article>
  );
}

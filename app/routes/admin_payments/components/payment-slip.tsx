import { cn } from "cn";
import { useId } from "react";

import { CustomerContact } from "~/components/customer-contact";
import { PaymentStatusBadge } from "~/components/payment-status-badge";
import { ADMIN_HAIRLINE, ADMIN_PLATE } from "~/lib/admin-plate";
import { describeBalance, describeDeposit } from "~/lib/deposit-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { describeWhenFree } from "~/lib/when-free-format";
import type { AdminPayment } from "~/orpc/checkout/contract";
import type { Refund } from "~/orpc/refund/contract";

import { tomanDigits } from "../money";
import { NOTCH } from "../slip-marks";
import { PaymentItemRow } from "./payment-item-row";
import { RefundSection } from "./refund-section";

/*===== Payment Slip =====*/
/**
 * A paid payment as the customer's slip made into a ledger page: a stub and the lines it paid for, torn apart by a
 * dashed line with a notch bitten out of the edge at each end.
 *
 * - **Stub** (from `lg` the start column, 16rem; on phones the slip's head with the tear running under it): the date
 *   and status, the total big in Estedad (ivory: money is not gold here), the deposit note, the customer to call, when
 *   they said they are free, and the gateway's reference and card in small `ltr` text.
 * - **Lines:** each course bought; a paid item with no enrollment is the torn piece (`PaymentItemRow`).
 * - **Refunds**, under a double rule, pushed to the bottom so a stub taller than the lines leaves no hole under them.
 */
export function PaymentSlip({
  payment,
  refunds,
  className,
  style,
}: {
  payment: AdminPayment;
  refunds: readonly Refund[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const titleId = useId();
  const moment = payment.paidAt ?? payment.createdAt;
  const whenFree = describeWhenFree({ days: payment.availableDays, periods: payment.availablePeriods });
  const deposit = describeDeposit(payment);

  return (
    <article
      aria-labelledby={titleId}
      style={style}
      className={cn(ADMIN_PLATE, "relative grid overflow-hidden lg:grid-cols-[16rem_minmax(0,1fr)]", className)}
    >
      {/*===== Stub =====*/}
      <div className="relative flex flex-col gap-3 border-b-2 border-dashed border-foreground/20 bg-foreground/[0.025] p-5 lg:border-e-2 lg:border-b-0 lg:p-6">
        {/*------ Notches ------*/}
        {/* Phones: the tear runs across under the stub (both bottom corners); from `lg` it runs down its end side. */}
        <span
          aria-hidden
          className={`${NOTCH} -start-2.5 -bottom-2.5 lg:start-auto lg:-end-2.5 lg:-top-2.5 lg:bottom-auto`}
        />
        <span aria-hidden className={`${NOTCH} -end-2.5 -bottom-2.5`} />

        {/*------ Date and Status ------*/}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h3 id={titleId} className="text-sm font-bold">
            <time dateTime={moment.toISOString()}>{formatJalaliTimestamp(moment)}</time>
          </h3>
          <PaymentStatusBadge status={payment.status} />
        </div>

        {/*------ Total and Customer ------*/}
        {/* Phones: side by side, to keep the head short (the total at the start, the customer at the end); from `lg`
            stacked in the narrow stub. */}
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 lg:flex-col lg:items-stretch lg:justify-start">
          <div>
            <p className="whitespace-nowrap">
              <span className="font-display text-[1.75rem] leading-none font-extrabold">
                {tomanDigits(payment.amount)}
              </span>{" "}
              <span className="text-xs font-bold text-muted-foreground">تومان</span>
            </p>
            {/* A deposit says what it is a share of and what is left; each part keeps its amount on one line. */}
            {deposit && (
              <p className="mt-1.5 text-xs leading-relaxed text-pretty text-muted-foreground">
                <span className="whitespace-nowrap">{deposit}</span> ·{" "}
                <span className="whitespace-nowrap">{describeBalance(payment)}</span>
              </p>
            )}
          </div>

          <CustomerContact name={payment.customer.name} phoneNumber={payment.customer.phoneNumber} />
        </div>

        {/*------ When They're Free ------*/}
        {whenFree && (
          <p className="text-xs leading-relaxed text-pretty text-muted-foreground">
            <span className="font-bold text-foreground">وقت‌های آزاد برای هماهنگی:</span> {whenFree}
          </p>
        )}

        {/*------ Gateway Details ------*/}
        {/* One small line under an ink hairline: the gateway's reference, then the card, read left to right. */}
        {(payment.referenceId || payment.cardNumberMasked) && (
          <p
            dir="ltr"
            className={cn(
              "mt-auto flex flex-wrap justify-end gap-x-3 border-t pt-2.5 text-xs text-muted-foreground tabular-nums",
              ADMIN_HAIRLINE,
            )}
          >
            {payment.referenceId && (
              <span>
                <span className="sr-only">شماره‌ی پیگیری: </span>
                {payment.referenceId}
              </span>
            )}
            {payment.cardNumberMasked && (
              <span>
                <span className="sr-only">کارت: </span>
                {payment.cardNumberMasked}
              </span>
            )}
          </p>
        )}
      </div>

      {/*===== Lines and Refunds =====*/}
      <div className="flex min-w-0 flex-col p-5 pt-6 lg:p-6">
        <ul className={cn("flex flex-col divide-y", ADMIN_HAIRLINE)}>
          {payment.items.map((item) => (
            <PaymentItemRow key={item.id} item={item} customer={payment.customer} />
          ))}
        </ul>

        <RefundSection payment={payment} refunds={refunds} />
      </div>
    </article>
  );
}

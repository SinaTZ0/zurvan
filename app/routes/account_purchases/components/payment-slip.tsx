import { cn } from "cn";
import { useId } from "react";

import { MascotCut } from "~/components/mascot-cut";
import { PaymentStatusBadge } from "~/components/payment-status-badge";
import { formatToman } from "~/lib/course-format";
import { describeBalance, describeDeposit } from "~/lib/deposit-format";
import { formatNumber, formatTimestamp } from "~/lib/locale-format";
import { describeWhenFree } from "~/lib/when-free-format";
import type { Payment } from "~/orpc/checkout/contract";
import type { Media } from "~/orpc/media/contract";
import type { MyRefund } from "~/orpc/refund/contract";
import { m } from "~/paraglide/messages";

import { tomanDigits } from "../money";
import { PaymentLine } from "./payment-line";
import { RefundList } from "./refund-list";

/*===== Notch =====*/
// A half-round bite out of the slip's edge where the tear line meets it: a disc of the page's own paper over the edge,
// the part outside the slip clipped away by the slip's `overflow-hidden`.
const NOTCH = "pointer-events-none absolute size-5 rounded-full bg-background paper-grain";

// The slips that arrive with the page (the first screen and a little more); later ones rise in as they scroll in.
const ARRIVING = 4;

/** A phrase that never breaks across lines (it used to sit in a `whitespace-nowrap` span). */
function unbroken(text: string) {
  return text.replaceAll(" ", "\u00a0");
}

/*===== Payment Slip =====*/
/**
 * One payment as a paper slip on the table: a stub and the lines it paid for, torn apart by a dashed line with a notch
 * bitten out of the edge at each end. The stub carries the date, the status, the amount big in gold with «تومان» in body
 * text, the deposit line, when the customer said they are free, a failed payment's reason and the gateway's reference
 * and card in a small ruled list. A paid slip has the round gold seal stamped on its stub; a failed one is muted and
 * has only a faint dashed ring where the seal would be.
 *
 * From `lg` the stub is the start column (19rem); on phones it is the slip's head, the tear running under it. The seal
 * sits beside the amount on both. The lines end on the receipt's total under a double rule, pushed to the bottom, so
 * whichever side is shorter has no hole under it.
 *
 * Motion (page-motion.tsx): the first slips slide up one after another with the page (`ap-slip`, staggered by
 * `--answer-delay`) and their seals stamp as each lands (`ap-seal`); later slips rise in on scroll and stamp there.
 */
export function PaymentSlip({
  payment,
  refunds,
  photos,
  index,
}: {
  payment: Payment;
  refunds: readonly MyRefund[];
  /** The customer's dogs' photos by dog id; a dog not in it gets its engraved initial. */
  photos: Readonly<Record<string, Media | null>>;
  /** The slip's place in the list, newest first. */
  index: number;
}) {
  // A refund the trainer withdrew before paying it was never owed to anyone: only the ones still to come or already paid show.
  const shownRefunds = refunds.filter((entry) => entry.status !== "cancelled");
  const titleId = useId();
  const moment = payment.paidAt ?? payment.createdAt;
  const whenFree = describeWhenFree({ days: payment.availableDays, periods: payment.availablePeriods });
  const deposit = describeDeposit(payment);
  const paid = payment.status === "paid";
  const failed = payment.status === "failed";

  /*------ Motion ------*/
  const arriving = index < ARRIVING;
  const delay = 0.45 + index * 0.12;
  const motionStyle = arriving
    ? ({ "--answer-delay": `${delay}s`, "--ap-delay": `${delay + 0.3}s` } as React.CSSProperties)
    : undefined;
  const sealMotion = arriving ? "ap-seal" : "ap-seal-view";

  return (
    <article
      aria-labelledby={titleId}
      style={motionStyle}
      className={cn(
        "relative grid overflow-hidden rounded-3xl border border-foreground/10 bg-card paper-grain shadow-[0_22px_40px_-24px_rgb(0_0_0/0.95)] lg:grid-cols-[19rem_minmax(0,1fr)]",
        arriving ? "ap-slip" : "lively-reveal",
      )}
    >
      {/*===== Stub =====*/}
      <div
        className={cn(
          "relative flex flex-col gap-4 border-b-2 border-dashed border-foreground/20 bg-foreground/[0.025] p-5 sm:p-6 lg:border-e-2 lg:border-b-0 lg:p-7",
        )}
      >
        {/*------ Notches ------*/}
        {/* Phones: the tear runs across under the stub (both bottom corners); from `lg` it runs down its end side. */}
        <span
          aria-hidden
          className={`${NOTCH} -start-2.5 -bottom-2.5 lg:start-auto lg:-end-2.5 lg:-top-2.5 lg:bottom-auto`}
        />
        <span aria-hidden className={`${NOTCH} -end-2.5 -bottom-2.5`} />

        {/*------ Date and Status ------*/}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h3 id={titleId} className="font-sans text-base font-extrabold">
            {formatTimestamp(moment)}
          </h3>
          <PaymentStatusBadge status={payment.status} />
        </div>

        {/*------ Amount ------*/}
        <div className="flex items-center justify-between gap-4">
          <p className="whitespace-nowrap">
            <span
              className={cn(
                "font-display text-[2rem] leading-none font-black",
                failed ? "text-muted-foreground" : "text-primary",
              )}
            >
              {tomanDigits(payment.amount)}
            </span>{" "}
            <span className="text-sm font-bold text-muted-foreground">{m.account_purchases_slip_unit()}</span>
          </p>
          {/* The seal (or its empty ring) stamped at the stub's corner, beside the amount it vouches for. */}
          <SealMark paid={paid} motion={sealMotion} className="-my-2 w-16 lg:w-[4.75rem]" />
        </div>

        {/*------ Deposit ------*/}
        {/* A deposit says what it is a share of and what is left, which is settled when the lessons are arranged. */}
        {deposit && (
          // Each part holds its amount together (its spaces made non-breaking): a line may break between them, never
          // inside «… تومان».
          <p className="-mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
            {m.account_purchases_slip_deposit_line({
              deposit: unbroken(deposit),
              balance: unbroken(describeBalance(payment) ?? ""),
            })}
          </p>
        )}

        {/*------ When I'm Free ------*/}
        {whenFree && (
          <p className="text-sm text-pretty text-muted-foreground">
            <span className="font-bold text-foreground">{m.account_purchases_slip_free_times()}</span> {whenFree}
          </p>
        )}

        {/*------ Failure ------*/}
        {failed && (
          <p className="text-sm text-pretty text-muted-foreground">
            <span className="font-bold text-foreground">{m.account_purchases_slip_failed_why()}</span>{" "}
            {payment.failureReason ?? m.account_purchases_slip_failed_fallback()}
          </p>
        )}

        {/*------ Gateway Details ------*/}
        {(payment.referenceId || payment.cardNumberMasked) && (
          <dl className="grid text-sm">
            {payment.referenceId && (
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-dashed border-foreground/15 py-2">
                <dt className="text-muted-foreground">{m.account_purchases_slip_reference()}</dt>
                <dd dir="ltr" className="font-bold tabular-nums">
                  {payment.referenceId}
                </dd>
              </div>
            )}
            {payment.cardNumberMasked && (
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-dashed border-foreground/15 py-2">
                <dt className="text-muted-foreground">{m.account_purchases_slip_card()}</dt>
                <dd dir="ltr" className="font-bold tabular-nums">
                  {payment.cardNumberMasked}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/*===== Lines =====*/}
      <div className="flex flex-col p-5 pt-7 sm:p-6 sm:pt-8 lg:p-8">
        <div className="flex-1">
          <ul className="flex flex-col">
            {payment.items.map((item, itemIndex) => (
              <PaymentLine
                key={item.id}
                item={item}
                paymentStatus={payment.status}
                photo={photos[item.dog.id] ?? null}
                index={itemIndex}
              />
            ))}
          </ul>
          {shownRefunds.length > 0 && <RefundList refunds={shownRefunds} items={payment.items} />}
        </div>

        {/*------ Total ------*/}
        {/* The receipt's foot, under a double rule: the full price of what was bought (with a deposit, more than the
            stub's amount, which is what was taken). It sits at the bottom, so a stub taller than the lines leaves no
            hole under them. */}
        <p className="mt-6 flex items-baseline justify-between gap-4 border-t-[3px] border-double border-foreground/20 pt-4">
          <span className="text-sm font-bold text-muted-foreground">
            {m.account_purchases_slip_total({
              courses:
                payment.items.length === 1
                  ? m.account_purchases_courses_one({ count: formatNumber(payment.items.length) })
                  : m.account_purchases_courses_other({ count: formatNumber(payment.items.length) }),
            })}
          </span>
          <span className={cn("text-lg font-bold whitespace-nowrap", failed && "text-muted-foreground")}>
            {formatToman(payment.totalAmount)}
          </span>
        </p>
      </div>
    </article>
  );
}

/*===== Seal Mark =====*/
/**
 * The gold seal stamped on a paid slip (not dimmed: it is the slip's gold mark), slightly turned; for any other slip a
 * faint dashed ring where it would be. Decorative: the status badge says the same in words.
 */
function SealMark({ paid, motion, className }: { paid: boolean; motion: string; className?: string }) {
  if (!paid) {
    return (
      <span
        aria-hidden
        className={cn(
          "block aspect-square shrink-0 rounded-full border-2 border-dashed border-foreground/15",
          className,
        )}
      />
    );
  }

  return (
    <span aria-hidden className={cn("block shrink-0 -rotate-12", className)}>
      <MascotCut name="seal-disc" className={cn(motion, "block w-full")} />
    </span>
  );
}

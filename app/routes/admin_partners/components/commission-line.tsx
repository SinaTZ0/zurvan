import { cn } from "cn";

import { Button } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminCommission } from "~/orpc/commission/contract";

/*===== Columns =====*/
/**
 * The lines' tracks from `xl`, shared by the slip's column head and every line so they line up down the slip: the
 * customer, the purchase date, how the amount comes about, the amount and the button. The date, the amount and the
 * button have fixed widths so the eye runs straight down them.
 */
export const LINE_COLUMNS = "xl:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1.15fr)_8rem_7.25rem] xl:gap-x-4";

/*===== Types =====*/
/** How a paid line is leaving, once its exit has started. */
export type LineExit = { fold: boolean };

/*===== Commission Line =====*/
/**
 * One unpaid commission on its partner's slip: who bought, when, how the amount comes about, the amount and
 * «پرداخت شد» (the line's one gold button). The percent shown is the one *this* commission was written with (it can
 * differ from today's setting).
 *
 * - **Phones:** the customer and the date, then the sum it comes from and the amount, then a full-width button (44px).
 * - **`md` to `xl`:** the same two lines with the button at the end, beside both.
 * - **From `xl`:** one row in `LINE_COLUMNS`.
 *
 * Leaving (page-motion.tsx): `leaving` marks a line he just paid, kept for its exit; it is inert at once (the button
 * can't be pressed twice). Once `exit` is set the «پرداخت شد» stamp lands where the button was, and with `exit.fold`
 * the row folds away (without it, the whole slip is folding).
 */
export function CommissionLine({
  commission,
  leaving,
  exit,
  onPay,
}: {
  commission: AdminCommission;
  leaving: boolean;
  exit: LineExit | null;
  onPay: () => void;
}) {
  return (
    <li
      inert={leaving}
      data-commission={commission.id}
      // A grid of one row, so the fold can collapse it from `1fr` to `0fr`.
      className={cn("grid grid-rows-[1fr]", exit && ["pp-leaving", exit.fold && "pp-fold"])}
    >
      <div className={cn("min-h-0", exit && "overflow-hidden")}>
        <div
          className={cn(
            "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3.5",
            "[grid-template-areas:'who_date'_'calc_amount'_'pay_pay']",
            "md:grid-cols-[minmax(0,1fr)_auto_7.25rem] md:[grid-template-areas:'who_date_pay'_'calc_amount_pay']",
            "xl:gap-y-0 xl:[grid-template-areas:'who_date_calc_amount_pay']",
            LINE_COLUMNS,
          )}
        >
          {/*------ Who and When ------*/}
          <p className="min-w-0 text-sm font-bold break-words [grid-area:who]">
            <bdi>{commission.customer.name}</bdi>
          </p>
          <p className="text-xs whitespace-nowrap text-muted-foreground tabular-nums [grid-area:date] md:text-end xl:text-start xl:text-sm">
            <span className="sr-only">خرید: </span>
            {formatJalaliTimestamp(commission.createdAt)}
          </p>

          {/*------ How Much ------*/}
          <p className="text-xs text-muted-foreground [grid-area:calc] xl:text-sm">
            {formatNumberFa(commission.percent)}٪ از{" "}
            <span className="whitespace-nowrap">{formatToman(commission.baseAmount)}</span>
          </p>
          <p className="text-sm font-bold whitespace-nowrap tabular-nums [grid-area:amount] md:text-end">
            {formatToman(commission.amount)}
          </p>

          {/*------ Pay or Stamp ------*/}
          <div className="relative mt-2.5 [grid-area:pay] md:mt-0">
            <Button
              type="button"
              variant="solid"
              size="sm"
              className={cn("h-11 w-full md:h-10", exit && "pp-out")}
              onClick={onPay}
            >
              پرداخت شد
            </Button>
            {/* Pressed where the button was, in the paid chip's ink. Decorative: the toast says it in words. */}
            {exit && (
              <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="pp-stamp inline-flex items-center rounded-lg border-[3px] border-double border-success px-2.5 py-0.5 font-display text-base font-black whitespace-nowrap text-success">
                  پرداخت شد
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

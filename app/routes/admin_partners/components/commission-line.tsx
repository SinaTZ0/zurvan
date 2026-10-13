import { Button } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminCommission } from "~/orpc/commission/contract";

/*===== Commission Line =====*/
/**
 * One unpaid commission under its partner's head: who bought, when, how the amount comes about, the amount and the
 * button. The percent shown is the one *this* commission was written with (it can differ from today's setting).
 *
 * Phones: two lines (customer and date; the sum it comes from, muted; then the amount and the button). From `lg`: one
 * row on a five-column grid that lines up across every line of the block.
 */
export function CommissionLine({ commission, onPay }: { commission: AdminCommission; onPay: () => void }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3 [grid-template-areas:'who_date'_'calc_calc'_'amount_pay'] lg:grid-cols-[minmax(0,2fr)_7rem_minmax(0,2fr)_8rem_auto] lg:gap-y-0 lg:[grid-template-areas:'who_date_calc_amount_pay']">
      <p className="min-w-0 font-bold break-words [grid-area:who]">
        <bdi>{commission.customer.name}</bdi>
      </p>
      <p className="text-xs text-muted-foreground tabular-nums [grid-area:date] lg:text-sm">
        {formatJalaliTimestamp(commission.createdAt)}
      </p>
      <p className="text-xs text-muted-foreground [grid-area:calc] lg:text-sm">
        {formatNumberFa(commission.percent)}٪ از {formatToman(commission.baseAmount)}
      </p>
      <p className="mt-2 font-bold tabular-nums [grid-area:amount] lg:mt-0 lg:text-end">
        {formatToman(commission.amount)}
      </p>
      <Button type="button" variant="solid" size="sm" className="mt-2 [grid-area:pay] lg:mt-0" onClick={onPay}>
        پرداخت شد
      </Button>
    </li>
  );
}

import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminCommission } from "~/orpc/commission/contract";

/*===== Paid Ledger =====*/
/**
 * Commissions already paid, newest payment first: a record to look back at ("did I pay Bahram for Sara?"), with
 * nothing to press. One card with ruled rows; no paging, the list is short (a partner earns once per customer).
 */
export function PaidLedger({ commissions }: { commissions: readonly AdminCommission[] }) {
  return (
    <ul
      aria-label="پورسانت‌های پرداخت‌شده"
      className="divide-y divide-border rounded-2xl border border-border bg-card px-4"
    >
      {commissions.map((commission) => (
        <li
          key={commission.id}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 py-3 [grid-template-areas:'partner_amount'_'customer_customer'_'date_date'] lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_8rem] lg:[grid-template-areas:'partner_customer_date_amount']"
        >
          <p className="min-w-0 font-bold break-words [grid-area:partner]">
            <bdi>{commission.partner.name}</bdi>
          </p>
          <p className="min-w-0 text-sm break-words text-muted-foreground [grid-area:customer]">
            <span className="lg:sr-only">مشتری: </span>
            <bdi>{commission.customer.name}</bdi>
          </p>
          <p className="text-xs text-muted-foreground tabular-nums [grid-area:date] lg:text-sm">
            {commission.paidAt && `پرداخت شد ${formatJalaliTimestamp(commission.paidAt)}`}
          </p>
          <p className="font-bold tabular-nums [grid-area:amount] lg:text-end">{formatToman(commission.amount)}</p>
        </li>
      ))}
    </ul>
  );
}

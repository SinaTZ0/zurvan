import { Link } from "~/components/link";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { JALALI_MONTHS } from "~/lib/jalali";
import type { DashboardOverview } from "~/orpc/dashboard/contract";

import { TileChevron } from "./tile-chevron";

/*===== Money Row =====*/
/** A label and its amount in one row of the Money card. With `to` the whole row is a link; without, a plain figure. */
function MoneyRow({
  label,
  note,
  value,
  to,
}: {
  label: string;
  /** A small line under the label. */
  note?: string;
  value: string;
  to?: string;
}) {
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-pretty">{label}</span>
        {note && <span className="block text-xs text-muted-foreground">{note}</span>}
      </span>
      <span className="text-base font-bold tabular-nums">{value}</span>
    </>
  );

  // The empty span keeps a plain figure's amount in the column the linked rows' amounts use (the chevron's width).
  if (!to) {
    return (
      <div className="flex min-h-14 items-center gap-3 px-4 py-3">
        {content}
        <span aria-hidden className="size-5 shrink-0" />
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="group flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent"
    >
      {content}
      <TileChevron />
    </Link>
  );
}

/*===== Money Block =====*/
/**
 * F11's money, kept plain: what was paid this month and in all, and the commissions still unpaid. «پرداخت‌شده», never
 * «سود»: refunds are not recorded in the app, so these are payments taken, not earnings. Unpaid commissions have no
 * link on purpose: their list is the Partners page, which doesn't exist yet, and a dead link would promise it.
 */
export function MoneyBlock({ money }: { money: DashboardOverview["money"] }) {
  // The year is written digit by digit: `formatNumberFa` would group it as «۱٬۴۰۵».
  const monthLabel = `${JALALI_MONTHS[money.month.month - 1]} ${toPersianDigits(String(money.month.year))}`;

  return (
    <div>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        <MoneyRow
          label={`پرداخت‌شده در ${monthLabel}`}
          value={formatToman(money.salesThisMonth)}
          to="/admin/payments?view=paid"
        />
        <MoneyRow label="پرداخت‌شده تا امروز" value={formatToman(money.salesTotal)} to="/admin/payments?view=paid" />
        <MoneyRow
          label="کمیسیون پرداخت‌نشده"
          note={`${formatNumberFa(money.unpaidCommissions.count)} مورد`}
          value={formatToman(money.unpaidCommissions.amount)}
        />
      </div>
      <p className="mt-3 text-xs text-pretty text-muted-foreground">
        پرداخت‌های موفق است؛ پس دادن پول در برنامه ثبت نمی‌شود.
      </p>
    </div>
  );
}

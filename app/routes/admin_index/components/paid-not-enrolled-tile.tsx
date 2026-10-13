import { Link } from "~/components/link";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";

import { TileChevron } from "./tile-chevron";

/*===== Paid, Not Enrolled Tile =====*/
/**
 * F5's flag on the dashboard: items whose money was taken but that got no enrollment. At zero it is a calm one-line card
 * (no link: the flagged list would be empty). Above zero it borrows the torn slip of the Payments page, a dashed
 * destructive edge, with the count in gold because it is work waiting. The words never say the customer is owed: the app
 * records no refunds, giving the money back is done outside it.
 */
export function PaidNotEnrolledTile({ count, amount }: { count: number; amount: number }) {
  if (count === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        همه‌ی خریدها ثبت‌نام شده‌اند
      </p>
    );
  }

  return (
    <Link
      to="/admin/payments?view=flagged"
      className="group flex min-h-16 items-center gap-4 rounded-2xl border border-dashed border-destructive/60 bg-card p-4 transition-colors hover:border-destructive focus-visible:border-destructive"
    >
      <span className="text-3xl font-extrabold text-primary tabular-nums">{formatNumberFa(count)}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">ثبت‌نام نشده · {formatToman(amount)}</span>
        <span className="mt-1 block text-sm text-pretty text-muted-foreground">
          پول گرفته شده ولی ثبت‌نام ساخته نشده؛ پس دادنش بیرون از برنامه است.
        </span>
      </span>
      <TileChevron />
    </Link>
  );
}

import { CustomerContact } from "~/components/customer-contact";
import { Link } from "~/components/link";
import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { DashboardOverview } from "~/orpc/dashboard/contract";

export type LatestPurchase = DashboardOverview["waiting"]["latestPurchases"][number];

/*===== Purchase Row =====*/
/**
 * One paid payment, to call. Phones stack it (who, what, then amount and date on the last line); from `sm` it is one
 * line of three columns. An item with no enrollment carries the dashed «ثبت‌نام نشد» chip, the same dashed language as
 * the torn slip on Payments, so it can't be missed in a row of normal purchases.
 */
export function PurchaseRow({ purchase }: { purchase: LatestPurchase }) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:grid sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-center sm:gap-x-4">
      {/*------ Customer ------*/}
      <CustomerContact name={purchase.customer.name} phoneNumber={purchase.customer.phoneNumber} />

      {/*------ Items ------*/}
      <ul className="flex min-w-0 flex-col">
        {purchase.items.map((item) => (
          <li
            key={`${item.dog.id}-${item.course.slug}`}
            className="flex min-h-10 flex-wrap items-center gap-x-2 gap-y-1 text-sm"
          >
            <span className="min-w-0 text-pretty">
              <Link
                to={`/admin/dogs/${item.dog.id}`}
                className="rounded-sm font-bold underline-offset-4 hover:text-primary hover:underline"
              >
                <bdi>{item.dog.name}</bdi>
              </Link>
              <span aria-hidden> · </span>
              <span className="sr-only">، </span>
              <span className="text-muted-foreground">{item.course.title}</span>
            </span>
            {!item.enrolled && (
              <span className="rounded-full border border-dashed border-destructive/60 px-2 py-0.5 text-xs text-destructive">
                ثبت‌نام نشد
              </span>
            )}
          </li>
        ))}
      </ul>

      {/*------ Amount and Date ------*/}
      <div className="flex items-baseline justify-between gap-3 sm:flex-col sm:items-end sm:gap-0.5">
        <p className="text-sm font-bold tabular-nums">{formatToman(purchase.amount)}</p>
        <time dateTime={purchase.paidAt.toISOString()} className="text-xs text-muted-foreground">
          {formatJalaliTimestamp(purchase.paidAt)}
        </time>
      </div>
    </li>
  );
}

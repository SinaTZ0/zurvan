import { CustomerContact } from "~/components/customer-contact";
import { Link } from "~/components/link";
import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { DashboardOverview } from "~/orpc/dashboard/contract";

export type LatestPurchase = DashboardOverview["waiting"]["latestPurchases"][number];

/*===== Purchase Row =====*/
/**
 * One paid payment, to call. Narrow (a phone): the person and the number at the start with the amount and the day
 * across from them, then what was bought under both. Wide (the list's own width from 32rem, `@lg`): one line of three
 * columns, the person, what was bought, the amount and the day. An item with no enrollment carries the dashed
 * «ثبت‌نام نشد» chip, the torn piece's language, so it can't be missed in a row of normal purchases.
 */
export function PurchaseRow({ purchase }: { purchase: LatestPurchase }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 px-5 py-3 sm:px-6 @lg:grid-cols-[9.5rem_minmax(0,1fr)_auto] @lg:items-center">
      {/*------ Customer ------*/}
      <CustomerContact name={purchase.customer.name} phoneNumber={purchase.customer.phoneNumber} />

      {/*------ Amount and Date ------*/}
      {/* Second in the source so the narrow grid puts it across from the person; the wide grid moves it to the end. */}
      <div className="flex flex-col items-end gap-0.5 @lg:order-last">
        <p className="text-sm font-bold whitespace-nowrap tabular-nums">{formatToman(purchase.amount)}</p>
        <time dateTime={purchase.paidAt.toISOString()} className="text-xs whitespace-nowrap text-muted-foreground">
          {formatJalaliTimestamp(purchase.paidAt)}
        </time>
      </div>

      {/*------ Items ------*/}
      <ul className="col-span-2 flex min-w-0 flex-col @lg:col-span-1">
        {purchase.items.map((item) => (
          <li
            key={`${item.dog.id}-${item.course.slug}`}
            className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1 text-sm"
          >
            <span className="min-w-0 text-pretty">
              <Link
                to={`/admin/dogs/${item.dog.id}`}
                className="rounded-sm font-bold underline-offset-4 hover:underline"
              >
                <bdi>{item.dog.name}</bdi>
              </Link>
              <span aria-hidden> · </span>
              <span className="sr-only">، </span>
              <span className="text-muted-foreground">{item.course.title}</span>
            </span>
            {!item.enrolled && (
              <span className="rounded-full border border-dashed border-destructive/60 px-2 py-0.5 text-xs whitespace-nowrap text-destructive">
                ثبت‌نام نشد
              </span>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

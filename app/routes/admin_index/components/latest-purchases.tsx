import { cn } from "cn";
import { useId } from "react";

import { Link } from "~/components/link";
import { ADMIN_HAIRLINE } from "~/lib/admin-plate";

import { PurchaseRow, type LatestPurchase } from "./purchase-row";
import { TileChevron } from "./tile-chevron";

/*===== Latest Purchases =====*/
/**
 * «آخرین خریدها», the lines of the waiting slip: the newest paid payments, so he can ring the people who just bought.
 * The app has no "called" mark, so this isn't a queue that empties: it is simply the latest few, and it is never lit.
 * The rows lay themselves out by the width they get (a container query), since the same list sits in a 7/12 column at
 * 1440 and across the whole plate below `xl`.
 */
export function LatestPurchases({ purchases }: { purchases: readonly LatestPurchase[] }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="@container">
      {/*------ Head ------*/}
      <div className={cn("flex items-center justify-between gap-3 border-b ps-5 pe-3 sm:ps-6", ADMIN_HAIRLINE)}>
        <h3 id={titleId} className="py-3.5 text-sm font-bold">
          آخرین خریدها
        </h3>
        <Link
          to="/admin/payments?view=paid"
          className="group inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          همه‌ی پرداخت‌ها
          <TileChevron className="size-4" />
        </Link>
      </div>

      {/*------ Rows ------*/}
      {purchases.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">هنوز کسی خرید نکرده</p>
      ) : (
        <ul className={cn("divide-y", ADMIN_HAIRLINE)}>
          {purchases.map((purchase) => (
            <PurchaseRow key={purchase.paymentId} purchase={purchase} />
          ))}
        </ul>
      )}
    </section>
  );
}

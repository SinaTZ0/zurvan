import { useId } from "react";

import { Link } from "~/components/link";

import { PurchaseRow, type LatestPurchase } from "./purchase-row";
import { TileChevron } from "./tile-chevron";

/*===== Latest Purchases =====*/
/**
 * The newest paid payments, so he can ring the people who just bought. The app has no "called" mark, so this isn't a
 * queue that empties: it is simply the latest few, and it is never lit.
 */
export function LatestPurchases({ purchases }: { purchases: readonly LatestPurchase[] }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="rounded-2xl border border-border bg-card">
      {/*------ Head ------*/}
      <div className="flex items-center justify-between gap-3 border-b border-border ps-4 pe-2">
        <h3 id={titleId} className="py-3 text-sm font-extrabold">
          آخرین خریدها
        </h3>
        <Link
          to="/admin/payments?view=paid"
          className="group inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          همه‌ی پرداخت‌ها
          <TileChevron className="size-4" />
        </Link>
      </div>

      {/*------ Rows ------*/}
      {purchases.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">هنوز خریدی نشده</p>
      ) : (
        <ul className="divide-y divide-border">
          {purchases.map((purchase) => (
            <PurchaseRow key={purchase.paymentId} purchase={purchase} />
          ))}
        </ul>
      )}
    </section>
  );
}

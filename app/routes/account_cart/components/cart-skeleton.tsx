import { cn } from "cn";

import { Skeleton } from "~/components/ui/skeleton";
import { PLATE } from "~/routes/account_cart/column";

/*===== Cart Skeleton =====*/
/**
 * A bag and the counter in the new plates' shapes, while the cart is read and the first review runs. The server render
 * and the hydration pass both draw this (the cart is `[]` there), so it must not depend on the cart.
 */
export function CartSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-x-10"
    >
      {/*------ Bag ------*/}
      <div>
        <div className="flex h-24 items-end pb-3 lg:h-32">
          <Skeleton className="h-9 w-32 bg-card" />
        </div>
        <div className={cn(PLATE, "p-4 sm:p-6 lg:p-8")}>
          <div className="grid gap-5 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-x-8">
            <div className="flex items-center gap-4 lg:flex-col lg:items-stretch">
              <Skeleton className="aspect-[4/5] w-24 shrink-0 rounded-[3px] bg-card lg:w-40" />
              <Skeleton className="h-12 w-40 rounded-[1.4rem] bg-card lg:-mt-2 lg:w-full" />
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-card p-4">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-32 bg-muted" />
                    <Skeleton className="h-4 w-20 bg-muted" />
                  </div>
                  <Skeleton className="h-9 w-28 rounded-lg bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/*------ Counter ------*/}
      <div>
        <div className="flex h-24 items-end pb-3 lg:h-32">
          <Skeleton className="h-8 w-28 bg-card" />
        </div>
        <div className={cn(PLATE, "p-5 sm:p-7")}>
          <Skeleton className="h-5 w-36 bg-card" />
          <Skeleton className="mt-4 h-12 w-56 bg-card" />
          <Skeleton className="mt-8 h-4 w-full bg-card" />
          <Skeleton className="mt-6 h-12 w-full rounded-full bg-card" />
          <Skeleton className="mt-3 h-12 w-full rounded-full bg-card" />
        </div>
      </div>
    </div>
  );
}

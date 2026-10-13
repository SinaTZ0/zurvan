import { Skeleton } from "~/components/ui/skeleton";

/*===== Cart Skeleton =====*/
/**
 * One group and the summary on `sunken`, while the cart is read from the browser and the first review runs. The
 * server render and the hydration pass both draw this (the cart is `[]` there), so it must not depend on the cart.
 */
export function CartSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8">
      {/*------ Group ------*/}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-6">
        <Skeleton className="hidden min-h-56 rounded-2xl bg-sunken lg:col-span-4 lg:block" />
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Skeleton className="size-16 rounded-full bg-sunken" />
            <Skeleton className="h-7 w-32 bg-sunken" />
          </div>
          <Skeleton className="mt-4 h-16 w-64 max-w-full rounded-3xl bg-sunken lg:mt-0" />
          <Skeleton className="mt-4 h-7 w-28 bg-sunken max-lg:hidden" />
          <Skeleton className="mt-4 h-24 w-full rounded-2xl bg-sunken" />
        </div>
      </div>

      {/*------ Summary ------*/}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <Skeleton className="h-7 w-24 bg-sunken" />
        <Skeleton className="mt-4 h-5 w-40 bg-sunken" />
        <Skeleton className="mt-3 h-10 w-52 bg-sunken" />
        <Skeleton className="mt-6 h-14 w-full rounded-full bg-sunken" />
      </div>
    </div>
  );
}

import { cn } from "cn";
import { useAtomValue } from "jotai";
import { ShoppingBagIcon } from "lucide-react";

import { cartCountAtom } from "~/atoms/cart";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { useHydrated } from "~/hooks/use-hydrated";
import { formatNumberFa } from "~/lib/digits";
import { CART_PATH } from "~/orpc/checkout/constants";
import { useChanged } from "~/routes/buy/hooks/use-changed";

/*===== Cart Bar =====*/
/**
 * «دیدن سبد و پرداخت» with the number of items, floating at the bottom of the screen once the cart holds something
 * (above the phone tab bar, `--tab-bar-space`). Shown after hydration, as the header's icon is: the cart is
 * browser-first. It stays mounted and slides up when the count leaves zero (and away when the cart empties elsewhere),
 * `inert` while hidden; the count disc re-pops on every change while the page is open, not on the first read.
 */
export function CartBar() {
  const hydrated = useHydrated();
  const count = useAtomValue(cartCountAtom);
  const shown = hydrated && count > 0;
  const changed = useChanged(hydrated ? String(count) : null);

  return (
    <div
      inert={!shown}
      className={cn(
        "fixed inset-x-3 bottom-(--tab-bar-space) z-30 mx-auto w-fit max-w-[calc(100%-1.5rem)] lg:bottom-6",
        "motion-safe:transition-[translate,opacity,scale] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(.3,1.35,.5,1)]",
        shown ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-6 scale-90 opacity-0",
      )}
    >
      <div className="flex items-center gap-3 rounded-full border border-foreground/15 bg-card/95 paper-grain py-2 ps-2.5 pe-2 shadow-[0_14px_36px_-10px_rgb(0_0_0/0.9)] backdrop-blur-md sm:gap-4 sm:ps-3">
        {/*------ Count ------*/}
        <span className="relative grid size-10 shrink-0 place-items-center rounded-full border border-foreground/15 text-foreground">
          <ShoppingBagIcon aria-hidden strokeWidth={1.8} className="size-5" />
          <span
            key={count}
            aria-hidden
            className={cn(
              "absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-black text-primary-foreground tabular-nums",
              changed && "answer-pop",
            )}
          >
            {formatNumberFa(count)}
          </span>
        </span>
        <p className="text-sm font-bold whitespace-nowrap">{formatNumberFa(count)} مورد توی سبدته</p>
        <Link to={CART_PATH} className={buttonVariants({ size: "sm", className: "shrink-0" })}>
          دیدن سبد و پرداخت
        </Link>
      </div>
    </div>
  );
}

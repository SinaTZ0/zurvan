import { ShoppingBagIcon } from "lucide-react";
import { useAtomValue } from "jotai";

import { cartCountAtom } from "~/atoms/cart";
import { Link } from "~/components/link";
import { useHydrated } from "~/hooks/use-hydrated";
import { formatNumberFa } from "~/lib/digits";
import { CART_PATH } from "~/orpc/checkout/constants";

/*===== Cart Link =====*/
/**
 * The customer's cart icon in the storefront header, with the number of items in gold. The cart is in the browser, so
 * the count shows only after hydration (the server and the hydration pass render the bare icon); nothing shows for 0.
 */
export function CartLink() {
  const hydrated = useHydrated();
  const count = useAtomValue(cartCountAtom);
  const shown = hydrated ? count : 0;

  return (
    <Link
      to={CART_PATH}
      aria-label={shown ? `سبد، ${formatNumberFa(shown)} مورد` : "سبد"}
      className="relative grid size-11 shrink-0 place-items-center rounded-full text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ShoppingBagIcon aria-hidden strokeWidth={1.7} className="size-5" />
      {shown > 0 && (
        <span
          aria-hidden
          className="absolute end-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground tabular-nums"
        >
          {formatNumberFa(shown)}
        </span>
      )}
    </Link>
  );
}

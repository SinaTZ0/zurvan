import { useAtomValue } from "jotai";

import { cartCountAtom } from "~/atoms/cart";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { useHydrated } from "~/hooks/use-hydrated";
import { formatNumberFa } from "~/lib/digits";
import { CART_PATH } from "~/orpc/checkout/constants";

/*===== Cart Bar =====*/
/** «دیدن سبد» with the number of items, once there is something in it. Shown after hydration, as the header's icon is. */
export function CartBar() {
  const hydrated = useHydrated();
  const count = useAtomValue(cartCountAtom);
  if (!hydrated || count === 0) return null;

  return (
    <div className="mt-10 flex flex-wrap items-center gap-4 rounded-3xl border border-primary/40 bg-primary/10 p-5">
      <p className="font-bold">{formatNumberFa(count)} مورد توی سبدته</p>
      <Link to={CART_PATH} className={buttonVariants({ size: "lg" })}>
        دیدن سبد و پرداخت
      </Link>
    </div>
  );
}

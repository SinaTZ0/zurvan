import { useAtomValue } from "jotai";

import { useHydrated } from "~/hooks/use-hydrated";
import { cartCountAtom } from "~/atoms/cart";
import { ACCOUNT_NAV_ITEMS, type DeskNavItem } from "~/routes/layout_account/account-nav";
import { CART_PATH } from "~/orpc/checkout/constants";

/*===== Account Nav Items =====*/
/**
 * The account sections with the Cart tab's count. The cart lives in localStorage, so the count appears only once the
 * page has hydrated: the server and the hydration pass render without it and the two match. Nothing shows for 0.
 */
export function useAccountNavItems(): readonly DeskNavItem[] {
  const hydrated = useHydrated();
  const count = useAtomValue(cartCountAtom);

  if (!hydrated || count === 0) return ACCOUNT_NAV_ITEMS;
  return ACCOUNT_NAV_ITEMS.map((item) =>
    item.to === CART_PATH ? { ...item, badge: count, badgeLabel: "مورد" } : item,
  );
}

import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { cartItemsAtom } from "~/atoms/cart";

/*===== Cart Items =====*/
/**
 * The browser's cart, plus whether it has been read from storage yet.
 *
 * The atom is `[]` on the server, during hydration, and on the first render after a client-side navigation, and only
 * fills in when its first subscriber mounts. `useHydrated()` alone would let that empty first render show «سبد خالیه»
 * for a frame. `ready` flips in an effect declared after the atom's own subscription, so the stored items and the flag
 * arrive in the same render.
 */
export function useCartItems() {
  const items = useAtomValue(cartItemsAtom);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The server render and the hydration pass must stay `false`; an effect only runs in the browser, after them.
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- the one-way flip is the point (see the JSDoc).
    setReady(true);
  }, []);

  return { items, ready };
}

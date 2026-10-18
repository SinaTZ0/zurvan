import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { useEffect, useRef } from "react";

import {
  CART_SYNCED_KEY,
  cartItemsAtom,
  cartServerAtom,
  cartSyncingAtom,
  isInCart,
  setCartItemsAtom,
  type CartServer,
} from "~/atoms/cart";
import type { CartItem } from "~/orpc/checkout/contract";
import { client, orpc } from "~/orpc/client";

/*===== Synced Marker =====*/
// Storage can be blocked (private windows, site data off); then the marker is never kept and a stale local cart is merged
// again at the next load, which only ever adds items the server accepts.
function wasSynced(): boolean {
  try {
    return localStorage.getItem(CART_SYNCED_KEY) === "1";
  } catch {
    return false;
  }
}

function markSynced() {
  try {
    localStorage.setItem(CART_SYNCED_KEY, "1");
  } catch {
    // Not kept; see above.
  }
}

/*===== Cart Sync =====*/
/**
 * Keeps the browser's cart and the account's together, for a signed-in customer (F5). Renders nothing; the layouts that
 * show the cart mount it, so it is never on the sign-in page (whose `finish()` clears the query cache).
 *
 * - **Out:** while mounted, every change to the cart is also sent to the server (`CartServer`, used by the atoms).
 * - **In:** the server's cart is read on arrival and again when the tab regains focus, so a cart filled on another
 *   device appears. A copy that arrives while a change is still on its way is ignored: it would undo what was just done.
 * - **First time on this browser:** a cart already held here (from before carts lived in the account) is merged into the
 *   account once, and the merged result is shown. After that the account's cart wins: an item bought or removed on another
 *   device is not put back by a copy that is out of date.
 */
export function CartSync() {
  const queryClient = useQueryClient();
  const store = useStore();
  const setServer = useSetAtom(cartServerAtom);
  const setItems = useSetAtom(setCartItemsAtom);
  // Subscribing is what loads the stored cart from localStorage, which has to happen before anything is written to it.
  useAtomValue(cartItemsAtom);

  /*------ Out ------*/
  useEffect(() => {
    const queryKey = orpc.cart.get.queryKey();
    // Keeps the query's copy as new as the last answer, so a later effect run never sees an older one.
    const remember = ({ items }: { items: CartItem[] }) => {
      queryClient.setQueryData(queryKey, { items });
      return items;
    };
    const server: CartServer = {
      get: () => client.cart.get().then(remember),
      add: (item) => client.cart.add({ item }).then(remember),
      remove: (item) => client.cart.remove({ item }).then(remember),
      clear: () => client.cart.clear().then(remember),
    };
    setServer(server);
    return () => setServer(null);
  }, [queryClient, setServer]);

  /*------ In ------*/
  // A new object on every answer (no structural sharing), so an answer equal to the last still makes the effect check the
  // browser's copy against it: that is how a copy that drifted gets repaired on the next focus.
  const query = useQuery({
    ...orpc.cart.get.queryOptions(),
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    retry: 1,
    structuralSharing: false,
  });
  const mergedOnce = useRef(false);

  useEffect(() => {
    if (!query.data) return;
    // A change still on its way to the server: its own answer will say what the cart is. This copy is older.
    if (store.get(cartSyncingAtom) > 0) return;

    const serverItems = query.data.items;
    const held = store.get(cartItemsAtom);

    if (!mergedOnce.current) {
      mergedOnce.current = true;
      // Only a browser that was never brought together with the account has a cart of its own to merge in.
      if (!wasSynced() && held.some((item) => !isInCart(serverItems, item))) {
        void client.cart
          .merge({ items: held })
          .then(({ items }) => {
            queryClient.setQueryData(orpc.cart.get.queryKey(), { items });
            setItems(items);
            markSynced();
          })
          .catch(() => undefined);
        return;
      }
      markSynced();
    }

    const same = held.length === serverItems.length && held.every((item) => isInCart(serverItems, item));
    if (!same) setItems(serverItems);
  }, [query.data, queryClient, setItems, store]);

  return null;
}

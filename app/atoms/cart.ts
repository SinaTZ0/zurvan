import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { z } from "zod";

import { CART_MAX_ITEMS } from "~/orpc/checkout/constants";
import { cartItemSchema } from "~/orpc/checkout/contract";
import type { CartItem } from "~/orpc/checkout/contract";

/*===== Storage =====*/
/** The localStorage key. Internal identifiers keep the `zurvan` name (see CLAUDE.md). */
export const CART_STORAGE_KEY = "zurvan-cart";

/** jotai's synchronous storage shape (its own type isn't exported from `jotai/utils`). */
type SyncStorage<Value> = {
  getItem: (key: string, initialValue: Value) => Value;
  setItem: (key: string, newValue: Value) => void;
  removeItem: (key: string) => void;
  subscribe?: (key: string, callback: (value: Value) => void, initialValue: Value) => (() => void) | undefined;
};

const storedCartSchema = z.array(cartItemSchema);

/** Whether two cart items are the same course for the same dog. */
export function isSameCartItem(a: CartItem, b: CartItem) {
  return a.courseSlug === b.courseSlug && a.dogId === b.dogId;
}

/** Whether the pair is already in the cart. */
export function isInCart(items: readonly CartItem[], item: CartItem) {
  return items.some((existing) => isSameCartItem(existing, item));
}

/**
 * Turns whatever came out of localStorage into a safe cart. The value is user-editable and may come from an older
 * version of the app, so anything that isn't a list of `{ courseSlug, dogId }` becomes an empty cart (never a crash on
 * the page that reads it). A valid list is de-duplicated and cut to `CART_MAX_ITEMS`, the same limits the actions keep.
 */
export function parseStoredCart(value: unknown): CartItem[] {
  const parsed = storedCartSchema.safeParse(value);
  if (!parsed.success) return [];

  const items: CartItem[] = [];
  for (const item of parsed.data) {
    if (items.length >= CART_MAX_ITEMS) break;
    if (!isInCart(items, item)) items.push(item);
  }
  return items;
}

/**
 * Wraps a raw JSON storage so every read is validated. jotai's `withStorageValidator` only guards `getItem`, but a
 * cross-tab `storage` event arrives through `subscribe` and would otherwise put unchecked data into the atom.
 */
export function createCartStorage(raw: SyncStorage<unknown>): SyncStorage<CartItem[]> {
  const { subscribe } = raw;
  return {
    getItem: (key, initialValue) => parseStoredCart(raw.getItem(key, initialValue)),
    setItem: (key, value) => raw.setItem(key, value),
    removeItem: (key) => raw.removeItem(key),
    subscribe: subscribe
      ? (key, callback, initialValue) => subscribe(key, (value) => callback(parseStoredCart(value)), initialValue)
      : undefined,
  };
}

/*===== Source State =====*/
/**
 * The cart: one course for one dog per item, kept in the browser only (F5).
 *
 * The atom is `[]` on the server and during hydration, and reads localStorage when the first component subscribes to it.
 * So render anything that depends on the stored cart only after `useHydrated()`, and have at least one mounted
 * component read it (`useAtomValue`) before a write: a write to a store that never read the storage would replace the
 * saved cart with just the new item.
 */
export const cartItemsAtom = atomWithStorage<CartItem[]>(
  CART_STORAGE_KEY,
  [],
  createCartStorage(createJSONStorage<unknown>()),
);

/*===== Derived State =====*/
export const cartCountAtom = atom((get) => get(cartItemsAtom).length);

/*===== Actions =====*/
/** Adds a course-and-dog pair. Returns `"duplicate"` if it is already there and `"full"` at `CART_MAX_ITEMS`. */
export const addCartItemAtom = atom(null, (get, set, item: CartItem): "added" | "duplicate" | "full" => {
  const items = get(cartItemsAtom);
  if (isInCart(items, item)) return "duplicate";
  if (items.length >= CART_MAX_ITEMS) return "full";

  // Store only the two known fields: callers may pass a bigger object.
  set(cartItemsAtom, [...items, { courseSlug: item.courseSlug, dogId: item.dogId }]);
  return "added";
});

export const removeCartItemAtom = atom(null, (get, set, item: CartItem) => {
  set(
    cartItemsAtom,
    get(cartItemsAtom).filter((existing) => !isSameCartItem(existing, item)),
  );
});

export const clearCartAtom = atom(null, (_get, set) => {
  set(cartItemsAtom, []);
});

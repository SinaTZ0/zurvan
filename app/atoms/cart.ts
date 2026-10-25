import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { z } from "zod";

import { CART_MAX_ITEMS } from "~/orpc/checkout/constants";
import { cartItemSchema } from "~/orpc/checkout/contract";
import type { CartItem } from "~/orpc/checkout/contract";
import type { CoursePlace } from "~/orpc/course/constants";

/*===== Storage =====*/
/** The localStorage key. Internal identifiers keep the `zurvan` name (see CLAUDE.md). */
export const CART_STORAGE_KEY = "zurvan-cart";

/**
 * Set once this browser has been brought together with the account's cart. A cart held here before that (from when carts
 * lived only in the browser) is merged into the account; after it, the account's cart is the truth and anything here the
 * account no longer has (it was bought or removed elsewhere) is dropped instead of being put back.
 */
export const CART_SYNCED_KEY = "zurvan-cart-synced";

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

/** Whether two carts hold the same items with the same places picked, in any order. */
export function isSameCart(a: readonly CartItem[], b: readonly CartItem[]) {
  return (
    a.length === b.length &&
    a.every((item) => b.some((other) => isSameCartItem(item, other) && (item.place ?? null) === (other.place ?? null)))
  );
}

/** Whether the pair is already in the cart. */
export function isInCart(items: readonly CartItem[], item: CartItem) {
  return items.some((existing) => isSameCartItem(existing, item));
}

/**
 * Turns whatever came out of localStorage into a safe cart. The value is user-editable and may come from an older
 * version of the app, so anything that isn't a list of `{ courseSlug, dogId, place? }` becomes an empty cart (never a crash on
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
 * The cart as this browser shows it: one course for one dog per item (F5). The customer's account keeps the real copy
 * on the server, so the cart follows them to another device; this atom is what every page reads, kept in localStorage so
 * it appears at once and survives a reload. `CartSync` (mounted for a signed-in customer) keeps the two together.
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

/*===== Server Copy =====*/
/** What the cart needs from the account's copy on the server. Every answer is the whole cart afterwards. */
export type CartServer = {
  get: () => Promise<CartItem[]>;
  add: (item: CartItem) => Promise<CartItem[]>;
  remove: (item: CartItem) => Promise<CartItem[]>;
  clear: () => Promise<CartItem[]>;
  setPlace: (item: CartItem, place: CoursePlace | null) => Promise<CartItem[]>;
};

/** Set by `CartSync` while a customer is signed in; without it the actions below change only this browser. */
export const cartServerAtom = atom<CartServer | null>(null);

/** How many changes are on their way to the server. While there are any, an older copy must not replace the screen. */
export const cartSyncingAtom = atom(0);

/** Counts the changes sent, so that only the newest answer is shown: an earlier one may arrive after a later one. */
let newestRequest = 0;

/**
 * Sends one change to the server and shows the cart it answers with. The browser changed first (so the page never
 * waits); the answer also carries what was added on another device. If the server refuses or can't be reached the
 * real cart is asked for instead, and if that fails too the browser keeps what it has: `CartSync` merges it into the
 * account the next time the customer opens the site.
 */
const pushToServerAtom = atom(null, async (get, set, send: (server: CartServer) => Promise<CartItem[]>) => {
  const server = get(cartServerAtom);
  if (!server) return;

  const mine = ++newestRequest;
  set(cartSyncingAtom, (count) => count + 1);
  try {
    const items = await send(server).catch(() => server.get());
    if (mine === newestRequest) set(cartItemsAtom, parseStoredCart(items));
  } catch {
    // Offline or signed out: the browser's copy stands.
  } finally {
    set(cartSyncingAtom, (count) => count - 1);
  }
});

/*===== Actions =====*/
/** Adds a course-and-dog pair. Returns `"duplicate"` if it is already there and `"full"` at `CART_MAX_ITEMS`. */
export const addCartItemAtom = atom(null, (get, set, item: CartItem): "added" | "duplicate" | "full" => {
  const items = get(cartItemsAtom);
  if (isInCart(items, item)) return "duplicate";
  if (items.length >= CART_MAX_ITEMS) return "full";

  // Store only the two known fields: callers may pass a bigger object.
  const stored = { courseSlug: item.courseSlug, dogId: item.dogId };
  set(cartItemsAtom, [...items, stored]);
  void set(pushToServerAtom, (server) => server.add(stored));
  return "added";
});

export const removeCartItemAtom = atom(null, (get, set, item: CartItem) => {
  set(
    cartItemsAtom,
    get(cartItemsAtom).filter((existing) => !isSameCartItem(existing, item)),
  );
  // The cart page passes a bigger object (the reviewed item); the API takes exactly the two fields.
  const target = { courseSlug: item.courseSlug, dogId: item.dogId };
  void set(pushToServerAtom, (server) => server.remove(target));
});

/**
 * Picks where one item is taught (F5), or takes the pick back with null. The browser changes first, so the chip answers
 * at once; the server checks the place against the course and answers with the cart as it is.
 */
export const setCartItemPlaceAtom = atom(
  null,
  (get, set, { item, place }: { item: CartItem; place: CoursePlace | null }) => {
    set(
      cartItemsAtom,
      get(cartItemsAtom).map((existing) => (isSameCartItem(existing, item) ? { ...existing, place } : existing)),
    );
    const target = { courseSlug: item.courseSlug, dogId: item.dogId };
    void set(pushToServerAtom, (server) => server.setPlace(target, place));
  },
);

/** Empties the cart, here and on the server: what the customer asked for. Sign-out uses `resetCartAtom` instead. */
export const clearCartAtom = atom(null, (_get, set) => {
  set(cartItemsAtom, []);
  void set(pushToServerAtom, (server) => server.clear());
});

/**
 * Forgets this browser's copy without touching the account's: signing out must not empty the cart the customer will
 * find again, and the next person on this device must not inherit it. Any answer still on its way is dropped.
 */
export const resetCartAtom = atom(null, (_get, set) => {
  newestRequest++;
  set(cartItemsAtom, []);
});

/** Replaces the browser's copy with what the server holds, for `CartSync`. */
export const setCartItemsAtom = atom(null, (_get, set, items: readonly CartItem[]) => {
  set(cartItemsAtom, parseStoredCart(items));
});

import { createStore } from "jotai";
import { createJSONStorage } from "jotai/utils";
import { describe, expect, it } from "vitest";

import {
  addCartItemAtom,
  cartCountAtom,
  cartItemsAtom,
  cartServerAtom,
  cartSyncingAtom,
  clearCartAtom,
  createCartStorage,
  parseStoredCart,
  removeCartItemAtom,
  resetCartAtom,
  type CartServer,
} from "~/atoms/cart";
import { CART_MAX_ITEMS } from "~/orpc/checkout/constants";
import type { CartItem } from "~/orpc/checkout/contract";

/*===== Add =====*/
describe("addCartItemAtom", () => {
  it("rejects the same course for the same dog, but not another dog", () => {
    const store = createStore();
    const item = { courseSlug: "bmc", dogId: "dog-1" };

    expect(store.set(addCartItemAtom, item)).toBe("added");
    expect(store.set(addCartItemAtom, { ...item })).toBe("duplicate");
    expect(store.set(addCartItemAtom, { ...item, dogId: "dog-2" })).toBe("added");
    expect(store.get(cartCountAtom)).toBe(2);
  });

  it("refuses new items once the cart is full", () => {
    const store = createStore();
    for (let i = 0; i < CART_MAX_ITEMS; i++) {
      store.set(addCartItemAtom, { courseSlug: "bmc", dogId: `dog-${i}` });
    }

    expect(store.set(addCartItemAtom, { courseSlug: "cgc", dogId: "extra" })).toBe("full");
    expect(store.get(cartItemsAtom)).toHaveLength(CART_MAX_ITEMS);
  });
});

/*===== Storage =====*/
describe("stored cart", () => {
  it("falls back to an empty cart for malformed values", () => {
    expect(parseStoredCart("nope")).toEqual([]);
    expect(parseStoredCart({ courseSlug: "bmc", dogId: "d" })).toEqual([]);
    expect(parseStoredCart([{ courseSlug: "bmc" }])).toEqual([]);
    expect(parseStoredCart([{ courseSlug: "bmc", dogId: "d", price: 0 }])).toEqual([]);
  });

  it("keeps a valid cart within the item cap and without repeats", () => {
    const many = Array.from({ length: CART_MAX_ITEMS + 5 }, (_, i) => ({ courseSlug: "bmc", dogId: `dog-${i}` }));
    const repeated = { courseSlug: "cgc", dogId: "d" };

    expect(parseStoredCart(many)).toHaveLength(CART_MAX_ITEMS);
    expect(parseStoredCart([repeated, repeated])).toEqual([repeated]);
  });

  it("reads corrupt JSON from the browser's storage as an empty cart", () => {
    const data = new Map<string, string>([["zurvan-cart", "{not json"]]);
    const storage = createCartStorage(
      createJSONStorage<unknown>(() => ({
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => void data.set(key, value),
        removeItem: (key) => void data.delete(key),
      })),
    );

    expect(storage.getItem("zurvan-cart", [])).toEqual([]);
  });
});

/*===== Server Copy =====*/
// The account keeps the real cart; the atom is what pages read. Each change goes to the server and the server's answer
// (the whole cart afterwards) is what the page ends up showing.

/** A promise settled by hand, so a test decides the order in which answers arrive. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const a: CartItem = { courseSlug: "bmc", dogId: "dog-1" };
const b: CartItem = { courseSlug: "cgc", dogId: "dog-1" };
const fromOtherDevice: CartItem = { courseSlug: "igp", dogId: "dog-2" };

function connect(overrides: Partial<CartServer> = {}) {
  const store = createStore();
  const server: CartServer = {
    get: () => Promise.resolve([]),
    add: (item) => Promise.resolve([item]),
    remove: () => Promise.resolve([]),
    clear: () => Promise.resolve([]),
    ...overrides,
  };
  store.set(cartServerAtom, server);
  return store;
}

describe("the cart's copy on the server", () => {
  it("changes the page at once, then shows what the server answers, including items from another device", async () => {
    const store = connect({ add: (item) => Promise.resolve([fromOtherDevice, item]) });

    store.set(addCartItemAtom, a);
    expect(store.get(cartItemsAtom)).toEqual([a]);
    expect(store.get(cartSyncingAtom)).toBe(1);

    await flush();
    expect(store.get(cartItemsAtom)).toEqual([fromOtherDevice, a]);
    expect(store.get(cartSyncingAtom)).toBe(0);
  });

  it("shows only the newest answer, however the answers arrive", async () => {
    const first = deferred<CartItem[]>();
    const second = deferred<CartItem[]>();
    const answers = [first, second];
    const store = connect({ add: () => (answers.shift() ?? first).promise });

    store.set(addCartItemAtom, a);
    store.set(addCartItemAtom, b);
    second.resolve([a, b]);
    await flush();
    first.resolve([a]);
    await flush();

    expect(store.get(cartItemsAtom)).toEqual([a, b]);
    expect(store.get(cartSyncingAtom)).toBe(0);
  });

  it("asks for the real cart when a change is refused, and keeps the browser's copy when the server can't be reached", async () => {
    const refusing = connect({
      add: () => Promise.reject(new Error("no")),
      get: () => Promise.resolve([fromOtherDevice]),
    });
    refusing.set(addCartItemAtom, a);
    await flush();
    expect(refusing.get(cartItemsAtom)).toEqual([fromOtherDevice]);

    const offline = connect({ add: () => Promise.reject(new Error("no")), get: () => Promise.reject(new Error("no")) });
    offline.set(addCartItemAtom, a);
    await flush();
    expect(offline.get(cartItemsAtom)).toEqual([a]);
    expect(offline.get(cartSyncingAtom)).toBe(0);
  });

  it("sends a removal and a clear, but not an add that was a duplicate or refused for being full", async () => {
    const calls: string[] = [];
    const store = connect({
      add: (item) => {
        calls.push("add");
        return Promise.resolve([item]);
      },
      remove: () => {
        calls.push("remove");
        return Promise.resolve([]);
      },
      clear: () => {
        calls.push("clear");
        return Promise.resolve([]);
      },
    });

    store.set(addCartItemAtom, a);
    store.set(addCartItemAtom, { ...a });
    store.set(removeCartItemAtom, a);
    store.set(clearCartAtom);
    await flush();
    expect(calls).toEqual(["add", "remove", "clear"]);
  });

  it("sends the server only the two known fields, even when the caller passes a bigger object", async () => {
    const sent: unknown[] = [];
    const store = connect({
      remove: (item) => {
        sent.push(item);
        return Promise.resolve([]);
      },
    });
    store.set(addCartItemAtom, a);
    // What the cart page holds is a reviewed item, with the course, the dog and the price on it.
    const reviewed = { ...a, price: 95_000_000, course: { title: "x" }, dog: { name: "رکس" } };
    store.set(removeCartItemAtom, reviewed);
    await flush();

    expect(sent).toEqual([a]);
  });

  it("forgets the browser's copy on sign-out without telling the server, and drops an answer still on its way", async () => {
    const pending = deferred<CartItem[]>();
    const calls: string[] = [];
    const store = connect({
      add: () => pending.promise,
      clear: () => {
        calls.push("clear");
        return Promise.resolve([]);
      },
    });

    store.set(addCartItemAtom, a);
    store.set(resetCartAtom);
    pending.resolve([a]);
    await flush();

    expect(store.get(cartItemsAtom)).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("changes only the browser while no server is connected", () => {
    const store = createStore();
    expect(store.set(addCartItemAtom, a)).toBe("added");
    store.set(removeCartItemAtom, a);
    expect(store.get(cartItemsAtom)).toEqual([]);
  });
});

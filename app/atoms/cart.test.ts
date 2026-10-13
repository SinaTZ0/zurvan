import { createStore } from "jotai";
import { createJSONStorage } from "jotai/utils";
import { describe, expect, it } from "vitest";

import { addCartItemAtom, cartCountAtom, cartItemsAtom, createCartStorage, parseStoredCart } from "~/atoms/cart";
import { CART_MAX_ITEMS } from "~/orpc/checkout/constants";

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

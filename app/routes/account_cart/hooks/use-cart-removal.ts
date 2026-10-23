import { useSetAtom } from "jotai";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { removeCartItemAtom } from "~/atoms/cart";
import type { CartItem } from "~/orpc/checkout/contract";
import { m } from "~/paraglide/messages";

/*===== Removal =====*/
/** The value of a row's `data-cart-remove` attribute: how the page finds a button again after a render. */
export function removeKey(item: CartItem) {
  return `${item.courseSlug}|${item.dogId}`;
}

/**
 * Removing a row from the cart, with the two things a keyboard or screen-reader user needs: focus moves to a
 * neighbouring «برداشتن» (or the page title when none is left) instead of falling to the top of the document, and a
 * polite message says «برداشته شد».
 *
 * @returns `containerRef` goes on the element that holds every row; `message` is for an always-mounted live region.
 */
export function useCartRemoval() {
  const removeFromCart = useSetAtom(removeCartItemAtom);
  const containerRef = useRef<HTMLDivElement>(null);
  const [removals, setRemovals] = useState(0);

  function remove(item: CartItem) {
    const buttons = [...(containerRef.current?.querySelectorAll<HTMLElement>("[data-cart-remove]") ?? [])];
    const index = buttons.findIndex((button) => button.dataset.cartRemove === removeKey(item));
    const neighbour = buttons[index + 1] ?? buttons[index - 1];

    // Rendered synchronously, so the removed button is gone and the neighbour can be focused right away.
    flushSync(() => {
      removeFromCart(item);
      setRemovals((count) => count + 1);
    });

    if (neighbour?.isConnected) neighbour.focus();
    else document.getElementById("cart-title")?.focus();
  }

  return {
    containerRef,
    remove,
    // A live region only speaks when its text changes, and two removals in a row say the same words: a trailing
    // full stop on every second one makes them differ.
    message: removals === 0 ? "" : removals % 2 === 1 ? m.account_cart_removed_odd() : m.account_cart_removed_even(),
  };
}

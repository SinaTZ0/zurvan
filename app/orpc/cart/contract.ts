import { oc } from "@orpc/contract";
import { z } from "zod";

import { CART_MAX_ITEMS } from "~/orpc/checkout/constants";
import { cartItemSchema } from "~/orpc/checkout/contract";
import { COURSE_PLACES } from "~/orpc/course/constants";
import { commonErrors } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** The customer's cart as saved on the server (F5): one course for one dog per item, oldest first. */
export const cartSchema = z.object({ items: z.array(cartItemSchema) });

export type Cart = z.infer<typeof cartSchema>;

// Structure only; the limit and the meaning (the dog is theirs, the course exists) are checked by the service.
const itemInputSchema = z.strictObject({ item: cartItemSchema });
/**
 * A browser never holds more than the cart's limit (it cuts what it reads to that), so a longer list is a hand-made
 * request and is refused at the edge instead of being looked up item by item.
 */
export const mergeInputSchema = z.strictObject({ items: z.array(cartItemSchema).max(CART_MAX_ITEMS) });

/** Picks where one item is taught; null takes the pick back. */
const placeInputSchema = z.strictObject({ item: cartItemSchema, place: z.enum(COURSE_PLACES).nullable() });

/*===== Errors =====*/
const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
// Every procedure answers with the whole cart as it is afterwards, so the browser replaces what it holds with it.

/** The customer's cart. */
export const getCartContract = oc.errors(baseErrors).output(cartSchema);

/** Adds one item. `INVALID_INPUT` when the dog is not the customer's, the course doesn't exist or the cart is full. */
export const addToCartContract = oc.errors(baseErrors).input(itemInputSchema).output(cartSchema);

/** Takes one item out. An item that isn't there is not an error. */
export const removeFromCartContract = oc.errors(baseErrors).input(itemInputSchema).output(cartSchema);

export const clearCartContract = oc.errors(baseErrors).output(cartSchema);

/**
 * Picks where one item is taught (F5). `INVALID_INPUT` when the item isn't in the cart or its course doesn't offer the
 * place: the browser then reads the cart again.
 */
export const setCartPlaceContract = oc.errors(baseErrors).input(placeInputSchema).output(cartSchema);

/**
 * Adds a list of items at once, for the cart a browser already holds when the customer signs in on it. Items that
 * don't belong (not the customer's dog, no such course) and items past the cart's limit are left out, not refused; a
 * list longer than the limit is refused before anything is looked up.
 */
export const mergeCartContract = oc.errors(baseErrors).input(mergeInputSchema).output(cartSchema);

export const cartContract = {
  get: getCartContract,
  add: addToCartContract,
  remove: removeFromCartContract,
  clear: clearCartContract,
  merge: mergeCartContract,
  setPlace: setCartPlaceContract,
};

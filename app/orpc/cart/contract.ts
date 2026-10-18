import { oc } from "@orpc/contract";
import { z } from "zod";

import { cartItemSchema } from "~/orpc/checkout/contract";
import { commonErrors } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** The customer's cart as saved on the server (F5): one course for one dog per item, oldest first. */
export const cartSchema = z.object({ items: z.array(cartItemSchema) });

export type Cart = z.infer<typeof cartSchema>;

// Structure only; the limit and the meaning (the dog is theirs, the course exists) are checked by the service.
const itemInputSchema = z.strictObject({ item: cartItemSchema });
const itemsInputSchema = z.strictObject({ items: z.array(cartItemSchema) });

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
 * Adds a list of items at once, for the cart a browser already holds when the customer signs in on it. Items that
 * don't belong (not the customer's dog, no such course) and items past the cart's limit are left out, not refused.
 */
export const mergeCartContract = oc.errors(baseErrors).input(itemsInputSchema).output(cartSchema);

export const cartContract = {
  get: getCartContract,
  add: addToCartContract,
  remove: removeFromCartContract,
  clear: clearCartContract,
  merge: mergeCartContract,
};

import type { CheckoutOrder } from "~/orpc/order/contract";

/*===== Result State =====*/
/**
 * Which of the page's states an order is in, from the order alone (the gateway callback has already settled it):
 * - `paid`: the order is paid (or has been refunded since), so there is an enrollment to go to.
 * - `failed`: still pending, and the newest gateway attempt failed.
 * - `waiting`: still pending with an attempt the gateway hasn't answered, or none: nothing happened to show yet.
 * - `lost`: cancelled while a payment succeeded; the gateway money went to the wallet.
 * - `closed`: cancelled with no payment; Checkout says so.
 */
export type ResultState = "paid" | "failed" | "waiting" | "lost" | "closed";

export function getResultState(order: CheckoutOrder): ResultState {
  if (order.status === "paid" || order.status === "refunded" || order.status === "partially-refunded") return "paid";
  if (order.status === "cancelled" || order.status === "failed") {
    return order.payment?.status === "succeeded" ? "lost" : "closed";
  }
  return order.payment?.status === "failed" ? "failed" : "waiting";
}

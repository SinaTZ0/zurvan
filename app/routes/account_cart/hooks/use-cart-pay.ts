import { ORPCError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CartItem } from "~/orpc/checkout/contract";
import { client, orpc } from "~/orpc/client";

/*===== Messages =====*/
const CHANGED_MESSAGE = "وضعیت بعضی موردها عوض شده؛ سبد را دوباره بررسی کردیم. چیزی پرداخت نشد.";
const FAILED_MESSAGE = "پرداخت شروع نشد. دوباره امتحان کن.";

/*===== Cart Pay =====*/
/**
 * «پرداخت»: sends the payable items to `checkout.pay` and takes the browser to the gateway.
 *
 * `busy` stays true after a success: the gateway page is a document navigation, and until the browser leaves, a second
 * press would start a second payment.
 *
 * `NOT_ELIGIBLE` means the cart changed under the customer (an evaluation was withdrawn, a price stopped being sold):
 * the review is asked again so the page shows the new state, and nothing was charged.
 */
export function useCartPay() {
  const queryClient = useQueryClient();

  const pay = useMutation({
    mutationFn: (items: CartItem[]) => client.checkout.pay({ items }),
    // A relative or absolute gateway address both work with `assign`; the callback comes back as a document request.
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (error) => {
      if (error instanceof ORPCError && error.code === "NOT_ELIGIBLE") {
        void queryClient.invalidateQueries({ queryKey: orpc.checkout.review.key() });
      }
    },
  });

  const message = pay.error
    ? pay.error instanceof ORPCError && pay.error.code === "NOT_ELIGIBLE"
      ? CHANGED_MESSAGE
      : FAILED_MESSAGE
    : undefined;

  return {
    start: (items: CartItem[]) => pay.mutate(items),
    busy: pay.isPending || pay.isSuccess,
    message,
  };
}

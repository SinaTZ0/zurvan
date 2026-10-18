import { ORPCError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CartItem } from "~/orpc/checkout/contract";
import { client, orpc } from "~/orpc/client";

/*===== Messages =====*/
const CHANGED_MESSAGE = "وضعیت بعضی موردها عوض شده؛ سبد را دوباره بررسی کردیم. چیزی پرداخت نشد.";
const FAILED_MESSAGE = "پرداخت شروع نشد. دوباره امتحان کن.";
const RULES_MESSAGE = "اول قوانین سایت را بپذیر؛ بعد پرداخت.";

/*===== Cart Pay =====*/
/**
 * «پرداخت»: sends the payable items to `checkout.pay` and takes the browser to the gateway.
 *
 * `busy` stays true after a success: the gateway page is a document navigation, and until the browser leaves, a second
 * press would start a second payment.
 *
 * `NOT_ELIGIBLE` means the cart changed under the customer (an evaluation was withdrawn, a price stopped being sold):
 * the review is asked again so the page shows the new state, and nothing was charged. `RULES_NOT_ACCEPTED` means site rules
 * are published and this customer hasn't accepted them (F13): the consent status is asked again so the tick appears.
 * With `acceptRules` the acceptance is recorded first, so the tick and «پرداخت» are one press.
 */
export function useCartPay() {
  const queryClient = useQueryClient();

  const pay = useMutation({
    mutationFn: async ({ items, acceptRules }: { items: CartItem[]; acceptRules: boolean }) => {
      if (acceptRules) await client.consent.acceptSiteRules();
      return client.checkout.pay({ items });
    },
    // A relative or absolute gateway address both work with `assign`; the callback comes back as a document request.
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (error) => {
      if (error instanceof ORPCError && error.code === "NOT_ELIGIBLE") {
        void queryClient.invalidateQueries({ queryKey: orpc.checkout.review.key() });
      }
      if (error instanceof ORPCError && error.code === "RULES_NOT_ACCEPTED") {
        void queryClient.invalidateQueries({ queryKey: orpc.consent.status.key() });
      }
    },
  });

  const code = pay.error instanceof ORPCError ? pay.error.code : null;
  const message = pay.error
    ? code === "NOT_ELIGIBLE"
      ? CHANGED_MESSAGE
      : code === "RULES_NOT_ACCEPTED"
        ? RULES_MESSAGE
        : FAILED_MESSAGE
    : undefined;

  return {
    start: (items: CartItem[], options: { acceptRules?: boolean } = {}) =>
      pay.mutate({ items, acceptRules: options.acceptRules ?? false }),
    busy: pay.isPending || pay.isSuccess,
    message,
  };
}

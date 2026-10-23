import { ORPCError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CartItem } from "~/orpc/checkout/contract";
import { client, orpc } from "~/orpc/client";
import type { EvaluationPeriod, EvaluationWeekday } from "~/orpc/evaluation/constants";
import { m } from "~/paraglide/messages";

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
 * With `acceptRules` the acceptance is recorded first, so the tick and «پرداخت» are one press. `availableDays` and
 * `availablePeriods` are when the customer said they are usually free (F5), sent with the items for the call that follows.
 */
export function useCartPay() {
  const queryClient = useQueryClient();

  const pay = useMutation({
    mutationFn: async ({
      items,
      acceptRules,
      availableDays,
      availablePeriods,
    }: {
      items: CartItem[];
      acceptRules: boolean;
      availableDays: EvaluationWeekday[];
      availablePeriods: EvaluationPeriod[];
    }) => {
      if (acceptRules) await client.consent.acceptSiteRules();
      return client.checkout.pay({ items, availableDays, availablePeriods });
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
      ? m.account_cart_pay_changed()
      : code === "RULES_NOT_ACCEPTED"
        ? m.account_cart_pay_rules()
        : m.account_cart_pay_failed()
    : undefined;

  return {
    start: (
      items: CartItem[],
      options: {
        acceptRules?: boolean;
        availableDays?: EvaluationWeekday[];
        availablePeriods?: EvaluationPeriod[];
      } = {},
    ) =>
      pay.mutate({
        items,
        acceptRules: options.acceptRules ?? false,
        availableDays: options.availableDays ?? [],
        availablePeriods: options.availablePeriods ?? [],
      }),
    busy: pay.isPending || pay.isSuccess,
    message,
  };
}

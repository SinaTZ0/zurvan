import { useMutation } from "@tanstack/react-query";

import { client } from "~/orpc/client";

/*===== Checkout Actions =====*/
// Wrapped, so TanStack's mutation context isn't passed on as the call's options. No query cache to invalidate: the
// page's data is the route loader's, which the caller revalidates.

export function useApplyDiscount() {
  return useMutation({
    mutationFn: (input: Parameters<typeof client.order.applyDiscount>[0]) => client.order.applyDiscount(input),
  });
}

export function useRemoveDiscount() {
  return useMutation({
    mutationFn: (input: Parameters<typeof client.order.removeDiscount>[0]) => client.order.removeDiscount(input),
  });
}

/** `paid` or `redirect`; the caller navigates. */
export function usePayOrder() {
  return useMutation({
    mutationFn: (input: Parameters<typeof client.order.pay>[0]) => client.order.pay(input),
  });
}

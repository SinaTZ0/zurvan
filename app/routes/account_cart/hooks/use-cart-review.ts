import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { CartItem } from "~/orpc/checkout/contract";
import { orpc } from "~/orpc/client";

/*===== Cart Review =====*/
/**
 * The cart's items with today's prices and eligibility, and the server's total (F5).
 *
 * Keyed by the items without their places, so a removal asks again but picking a place doesn't (the page resolves the
 * pick itself, `selectCartItems`, and «پرداخت» sends it); the previous answer stays on screen meanwhile
 * (`isPlaceholderData` says so) instead of dropping the page back to a skeleton. Never reused as fresh (`staleTime: 0`): a price or a
 * dog's status can change between visits, and the page must show what «پرداخت» will charge.
 */
export function useCartReview({ items, ready }: { items: readonly CartItem[]; ready: boolean }) {
  return useQuery({
    ...orpc.checkout.review.queryOptions({
      input: { items: items.map(({ courseSlug, dogId }) => ({ courseSlug, dogId })) },
    }),
    enabled: ready && items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 0,
    // One retry is enough to ride out a blip; the page has its own «دوباره امتحان کن».
    retry: 1,
  });
}

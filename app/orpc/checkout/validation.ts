import { z } from "zod";

import { CART_MAX_ITEMS } from "~/orpc/checkout/constants";
import { m } from "~/paraglide/messages";

/*===== Cart =====*/
// Domain rules for the items a browser sends (F5): at least one, not absurdly many, and the same course for the same
// dog only once however the cart got that way. The messages are functions so each failure is worded in its request's
// language; the count keeps the Latin digits the Persian has always shown.
export const cartItemsSchema = z
  .array(z.object({ courseSlug: z.string().trim().min(1), dogId: z.string().trim().min(1) }))
  .min(1, { error: () => m.server_cart_empty() })
  .max(CART_MAX_ITEMS, { error: () => m.server_cart_max_items({ max: String(CART_MAX_ITEMS) }) })
  .transform((items) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${item.dogId}:${item.courseSlug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

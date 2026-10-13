import { z } from "zod";

import { CART_MAX_ITEMS } from "~/orpc/checkout/constants";

/*===== Cart =====*/
// Domain rules for the items a browser sends (F5): at least one, not absurdly many, and the same course for the same
// dog only once however the cart got that way.
export const cartItemsSchema = z
  .array(z.object({ courseSlug: z.string().trim().min(1), dogId: z.string().trim().min(1) }))
  .min(1, "سبد خرید خالی است.")
  .max(CART_MAX_ITEMS, `سبد خرید حداکثر ${CART_MAX_ITEMS} مورد دارد.`)
  .transform((items) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${item.dogId}:${item.courseSlug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

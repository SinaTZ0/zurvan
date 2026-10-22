import { CART_PATH, PURCHASES_PATH } from "~/orpc/checkout/constants";
import { m } from "~/paraglide/messages";

/*===== Account Links =====*/
// The customer's account pages (docs/app-spec.md, Pages), in one list so the account area's tabs and the storefront
// header's person menu always name and order them the same. Browser-safe.
// The labels are messages read through getters, in the page's language: read them while rendering.
export const ACCOUNT_LINKS = [
  {
    get label() {
      return m.shared_account_dogs();
    },
    to: "/account",
    end: true,
  },
  {
    get label() {
      return m.shared_account_cart();
    },
    to: CART_PATH,
  },
  {
    get label() {
      return m.shared_account_purchases();
    },
    to: PURCHASES_PATH,
  },
] as const;

/*===== Profile Settings =====*/
// Shared by customers and partners (docs/app-spec.md, F1). It is not a tab: settings aren't a daily destination, so it
// sits in the person menu of both headers instead.
export const PROFILE_PATH = "/account/profile";

export const PROFILE_LINK = {
  get label() {
    return m.shared_account_settings();
  },
  to: PROFILE_PATH,
} as const;

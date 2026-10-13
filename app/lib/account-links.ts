import { CART_PATH, PURCHASES_PATH } from "~/orpc/checkout/constants";

/*===== Account Links =====*/
// The customer's account pages (docs/app-spec.md, Pages), in one list so the account area's tabs and the storefront
// header's person menu always name and order them the same. Browser-safe.
export const ACCOUNT_LINKS = [
  { label: "سگ‌های من", to: "/account", end: true },
  { label: "سبد", to: CART_PATH },
  { label: "خریدها", to: PURCHASES_PATH },
] as const;

/*===== Profile Settings =====*/
// Shared by customers and partners (docs/app-spec.md, F1). It is not a tab: settings aren't a daily destination, so it
// sits in the person menu of both headers instead.
export const PROFILE_PATH = "/account/profile";

export const PROFILE_LINK = { label: "تنظیمات حساب", to: PROFILE_PATH } as const;

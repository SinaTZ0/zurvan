import { CART_PATH, PURCHASES_PATH } from "~/orpc/checkout/constants";

/*===== Account Links =====*/
// The customer's account pages (docs/app-spec.md, Pages), in one list so the account area's tabs and the storefront
// header's person menu always name and order them the same. Browser-safe.
export const ACCOUNT_LINKS = [
  { label: "سگ‌های من", to: "/account", end: true },
  { label: "سبد", to: CART_PATH },
  { label: "خریدها", to: PURCHASES_PATH },
] as const;

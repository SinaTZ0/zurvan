import { CART_PATH, PURCHASES_PATH } from "~/orpc/checkout/constants";

/*===== Storefront Navigation =====*/
// Shared by the desktop header and the phone menu, so both always list the same pages.
// The catalogue pages aren't built yet; the hash links point into the home page.
export const NAV_ITEMS = [
  { label: "دوره‌ها", to: "/#courses" },
  { label: "ارزیابی رایگان", to: "/#evaluation" },
  { label: "مربی", to: "/#trainer" },
] as const;

/*===== Signed-in Links =====*/
// The customer's account pages, listed in the person menu of the storefront header. The account area keeps its own
// copy (`layout_account/account-nav.ts`): a route slice never imports another's files.
export const CUSTOMER_MENU_LINKS = [
  { label: "سگ‌های من", to: "/account" },
  { label: "سبد", to: CART_PATH },
  { label: "خریدها", to: PURCHASES_PATH },
] as const;

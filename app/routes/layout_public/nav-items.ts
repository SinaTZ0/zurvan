import { ACCOUNT_LINKS } from "~/lib/account-links";

/*===== Storefront Navigation =====*/
// Shared by the desktop header and the phone menu, so both always list the same pages.
// The catalogue pages aren't built yet; the hash links point into the home page.
export const NAV_ITEMS = [
  { label: "دوره‌ها", to: "/#courses" },
  { label: "ارزیابی رایگان", to: "/#evaluation" },
  { label: "مربی", to: "/#trainer" },
] as const;

/*===== Signed-in Links =====*/
// The customer's account pages, listed in the person menu of the storefront header.
export const CUSTOMER_MENU_LINKS = ACCOUNT_LINKS.map(({ label, to }) => ({ label, to }));

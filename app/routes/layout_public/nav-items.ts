import { ACCOUNT_LINKS } from "~/lib/account-links";
import { SITE_RULES } from "~/lib/site-rules";

/*===== Storefront Navigation =====*/
// The desktop header's four pages. On phones the tab bar carries «دوره‌ها» and «تماس» and the «بیشتر» sheet the rest
// (`MORE_LINKS`), so every page here is reachable on both. A link is listed only when its page is usable: «قوانین»
// waits for text the owner has approved (it appears on its own once `SITE_RULES` is set). «همکاری با زروان» is in the
// footer and the «بیشتر» sheet, not the header: the header speaks to dog owners. There is no search here: search lives
// on the pages that have something to search.
export const NAV_ITEMS: readonly { label: string; to: string }[] = [
  { label: "دوره‌ها", to: "/courses" },
  { label: "درباره", to: "/about" },
  { label: "تماس", to: "/contact" },
  { label: "راهنما", to: "/help" },
  // Appears with the approved wording (`app/lib/site-rules.ts`) and not before.
  ...(SITE_RULES ? [{ label: "قوانین", to: "/rules" }] : []),
];

/** The pages of the phone's «بیشتر» sheet: everything the header lists that the tab bar doesn't. */
export const MORE_LINKS: readonly { label: string; to: string }[] = [
  { label: "درباره‌ی ما", to: "/about" },
  { label: "راهنما و سؤال‌های رایج", to: "/help" },
  { label: "همکاری با زروان", to: "/join/partner" },
  ...(SITE_RULES ? [{ label: "قوانین", to: "/rules" }] : []),
];

/** The one prominent ask in the header, a gold pill on desktop and the gold tile in the middle of the phone's tab bar. */
export const NAV_CTA = { label: "ارزیابی رایگان", to: "/assessment" } as const;

/*===== Signed-in Links =====*/
// The customer's account pages, listed in the person menu of the storefront header.
export const CUSTOMER_MENU_LINKS = ACCOUNT_LINKS.map(({ label, to }) => ({ label, to }));

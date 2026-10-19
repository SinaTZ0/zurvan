import { ACCOUNT_LINKS } from "~/lib/account-links";
import { SITE_RULES } from "~/lib/site-rules";

/*===== Storefront Navigation =====*/
// Shared by the desktop header and the phone menu, so both always list the same pages. A link is listed only when its
// page is usable: «قوانین» waits for text the owner has approved (it appears on its own once `SITE_RULES` is set) and
// «پرونده‌ها» for the dog logbook. «مربی» is gone
// because there is one trainer, and there is no search here: search lives on the pages that have something to search.
export const NAV_ITEMS: readonly { label: string; to: string }[] = [
  { label: "دوره‌ها", to: "/courses" },
  { label: "درباره‌ی طلا راستی", to: "/about" },
  { label: "همکارها", to: "/join/partner" },
  { label: "تماس با ما", to: "/contact" },
  // Appears with the approved wording (`app/lib/site-rules.ts`) and not before.
  ...(SITE_RULES ? [{ label: "قوانین", to: "/rules" }] : []),
];

/** The one prominent ask in the header, a gold pill on desktop and the first button in the phone menu. */
export const NAV_CTA = { label: "ارزیابی رایگان", to: "/assessment" } as const;

/*===== Signed-in Links =====*/
// The customer's account pages, listed in the person menu of the storefront header.
export const CUSTOMER_MENU_LINKS = ACCOUNT_LINKS.map(({ label, to }) => ({ label, to }));

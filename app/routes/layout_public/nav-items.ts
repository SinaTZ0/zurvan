import { ACCOUNT_LINKS } from "~/lib/account-links";
import { SITE_RULES } from "~/lib/site-rules";
import { m } from "~/paraglide/messages";

/*===== Storefront Navigation =====*/
// The desktop header's five pages. On phones the tab bar carries «دوره‌ها» and «تماس» and the «بیشتر» sheet the rest
// (`MORE_LINKS`), so every page here is reachable on both. A link is listed only when its page is usable: «قوانین»
// waits for text the owner has approved (it appears on its own once `SITE_RULES` is set). «همکاری با زروان» is in the
// footer and the «بیشتر» sheet, not the header: the header speaks to dog owners. There is no search here: search lives
// on the pages that have something to search.
// Route paths kept as literals (`as const`), so the links built from them are typed. The labels are messages read
// through getters, in the page's language: read them while rendering.
export const NAV_ITEMS = [
  {
    get label() {
      return m.layout_public_nav_courses();
    },
    to: "/courses",
  },
  {
    get label() {
      return m.layout_public_nav_blog();
    },
    to: "/blog",
  },
  {
    get label() {
      return m.layout_public_nav_about();
    },
    to: "/about",
  },
  {
    get label() {
      return m.layout_public_nav_contact();
    },
    to: "/contact",
  },
  {
    get label() {
      return m.layout_public_nav_help();
    },
    to: "/help",
  },
  // Appears with the approved wording (`app/lib/site-rules.ts`) and not before.
  ...(SITE_RULES
    ? [
        {
          get label() {
            return m.layout_public_nav_rules();
          },
          to: "/rules",
        } as const,
      ]
    : []),
] as const;

/** The pages of the phone's «بیشتر» sheet: everything the header lists that the tab bar doesn't. */
export const MORE_LINKS = [
  {
    get label() {
      return m.layout_public_more_about();
    },
    to: "/about",
  },
  {
    get label() {
      return m.layout_public_more_blog();
    },
    to: "/blog",
  },
  {
    get label() {
      return m.layout_public_more_help();
    },
    to: "/help",
  },
  {
    get label() {
      return m.layout_public_more_partner();
    },
    to: "/join/partner",
  },
  ...(SITE_RULES
    ? [
        {
          get label() {
            return m.layout_public_more_rules();
          },
          to: "/rules",
        } as const,
      ]
    : []),
] as const;

/** The one prominent ask in the header, a gold pill on desktop and the gold tile in the middle of the phone's tab bar. */
export const NAV_CTA = {
  get label() {
    return m.layout_public_nav_evaluation();
  },
  to: "/assessment",
} as const;

/*===== Signed-in Links =====*/
// The customer's account pages, listed in the person menu of the storefront header. The account's own list, so its
// labels stay getters (a copy made here would read them once, in whatever language the module loaded in).
export const CUSTOMER_MENU_LINKS = ACCOUNT_LINKS;

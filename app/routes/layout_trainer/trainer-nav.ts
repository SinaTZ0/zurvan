import type { DeskExitLink, DeskNavItem } from "~/routes/layout_account/account-nav";

/*===== Trainer Navigation =====*/
// The trainer area's sections, in the same header and tabs as the customer's account (docs/assessment-design.md,
// "Trainer Area Shell"). Only built pages are listed; enrollments and requests join when they exist.

export const TRAINER_NAV_ITEMS: readonly DeskNavItem[] = [{ label: "برنامه", to: "/trainer" }];

/** Back out of the desk to the public site. */
export const TRAINER_EXIT_LINK: DeskExitLink = { label: "سایت", to: "/" };

import type { DeskExitLink, DeskNavItem } from "~/routes/layout_account/account-nav";

/*===== Trainer Navigation =====*/
// The trainer area's sections, in the same header and tabs as the customer's account (docs/assessment-design.md,
// "Trainer Area Shell"). Only built pages are listed.

export const TRAINER_NAV_ITEMS: readonly DeskNavItem[] = [
  { label: "برنامه", to: "/trainer", end: true },
  { label: "شاگردها", to: "/trainer/enrollments" },
  { label: "درخواست‌ها", to: "/trainer/behavior-requests" },
];

/** Back out of the desk to the public site. */
export const TRAINER_EXIT_LINK: DeskExitLink = { label: "سایت", to: "/" };

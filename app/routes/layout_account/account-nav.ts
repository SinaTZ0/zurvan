/*===== Account Navigation =====*/
// The account area's sections, shared by the desktop tabs and the phone menu. Only built pages are listed; add each
// one here when its page exists (docs/customer-area-design.md, "Shell"). From three sections on, phones get a bottom
// tab bar instead of listing them in the person menu.

/** One section in a desk's header. The trainer area (`layout_trainer`) passes its own list to the same header. */
export type DeskNavItem = { label: string; to: string };

/** The link at the end of the header, back out of the desk. */
export type DeskExitLink = { label: string; to: string };

export const ACCOUNT_NAV_ITEMS: readonly DeskNavItem[] = [
  { label: "سگ‌های من", to: "/account/dogs" },
  { label: "آموزش‌ها", to: "/account/training" },
  { label: "ارزیابی‌ها", to: "/account/assessments" },
];

export const ACCOUNT_EXIT_LINK: DeskExitLink = { label: "دوره‌ها", to: "/courses" };

/** Phones show a bottom tab bar once there are this many sections. */
export const BOTTOM_TABS_FROM = 3;

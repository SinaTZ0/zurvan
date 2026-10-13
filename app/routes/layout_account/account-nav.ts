/*===== Account Navigation =====*/
// The account area's sections, shared by the desktop tabs and the phone menu. Only built pages are listed; add each
// one here when its page exists (docs/customer-area-design.md, "Shell"). From three sections on, phones get a bottom
// tab bar instead of listing them in the person menu.

/** One section in a desk's header. The Admin's area will pass its own list to the same header. */
export type DeskNavItem = {
  label: string;
  to: string;
  /** Active only on this exact URL: a desk's landing page would otherwise stay underlined on every page below it. */
  end?: boolean;
  /** A count shown beside the label, e.g. requests waiting for the Admin. Nothing shows for 0. */
  badge?: number;
};

/** The link at the end of the header, back out of the desk. */
export type DeskExitLink = { label: string; to: string };

// The pages of docs/app-spec.md (Dashboard, Cart, Purchases) are listed here as they are rebuilt.
export const ACCOUNT_NAV_ITEMS: readonly DeskNavItem[] = [{ label: "سگ‌های من", to: "/account", end: true }];

export const ACCOUNT_EXIT_LINK: DeskExitLink = { label: "دوره‌ها", to: "/courses" };

/** Phones show a bottom tab bar once there are this many sections. */
export const BOTTOM_TABS_FROM = 3;

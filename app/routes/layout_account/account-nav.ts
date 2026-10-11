/*===== Account Navigation =====*/
// The account area's sections, shared by the desktop tabs and the phone menu. Only built pages are listed; add each
// one here when its page exists (docs/customer-area-design.md, "Shell"). From three sections on, phones get a bottom
// tab bar instead of listing them in the person menu.
export const ACCOUNT_NAV_ITEMS = [{ label: "سگ‌های من", to: "/account/dogs" }] as const;

/** Phones show a bottom tab bar once there are this many sections. */
export const BOTTOM_TABS_FROM = 3;

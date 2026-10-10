/*===== Storefront Navigation =====*/
// Shared by the desktop header and the phone menu, so both always list the same pages.
// The catalogue and trainer pages aren't built yet; the hash links point into the home page.
export const NAV_ITEMS = [
  { label: "دوره‌ها", to: "/courses" },
  { label: "کلاس‌های پیش رو", to: "/#upcoming-runs" },
  { label: "مربیان", to: "/#trainers" },
  { label: "چطور کار می‌کند", to: "/#how-it-works" },
] as const;

/*===== Storefront Navigation =====*/
// Shared by the desktop header and the phone menu, so both always list the same pages.
// The catalogue pages aren't built yet; the hash links point into the home page.
export const NAV_ITEMS = [
  { label: "دوره‌ها", to: "/#courses" },
  { label: "مربی", to: "/#trainer" },
  { label: "چطور کار می‌کند", to: "/#how-it-works" },
  { label: "اصلاح رفتار", to: "/behavior-modification" },
] as const;

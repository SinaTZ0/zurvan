import { BookOpen, PawPrint, ReceiptText, ShoppingBag, Store, UsersRound, type LucideIcon } from "lucide-react";

import { ACCOUNT_LINKS } from "~/lib/account-links";
import { CART_PATH, PURCHASES_PATH } from "~/orpc/checkout/constants";
import type { StaticRoutePath } from "~/lib/route-path";

/*===== Account Navigation =====*/
// The account area's sections, shared by the desktop nav and the phone tab bar. Only built pages are listed; add each
// one here when its page exists (docs/storefront-design.md, "Account Shell"). Both roles get the floating tab bar on
// phones, so the person menu no longer lists the sections.

/** A page without params: what the header, the tab bar and the footer can link to. */
export type DeskPath = StaticRoutePath;

/** One section in a desk's header and tab bar. */
export type DeskNavItem = {
  label: string;
  /** A shorter name for the tab bar, where the label would crowd its neighbours. */
  short?: string;
  to: DeskPath;
  icon: LucideIcon;
  /** Active only on this exact URL: a desk's landing page would otherwise stay underlined on every page below it. */
  end?: boolean;
  /** A count shown beside the label, e.g. the cart's items. Nothing shows for 0. */
  badge?: number;
  /** What a screen reader says after the count. */
  badgeLabel?: string;
};

/** The link at the end of the header and the last tab: back out of the desk into the store. */
export type DeskExitLink = { label: string; to: DeskPath; icon: LucideIcon };

// The customer's pages (Dashboard, Cart, Purchases) come from the shared list, so the storefront's person menu and
// this shell always name and order them the same; the icons are the shell's own. The Cart's count is added at render
// time by `useAccountNavItems`: it comes from the browser-only cart, so it can't be part of this static list.
const ACCOUNT_ICONS: Record<string, LucideIcon> = {
  "/account": PawPrint,
  [CART_PATH]: ShoppingBag,
  [PURCHASES_PATH]: ReceiptText,
};

export const ACCOUNT_NAV_ITEMS: readonly DeskNavItem[] = ACCOUNT_LINKS.map((link) => ({
  ...link,
  icon: ACCOUNT_ICONS[link.to] ?? PawPrint,
}));

/** The partner's pages (F7): the dashboard and the leads. */
export const PARTNER_NAV_ITEMS: readonly DeskNavItem[] = [
  { label: "همکاری من", to: "/account/partner", end: true, icon: Store },
  { label: "شماره‌ها و مشتری‌ها", short: "مشتری‌ها", to: "/account/partner/leads", icon: UsersRound },
];

export const ACCOUNT_EXIT_LINK: DeskExitLink = { label: "دوره‌ها", to: "/courses", icon: BookOpen };

/** The room's name, the chip after the wordmark. */
export const ROOM_LABEL = { customer: "حساب من", partner: "همکار" } as const;

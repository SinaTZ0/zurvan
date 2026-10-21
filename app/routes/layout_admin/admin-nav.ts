import {
  ClipboardCheckIcon,
  GraduationCapIcon,
  BookOpenIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  MessageSquareTextIcon,
  PawPrintIcon,
  ReceiptTextIcon,
  SlidersHorizontalIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

/*===== Admin Navigation =====*/
// The Admin's pages (docs/app-spec.md, Pages), in the order he works through a day: answer the requests, call the
// customers, check the money. After those come the setup pages (courses, users, SMS, settings): the list has two groups
// and the rail and the «بیشتر» sheet draw the slip's dashed tear between them. Add each page here when it is built; the
// rail and the phone's tab bar both read this list. With more than four pages the bar keeps the first three and puts
// the rest in the «بیشتر» sheet (`PHONE_TAB_COUNT`). The counts are added by the layout, from its loader.

/** One page in the Admin's rail and bottom tabs. */
export type AdminNavItem = {
  /** `daily` pages come first; `setup` pages follow after the tear. Items must be listed with the daily ones first. */
  group: "daily" | "setup";
  label: string;
  to: string;
  icon: LucideIcon;
  /** Active only on this exact URL. */
  end?: boolean;
  /** A count shown beside the label, e.g. requests waiting for him. Nothing shows for 0. */
  badge?: number;
  /** What a screen reader says after the count; «در انتظار» when absent. */
  badgeLabel?: string;
};

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { group: "daily", label: "نمای کلی", to: "/admin", icon: LayoutDashboardIcon, end: true },
  { group: "daily", label: "ارزیابی‌ها", to: "/admin/evaluations", icon: ClipboardCheckIcon },
  { group: "daily", label: "ثبت‌نام‌ها", to: "/admin/enrollments", icon: GraduationCapIcon },
  { group: "daily", label: "پرداخت‌ها", to: "/admin/payments", icon: ReceiptTextIcon },
  { group: "daily", label: "همکاران", to: "/admin/partners", icon: HandshakeIcon },
  { group: "daily", label: "سگ‌ها", to: "/admin/dogs", icon: PawPrintIcon },
  { group: "setup", label: "دوره‌ها", to: "/admin/courses", icon: BookOpenIcon },
  { group: "setup", label: "کاربران", to: "/admin/users", icon: UsersIcon },
  { group: "setup", label: "پیامک‌ها", to: "/admin/sms", icon: MessageSquareTextIcon },
  { group: "setup", label: "تنظیمات", to: "/admin/settings", icon: SlidersHorizontalIcon },
];

/** How many pages the phone's tab bar shows when there are more than four; the rest wait in the «بیشتر» sheet. */
export const PHONE_TAB_COUNT = 3;

/** Whether the URL is the page of an item (the Overview matches only its exact URL, the others their subpages too). */
export function isCurrentNavItem({ item, pathname }: { item: AdminNavItem; pathname: string }): boolean {
  return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

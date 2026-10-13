import { ClipboardCheckIcon, GraduationCapIcon, ReceiptTextIcon, type LucideIcon } from "lucide-react";

/*===== Admin Navigation =====*/
// The Admin's pages (docs/app-spec.md, Pages), in the order he works through a day: answer the requests, call the
// customers, check the money. Add each page here when it is built; the rail and the phone's bottom tabs both read this
// list. The sheet that holds the pages beyond four on phones ("بیشتر") is built with the fifth page.

/** One page in the Admin's rail and bottom tabs. */
export type AdminNavItem = {
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
  { label: "ارزیابی‌ها", to: "/admin/evaluations", icon: ClipboardCheckIcon },
  { label: "ثبت‌نام‌ها", to: "/admin/enrollments", icon: GraduationCapIcon },
  { label: "پرداخت‌ها", to: "/admin/payments", icon: ReceiptTextIcon },
];

/** The Evaluations page, which the Admin's landing redirects to and which carries the waiting count. */
export const ADMIN_EVALUATIONS_PATH = "/admin/evaluations";

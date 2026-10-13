import { cn } from "cn";

import { NavBadge } from "~/components/nav-badge";
import { NavLink } from "~/components/nav-link";
import type { AdminNavItem } from "~/routes/layout_admin/admin-nav";

/*===== Admin Bottom Tabs =====*/
/**
 * Phones: the Admin's pages in a bar at the bottom of the screen, icon over label, where a thumb reaches them. It also
 * renders a spacer in the page flow so the last row scrolls clear of the bar. All pages fit while there are four or
 * fewer; the «بیشتر» sheet for more is built with the fifth page.
 */
export function AdminBottomTabs({ items }: { items: readonly AdminNavItem[] }) {
  return (
    <>
      <div aria-hidden className="h-16 lg:hidden" />
      <nav
        aria-label="مدیریت"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-popover pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex h-16 items-stretch">
          {items.map((item) => (
            <li key={item.to} className="flex flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-1 text-xs font-bold transition-colors outline-none focus-visible:bg-card",
                    // The mark sits on the bar's top edge.
                    "before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:rounded-full before:bg-primary before:opacity-0 before:transition-opacity",
                    isActive ? "text-foreground before:opacity-100" : "text-muted-foreground",
                  )
                }
              >
                <item.icon aria-hidden strokeWidth={1.7} className="size-5" />
                <span className="flex items-center">
                  {item.label}
                  <NavBadge count={item.badge} label={item.badgeLabel} />
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

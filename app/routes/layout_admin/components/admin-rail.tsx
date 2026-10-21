import { cn } from "cn";

import { NavBadge } from "~/components/nav-badge";
import { NavLink } from "~/components/nav-link";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import type { AdminNavItem } from "~/routes/layout_admin/admin-nav";
import { CurrentMark } from "~/routes/layout_admin/components/current-mark";
import { useHasNavigated } from "~/routes/layout_admin/hooks/use-has-navigated";

/*===== Admin Rail =====*/
/**
 * Desktop: the Admin's pages as a column at the start side, under the top bar. A column, not header tabs, because ten
 * pages live here, in two groups (the daily work, then the setup pages) split by the slip's dashed tear. Each item is
 * its icon, its label and, at the end, the count of work waiting there. The current page sits on a raised grained pill
 * with the gold mark at its start edge; the mark grows in when he opens another page.
 *
 * It stays under the sticky header, and scrolls on its own if a short window can't hold every item.
 */
export function AdminRail({ items }: { items: readonly AdminNavItem[] }) {
  const grow = useHasNavigated();

  return (
    <aside className="hidden w-60 shrink-0 border-e border-foreground/10 lg:block">
      <nav aria-label="صفحه‌های مدیریت" className="sticky top-16 max-h-[calc(100svh-4rem)] overflow-y-auto px-3 py-6">
        <ul className="flex flex-col gap-1">
          {items.map((item, index) => (
            <li
              key={item.to}
              // The group's first item carries the tear and the gap, so the groups read as two lists.
              className={cn(index > 0 && item.group !== items[index - 1]?.group && `mt-3 border-t pt-4 ${ADMIN_TEAR}`)}
            >
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "relative flex h-10 items-center gap-3 rounded-full ps-4 pe-3 text-sm font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    isActive
                      ? "bg-card paper-grain text-foreground shadow-[var(--elevation-sm)]"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <CurrentMark grow={grow} />}
                    <item.icon aria-hidden strokeWidth={1.7} className="size-5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <NavBadge count={item.badge} label={item.badgeLabel} className="ms-0" />
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

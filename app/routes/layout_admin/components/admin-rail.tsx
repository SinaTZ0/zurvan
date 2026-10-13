import { cn } from "cn";

import { NavBadge } from "~/components/nav-badge";
import { NavLink } from "~/components/nav-link";
import type { AdminNavItem } from "~/routes/layout_admin/admin-nav";

/*===== Admin Rail =====*/
/**
 * Desktop: the Admin's pages as a column at the start side, under the top bar. A column, not header tabs, because ten
 * pages will live here. The current page sits on a raised surface with a flat-gold mark at its start edge.
 */
export function AdminRail({ items }: { items: readonly AdminNavItem[] }) {
  return (
    <aside className="hidden w-56 shrink-0 border-e border-foreground/10 lg:block">
      <nav aria-label="مدیریت" className="sticky top-14 p-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    // The mark sits on the item's start edge, the rail's version of the account tabs' underline.
                    "before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-full before:bg-primary before:opacity-0 before:transition-opacity",
                    isActive
                      ? "bg-card text-foreground before:opacity-100"
                      : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                  )
                }
              >
                <item.icon aria-hidden strokeWidth={1.7} className="size-5 shrink-0" />
                {item.label}
                <NavBadge count={item.badge} label={item.badgeLabel} />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

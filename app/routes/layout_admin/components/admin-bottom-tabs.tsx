import { cn } from "cn";
import { EllipsisIcon } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router";

import { NavBadge } from "~/components/nav-badge";
import { NavLink } from "~/components/nav-link";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { type AdminNavItem, PHONE_TAB_COUNT } from "~/routes/layout_admin/admin-nav";

/*===== Constants =====*/
const TAB_CLASS =
  "relative flex flex-1 flex-col items-center justify-center gap-1 text-xs font-bold transition-colors outline-none focus-visible:bg-card " +
  // The mark sits on the bar's top edge.
  "before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:rounded-full before:bg-primary before:opacity-0 before:transition-opacity";

/** Whether the URL is the page of an item (the dashboard matches only its exact URL). */
function isCurrent({ item, pathname }: { item: AdminNavItem; pathname: string }): boolean {
  return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/*===== Admin Bottom Tabs =====*/
/**
 * Phones: the Admin's pages in a bar at the bottom of the screen, icon over label, where a thumb reaches them. It also
 * renders a spacer in the page flow so the last row scrolls clear of the bar. Up to four pages sit in the bar; with more,
 * the bar keeps the first three and the rest open from «بیشتر», a bottom sheet (a `Sheet`: the `Drawer` is not RTL-correct).
 */
export function AdminBottomTabs({ items }: { items: readonly AdminNavItem[] }) {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const overflowing = items.length > 4;
  const tabs = overflowing ? items.slice(0, PHONE_TAB_COUNT) : items;
  const more = overflowing ? items.slice(PHONE_TAB_COUNT) : [];
  const moreIsCurrent = more.some((item) => isCurrent({ item, pathname }));
  // A count on a page inside the sheet would be invisible; the bar's «بیشتر» carries the sum so nothing waiting hides.
  const moreBadge = more.reduce((sum, item) => sum + (item.badge ?? 0), 0);

  return (
    <>
      <div aria-hidden className="h-16 lg:hidden" />
      <nav
        aria-label="مدیریت"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-popover pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex h-16 items-stretch">
          {tabs.map((item) => (
            <li key={item.to} className="flex flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(TAB_CLASS, isActive ? "text-foreground before:opacity-100" : "text-muted-foreground")
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

          {/*------ More ------*/}
          {overflowing && (
            <li className="flex flex-1">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen(true)}
                className={cn(
                  TAB_CLASS,
                  moreIsCurrent ? "text-foreground before:opacity-100" : "text-muted-foreground",
                )}
              >
                <EllipsisIcon aria-hidden strokeWidth={1.7} className="size-5" />
                <span className="flex items-center">
                  بیشتر
                  <NavBadge count={moreBadge} />
                </span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/*===== More Sheet =====*/}
      {overflowing && (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent
            side="bottom"
            className="gap-2 rounded-t-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
          >
            <SheetTitle className="px-1 text-base font-extrabold">صفحه‌های دیگر</SheetTitle>
            <ul className="flex flex-col gap-1">
              {more.map((item, index) => (
                <li
                  key={item.to}
                  // The first setup page after a daily one starts a new group.
                  className={cn(
                    index > 0 && item.group !== more[index - 1]?.group && "mt-2 border-t border-foreground/10 pt-3",
                  )}
                >
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        isActive ? "bg-card text-foreground" : "text-muted-foreground hover:bg-card/60",
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
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

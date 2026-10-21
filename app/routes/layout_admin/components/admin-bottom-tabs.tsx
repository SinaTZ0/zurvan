import { cn } from "cn";
import { EllipsisIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router";

import { NavBadge } from "~/components/nav-badge";
import { NavLink } from "~/components/nav-link";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { type AdminNavItem, isCurrentNavItem, PHONE_TAB_COUNT } from "~/routes/layout_admin/admin-nav";
import { CurrentMark } from "~/routes/layout_admin/components/current-mark";
import { useHasNavigated } from "~/routes/layout_admin/hooks/use-has-navigated";

/*===== Constants =====*/
// The account shell's floating bar (held off the edges, the card's grey with a hairline, icons over 11px labels, the
// current tab's icon gold). `aria-current` marks a page's tab; «بیشتر» is a button, so it marks itself with
// `data-current` when the page is one of those inside its sheet.
const TAB =
  "group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] leading-none text-foreground/70 transition-colors motion-reduce:transition-none hover:text-foreground aria-[current=page]:text-foreground data-[current=true]:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

const ICON =
  "size-[1.375rem] transition-colors duration-300 motion-reduce:transition-none group-aria-[current=page]:text-primary group-data-[current=true]:text-primary";

/** A count on a tab's icon: the badge made small and hung on the icon's top corner. */
const ICON_BADGE = "absolute -end-3 -top-2 ms-0 h-4 min-w-4 px-1 text-[10px]";

/*===== Admin Bottom Tabs =====*/
/**
 * Phones (below `lg`): the Admin's pages in the account shell's floating tab bar, where a thumb reaches them. It also
 * renders a spacer in the page flow so the last row scrolls clear of the bar (`--tab-bar-space`). Up to four pages sit
 * in the bar; with more, the bar keeps the first three and the rest open from «بیشتر», a grained bottom sheet (a `Sheet`:
 * the `Drawer` is not RTL-correct).
 */
export function AdminBottomTabs({ items }: { items: readonly AdminNavItem[] }) {
  const { pathname } = useLocation();
  const grow = useHasNavigated();
  const [moreOpen, setMoreOpen] = useState(false);

  const overflowing = items.length > 4;
  const tabs = overflowing ? items.slice(0, PHONE_TAB_COUNT) : items;
  const more = overflowing ? items.slice(PHONE_TAB_COUNT) : [];
  const moreIsCurrent = more.some((item) => isCurrentNavItem({ item, pathname }));
  // A count on a page inside the sheet would be invisible; the bar's «بیشتر» carries the sum so nothing waiting hides.
  const moreBadge = more.reduce((sum, item) => sum + (item.badge ?? 0), 0);

  return (
    <>
      <div aria-hidden className="h-[var(--tab-bar-space)] lg:hidden" />
      <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md lg:hidden">
        <nav aria-label="صفحه‌های مدیریت، منوی پایین">
          <ul className="flex h-[4.25rem] items-stretch rounded-[1.6rem] border border-foreground/15 bg-card/90 px-1.5 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.8)] backdrop-blur-md">
            {tabs.map((item) => (
              <li key={item.to} className="flex flex-1">
                <NavLink to={item.to} end={item.end} className={TAB}>
                  <span className="relative">
                    <item.icon aria-hidden strokeWidth={1.8} className={ICON} />
                    <NavBadge count={item.badge} label={item.badgeLabel} className={ICON_BADGE} />
                  </span>
                  <span className="max-w-full truncate px-0.5">{item.label}</span>
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
                  data-current={moreIsCurrent}
                  onClick={() => setMoreOpen(true)}
                  className={TAB}
                >
                  <span className="relative">
                    <EllipsisIcon aria-hidden strokeWidth={1.8} className={ICON} />
                    <NavBadge count={moreBadge} label="کار منتظر توی صفحه‌های دیگه" className={ICON_BADGE} />
                  </span>
                  بیشتر
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/*===== More Sheet =====*/}
      {overflowing && (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="gap-3 rounded-t-4xl border-foreground/15 paper-grain px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:hidden"
          >
            <div className="flex items-center justify-between gap-3 ps-2">
              <SheetTitle className={cn(DISPLAY_HEADING, "text-xl")}>صفحه‌های دیگه</SheetTitle>
              <SheetClose
                aria-label="بستن"
                className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <XIcon aria-hidden strokeWidth={1.7} className="size-5" />
              </SheetClose>
            </div>

            <ul className="flex flex-col gap-1">
              {more.map((item, index) => (
                <li
                  key={item.to}
                  // The first setup page after a daily one starts a new group, past the tear.
                  className={cn(
                    index > 0 && item.group !== more[index - 1]?.group && `mt-2 border-t pt-3 ${ADMIN_TEAR}`,
                  )}
                >
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "relative flex h-12 items-center gap-3 rounded-full ps-5 pe-4 text-sm font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        // The sheet is `popover` grey, so its raised pill is one step up (`muted`), not the rail's `card`.
                        isActive
                          ? "bg-muted paper-grain text-foreground shadow-[var(--elevation-sm)]"
                          : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
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
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

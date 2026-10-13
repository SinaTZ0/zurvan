import { cn } from "cn";
import { useMatches } from "react-router";

import { NavLink } from "~/components/nav-link";
import { NavBadge } from "~/components/nav-badge";
import { BOTTOM_TABS_FROM, type DeskNavItem } from "~/routes/layout_account/account-nav";

/*===== Bottom Tabs =====*/
// Phones, from three sections on (docs/customer-area-design.md, "Shell"): the sections sit in a bar at the bottom of
// the screen, where a thumb reaches them, instead of in the person menu.

/**
 * A route that is a focused step, with its own fixed action bar (booking, checkout), sets this in its `handle`, and
 * the tabs step aside so the two bars never stack.
 */
export type DeskRouteHandle = { hideBottomTabs?: boolean };

function isDeskRouteHandle(handle: unknown): handle is DeskRouteHandle {
  return typeof handle === "object" && handle !== null && "hideBottomTabs" in handle;
}

/**
 * The phone's bottom tab bar, and a spacer in the page flow so the last content scrolls clear of it. Renders nothing
 * on wider screens, with fewer sections than `BOTTOM_TABS_FROM`, or on a focused step.
 */
export function BottomTabs({ items, label }: { items: readonly DeskNavItem[]; label: string }) {
  const hidden = useMatches().some((match) => isDeskRouteHandle(match.handle) && match.handle.hideBottomTabs);
  if (items.length < BOTTOM_TABS_FROM || hidden) return null;

  return (
    <>
      <div aria-hidden className="h-16 lg:hidden" />
      <nav
        aria-label={label}
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
                    "relative flex flex-1 items-center justify-center text-sm font-bold transition-colors",
                    // The mark sits on the bar's top edge, the mirror of the header tabs' underline.
                    "before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:rounded-full before:bg-primary before:opacity-0 before:transition-opacity",
                    isActive ? "text-foreground before:opacity-100" : "text-muted-foreground",
                  )
                }
              >
                {item.label}
                <NavBadge count={item.badge} label={item.badgeLabel} />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

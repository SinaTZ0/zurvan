import { useMatches } from "@tanstack/react-router";

import { NavLink } from "~/components/nav-link";
import type { DeskExitLink, DeskNavItem } from "~/routes/layout_account/account-nav";
import { CountBadge } from "~/routes/layout_account/components/count-badge";

/*===== Account Tab Bar =====*/
// The storefront's floating bar (held off the edges, the card's grey with a hairline, icons over 11px labels, the
// current tab's icon gold), with the account's own tabs: the sections and the way back into the store. Its height
// plus the gap is what the footer leaves free at the bottom (`--tab-bar-space`, app.css).
const TAB =
  "group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] leading-none text-foreground/70 transition-colors motion-reduce:transition-none hover:text-foreground aria-[current=page]:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

const ICON =
  "size-[1.375rem] transition-colors duration-300 motion-reduce:transition-none group-aria-[current=page]:text-primary";

/**
 * The phone's tab bar, below `lg`: the sections (with the cart's count) and «دوره‌ها». Nothing on a focused step: a
 * route with its own fixed action bar (booking, checkout) sets `staticData: { hideBottomTabs: true }`, and the tab bar
 * steps aside so the two bars never stack.
 */
export function AccountTabBar({
  items,
  exitLink,
  label,
}: {
  items: readonly DeskNavItem[];
  exitLink: DeskExitLink;
  /** The nav landmark's name, e.g. «حساب من». */
  label: string;
}) {
  const hidden = useMatches({ select: (matches) => matches.some((match) => match.staticData.hideBottomTabs) });
  if (hidden) return null;
  // The exit link has the same shape as a section minus the optional parts.
  const tabs: readonly DeskNavItem[] = [...items, exitLink];

  return (
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md [view-transition-name:tab-dock] lg:hidden">
      <nav aria-label={`${label}، منوی پایین`}>
        <ul className="flex h-[4.25rem] items-stretch rounded-[1.6rem] border border-foreground/15 bg-card/90 px-1.5 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.8)] backdrop-blur-md">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="flex flex-1">
                <NavLink to={item.to} end={item.end} className={TAB}>
                  <span className="relative">
                    <Icon aria-hidden className={ICON} strokeWidth={1.8} />
                    <CountBadge
                      count={item.badge}
                      label={item.badgeLabel}
                      className="absolute -end-3 -top-2 h-4 min-w-4 px-1 text-[10px]"
                    />
                  </span>
                  {item.short ?? item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

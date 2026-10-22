import { cn } from "cn";

import { NavLink } from "~/components/nav-link";
import type { DeskNavItem } from "~/routes/layout_account/account-nav";
import { CountBadge } from "~/routes/layout_account/components/count-badge";

/*===== Account Tabs =====*/
/** Desktop: the desk's sections as the storefront header's links, the current page with the gold underline. */
export function AccountTabs({
  items,
  label,
  className,
}: {
  items: readonly DeskNavItem[];
  /** The nav landmark's name, e.g. «حساب من». */
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex items-center gap-7">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={cn(
                "inline-flex items-center rounded px-1 py-1 text-[15px] text-foreground/85 decoration-primary decoration-2 underline-offset-8 transition-colors hover:text-foreground hover:underline aria-[current=page]:text-foreground aria-[current=page]:underline",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
              )}
            >
              {item.label}
              {/* The underline would run under the badge; its own span keeps the line to the label. */}
              <CountBadge count={item.badge} className="ms-1.5 no-underline" />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

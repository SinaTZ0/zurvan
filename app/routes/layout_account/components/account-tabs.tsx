import { cn } from "cn";

import { NavLink } from "~/components/nav-link";
import { ACCOUNT_NAV_ITEMS } from "~/routes/layout_account/account-nav";

/*===== Account Tabs =====*/
/** Desktop: the account's sections in the header. The current one is ivory with a flat-gold underline. */
export function AccountTabs({ className }: { className?: string }) {
  return (
    <nav aria-label="حساب من" className={className}>
      <ul className="flex h-full items-stretch gap-1">
        {ACCOUNT_NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center rounded-sm px-3 text-sm font-bold transition-colors focus-visible:text-foreground",
                  // The underline sits on the header's bottom edge, so the tab reads as attached to the page below.
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity",
                  isActive ? "text-foreground after:opacity-100" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

import { Outlet, useMatches } from "react-router";

import { CartSync } from "~/components/cart-sync";
import { requireSession, sessionContext } from "~/lib/session-guard.server";
import { ACCOUNT_EXIT_LINK, ROOM_LABEL } from "~/routes/layout_account/account-nav";
import { AccountFooter } from "~/routes/layout_account/components/account-footer";
import { AccountHeader } from "~/routes/layout_account/components/account-header";
import { AccountTabBar } from "~/routes/layout_account/components/account-tab-bar";
import { useAccountNavItems } from "~/routes/layout_account/hooks/use-account-nav-items";

import type { Route } from "./+types/layout-account";

/*===== Guard =====*/
// Signed in as a customer or a partner. The Admin has his own area (docs/app-spec.md, Pages).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer", "partner"] })];

/*===== Loader =====*/
export function loader({ context }: Route.LoaderArgs) {
  const user = context.get(sessionContext);
  return {
    firstName: user.firstName,
    phoneNumber: user.phoneNumber,
    role: user.role === "partner" ? "partner" : "customer",
  } as const;
}

/*===== Account Layout =====*/
/**
 * A page's `handle` for this shell. `flushFooter` drops the gap above the footer, for a page whose last band runs into
 * it (the Dashboard's and Dog Detail's closing brick bands). `hideBottomTabs` is `DeskRouteHandle`'s, for focused steps.
 */
export type AccountLayoutHandle = { flushFooter?: boolean };

/**
 * The signed-in shell for customers and partners at `/account`: the storefront's house with the account's own room.
 * The header and the floating tab bar (below `lg`) are the storefront's look with the desk's sections; the footer is a
 * short grained band with the dog on the phone. The wrapper clips sideways so cut-outs and bubbles may poke past the
 * container.
 */
export default function AccountLayout({ loaderData }: Route.ComponentProps) {
  const navItems = useAccountNavItems(loaderData.role);
  const flushFooter = useMatches().some((match) => (match.handle as AccountLayoutHandle | undefined)?.flushFooter);
  const roomLabel = ROOM_LABEL[loaderData.role];

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      {loaderData.role === "customer" && <CartSync />}
      <AccountHeader
        firstName={loaderData.firstName}
        phoneNumber={loaderData.phoneNumber}
        roomLabel={roomLabel}
        navItems={navItems}
        exitLink={ACCOUNT_EXIT_LINK}
      />
      <main id="main" className={flushFooter ? "flex-1" : "flex-1 pb-section-md"}>
        <Outlet />
      </main>
      <AccountFooter />
      <AccountTabBar items={navItems} exitLink={ACCOUNT_EXIT_LINK} label={roomLabel} />
    </div>
  );
}

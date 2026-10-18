import { Outlet } from "react-router";

import { CartSync } from "~/components/cart-sync";
import { requireSession, sessionContext } from "~/lib/session-guard.server";
import { ACCOUNT_EXIT_LINK } from "~/routes/layout_account/account-nav";
import { AccountFooter } from "~/routes/layout_account/components/account-footer";
import { AccountHeader } from "~/routes/layout_account/components/account-header";
import { BottomTabs } from "~/routes/layout_account/components/bottom-tabs";
import { useAccountNavItems } from "~/routes/layout_account/hooks/use-account-nav-items";

import type { Route } from "./+types/layout-account";

/*===== Guard =====*/
// Signed in as a customer or a partner. The Admin has his own area (docs/app-spec.md, Pages).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer", "partner"] })];

/*===== Loader =====*/
export function loader({ context }: Route.LoaderArgs) {
  const { user } = context.get(sessionContext);
  // The guard only lets named accounts through, so `firstName` is set.
  return {
    firstName: user.firstName ?? "",
    phoneNumber: user.phoneNumber ?? null,
    role: user.role === "partner" ? "partner" : "customer",
  } as const;
}

/*===== Account Layout =====*/
/** The signed-in shell for customers and partners at `/account`. */
export default function AccountLayout({ loaderData }: Route.ComponentProps) {
  const navItems = useAccountNavItems(loaderData.role);

  return (
    <div className="flex min-h-svh flex-col">
      {loaderData.role === "customer" && <CartSync />}
      <AccountHeader
        firstName={loaderData.firstName}
        phoneNumber={loaderData.phoneNumber}
        navItems={navItems}
        navLabel="حساب من"
        exitLink={ACCOUNT_EXIT_LINK}
      />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <AccountFooter />
      <BottomTabs items={navItems} label="حساب من" />
    </div>
  );
}

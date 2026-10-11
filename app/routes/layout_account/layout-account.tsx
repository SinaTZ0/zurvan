import { Outlet } from "react-router";

import { requireSession, sessionContext } from "~/lib/session-guard.server";
import { ACCOUNT_EXIT_LINK, ACCOUNT_NAV_ITEMS } from "~/routes/layout_account/account-nav";
import { AccountFooter } from "~/routes/layout_account/components/account-footer";
import { AccountHeader } from "~/routes/layout_account/components/account-header";

import type { Route } from "./+types/layout-account";

/*===== Guard =====*/
// Signed in, any role but Admin (docs/foundations-plan.md, "Layouts and guards"). The Admin has his own panel.
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer", "trainer", "partner"] })];

/*===== Loader =====*/
export function loader({ context }: Route.LoaderArgs) {
  const { user } = context.get(sessionContext);
  // The guard only lets named accounts through, so `firstName` is set.
  return { firstName: user.firstName ?? "", phoneNumber: user.phoneNumber ?? null };
}

/*===== Account Layout =====*/
/** The signed-in shell for customers, trainers and partners at `/account` (docs/customer-area-design.md). */
export default function AccountLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <AccountHeader
        firstName={loaderData.firstName}
        phoneNumber={loaderData.phoneNumber}
        navItems={ACCOUNT_NAV_ITEMS}
        navLabel="حساب من"
        exitLink={ACCOUNT_EXIT_LINK}
      />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <AccountFooter />
    </div>
  );
}

import { Outlet } from "react-router";

import { requireSession, sessionContext } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { ADMIN_NAV_ITEMS, type AdminNavItem } from "~/routes/layout_admin/admin-nav";
import { AdminBottomTabs } from "~/routes/layout_admin/components/admin-bottom-tabs";
import { AdminHeader } from "~/routes/layout_admin/components/admin-header";
import { AdminRail } from "~/routes/layout_admin/components/admin-rail";
import { ShellMotion } from "~/routes/layout_admin/components/shell-motion";

import type { Route } from "./+types/layout-admin";

/*===== Guard =====*/
// The Admin is the head trainer, the only staff account (docs/app-spec.md, Roles). Customers and partners are sent to
// their own home; visitors to sign in. The oRPC `admin` procedures check the role again.
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["admin"] })];

/*===== Meta =====*/
// A private area: keep it out of search results.
export const meta: Route.MetaFunction = () => [{ name: "robots", content: "noindex" }];

/*===== Loader =====*/
export async function loader({ request, context }: Route.LoaderArgs) {
  const user = context.get(sessionContext);
  // The counts on the rail: the three kinds of work that wait for him (F11, "Waiting for him"), read from the Overview's
  // one call. Reloaded with every revalidation, so a count drops (and its badge pops) as soon as he answers.
  const { waiting, money } = await createServerClient(request).dashboard.admin.overview();

  return {
    firstName: user.firstName,
    phoneNumber: user.phoneNumber,
    counts: {
      evaluationRequests: waiting.evaluationRequests,
      paidNotEnrolled: waiting.paidNotEnrolled.count,
      unpaidCommissions: money.unpaidCommissions.count,
    },
  };
}

/*===== Admin Layout =====*/
/** The Admin's shell at `/admin`: a top bar, a rail on desktop, a floating tab bar on phones, and the page in between. */
export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const { counts } = loaderData;
  // The counts come from the server, so they are put on the items here and not in the static list. Each says on a
  // screen reader what it counts.
  const badges: Record<string, Pick<AdminNavItem, "badge" | "badgeLabel">> = {
    "/admin/evaluations": { badge: counts.evaluationRequests, badgeLabel: "درخواست منتظر جواب" },
    "/admin/payments": { badge: counts.paidNotEnrolled, badgeLabel: "خرید ثبت‌نام‌نشده" },
    "/admin/partners": { badge: counts.unpaidCommissions, badgeLabel: "پورسانت پرداخت‌نشده" },
  };
  const navItems = ADMIN_NAV_ITEMS.map((item) => ({ ...item, ...badges[item.to] }));

  return (
    <div className="flex min-h-svh flex-col">
      <ShellMotion />
      <AdminHeader firstName={loaderData.firstName} phoneNumber={loaderData.phoneNumber} />
      <div className="flex flex-1">
        <AdminRail items={navItems} />
        <main id="main" className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
      <AdminBottomTabs items={navItems} />
    </div>
  );
}

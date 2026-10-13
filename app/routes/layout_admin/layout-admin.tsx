import { Outlet } from "react-router";

import { requireSession, sessionContext } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { ADMIN_EVALUATIONS_PATH, ADMIN_NAV_ITEMS } from "~/routes/layout_admin/admin-nav";
import { AdminBottomTabs } from "~/routes/layout_admin/components/admin-bottom-tabs";
import { AdminHeader } from "~/routes/layout_admin/components/admin-header";
import { AdminRail } from "~/routes/layout_admin/components/admin-rail";

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
  const { user } = context.get(sessionContext);
  // The count on the Evaluations tab: requests waiting for his answer (F11, "Waiting for him"). Reloaded with every
  // revalidation, so it drops as soon as he answers one.
  const waiting = await createServerClient(request).evaluation.admin.list({ status: "requested" });

  return {
    // The guard only lets named accounts through, so `firstName` is set.
    firstName: user.firstName ?? "",
    phoneNumber: user.phoneNumber ?? null,
    waitingEvaluations: waiting.length,
  };
}

/*===== Admin Layout =====*/
/** The Admin's shell at `/admin`: a top bar, a rail on desktop, bottom tabs on phones, and the page in between. */
export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  // The count comes from the server, so the items are built here and not in the static list.
  const navItems = ADMIN_NAV_ITEMS.map((item) =>
    item.to === ADMIN_EVALUATIONS_PATH ? { ...item, badge: loaderData.waitingEvaluations } : item,
  );

  return (
    <div className="flex min-h-svh flex-col">
      <AdminHeader firstName={loaderData.firstName} phoneNumber={loaderData.phoneNumber} />
      <div className="flex flex-1">
        <AdminRail items={navItems} />
        <main id="main" className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <AdminBottomTabs items={navItems} />
    </div>
  );
}

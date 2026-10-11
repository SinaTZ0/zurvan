import { Outlet } from "react-router";

import { requireSession, sessionContext } from "~/lib/session-guard.server";
import { AccountFooter } from "~/routes/layout_account/components/account-footer";
import { AccountHeader } from "~/routes/layout_account/components/account-header";
import { TRAINER_EXIT_LINK, TRAINER_NAV_ITEMS } from "~/routes/layout_trainer/trainer-nav";

import type { Route } from "./+types/layout-trainer";

/*===== Guard =====*/
// The spec's rule is "has a Trainer Profile" (a Trainer, or the Admin as head trainer). Until that entity exists the
// role stands in for it. The API checks the role again on every procedure.
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["trainer", "admin"] })];

/*===== Loader =====*/
export function loader({ context }: Route.LoaderArgs) {
  const { user } = context.get(sessionContext);
  // The guard only lets named accounts through, so `firstName` is set.
  return {
    firstName: user.firstName ?? "",
    phoneNumber: user.phoneNumber ?? null,
    isHeadTrainer: user.role === "admin",
  };
}

/*===== Trainer Layout =====*/
/** The trainer's desk at `/trainer`: the account shell's header and footer with the trainer's own sections. */
export default function TrainerLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <AccountHeader
        firstName={loaderData.firstName}
        phoneNumber={loaderData.phoneNumber}
        // The Admin is the head trainer; a trainer is plain «مربی».
        roleLabel={loaderData.isHeadTrainer ? "مربی ارشد" : "مربی"}
        navItems={TRAINER_NAV_ITEMS}
        navLabel="میز مربی"
        exitLink={TRAINER_EXIT_LINK}
      />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <AccountFooter />
    </div>
  );
}

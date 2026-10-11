import { Outlet } from "react-router";

import { requireSession, sessionContext } from "~/lib/session-guard.server";

import type { Route } from "./+types/layout-account";

/*===== Guard =====*/
// Signed in, any role but Admin (docs/foundations-plan.md, "Layouts and guards"). The Admin has his own panel.
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer", "trainer", "partner"] })];

/*===== Loader =====*/
export function loader({ context }: Route.LoaderArgs) {
  const { user } = context.get(sessionContext);
  return { firstName: user.firstName, role: user.role };
}

/*===== Account Layout =====*/
/** The signed-in shell for customers, trainers and partners at `/account`. */
export default function AccountLayout() {
  return <Outlet />;
}

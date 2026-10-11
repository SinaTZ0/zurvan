import { redirect } from "react-router";

import { sessionContext } from "~/lib/session-guard.server";

import type { Route } from "./+types/account-home";

/*===== Loader =====*/
// `/account` is where everyone lands after signing in. Until the Customer Dashboard exists, customers go straight to
// their dogs, and trainers and partners, whose panels aren't built yet, go back to the storefront.
export function loader({ context }: Route.LoaderArgs) {
  const { user } = context.get(sessionContext);
  throw redirect(user.role === "customer" ? "/pets" : "/");
}

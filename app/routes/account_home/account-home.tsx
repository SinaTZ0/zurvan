import { redirect } from "react-router";

import { roleHomePath, sessionContext } from "~/lib/session-guard.server";

import type { Route } from "./+types/account-home";

/*===== Loader =====*/
// `/account` is where everyone lands after signing in. Until the Customer Dashboard exists, customers go straight to
// their dogs (`/account/dogs`); trainers go to the trainer area and partners, whose panel isn't built yet, back to the
// storefront (see `roleHomePath`).
export function loader({ context }: Route.LoaderArgs) {
  const { user } = context.get(sessionContext);
  throw redirect(user.role === "customer" ? "/account/dogs" : roleHomePath(user.role));
}

import { authForHeaders } from "~/lib/auth.server";

import type { Route } from "./+types/api-auth";

/*===== Better-Auth Endpoints =====*/
// Resource route (no default export): Better-Auth answers every `/api/auth/*` request itself.

export function loader({ request }: Route.LoaderArgs) {
  return authForHeaders(request.headers).handler(request);
}

export function action({ request }: Route.ActionArgs) {
  return authForHeaders(request.headers).handler(request);
}

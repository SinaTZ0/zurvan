import type { QueryClient } from "@tanstack/react-query";
import { type ParsedLocation, redirect } from "@tanstack/react-router";

import { roleHomePath } from "~/lib/role-home";
import type { UserRole } from "~/lib/user-constants";
import { orpc } from "~/orpc/client";
import type { SessionUser } from "~/orpc/session/contract";

/*===== Guard =====*/
/**
 * The page guard for a guarded layout or page, called from its `beforeLoad` (docs/app-spec.md, Roles). Whatever it
 * returns lands in the route context, so the pages below read `context.user` instead of asking for the session again.
 *
 * - Signed out, or a new account that hasn't given its name yet: redirect to `/auth?redirectTo=<this page>`. The
 *   sign-in page asks for the name and then sends them back.
 * - Blocked: `session.get` revokes the account's sessions and answers `anonymous`, so they are sent to sign in, where a
 *   blocked number gets no code.
 * - A role outside `roles`: redirect to that role's own home.
 *
 * It runs on the server for the first request and in the browser on navigations and preloads, so the answer is read
 * through the query cache: a preload doesn't ask again. Signing in and out drop that cached answer
 * (`forgetSession`). The UI guard is never the only check: oRPC procedures check the role again
 * (`requireRoleMiddleware`).
 *
 * @throws A redirect, as above.
 */
export async function requireSession({
  queryClient,
  location,
  roles,
}: {
  queryClient: QueryClient;
  location: ParsedLocation;
  roles: readonly UserRole[];
}): Promise<{ user: SessionUser }> {
  const session = await queryClient.ensureQueryData(orpc.session.get.queryOptions());

  // The page they asked for, query string included.
  if (session.status !== "active") throw redirect({ to: "/auth", search: { redirectTo: location.href } });
  if (!roles.includes(session.user.role)) throw redirect({ to: roleHomePath(session.user.role) });

  return { user: session.user };
}

/*===== Session Cache =====*/
/**
 * Drops the cached session answer, so the next guard or header asks the server. Call it whenever the session changes
 * in this tab: after signing in, after signing out, after giving a name.
 */
export function forgetSession(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: orpc.session.get.key() });
}

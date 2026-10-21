import { createContext, redirect, type MiddlewareFunction } from "react-router";

import { roleHomePath } from "~/lib/role-home";
import type { UserRole } from "~/lib/user-constants";
import type { SessionUser } from "~/orpc/session/contract";
import { createServerClient } from "~/orpc/server-client.server";

/*===== Session Context =====*/
/**
 * The signed-in person, set by `requireSession` on a guarded layout. Every loader and action below that layout reads
 * it with `context.get(sessionContext)` instead of fetching the session again. Always named: the guard sends anyone
 * without a name to sign in.
 */
export const sessionContext = createContext<SessionUser>();

/*===== Guard =====*/
/**
 * Route middleware for a guarded layout (docs/app-spec.md, Roles). Asks `session.get` once and puts the person in the
 * router context for every child loader and action.
 *
 * - Signed out, or a new account that hasn't given its name yet: redirect to `/auth?redirectTo=<this page>`. The
 *   sign-in page asks for the name and then sends them back.
 * - Blocked: `session.get` revokes the account's sessions and answers `anonymous`, so they are sent to sign in, where a
 *   blocked number gets no code.
 * - A role outside `roles`: redirect to that role's own home.
 *
 * The UI guard is never the only check: oRPC procedures check the role again (`requireRoleMiddleware`).
 */
export function requireSession({ roles }: { roles: readonly UserRole[] }): MiddlewareFunction<Response> {
  return async ({ request, context }) => {
    const session = await createServerClient(request).session.get();

    if (session.status !== "active") throw signInRedirect(request);

    const { user } = session;
    if (!roles.includes(user.role)) throw redirect(roleHomePath(user.role));

    context.set(sessionContext, user);
  };
}

/** Sends the visitor to sign in and back to the page they asked for, query string included. */
function signInRedirect(request: Request) {
  const url = new URL(request.url);
  // Client navigations fetch `<path>.data` (`/_.data` for the root); the page itself is what they asked for. Mirrors
  // React Router's `getNormalizedPath`, which isn't exported.
  const pathname = url.pathname.endsWith("/_.data")
    ? url.pathname.slice(0, -"_.data".length)
    : url.pathname.replace(/\.data$/, "");
  url.searchParams.delete("_routes");
  const search = url.searchParams.size ? `?${url.searchParams}` : "";
  return redirect(`/auth?redirectTo=${encodeURIComponent(pathname + search)}`);
}

import { ORPCError, os } from "@orpc/server";

import { auth } from "~/lib/auth.server";

/*===== Require User =====*/
/**
 * Resolves the Better-Auth session from the request cookies and exposes the signed-in user as
 * `context.user`.
 *
 * @throws `UNAUTHORIZED` (see `auth.errors.ts`) when there is no valid session.
 */
export const requireUserMiddleware = os.$context<{ headers: Headers }>().middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });

  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Sign in to continue.",
      data: { errors: [], fields: {} },
    });
  }

  return next({ context: { user: session.user } });
});

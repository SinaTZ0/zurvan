import { ORPCError } from "@orpc/server";

import { auth, authForHeaders } from "~/lib/auth.server";
import { base } from "~/orpc/implementer.server";
import { requireUserMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";
import { getPasswordStatus, setPassword } from "~/orpc/password/service";

/*===== Status =====*/
export const passwordStatusProcedure = base.password.status
  .use(requireUserMiddleware)
  .use(provideDbMiddleware)
  .handler(({ context }) => getPasswordStatus({ db: context.db, userId: context.user.id }));

/*===== Set or Replace =====*/
// The service needs the session's age and token (a password can be set only soon after signing in), which the auth
// middleware doesn't carry, so the session is read once more here. The hash is made by Better-Auth's own hasher.
export const setPasswordProcedure = base.password.set
  .use(requireUserMiddleware)
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const current = await authForHeaders(context.headers).api.getSession({ headers: context.headers });
    if (!current)
      throw new ORPCError("UNAUTHORIZED", { message: "Sign in to continue.", data: { errors: [], fields: {} } });

    const authContext = await auth.$context;
    const result = await setPassword({
      db: context.db,
      userId: context.user.id,
      phoneNumber: context.user.phoneNumber ?? null,
      newPassword: input.newPassword,
      sessionToken: current.session.token,
      sessionCreatedAt: current.session.createdAt,
      hash: (password) => authContext.password.hash(password),
    });

    if (result.kind === "invalid") throw errors.INVALID_INPUT({ data: { errors: [], fields: result.fields } });
    if (result.kind === "session-too-old") throw errors.SESSION_TOO_OLD({ data: { errors: [], fields: {} } });
    return { replaced: result.replaced };
  });

import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";
import { adminListUsers, setUserStatus, updateUser } from "~/orpc/user/service";

/*===== Admin =====*/
// The caller's id goes to the service so `isSelf` and the "can't block yourself" rule know who is asking.
export const adminListUsersProcedure = base.user.admin.list
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(({ context }) => adminListUsers({ db: context.db, callerId: context.user.id }));

export const adminUpdateUserProcedure = base.user.admin.update
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...names } = input;
    const result = await updateUser({ db: context.db, callerId: context.user.id, id, input: names });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.user;
  });

export const adminSetUserStatusProcedure = base.user.admin.setStatus
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await setUserStatus({
      db: context.db,
      callerId: context.user.id,
      id: input.id,
      status: input.status,
    });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.user;
  });

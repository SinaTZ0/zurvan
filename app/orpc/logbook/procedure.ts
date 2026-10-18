import { base } from "~/orpc/implementer.server";
import {
  adminAddEntry,
  adminListDogLogbook,
  adminUpdateEntry,
  listDogLogbook,
  locateDog,
} from "~/orpc/logbook/service";
import { requireRoleMiddleware, requireUserMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";
import type { UserRole } from "~/lib/user-constants";

/*===== Locate =====*/
export const locateDogProcedure = base.logbook.locate
  .use(requireUserMiddleware)
  .use(provideDbMiddleware)
  .handler(({ context, input }) =>
    locateDog({
      db: context.db,
      user: { id: context.user.id, role: context.user.role as UserRole },
      fileNumber: input.fileNumber,
    }),
  );

/*===== Owner =====*/
// The owner's diary is scoped to the signed-in owner's own dogs.
export const listLogbookProcedure = base.logbook.list
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await listDogLogbook({ db: context.db, ownerId: context.user.id, dogId: input.dogId });
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    return result.entries;
  });

/*===== Admin =====*/
export const adminListLogbookProcedure = base.logbook.admin.list
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminListDogLogbook({ db: context.db, dogId: input.dogId });
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    return result.entries;
  });

export const adminAddEntryProcedure = base.logbook.admin.add
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminAddEntry({ db: context.db, authorId: context.user.id, input });
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid")
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    return result.entry;
  });

export const adminUpdateEntryProcedure = base.logbook.admin.update
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminUpdateEntry({ db: context.db, input });
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid")
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    return result.entry;
  });

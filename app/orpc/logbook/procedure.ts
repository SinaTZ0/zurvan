import { base } from "~/orpc/implementer.server";
import { locateDog } from "~/orpc/logbook/service";
import { requireUserMiddleware } from "~/orpc/middleware/auth/auth.middleware";
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

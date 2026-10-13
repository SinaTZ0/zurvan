import { overview } from "~/orpc/dashboard/service";
import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";

/*===== Admin =====*/
export const adminOverviewProcedure = base.dashboard.admin.overview
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(({ context }) => overview({ db: context.db }));

import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";
import { listSms } from "~/orpc/sms/service";

/*===== Admin =====*/
export const adminListSmsProcedure = base.sms.admin.list
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(({ context, input }) => listSms({ db: context.db, kind: input.kind, page: input.page }));

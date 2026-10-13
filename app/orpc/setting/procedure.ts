import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";
import { adminGetSettings, getCommissionPercent, updateSetting } from "~/orpc/setting/service";

/*===== Public =====*/
// No auth, like `course.list`: the Partner Enquiry page shows the percent to visitors.
export const commissionPercentProcedure = base.setting.commissionPercent
  .use(provideDbMiddleware)
  .handler(({ context }) => getCommissionPercent({ db: context.db }));

/*===== Admin =====*/
export const adminGetSettingsProcedure = base.setting.admin.get
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(({ context }) => adminGetSettings({ db: context.db }));

export const adminUpdateSettingProcedure = base.setting.admin.update
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await updateSetting({ db: context.db, key: input.key, value: input.value });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: [], fields: result.fields } });
    }

    return result.setting;
  });

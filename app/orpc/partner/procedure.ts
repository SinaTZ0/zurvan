import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";
import { getPartnerProfile, updatePartnerProfile } from "~/orpc/partner/service";

// Both procedures are for partners and only ever touch the signed-in partner's own row.

/*===== Get =====*/
export const getMyPartnerProfileProcedure = base.partner.getMine
  .use(requireRoleMiddleware("partner"))
  .use(provideDbMiddleware)
  .handler(async ({ context, errors }) => {
    const result = await getPartnerProfile({ db: context.db, userId: context.user.id });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.profile;
  });

/*===== Update =====*/
export const updateMyPartnerProfileProcedure = base.partner.updateMine
  .use(requireRoleMiddleware("partner"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await updatePartnerProfile({ db: context.db, userId: context.user.id, input });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.profile;
  });

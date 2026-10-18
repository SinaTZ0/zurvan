import { acceptSiteRules, getConsentStatus } from "~/orpc/consent/service";
import { base } from "~/orpc/implementer.server";
import { requireUserMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";

// A person's own consent, nobody else's: every call is scoped to the signed-in user.

/*===== Status =====*/
export const consentStatusProcedure = base.consent.status
  .use(requireUserMiddleware)
  .use(provideDbMiddleware)
  .handler(({ context }) => getConsentStatus({ db: context.db, userId: context.user.id }));

/*===== Accept =====*/
export const acceptSiteRulesProcedure = base.consent.acceptSiteRules
  .use(requireUserMiddleware)
  .use(provideDbMiddleware)
  .handler(async ({ context, errors }) => {
    const result = await acceptSiteRules({ db: context.db, userId: context.user.id });
    if (result.kind === "not-published") throw errors.NOT_PUBLISHED({ data: { errors: [], fields: {} } });
    return { version: result.version };
  });

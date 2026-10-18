import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/**
 * Where the signed-in person stands on the site rules. `siteRules` is null while no rules are published (nothing to
 * accept); otherwise the current version and whether this person has accepted exactly that version.
 */
export const consentStatusSchema = z.object({
  siteRules: z.object({ version: z.string(), accepted: z.boolean() }).nullable(),
});

export type ConsentStatus = z.infer<typeof consentStatusSchema>;

/*===== Errors =====*/
/** Accepting rules that are not published: there is nothing to accept, so nothing is recorded. */
const notPublishedError = {
  NOT_PUBLISHED: {
    message: "There are no site rules to accept.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors };

/*===== Procedures =====*/
export const consentStatusContract = oc.errors(baseErrors).output(consentStatusSchema);

/**
 * Records that the signed-in person accepted the site rules **as published now**. The browser sends no version: the
 * server records the current one, so nobody can accept text that isn't published or an old version by mistake. Accepting
 * again is the same as accepting once.
 */
export const acceptSiteRulesContract = oc
  .errors({ ...baseErrors, ...notPublishedError })
  .output(z.object({ version: z.string() }));

export const consentContract = {
  status: consentStatusContract,
  acceptSiteRules: acceptSiteRulesContract,
};

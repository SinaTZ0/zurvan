import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";
import { SETTING_KEYS } from "~/orpc/setting/constants";

/*===== Schemas =====*/
export const adminSettingSchema = z.object({
  key: z.enum(SETTING_KEYS),
  /** The value in force: the stored one, else the default. */
  value: z.number().int(),
  defaultValue: z.number().int(),
  min: z.number().int(),
  max: z.number().int(),
  /** Null until the Admin first saves it. */
  updatedAt: z.date().nullable(),
});

export type AdminSetting = z.infer<typeof adminSettingSchema>;

/** One step of the partner's commission (F7): from the `fromCustomer`-th paying customer on, `percent`. */
export const commissionTierSchema = z.object({
  fromCustomer: z.number().int(),
  percent: z.number().int(),
});

/** The commission steps as the Admin edits them: the ones in force, the default ones, and when they were last saved. */
export const adminCommissionTiersSchema = z.object({
  tiers: z.array(commissionTierSchema),
  defaultTiers: z.array(commissionTierSchema),
  /** Null until the Admin first saves them. */
  updatedAt: z.date().nullable(),
});

export type AdminCommissionTiers = z.infer<typeof adminCommissionTiersSchema>;

/*===== Procedures =====*/
/** The three number settings in `SETTING_KEYS` order. */
export const adminGetSettingsContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors })
  .output(z.array(adminSettingSchema));

/**
 * One setting at a time. A value outside the bounds or not an integer is `INVALID_INPUT` with `fields.value`. Takes
 * effect on the next request; no restart.
 */
export const adminUpdateSettingContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors })
  .input(z.strictObject({ key: z.enum(SETTING_KEYS), value: z.number() }))
  .output(adminSettingSchema);

export const adminGetCommissionTiersContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors })
  .output(adminCommissionTiersSchema);

/**
 * Replaces the whole table. Steps that break the guardrails (`commissionTiersError`) are `INVALID_INPUT` with
 * `fields.tiers`, and nothing is saved. Applies from the next commission; written ones keep their percent.
 */
export const adminUpdateCommissionTiersContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors })
  .input(z.strictObject({ tiers: z.array(z.strictObject({ fromCustomer: z.number(), percent: z.number() })).max(50) }))
  .output(adminCommissionTiersSchema);

/** Public: the Partner Enquiry page shows the steps in force. */
export const commissionTiersContract = oc
  .errors(commonErrors)
  .output(z.object({ tiers: z.array(commissionTierSchema) }));

export const settingContract = {
  commissionTiers: commissionTiersContract,
  admin: {
    get: adminGetSettingsContract,
    update: adminUpdateSettingContract,
    commissionTiers: adminGetCommissionTiersContract,
    updateCommissionTiers: adminUpdateCommissionTiersContract,
  },
};

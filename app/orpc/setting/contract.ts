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

/*===== Procedures =====*/
/** The four settings in `SETTING_KEYS` order. */
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

/** Public: the Partner Enquiry page shows the percent in force. */
export const commissionPercentContract = oc.errors(commonErrors).output(z.object({ percent: z.number().int() }));

export const settingContract = {
  commissionPercent: commissionPercentContract,
  admin: {
    get: adminGetSettingsContract,
    update: adminUpdateSettingContract,
  },
};

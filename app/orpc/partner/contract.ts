import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** A partner's own profile row. Only the Sheba is theirs to edit (F1); the name is the user's (Better-Auth). */
export const partnerProfileSchema = z.object({
  /** Normalized `IR` + 24 digits, or null until the partner has written it. */
  shebaNumber: z.string().nullable(),
});

export type PartnerProfile = z.infer<typeof partnerProfileSchema>;

/*===== Errors =====*/
const notFoundError = {
  // A partner user with no `partner` row.
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
export const getMyPartnerProfileContract = oc.errors({ ...baseErrors, ...notFoundError }).output(partnerProfileSchema);

/**
 * The input is the raw text as typed: the server normalizes it (spaces, Persian digits, case) and checks the format and
 * the checksum. A bad number is `INVALID_INPUT` with the message in `data.fields.shebaNumber`.
 */
export const updateMyPartnerProfileContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(z.strictObject({ shebaNumber: z.string() }))
  .output(partnerProfileSchema);

export const partnerContract = {
  getMine: getMyPartnerProfileContract,
  updateMine: updateMyPartnerProfileContract,
};

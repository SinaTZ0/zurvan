import { oc } from "@orpc/contract";
import { z } from "zod";

import { USER_ROLES, USER_STATUSES } from "~/lib/user-constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** A user as the Admin sees him (F1). */
export const adminUserSchema = z.object({
  id: z.string(),
  /** `"first last"`, always written together with the two parts. */
  name: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().nullable(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
  createdAt: z.date(),
  lastLoginAt: z.date().nullable(),
  /** A customer's dogs; 0 for everyone else. */
  dogCount: z.number().int(),
  /** The signed-in Admin: his own row can't be blocked. */
  isSelf: z.boolean(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

/*===== Errors =====*/
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
/** Every user, newest first. The Admin creates no one here: partners are made on the Partners page. */
export const adminListUsersContract = oc.errors(baseErrors).output(z.array(adminUserSchema));

/**
 * The names as typed. Refusals are `INVALID_INPUT` with `fields.firstName` / `fields.lastName`; a malformed or unknown
 * id is `NOT_FOUND`. Phone and role never change (one role per number, F1).
 */
export const adminUpdateUserContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(z.strictObject({ id: z.string(), firstName: z.string(), lastName: z.string() }))
  .output(adminUserSchema);

/**
 * Idempotent: a reversible switch, not a status that moves forward. Blocking revokes the user's sessions every time,
 * even when he is already blocked. Blocking yourself or any admin is `INVALID_INPUT` with a message in `errors`.
 */
export const adminSetUserStatusContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(z.strictObject({ id: z.string(), status: z.enum(USER_STATUSES) }))
  .output(adminUserSchema);

export const userContract = {
  admin: {
    list: adminListUsersContract,
    update: adminUpdateUserContract,
    setStatus: adminSetUserStatusContract,
  },
};

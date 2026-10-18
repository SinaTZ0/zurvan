import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
export const passwordStatusSchema = z.object({
  /** The signed-in person already has a password, so «ورود با رمز عبور» works for them. */
  hasPassword: z.boolean(),
});

export type PasswordStatus = z.infer<typeof passwordStatusSchema>;

/*===== Errors =====*/
const baseErrors = { ...commonErrors, ...authErrors };

/** A password can only be set or replaced soon after signing in. */
const sessionTooOldError = {
  SESSION_TOO_OLD: {
    message: "Sign in again to change the password.",
    data: errorDataSchema,
  },
};

/*===== Procedures =====*/
/** Whether the signed-in person has a password. Never the hash, never anything about it. */
export const passwordStatusContract = oc.errors(baseErrors).output(passwordStatusSchema);

/**
 * Sets the signed-in person's password, or replaces it. `newPassword` is as typed. Refusals are `INVALID_INPUT` with
 * `fields.newPassword`; a session older than a few minutes is `SESSION_TOO_OLD` (the person signs in again, with a code
 * or the old password, and tries at once). Every other session of the person is signed out.
 */
export const setPasswordContract = oc
  .errors({ ...baseErrors, ...sessionTooOldError })
  .input(z.strictObject({ newPassword: z.string() }))
  .output(z.object({ replaced: z.boolean() }));

export const passwordContract = {
  status: passwordStatusContract,
  set: setPasswordContract,
};

import { oc } from "@orpc/contract";
import { z } from "zod";

import { USER_ROLES } from "~/lib/user-constants";
import { commonErrors } from "~/orpc/errors";

/*===== Schemas =====*/
/**
 * Who is asking, as pages and guards need it:
 * - `anonymous`: no session, or a blocked account (whose sessions are revoked on the way).
 * - `unnamed`: signed in but hasn't given a name yet; the sign-in page asks for it before anything else.
 * - `active`: signed in with a name.
 */
export const sessionStateSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("anonymous") }),
  z.object({
    status: z.literal("unnamed"),
    user: z.object({ id: z.string(), role: z.enum(USER_ROLES), phoneNumber: z.string().nullable() }),
  }),
  z.object({
    status: z.literal("active"),
    user: z.object({
      id: z.string(),
      role: z.enum(USER_ROLES),
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string().nullable(),
    }),
  }),
]);

export type SessionState = z.infer<typeof sessionStateSchema>;

/** The signed-in person a guarded page gets. */
export type SessionUser = Extract<SessionState, { status: "active" }>["user"];

/*===== Procedures =====*/
/** Public: a visitor is `anonymous`, never an error. */
export const getSessionContract = oc.errors(commonErrors).output(sessionStateSchema);

export const sessionContract = {
  get: getSessionContract,
};

import { z } from "zod";

/*===== Shared Error Data =====*/
// Every API error carries this shape so the UI can render any failure the same way: `errors` for
// a form-level message, `fields` for messages next to inputs. Browser-safe.
export const errorDataSchema = z.object({
  errors: z.array(z.string()),
  fields: z.record(z.string(), z.string()),
});

export type ErrorData = z.infer<typeof errorDataSchema>;

/*===== Common Errors =====*/
// Declared on every contract so these stay typed on the client. Built as plain maps (not oRPC's
// `error()` factory) to keep `@orpc/server` out of the browser bundle.
export const commonErrors = {
  INVALID_INPUT: {
    message: "Invalid input.",
    data: errorDataSchema,
  },
  INTERNAL_SERVER_ERROR: {
    message: "Internal server error.",
    // `errorId` correlates the response with the full error in the server logs.
    data: errorDataSchema.extend({ errorId: z.string() }),
  },
};

/*===== HTTP Status =====*/
/** Statuses for codes oRPC doesn't already map (see `COMMON_ERROR_STATUS_MAP`). */
export const ERROR_STATUS_MAP = {
  INVALID_INPUT: 422,
  // The request is fine but contradicts the current state: a dog with a pending evaluation, an evaluation already
  // answered, an enrollment already ended, an item in the cart that can't be bought any more.
  NOT_REQUESTABLE: 409,
  NOT_WITHDRAWABLE: 409,
  NOT_ANSWERABLE: 409,
  NOT_ACTIVE: 409,
  NOT_ELIGIBLE: 409,
  ALREADY_PAID: 409,
  // Site rules are published and the customer has not accepted this version (payment), or none are published (accepting).
  RULES_NOT_ACCEPTED: 409,
  // A certificate is issued only for a completed enrollment.
  NOT_COMPLETED: 409,
  // A refund is for a paid payment, and is answered once.
  NOT_PAID: 409,
  NOT_PENDING: 409,
  NOT_PUBLISHED: 409,
  // The request is fine but the session is too old for a sensitive change: sign in again, then retry.
  SESSION_TOO_OLD: 403,
};

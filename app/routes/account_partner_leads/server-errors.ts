import { ORPCError } from "@orpc/client";
import type { UseFormSetError } from "react-hook-form";

import { HEAD_TRAINER } from "~/lib/head-trainer";
import { errorDataSchema } from "~/orpc/errors";
import { m } from "~/paraglide/messages";
import type { AddLeadFormValues } from "~/routes/account_partner_leads/schema";

/*===== Add Lead =====*/
/**
 * Puts the server's message next to the number (not a number, already has an account, already entered) and anything
 * else in the form-level alert (an inactive account). Never throws: every failure ends as a field error or as `root`.
 */
export function applyAddLeadServerError({
  error,
  setError,
}: {
  error: Error;
  setError: UseFormSetError<AddLeadFormValues>;
}) {
  const code = error instanceof ORPCError ? error.code : null;
  const parsed = error instanceof ORPCError ? errorDataSchema.safeParse(error.data) : null;

  if (code === "INVALID_INPUT" && parsed?.success) {
    const message = parsed.data.fields.phoneNumber;
    if (message) setError("phoneNumber", { message });
    const [general] = parsed.data.errors;
    if (general) setError("root", { message: general });
    if (!message && !general) setError("root", { message: m.account_partner_leads_error_not_saved() });
    return;
  }
  if (code === "UNAUTHORIZED") {
    setError("root", { message: m.account_partner_leads_error_signed_out() });
    return;
  }
  if (code === "FORBIDDEN" || code === "NOT_FOUND") {
    setError("root", {
      message: m.account_partner_leads_error_forbidden({ trainer: HEAD_TRAINER.firstName }),
    });
    return;
  }
  if (code === "INTERNAL_SERVER_ERROR") {
    const errorId = error instanceof ORPCError && typeof error.data?.errorId === "string" ? error.data.errorId : null;
    setError("root", {
      message: errorId
        ? m.account_partner_leads_error_internal_with_id({ errorId })
        : m.account_partner_leads_error_internal(),
    });
    return;
  }
  setError("root", { message: m.account_partner_leads_error_network() });
}

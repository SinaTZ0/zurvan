import { ORPCError } from "@orpc/client";
import type { UseFormSetError } from "react-hook-form";

import { HEAD_TRAINER } from "~/lib/head-trainer";
import { errorDataSchema } from "~/orpc/errors";
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
    if (!message && !general) setError("root", { message: "ثبت نشد. شماره را بررسی کن و دوباره امتحان کن." });
    return;
  }
  if (code === "UNAUTHORIZED") {
    setError("root", { message: "از حسابت خارج شده‌ای. صفحه را تازه کن و دوباره وارد شو." });
    return;
  }
  if (code === "FORBIDDEN" || code === "NOT_FOUND") {
    setError("root", {
      message: `برای این حساب شماره ثبت نمی‌شود. اگر فکر می‌کنی اشتباه است، به ${HEAD_TRAINER.firstName} خبر بده.`,
    });
    return;
  }
  if (code === "INTERNAL_SERVER_ERROR") {
    const errorId = error instanceof ORPCError && typeof error.data?.errorId === "string" ? error.data.errorId : null;
    setError("root", { message: `ثبت نشد. دوباره امتحان کن.${errorId ? ` کد پیگیری: ${errorId}` : ""}` });
    return;
  }
  setError("root", { message: "ثبت نشد. اتصال اینترنتت را بررسی کن و دوباره امتحان کن." });
}

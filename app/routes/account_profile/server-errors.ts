import { ORPCError } from "@orpc/client";
import type { UseFormSetError } from "react-hook-form";

import { errorDataSchema } from "~/orpc/errors";
import type { ShebaFormInput } from "~/routes/account_profile/schema";

/*===== Better-Auth =====*/
/** Why saving the name failed, in words that say what to do next. Better-Auth's own messages are English. */
export function describeNameError(error: { status?: number } | null): string {
  if (error?.status === 401) return "از حسابت خارج شده‌ای. صفحه را تازه کن و دوباره وارد شو.";
  if (error?.status === 429) return "تعداد درخواست‌ها زیاد بود. کمی صبر کن و دوباره امتحان کن.";
  return "ذخیره نشد. اتصال اینترنتت را بررسی کن و دوباره امتحان کن.";
}

/*===== Sheba =====*/
/**
 * Puts the server's message next to the Sheba field and anything else in the form-level alert. Never throws: every
 * failure ends as a field error or as `root`.
 */
export function applyShebaServerError({
  error,
  setError,
}: {
  error: Error;
  setError: UseFormSetError<ShebaFormInput>;
}) {
  const code = error instanceof ORPCError ? error.code : null;
  const parsed = error instanceof ORPCError ? errorDataSchema.safeParse(error.data) : null;

  if (code === "INVALID_INPUT" && parsed?.success) {
    const message = parsed.data.fields.shebaNumber;
    if (message) setError("shebaNumber", { message });
    const [general] = parsed.data.errors;
    if (general) setError("root", { message: general });
    if (!message && !general) setError("root", { message: "ذخیره نشد. شماره‌ی شبا را بررسی کن و دوباره امتحان کن." });
    return;
  }
  if (code === "UNAUTHORIZED") {
    setError("root", { message: "از حسابت خارج شده‌ای. صفحه را تازه کن و دوباره وارد شو." });
    return;
  }
  if (code === "FORBIDDEN" || code === "NOT_FOUND") {
    setError("root", { message: "برای این حساب شبا ثبت نمی‌شود. اگر فکر می‌کنی اشتباه است، به طلا خبر بده." });
    return;
  }
  if (code === "INTERNAL_SERVER_ERROR") {
    const errorId = error instanceof ORPCError && typeof error.data?.errorId === "string" ? error.data.errorId : null;
    setError("root", { message: `ذخیره نشد. دوباره امتحان کن.${errorId ? ` کد پیگیری: ${errorId}` : ""}` });
    return;
  }
  setError("root", { message: "ذخیره نشد. اتصال اینترنتت را بررسی کن و دوباره امتحان کن." });
}

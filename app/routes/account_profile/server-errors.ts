import { ORPCError } from "@orpc/client";
import type { UseFormSetError } from "react-hook-form";

import { HEAD_TRAINER } from "~/lib/head-trainer";
import { errorDataSchema } from "~/orpc/errors";
import type { PasswordFormValues, ShebaFormInput } from "~/routes/account_profile/schema";

/*===== Better-Auth =====*/
/** Why saving the name failed, in words that say what to do next. Better-Auth's own messages are English. */
export function describeNameError(error: { status?: number } | null): string {
  if (error?.status === 401) return "از حسابت خارج شدی. صفحه رو تازه کن و دوباره وارد شو.";
  if (error?.status === 429) return "تعداد درخواست‌ها زیاد بود. یه کم صبر کن و دوباره امتحان کن.";
  return "ذخیره نشد. اینترنتت رو چک کن و دوباره امتحان کن.";
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
    if (!message && !general) setError("root", { message: "ذخیره نشد. شماره‌ی شبا رو چک کن و دوباره امتحان کن." });
    return;
  }
  if (code === "UNAUTHORIZED") {
    setError("root", { message: "از حسابت خارج شدی. صفحه رو تازه کن و دوباره وارد شو." });
    return;
  }
  if (code === "FORBIDDEN" || code === "NOT_FOUND") {
    setError("root", {
      message: `برای این حساب شبا ثبت نمی‌شه. اگه فکر می‌کنی اشتباهه، به ${HEAD_TRAINER.firstName} خبر بده.`,
    });
    return;
  }
  if (code === "INTERNAL_SERVER_ERROR") {
    const errorId = error instanceof ORPCError && typeof error.data?.errorId === "string" ? error.data.errorId : null;
    setError("root", { message: `ذخیره نشد. دوباره امتحان کن.${errorId ? ` کد پیگیری: ${errorId}` : ""}` });
    return;
  }
  setError("root", { message: "ذخیره نشد. اینترنتت رو چک کن و دوباره امتحان کن." });
}

/*===== Password =====*/
/** The code `password.set` answers with when the session is too old to change the password (see `PASSWORD_CHANGE_FRESH_MINUTES`). */
export const SESSION_TOO_OLD_CODE = "SESSION_TOO_OLD";

/**
 * Puts the server's reason next to the new-password field and anything else in the form-level alert. A session that is
 * too old is told apart by `isSessionTooOld` in the form, which offers the way out (sign in again); this only words it.
 */
export function applyPasswordServerError({
  error,
  setError,
}: {
  error: Error;
  setError: UseFormSetError<PasswordFormValues>;
}) {
  const code = error instanceof ORPCError ? error.code : null;
  const parsed = error instanceof ORPCError ? errorDataSchema.safeParse(error.data) : null;

  if (code === "INVALID_INPUT" && parsed?.success) {
    const message = parsed.data.fields.newPassword;
    if (message) setError("newPassword", { message });
    const [general] = parsed.data.errors;
    if (general) setError("root", { message: general });
    if (!message && !general) setError("root", { message: "ذخیره نشد. رمز عبور رو چک کن و دوباره امتحان کن." });
    return;
  }
  if (code === SESSION_TOO_OLD_CODE) {
    setError("root", {
      message:
        "برای امنیت، رمز عبور رو فقط تا نیم ساعت بعد از ورود می‌شه عوض کرد. یه بار از حسابت خارج شو، با کد پیامکی دوباره وارد شو و همون لحظه رمز رو بذار.",
    });
    return;
  }
  if (code === "UNAUTHORIZED") {
    setError("root", { message: "از حسابت خارج شدی. صفحه رو تازه کن و دوباره وارد شو." });
    return;
  }
  if (code === "INTERNAL_SERVER_ERROR") {
    const errorId = error instanceof ORPCError && typeof error.data?.errorId === "string" ? error.data.errorId : null;
    setError("root", { message: `ذخیره نشد. دوباره امتحان کن.${errorId ? ` کد پیگیری: ${errorId}` : ""}` });
    return;
  }
  setError("root", { message: "ذخیره نشد. اینترنتت رو چک کن و دوباره امتحان کن." });
}

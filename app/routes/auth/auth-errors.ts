import { ACCOUNT_BLOCKED_CODE, SIGN_IN_PAUSED_CODE } from "~/lib/user-constants";

/*===== Types =====*/
type AuthErrorLike = { code?: string | undefined; status: number };

/*===== Mapping =====*/
/**
 * Translates a Better-Auth client error from the sign-in steps into a Persian message that says what to do next.
 * Unknown errors become a general message, so the person always sees something actionable.
 */
export function describeAuthError(error: AuthErrorLike): string {
  switch (error.code) {
    case "INVALID_OTP":
      return "کد درست نیست. دوباره نگاهش کن و بنویس.";
    case "OTP_EXPIRED":
    case "OTP_NOT_FOUND":
      return "این کد دیگر معتبر نیست. کد تازه بگیر.";
    case "TOO_MANY_ATTEMPTS":
      return "چند بار کد اشتباه وارد شد. کد تازه بگیر.";
    case "INVALID_PHONE_NUMBER":
      return "شماره موبایل درست نیست. مثال درست: ۰۹۱۲۳۴۵۶۷۸۹";
    case "RESEND_TOO_SOON":
      return "کد قبلی تازه فرستاده شده. یک دقیقه صبر کن و دوباره بخواه.";
    case "TOO_MANY_CODES":
      return "برای این شماره در یک ساعت گذشته کد زیادی فرستاده شده. کمی بعد دوباره امتحان کن.";
    case ACCOUNT_BLOCKED_CODE:
      return "این حساب مسدود شده است. برای پیگیری با آموزش K9 تماس بگیر.";
    case SIGN_IN_PAUSED_CODE:
      return "چند بار رمز اشتباه وارد شد. چند دقیقه صبر کن، یا با کد پیامکی وارد شو.";
  }
  if (error.status === 429) return "تعداد درخواست‌ها زیاد بود. کمی صبر کن و دوباره امتحان کن.";
  // Only the password sign-in answers 401, and it says the same for a wrong password, an unknown number and a number that
  // never set one. The hint covers the last without telling anyone which of the three it was.
  if (error.status === 401) return "شماره یا رمز عبور درست نیست. اگر رمز نگذاشته‌ای، با کد پیامکی وارد شو.";
  return "درخواست انجام نشد. اتصال اینترنت را بررسی کن و دوباره امتحان کن.";
}

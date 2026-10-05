import { CAPTCHA_FAILED_CODE } from "~/lib/auth-constants";

/*===== Types =====*/
type AuthErrorLike = { code?: string | undefined; status: number };

type AuthErrorField = "email" | "password" | "altcha" | "root";

/*===== Mapping =====*/
/**
 * Translates a Better-Auth client error into a Persian message and the form field it belongs to.
 * Unknown errors become a form-level message, so the user always sees something actionable.
 */
export function describeAuthError(error: AuthErrorLike): { field: AuthErrorField; message: string } {
  if (error.status === 429) {
    return { field: "root", message: "تعداد تلاش‌ها زیاد بود. یک دقیقه صبر کنید و دوباره امتحان کنید." };
  }

  switch (error.code) {
    // Deliberately not tied to one field: telling which part is wrong would reveal registered emails.
    case "INVALID_EMAIL_OR_PASSWORD":
      return { field: "root", message: "ایمیل یا رمز عبور درست نیست." };
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return { field: "email", message: "با این ایمیل قبلاً حساب ساخته شده است. از تب «ورود» وارد شوید." };
    case "INVALID_EMAIL":
      return { field: "email", message: "ایمیل معتبر نیست." };
    case "PASSWORD_TOO_SHORT":
      return { field: "password", message: "رمز عبور باید حداقل ۸ کاراکتر باشد." };
    case "PASSWORD_TOO_LONG":
      return { field: "password", message: "رمز عبور حداکثر ۱۲۸ کاراکتر است." };
    case CAPTCHA_FAILED_CODE:
      return { field: "altcha", message: "تأیید امنیتی منقضی شد. لطفاً دوباره تأیید کنید." };
    default:
      return { field: "root", message: "درخواست انجام نشد. اتصال اینترنت را بررسی کنید و دوباره امتحان کنید." };
  }
}

import { ACCOUNT_BLOCKED_CODE, SIGN_IN_PAUSED_CODE } from "~/lib/user-constants";
import { m } from "~/paraglide/messages";

/*===== Types =====*/
type AuthErrorLike = { code?: string | undefined; status: number };

/*===== Mapping =====*/
/**
 * Translates a Better-Auth client error from the sign-in steps into a message in the page's language that says what to do next.
 * Unknown errors become a general message, so the person always sees something actionable.
 */
export function describeAuthError(error: AuthErrorLike): string {
  switch (error.code) {
    case "INVALID_OTP":
      return m.auth_error_invalid_otp();
    case "OTP_EXPIRED":
    case "OTP_NOT_FOUND":
      return m.auth_error_otp_expired();
    case "TOO_MANY_ATTEMPTS":
      return m.auth_error_too_many_attempts();
    case "INVALID_PHONE_NUMBER":
      return m.auth_phone_invalid();
    case "RESEND_TOO_SOON":
      return m.auth_error_resend_too_soon();
    case "TOO_MANY_CODES":
      return m.auth_error_too_many_codes();
    case ACCOUNT_BLOCKED_CODE:
      return m.auth_error_blocked();
    case SIGN_IN_PAUSED_CODE:
      return m.auth_error_sign_in_paused();
  }
  if (error.status === 429) return m.auth_error_too_many_requests();
  // Only the password sign-in answers 401, and it says the same for a wrong password, an unknown number and a number that
  // never set one. The hint covers the last without telling anyone which of the three it was.
  if (error.status === 401) return m.auth_error_wrong_credentials();
  return m.auth_error_general();
}

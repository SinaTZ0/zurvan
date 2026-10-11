import { toLatinDigits } from "~/lib/digits";

/*===== Phone Numbers =====*/
// Iranian mobile numbers are stored and matched in one shape, `09xxxxxxxxx` (spec 2), so `+98 912 …`, `0098912…`
// and `۰۹۱۲…` all reach the same account. Browser-safe: the sign-in form normalizes before sending, and the server
// rejects anything that isn't already normalized.

const NORMALIZED_PATTERN = /^09\d{9}$/;

/**
 * Normalizes what a person typed to `09xxxxxxxxx`: Persian or Arabic digits become ASCII, spaces and dashes go, and
 * a `+98`, `0098` or `98` prefix becomes `0`.
 *
 * @returns The normalized number, or `null` when it isn't an Iranian mobile number.
 */
export function normalizePhoneNumber(input: string): string | null {
  const digits = toLatinDigits(input).replace(/[\s\-()]/g, "");
  const local = digits.replace(/^(\+98|0098|98)(?=9)/, "0").replace(/^(?=9\d{9}$)/, "0");
  return NORMALIZED_PATTERN.test(local) ? local : null;
}

/** Whether a number is already in the stored shape. */
export function isNormalizedPhoneNumber(value: string): boolean {
  return NORMALIZED_PATTERN.test(value);
}

/**
 * The email Better-Auth requires on every user, for an account that signs in by phone. It is on the reserved
 * `.invalid` domain, so it can never receive mail and never collides with a real address.
 */
export function phonePlaceholderEmail(phoneNumber: string): string {
  return `${phoneNumber}@phone.invalid`;
}

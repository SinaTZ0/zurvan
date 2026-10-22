import { toLatinDigits } from "~/lib/digits";
import { formatDigits } from "~/lib/locale-format";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "~/lib/user-constants";
import { m } from "~/paraglide/messages";

/*===== Password Rules =====*/
// The server's own rules for a new password. The form checks the same things for a nicer message; the server is the
// authority. Deliberately modest: a length, "not obviously guessable", and nothing that asks the person to invent
// symbols. Guessing is slowed elsewhere (the per-number pause and the per-IP limit).

/** Passwords that are in every list of the first ones tried. Compared in lower case. */
const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "87654321",
  "11111111",
  "00000000",
  "password",
  "password1",
  "qwertyui",
  "qwerty123",
  "abcd1234",
  "iloveyou",
]);

/**
 * Why a new password is refused, in the request's language, or `null` when it is fine. `phoneNumber` is the person's own number as
 * stored (`09xxxxxxxxx`): their number, in any digits, is the first thing anyone would try.
 */
export function describeWeakPassword({
  password,
  phoneNumber,
}: {
  password: string;
  phoneNumber: string | null;
}): string | null {
  if (password.trim() === "") return m.server_password_required();
  if (Array.from(password).length < PASSWORD_MIN_LENGTH)
    return m.server_password_min({ min: formatDigits(String(PASSWORD_MIN_LENGTH)) });
  if (password.length > PASSWORD_MAX_LENGTH) {
    return m.server_password_max({ max: formatDigits(String(PASSWORD_MAX_LENGTH)) });
  }

  const folded = toLatinDigits(password).toLowerCase();
  if (phoneNumber) {
    const withoutZero = phoneNumber.replace(/^0/, "");
    if (folded === phoneNumber || folded === withoutZero) return m.server_password_is_phone();
  }
  if (new Set(Array.from(folded)).size === 1 || COMMON_PASSWORDS.has(folded)) {
    return m.server_password_too_simple();
  }
  return null;
}

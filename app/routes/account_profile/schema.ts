import { z } from "zod";

import { toLatinDigits } from "~/lib/digits";
import { formatNumber } from "~/lib/locale-format";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "~/lib/user-constants";
import { m } from "~/paraglide/messages";

/*===== Name =====*/
// Same rules as the sign-in name step, written for this page: this slice does not import from the auth slice. Every
// message is a function, read when the check fails, so it is in the page's language (never fixed at import).
const NAME_MAX_LENGTH = 40;
const namePart = (missing: () => string) =>
  z
    .string()
    .trim()
    .min(2, { error: missing })
    .max(NAME_MAX_LENGTH, {
      error: () => m.account_profile_schema_name_too_long({ max: formatNumber(NAME_MAX_LENGTH) }),
    });

export const nameFormSchema = z.object({
  firstName: namePart(() => m.account_profile_schema_first_name_missing()),
  lastName: namePart(() => m.account_profile_schema_last_name_missing()),
});

export type NameFormValues = z.infer<typeof nameFormSchema>;

/*===== Sheba =====*/
/**
 * The 24 digits after «IR» from whatever was typed: Persian or Arabic digits, spaces (and dashes, and the zero-width
 * joiners Persian keyboards leave behind) ignored, «IR» in any case optional since the field shows it already. Returns
 * null when what is left is not exactly 24 digits.
 */
export function extractShebaDigits(value: string): string | null {
  const cleaned = toLatinDigits(value)
    .replace(/\s|\u200c|\u200d|-/g, "")
    .toUpperCase()
    .replace(/^IR/, "");
  return /^\d{24}$/.test(cleaned) ? cleaned : null;
}

/**
 * ISO 7064 mod 97-10, as IBANs use it: move the first four characters («IR» and the two check digits) to the end, write
 * the letters as numbers (I = 18, R = 27) and the remainder mod 97 must be 1. Done digit by digit so no number outgrows
 * what a double holds.
 */
function hasValidShebaChecksum(digits: string): boolean {
  const rearranged = `${digits.slice(2)}1827${digits.slice(0, 2)}`;
  let remainder = 0;
  for (const digit of rearranged) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

export const shebaFormSchema = z.object({
  shebaNumber: z.string().transform((value, ctx) => {
    const digits = extractShebaDigits(value);
    if (!digits) {
      ctx.addIssue({ code: "custom", message: m.account_profile_schema_sheba_format() });
      return z.NEVER;
    }
    if (!hasValidShebaChecksum(digits)) {
      ctx.addIssue({ code: "custom", message: m.account_profile_schema_sheba_checksum() });
      return z.NEVER;
    }
    return `IR${digits}`;
  }),
});

export type ShebaFormInput = z.input<typeof shebaFormSchema>;
export type ShebaFormValues = z.output<typeof shebaFormSchema>;

/** A saved Sheba (`IR` + 24 digits) as the field shows it: the 24 digits in groups of four, «IR» being the addon. */
export function formatShebaForField(sheba: string | null): string {
  const digits = sheba ? extractShebaDigits(sheba) : null;
  return digits ? (digits.match(/\d{4}/g)?.join(" ") ?? digits) : "";
}

/*===== Password =====*/
// The same length limits as the server (`app/orpc/password/validation.ts`), for a message before the request. The server
// also refuses a password that is the person's own number or on a list of the first ones tried; it is the authority, and
// its message lands on the same field.
export const passwordFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, { error: () => m.account_profile_schema_password_required() })
      .refine((value) => Array.from(value).length >= PASSWORD_MIN_LENGTH, {
        error: () => m.account_profile_schema_password_min({ min: formatNumber(PASSWORD_MIN_LENGTH) }),
      })
      .max(PASSWORD_MAX_LENGTH, {
        error: () => m.account_profile_schema_password_max({ max: formatNumber(PASSWORD_MAX_LENGTH) }),
      }),
    confirmPassword: z.string().min(1, { error: () => m.account_profile_schema_confirm_required() }),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    error: () => m.account_profile_schema_confirm_mismatch(),
  });

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

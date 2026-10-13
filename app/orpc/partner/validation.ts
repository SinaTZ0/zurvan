import { z } from "zod";

import { toLatinDigits } from "~/lib/digits";

/*===== Messages =====*/
export const SHEBA_FORMAT_MESSAGE = "شماره‌ی شبا باید با IR شروع شود و ۲۴ رقم بعد از آن داشته باشد.";
export const SHEBA_CHECKSUM_MESSAGE = "این شماره‌ی شبا درست نیست؛ دوباره نگاهش کن.";

/*===== Normalization =====*/
// Spaces (any kind), dashes and the zero-width non-joiner Persian keyboards add. Banks print Sheba numbers in groups.
const SEPARATORS = /[\s\-‐-―‌]/g;
const SHEBA_PATTERN = /^IR\d{24}$/;

/**
 * Turns what the partner typed into the stored form: Latin digits, no separators, uppercase, and the leading `IR` added
 * when the rest is 24 digits (many people copy the number without it). Anything else is left for the format check.
 */
export function normalizeShebaNumber(raw: string): string {
  const text = toLatinDigits(raw.trim()).replace(SEPARATORS, "").toUpperCase();
  return /^\d{24}$/.test(text) ? `IR${text}` : text;
}

/*===== Checksum =====*/
/**
 * ISO 7064 mod 97-10: the first four characters move to the end, letters become numbers (A=10 … Z=35, so I=18 and
 * R=27), and the remainder mod 97 must be 1. The remainder is carried digit by digit, as the number is far past what a
 * double holds exactly.
 */
export function hasValidShebaChecksum(sheba: string): boolean {
  if (!SHEBA_PATTERN.test(sheba)) return false;

  const digits = (sheba.slice(4) + sheba.slice(0, 4)).replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

/*===== Schema =====*/
// The format failure aborts, so a malformed number gets the format message and only a well-formed one reaches the
// checksum.
export const shebaNumberSchema = z
  .string()
  .transform(normalizeShebaNumber)
  .pipe(
    z
      .string()
      .regex(SHEBA_PATTERN, { error: SHEBA_FORMAT_MESSAGE, abort: true })
      .refine(hasValidShebaChecksum, SHEBA_CHECKSUM_MESSAGE),
  );

/** The partner profile as the service accepts it. Messages are user-facing because they surface as field errors. */
export const partnerProfileInputSchema = z.object({ shebaNumber: shebaNumberSchema });

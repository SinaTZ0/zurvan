/*===== Retry Number =====*/
// Browser-safe. What the unknown state's retry form turns typed text into before it navigates.
import { normalizeCertificateNumber } from "~/lib/certificate";

/**
 * The path segment to check for whatever was typed, or `null` for an empty box. A real number is made canonical (the
 * `ZC-` prefix added when missing, upper case, Persian digits read); anything else is passed on trimmed and in upper
 * case, because the API answers «unknown» for any text and there is nothing for the form to refuse.
 */
export function numberToCheck(typed: string): string | null {
  const trimmed = typed.trim();
  if (!trimmed) return null;
  return normalizeCertificateNumber(trimmed) ?? trimmed.toUpperCase();
}

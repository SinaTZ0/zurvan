import { toLatinDigits } from "~/lib/digits";

/*===== Dog File Number =====*/
// Browser-safe. A dog's file number is `ZD-` and ten hexadecimal characters (docs/app-spec.md, F14), written by the
// database. It is on the dog's QR code and certificates, so people type it, scan it and read it aloud.

export const FILE_NUMBER_PREFIX = "ZD-";

/**
 * The canonical number from whatever was typed, or `null` when it isn't one. Case, spaces, dashes and the zero-width
 * joiners Persian keyboards leave behind don't matter; Persian digits count; the prefix is optional.
 */
export function normalizeFileNumber(value: string): string | null {
  const cleaned = toLatinDigits(value)
    .replace(/[\s\-_‌‍]/g, "")
    .toUpperCase()
    .replace(/^ZD/, "");
  return /^[0-9A-F]{10}$/.test(cleaned) ? `${FILE_NUMBER_PREFIX}${cleaned}` : null;
}

/** Where a dog's public record lives, and what its QR code points at. */
export function logbookPath(fileNumber: string): string {
  return `/logbook/${encodeURIComponent(fileNumber)}`;
}

/*===== Certificate Number =====*/
// Browser-safe. A certificate's number is `ZC-` and ten hexadecimal characters (docs/app-spec.md, F14), written by the
// database. It is on the certificate's QR code and read out over the phone, so it is forgiving about how it is typed.

import { toLatinDigits } from "~/lib/digits";

export const CERTIFICATE_PREFIX = "ZC-";

/** The canonical number from whatever was typed, or `null` when it isn't one. The prefix is optional. */
export function normalizeCertificateNumber(value: string): string | null {
  const cleaned = toLatinDigits(value)
    .replace(/[\s\-_‌‍]/g, "")
    .toUpperCase()
    .replace(/^ZC/, "");
  return /^[0-9A-F]{10}$/.test(cleaned) ? `${CERTIFICATE_PREFIX}${cleaned}` : null;
}

/** Where a certificate is verified, and what its QR code points at. */
export function certificatePath(number: string): string {
  return `/certificate/${encodeURIComponent(number)}`;
}

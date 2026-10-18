import { toLatinDigits } from "~/lib/digits";
import type { RefundStatus } from "~/orpc/refund/constants";

/*===== Refund Wording and Math =====*/
// Browser-safe. Amounts are Rial everywhere; people type Toman.

const RIAL_PER_TOMAN = 10;

/** Rial the refunds that stand (everything but a cancelled one) add up to. */
export function sumStanding(refunds: readonly { amount: number; status: RefundStatus }[]): number {
  return refunds.filter((entry) => entry.status !== "cancelled").reduce((sum, entry) => sum + entry.amount, 0);
}

/**
 * Toman as typed (Persian or Latin digits, with commas, Persian thousands separators or spaces between the digits) → whole
 * Rial, or `null` when it isn't a positive whole number of Toman. «۱٬۲۵۰٬۰۰۰» is 12,500,000 Rial. A dot is **not** a
 * separator here (it could be a decimal point, and misreading «1.5» as 15 would move money), so it is refused.
 */
export function tomanToRial(typed: string): number | null {
  const digits = toLatinDigits(typed).replace(/[\s,٬،]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const toman = Number(digits);
  return Number.isSafeInteger(toman * RIAL_PER_TOMAN) && toman > 0 ? toman * RIAL_PER_TOMAN : null;
}

/** Whole Toman for a Rial amount, as the amount field starts: Rial that isn't a whole Toman is rounded down. */
export function rialToToman(rial: number): number {
  return Math.floor(rial / RIAL_PER_TOMAN);
}

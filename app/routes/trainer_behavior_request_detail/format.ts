import { toLatinDigits } from "~/lib/digits";
import { BEHAVIOR_PLAN_VALID_DAYS } from "~/orpc/behavior-request/constants";

/*===== Money =====*/
// The trainer types toman, the way people say a price; the API stores and checks Rial (×10).
const RIAL_PER_TOMAN = 10;
const DAY_MS = 24 * 60 * 60_000;

/**
 * Reads a toman amount typed with Persian or Arabic-Indic digits and separators (`۱۲۰٬۰۰۰`, `120,000`) as Rial.
 *
 * @returns Rial, or `null` when what was typed isn't a whole amount of toman.
 */
export function parseTomanToRial(typed: string): number | null {
  const digits = toLatinDigits(typed).replace(/[\s,٬،]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  return Number(digits) * RIAL_PER_TOMAN;
}

/** The toman a Rial amount is typed as, with Persian digits, for prefilling the form. */
export function rialToTomanInput(rial: number): string {
  return String(Math.round(rial / RIAL_PER_TOMAN));
}

/*===== Deadline =====*/
/** The moment a plan proposed at `now` stops being payable (B13: `BEHAVIOR_PLAN_VALID_DAYS` days). */
export function planExpiryFrom(now: Date): Date {
  return new Date(now.getTime() + BEHAVIOR_PLAN_VALID_DAYS * DAY_MS);
}

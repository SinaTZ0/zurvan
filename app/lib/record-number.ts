import { isoToJalali } from "~/lib/jalali";
import { utcToTehranParts } from "~/lib/tehran-time";

/*===== Record Numbers =====*/
/**
 * A human-readable number for an order or a transaction: the prefix, the Jalali year and month in Tehran, and a
 * sequence number of at least four digits, e.g. `ZR-140507-0042` (entity 14). The sequence never resets, so numbers
 * stay unique however many are made in a month; the date part is only there to help people read them.
 */
export function formatRecordNumber({ prefix, sequence, at }: { prefix: string; sequence: number; at: Date }): string {
  const { year, month } = isoToJalali(utcToTehranParts(at).date);
  return `${prefix}-${year}${String(month).padStart(2, "0")}-${String(sequence).padStart(4, "0")}`;
}

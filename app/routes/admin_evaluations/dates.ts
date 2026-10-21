import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { isoToJalali, JALALI_MONTHS } from "~/lib/jalali";

/*===== Tehran Days =====*/
/** `YYYY-MM-DD` of a moment on the Tehran calendar, the day the Admin is living in (the server may run in UTC). */
export function tehranDay(moment: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(moment);
}

/** Whole calendar days between two `YYYY-MM-DD` days. */
function daysBetween({ from, to }: { from: string; to: string }): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/*===== Waiting Time =====*/
/**
 * How long ago a request came in, in calendar days (not 24-hour spans): a request sent at 23:50 is «دیروز» just after
 * midnight. Returns the number of days; the row words it.
 */
export function daysSince({ moment, now = new Date() }: { moment: Date; now?: Date }): number {
  return Math.max(0, daysBetween({ from: tehranDay(moment), to: tehranDay(now) }));
}

/** «امروز» / «دیروز» / «۳ روز پیش», under the date of a request still waiting. */
export function describeWaiting(createdAt: Date): string {
  const days = daysSince({ moment: createdAt });
  if (days === 0) return "امروز";
  if (days === 1) return "دیروز";
  return `${formatNumberFa(days)} روز پیش`;
}

/*===== Day Labels =====*/
/**
 * The small label over a day's requests in the queue: «امروز», «دیروز», then the Jalali day («۲۷ مهر»), with the year
 * only when it isn't this year's.
 */
export function describeDay({ day, now = new Date() }: { day: string; now?: Date }): string {
  const today = tehranDay(now);
  const ago = daysBetween({ from: day, to: today });
  if (ago === 0) return "امروز";
  if (ago === 1) return "دیروز";

  const { year, month, day: dayOfMonth } = isoToJalali(day);
  const label = `${toPersianDigits(String(dayOfMonth))} ${JALALI_MONTHS[month - 1]}`;
  return year === isoToJalali(today).year ? label : `${label} ${toPersianDigits(String(year))}`;
}

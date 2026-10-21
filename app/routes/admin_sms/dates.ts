import { toPersianDigits } from "~/lib/digits";
import { isoToJalali, JALALI_MONTHS } from "~/lib/jalali";

/*===== Tehran Clock =====*/
// The outbox reads in the Admin's own day and hour: the server may run in UTC, and a message sent at 23:50 Tehran time
// belongs to that day, not the next one. Both formats name the time zone, so the server and the browser agree.

const TEHRAN_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" });
const TEHRAN_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tehran",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** `YYYY-MM-DD` of a moment on the Tehran calendar. */
export function tehranDay(moment: Date): string {
  return TEHRAN_DAY.format(moment);
}

/** «۱۴:۳۲», the hour a message went, on the Tehran clock. */
export function formatClock(moment: Date): string {
  return toPersianDigits(TEHRAN_CLOCK.format(moment));
}

/*===== Day Labels =====*/
/**
 * The muted label over a day's messages, as a messages app words it: «امروز», «دیروز», then the Jalali day («۲۷ مهر»),
 * with the year only when it isn't this year's.
 */
export function describeDay({ day, now = new Date() }: { day: string; now?: Date }): string {
  const today = tehranDay(now);
  const ago = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000);
  if (ago === 0) return "امروز";
  if (ago === 1) return "دیروز";

  const { year, month, day: dayOfMonth } = isoToJalali(day);
  const label = `${toPersianDigits(String(dayOfMonth))} ${JALALI_MONTHS[month - 1]}`;
  return year === isoToJalali(today).year ? label : `${label} ${toPersianDigits(String(year))}`;
}

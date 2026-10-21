import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";

/*===== Tehran Days =====*/
/** `YYYY-MM-DD` of a moment on the Tehran calendar, the day the Admin is living in (the server may run in UTC). */
function tehranDay(moment: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(moment);
}

/** Whole calendar days from one moment's Tehran day to another's. */
function daysBetween({ from, to }: { from: Date; to: Date }): number {
  const start = Date.parse(`${tehranDay(from)}T00:00:00Z`);
  const end = Date.parse(`${tehranDay(to)}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

/*===== Last Sign-in =====*/
/** Up to this many days ago a sign-in is said in days; older ones show their date. */
const RELATIVE_DAYS = 6;

/**
 * When a person last came in, the way he'd say it: «امروز», «دیروز», «۳ روز پیش» for the last week (calendar days in
 * Tehran, not 24-hour spans), then the Jalali date.
 */
export function describeLastLogin({ moment, now = new Date() }: { moment: Date; now?: Date }): string {
  const days = daysBetween({ from: moment, to: now });
  if (days <= 0) return "امروز";
  if (days === 1) return "دیروز";
  if (days <= RELATIVE_DAYS) return `${formatNumberFa(days)} روز پیش`;
  return formatJalaliTimestamp(moment);
}

/** Whether `describeLastLogin` said it in days, so the dialog can add the date after it. */
export function isRecent({ moment, now = new Date() }: { moment: Date; now?: Date }): boolean {
  return daysBetween({ from: moment, to: now }) <= RELATIVE_DAYS;
}

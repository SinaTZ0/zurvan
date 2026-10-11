import { toPersianDigits } from "~/lib/digits";
import { isoToJalali, JALALI_MONTHS } from "~/lib/jalali";
import { tehranToUtc, utcToTehranParts } from "~/lib/tehran-time";

/*===== Tehran Weeks =====*/
// The trainer's week runs Saturday to Friday on the Tehran calendar. Days are plain `YYYY-MM-DD` strings and are
// moved with UTC arithmetic, so neither the server's nor the browser's time zone can shift a day. Browser-safe.

const DAY_MS = 86_400_000;

/** `2026-10-10` plus `days` (negative to go back). */
export function addDaysIso({ date, days }: { date: string; days: number }): string {
  const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
}

/** The Saturday on or before a calendar day. */
export function saturdayOnOrBefore(date: string): string {
  const { weekday } = utcToTehranParts(tehranToUtc({ date, time: "12:00" }));
  return addDaysIso({ date, days: -weekday });
}

/**
 * The week the URL asks for. `?week=` holds any day in it (the stepper writes the Saturday); anything that isn't a
 * real date means this week.
 */
export function resolveWeekStart({ param, today }: { param: string | null; today: string }): string {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    try {
      return saturdayOnOrBefore(param);
    } catch {
      // Not a real date (2026-02-30): fall through to this week.
    }
  }
  return saturdayOnOrBefore(today);
}

/** The seven days of a week, Saturday first. */
export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDaysIso({ date: weekStart, days: index }));
}

/** The instants a week covers: midnight Saturday up to, not including, the next Saturday, Tehran time. */
export function weekRange(weekStart: string): { from: Date; to: Date } {
  return {
    from: tehranToUtc({ date: weekStart, time: "00:00" }),
    to: tehranToUtc({ date: addDaysIso({ date: weekStart, days: 7 }), time: "00:00" }),
  };
}

/*===== Labels =====*/
/** «۱۹» for the day of the Jalali month. */
export function jalaliDayLabel(date: string): string {
  return toPersianDigits(String(isoToJalali(date).day));
}

/** «مهر». */
export function jalaliMonthLabel(date: string): string {
  return JALALI_MONTHS[isoToJalali(date).month - 1] ?? "";
}

/** «۱۹ مهر», a day without its weekday. */
export function jalaliDayMonth(date: string): string {
  return `${jalaliDayLabel(date)} ${jalaliMonthLabel(date)}`;
}

/** «۱۹ تا ۲۵ مهر», or «۲۶ مهر تا ۲ آبان» when the week crosses a month. */
export function weekRangeLabel(weekStart: string): string {
  const last = addDaysIso({ date: weekStart, days: 6 });
  if (jalaliMonthLabel(weekStart) === jalaliMonthLabel(last)) {
    return `${jalaliDayLabel(weekStart)} تا ${jalaliDayMonth(last)}`;
  }
  return `${jalaliDayMonth(weekStart)} تا ${jalaliDayMonth(last)}`;
}

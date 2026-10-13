import { toPersianDigits } from "~/lib/digits";
import { isoToJalali, jalaliToIso, JALALI_MONTHS } from "~/lib/jalali";

/*===== Tehran Time =====*/
// Appointments are set by people living in Tehran and stored as UTC instants. Iran dropped daylight saving in 2022, so
// Tehran is a fixed UTC+03:30 and the conversion is plain arithmetic, with no time zone database and no surprises
// between the server and the browser. If Iran ever brings DST back, this is the one place to change. Browser-safe.

const TEHRAN_OFFSET_MS = (3 * 60 + 30) * 60_000;

/** Saturday is 0, because the Iranian week starts there. */
export const WEEKDAY_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"] as const;

export type TehranParts = {
  /** `YYYY-MM-DD`, Gregorian. */
  date: string;
  /** `HH:mm`, 24-hour. */
  time: string;
  /** 0 to 6, Saturday = 0. */
  weekday: number;
};

/*===== Conversion =====*/
/**
 * The instant at which the Tehran clock reads `date` and `time`.
 *
 * @throws When the date or time isn't `YYYY-MM-DD` / `HH:mm`, or isn't a real moment (`2026-02-30`).
 */
export function tehranToUtc({ date, time }: { date: string; time: string }): Date {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) throw new Error(`Not a Tehran date and time: ${date} ${time}`);

  const [year, month, day] = dateMatch.slice(1).map(Number) as [number, number, number];
  const [hour, minute] = timeMatch.slice(1).map(Number) as [number, number];
  const wallClock = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // `Date.UTC` rolls `02-30` over to March, so a round trip tells a real date from an impossible one.
  const isReal =
    wallClock.getUTCFullYear() === year &&
    wallClock.getUTCMonth() === month - 1 &&
    wallClock.getUTCDate() === day &&
    wallClock.getUTCHours() === hour &&
    wallClock.getUTCMinutes() === minute;
  if (!isReal) throw new Error(`Not a real Tehran date and time: ${date} ${time}`);

  return new Date(wallClock.getTime() - TEHRAN_OFFSET_MS);
}

/** What the Tehran clock and calendar read at an instant. */
export function utcToTehranParts(date: Date): TehranParts {
  // Shifting by the offset lets the UTC getters read the Tehran wall clock.
  const shifted = new Date(date.getTime() + TEHRAN_OFFSET_MS);
  const iso = shifted.toISOString();

  return {
    date: iso.slice(0, 10),
    time: iso.slice(11, 16),
    // JS counts Sunday as 0; moving the start of the week to Saturday adds one.
    weekday: (shifted.getUTCDay() + 1) % 7,
  };
}

/*===== Month Range =====*/
/**
 * The Jalali month that contains `now` on the Tehran clock, as the half-open range `[start, end)` of UTC instants.
 * `start` is Tehran midnight of day 1 and `end` is Tehran midnight of day 1 of the next month, so a moment at
 * 23:59:59 on the last day belongs to this month and one at 00:00:00 of day 1 to the next. Month 12 rolls over to
 * month 1 of the next year.
 */
export function tehranJalaliMonthRange(now: Date): { year: number; month: number; start: Date; end: Date } {
  const { year, month } = isoToJalali(utcToTehranParts(now).date);
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return {
    year,
    month,
    start: tehranToUtc({ date: jalaliToIso({ year, month, day: 1 }), time: "00:00" }),
    end: tehranToUtc({ date: jalaliToIso({ ...next, day: 1 }), time: "00:00" }),
  };
}

/*===== Formatting =====*/
/** «۱۷:۰۰», the time on the Tehran clock. */
export function formatSlotTime(date: Date): string {
  return toPersianDigits(utcToTehranParts(date).time);
}

/** «شنبه ۱۹ مهر», the day in the Jalali calendar. The year is left out: slots are always the next few weeks. */
export function formatSlotDay(date: Date): string {
  const { date: iso, weekday } = utcToTehranParts(date);
  const { month, day } = isoToJalali(iso);
  return `${WEEKDAY_NAMES[weekday]} ${toPersianDigits(String(day))} ${JALALI_MONTHS[month - 1]}`;
}

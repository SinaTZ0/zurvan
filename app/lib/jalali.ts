import { isValidJalaaliDate, jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";

import { toPersianDigits } from "~/lib/digits";

/*===== Jalali Calendar Dates =====*/
// Calendar dates (a birth date, "known since") are stored as Gregorian `YYYY-MM-DD` and shown in the Jalali calendar.
// They have no time of day, so they are converted arithmetically rather than through `Date` and a time zone, which
// could shift them by a day. Browser-safe.

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export type JalaliDate = { year: number; month: number; day: number };

/** `2024-10-03` → `{ year: 1403, month: 7, day: 12 }`. */
export function isoToJalali(iso: string): JalaliDate {
  const [year = 0, month = 0, day = 0] = iso.split("-").map(Number);
  const jalali = toJalaali(year, month, day);
  return { year: jalali.jy, month: jalali.jm, day: jalali.jd };
}

/** `{ year: 1403, month: 7, day: 12 }` → `2024-10-03`. */
export function jalaliToIso({ year, month, day }: JalaliDate): string {
  const gregorian = toGregorian(year, month, day);
  return [gregorian.gy, gregorian.gm, gregorian.gd].map((part) => String(part).padStart(2, "0")).join("-");
}

/** Whether the parts form a real Jalali date (rejects 31 Esfand in a common year). */
export function isValidJalali({ year, month, day }: JalaliDate): boolean {
  return isValidJalaaliDate(year, month, day);
}

/** Days in a Jalali month, for the day picker. */
export function jalaliMonthLength({ year, month }: { year: number; month: number }): number {
  return jalaaliMonthLength(year, month);
}

/*===== Today =====*/
/** Today's date in Tehran as `YYYY-MM-DD`, the calendar day the owner and the trainer are living in. */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
}

/*===== Formatting =====*/
// Years are written digit by digit: `formatNumberFa` would group them as «۱٬۴۰۳».

/** «۱۲ مهر ۱۴۰۳». */
export function formatJalaliDate(iso: string): string {
  const { year, month, day } = isoToJalali(iso);
  return `${toPersianDigits(String(day))} ${JALALI_MONTHS[month - 1]} ${toPersianDigits(String(year))}`;
}

/** «مهر ۱۴۰۳», for dates where the day doesn't matter. */
export function formatJalaliMonthYear(iso: string): string {
  const { year, month } = isoToJalali(iso);
  return `${JALALI_MONTHS[month - 1]} ${toPersianDigits(String(year))}`;
}

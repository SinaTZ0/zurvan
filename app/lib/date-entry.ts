import { isoToJalali, isValidJalali, JALALI_MONTHS, jalaliMonthLength, jalaliToIso, todayIso } from "~/lib/jalali";
import { formatDigits, formatNumber } from "~/lib/locale-format";
import { getLocale, type Locale } from "~/paraglide/runtime";

/*===== Dates People Type =====*/
// docs/i18n/english-version-plan.md, Phase 4 step 5. A date someone enters (a dog's birth date, the evaluation's
// earliest day) is picked as day, month and year in the calendar of the page's language: Jalali on the Persian pages,
// Gregorian on the English ones. What is stored never changes: one Gregorian `YYYY-MM-DD`, made by `toIso`.
//
// A form keeps the three parts as they were picked, so the parts are in the entry calendar, never in ISO. Reading
// them back (`toIso`, `isValid`) must use the same calendar they were picked in; that holds because the language only
// changes with a full page load (the switch is a plain link), which starts the form again.
//
// The order is day, month, year in both, as the dates are shown («۱۲ مهر ۱۴۰۳», «3 October 2024»). Browser-safe.

/** A day in the entry calendar: `{ year: 1403, month: 7, day: 12 }` in Persian, `{ year: 2024, month: 10, day: 3 }` in English. */
export type EntryDate = { year: number; month: number; day: number };

/** One calendar's way of entering a date. Get it with `entryCalendar()` while rendering or validating. */
export type EntryCalendar = {
  kind: "jalali" | "gregorian";
  /** The month names in order (index 0 is month 1), for the month select. */
  months: readonly string[];
  /** A stored date (`2024-10-03`) as the parts to preselect. */
  fromIso: (iso: string) => EntryDate;
  /** The parts as the stored date. Only for parts `isValid` accepts. */
  toIso: (date: EntryDate) => string;
  /** Whether the parts form a real day (rejects 31 Esfand in a common year, 29 February in a common year). */
  isValid: (date: EntryDate) => boolean;
  /** Days in a month, for the day select; 31 while the month or the year isn't a number yet. */
  monthLength: (parts: { year: number; month: number }) => number;
  /** Today in Tehran as parts (the trainer's calendar day, as `todayIso`). */
  today: () => EntryDate;
  /** A day's option label: «۱۲» or «12». */
  dayLabel: (day: number) => string;
  /** A year's option label, digit by digit (never grouped as «۱٬۴۰۳»): «۱۴۰۳» or «2024». */
  yearLabel: (year: number) => string;
};

/*===== Jalali (Persian) =====*/
const JALALI: Omit<EntryCalendar, "dayLabel" | "yearLabel"> = {
  kind: "jalali",
  months: JALALI_MONTHS,
  fromIso: isoToJalali,
  toIso: jalaliToIso,
  isValid: isValidJalali,
  monthLength: ({ year, month }) => (isMonth({ year, month }) ? jalaliMonthLength({ year, month }) : 31),
  today: () => isoToJalali(todayIso()),
};

/*===== Gregorian (English) =====*/
const GREGORIAN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Days in a Gregorian month: day 0 of the next month is this month's last day. */
function gregorianMonthLength({ year, month }: { year: number; month: number }): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const GREGORIAN: Omit<EntryCalendar, "dayLabel" | "yearLabel"> = {
  kind: "gregorian",
  months: GREGORIAN_MONTHS,
  fromIso: (iso) => {
    const [year = 0, month = 0, day = 0] = iso.split("-").map(Number);
    return { year, month, day };
  },
  toIso: ({ year, month, day }) =>
    [String(year).padStart(4, "0"), String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-"),
  isValid: ({ year, month, day }) =>
    isMonth({ year, month }) && Number.isInteger(day) && day >= 1 && day <= gregorianMonthLength({ year, month }),
  monthLength: (parts) => (isMonth(parts) ? gregorianMonthLength(parts) : 31),
  today: () => GREGORIAN.fromIso(todayIso()),
};

/*===== Calendar of the Page =====*/
/**
 * The entry calendar for a language (the page's by default). Call it where the date is rendered or checked, never at
 * module level: a module-level calendar would keep the language the module first loaded in.
 */
export function entryCalendar(locale: Locale = getLocale()): EntryCalendar {
  return {
    ...(locale === "fa" ? JALALI : GREGORIAN),
    dayLabel: (day) => formatNumber(day, locale),
    yearLabel: (year) => formatDigits(String(year), locale),
  };
}

/** Whether the year and month are usable numbers (a select still on its empty option gives `Number("") === 0`). */
function isMonth({ year, month }: { year: number; month: number }): boolean {
  return Number.isInteger(year) && year > 0 && Number.isInteger(month) && month >= 1 && month <= 12;
}

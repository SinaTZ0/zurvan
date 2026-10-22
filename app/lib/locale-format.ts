import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { formatJalaliDate, formatJalaliMonthYear, formatJalaliTimestamp } from "~/lib/jalali";
import { getLocale, type Locale } from "~/paraglide/runtime";

/*===== Locale-aware Formatting =====*/
// Digits, dates and amounts in the page's language (docs/i18n/english-version-plan.md, "Formatting"). Persian keeps
// exactly what `digits.ts` and `jalali.ts` write (Persian digits, the Jalali calendar); English gets Latin digits and
// Gregorian dates through `Intl`. Each takes the locale last and defaults to the page's (`getLocale()`); a procedure
// passes its context's (`context.locale`). Browser-safe. Money is in `course-format.ts` (`formatToman`).

const enNumberFormat = new Intl.NumberFormat("en-US");

/** A number to read: «۱۲٬۵۰۰» on the Persian pages, «12,500» on the English ones. */
export function formatNumber(value: number, locale: Locale = getLocale()): string {
  return locale === "fa" ? formatNumberFa(value) : enNumberFormat.format(value);
}

/**
 * A string of digits written as-is, with no separators (a code, a year, a step number): «۱۴۰۵» or «1405». Use it for
 * anything that is an identifier rather than an amount.
 */
export function formatDigits(value: string, locale: Locale = getLocale()): string {
  return locale === "fa" ? toPersianDigits(value) : value;
}

/*------ Dates ------*/
// Calendar dates are stored as `YYYY-MM-DD` with no time of day, so English formats them in UTC, where that string is
// midnight: any other zone could show the day before.
const enDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const enMonthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
// A moment is shown as the day it falls on in Tehran, where the owner and the trainer live (as `formatJalaliTimestamp`).
const enMoment = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Tehran",
});

/** A calendar date (`2024-10-03`): «۱۲ مهر ۱۴۰۳», or «3 October 2024». */
export function formatDate(iso: string, locale: Locale = getLocale()): string {
  return locale === "fa" ? formatJalaliDate(iso) : enDate.format(new Date(`${iso}T00:00:00Z`));
}

/** A moment (a purchase, an issue date), as its day in Tehran: «۱۲ مهر ۱۴۰۳», or «3 October 2024». */
export function formatTimestamp(moment: Date, locale: Locale = getLocale()): string {
  return locale === "fa" ? formatJalaliTimestamp(moment) : enMoment.format(moment);
}

/** A month and year, where the day doesn't matter: «مهر ۱۴۰۳», or «October 2024». */
export function formatMonthYear(iso: string, locale: Locale = getLocale()): string {
  return locale === "fa" ? formatJalaliMonthYear(iso) : enMonthYear.format(new Date(`${iso}T00:00:00Z`));
}

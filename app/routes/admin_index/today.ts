import { JALALI_MONTHS, isoToJalali } from "~/lib/jalali";
import { toPersianDigits } from "~/lib/digits";

/*===== Weekdays =====*/
// `Intl` names the weekday in English on every runtime; its Persian names differ between ICU builds (and some print
// «سه‌شنبه» without the half-space), so the mapping is ours.
const WEEKDAYS: Record<string, string> = {
  Saturday: "شنبه",
  Sunday: "یک‌شنبه",
  Monday: "دوشنبه",
  Tuesday: "سه‌شنبه",
  Wednesday: "چهارشنبه",
  Thursday: "پنج‌شنبه",
  Friday: "جمعه",
};

/*===== Today in Tehran =====*/
/**
 * «چهارشنبه ۲۹ مهر»: the day the head trainer is living in, for the Overview's summary line. It is computed once, in
 * the loader, on the Tehran clock, so the server's render and the browser's hydration show the same day whatever
 * either machine's time zone is. The weekday and the date come from the same moment, so they can't straddle midnight.
 */
export function describeTodayInTehran(now: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", weekday: "long" }).format(now);
  const { month, day } = isoToJalali(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(now));

  return [WEEKDAYS[weekday], toPersianDigits(String(day)), JALALI_MONTHS[month - 1]].filter(Boolean).join(" ");
}

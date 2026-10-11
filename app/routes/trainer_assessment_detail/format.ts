import { formatNumberFa } from "~/lib/digits";
import { formatJalaliDate } from "~/lib/jalali";
import { utcToTehranParts } from "~/lib/tehran-time";

/*===== Formatting =====*/
/** «یک ساعت», «۲ ساعت», «۴۵ دقیقه»: how long the meeting is. */
export function formatDuration(minutes: number): string {
  if (minutes === 60) return "یک ساعت";
  if (minutes % 60 === 0) return `${formatNumberFa(minutes / 60)} ساعت`;
  return `${formatNumberFa(minutes)} دقیقه`;
}

/** «۱۹ مهر ۱۴۰۵», the Tehran date an instant falls on. */
export function formatRecordedDate(date: Date): string {
  return formatJalaliDate(utcToTehranParts(date).date);
}

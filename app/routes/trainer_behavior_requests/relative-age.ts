import { formatJalaliDate } from "~/lib/jalali";
import { formatNumberFa } from "~/lib/digits";
import { utcToTehranParts } from "~/lib/tehran-time";

/*===== Relative Age =====*/
/**
 * How long ago a request was sent, in Persian: «۳ ساعت پیش». A week or more reads as its Jalali date, since «۲۰ روز پیش»
 * is harder to place than the date. `now` comes from the loader, so the server and the browser print the same words.
 * A `sentAt` in the future (clock skew) reads as «همین الان» rather than a negative age.
 */
export function describeAge({ sentAt, now }: { sentAt: Date; now: Date }): string {
  const minutes = Math.floor((now.getTime() - sentAt.getTime()) / 60_000);
  if (minutes < 1) return "همین الان";
  if (minutes < 60) return `${formatNumberFa(minutes)} دقیقه پیش`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${formatNumberFa(hours)} ساعت پیش`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${formatNumberFa(days)} روز پیش`;

  return formatJalaliDate(utcToTehranParts(sentAt).date);
}

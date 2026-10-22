import { formatNumber } from "~/lib/locale-format";

/*===== Toman Digits =====*/
/**
 * A Rial amount as Toman digits alone («۱٬۲۵۰٬۰۰۰», "1,250,000" in English), for a big gold numeral whose unit «تومان» is written beside it in
 * body text. The same rounding as `formatToman` (`app/lib/course-format.ts`), which writes the unit itself.
 */
export function tomanDigits(rial: number): string {
  return formatNumber(Math.round(rial / 10));
}

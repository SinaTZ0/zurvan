import { formatNumberFa } from "~/lib/digits";

/*===== Toman Digits =====*/
/**
 * A Rial amount as Toman digits alone («۱۲٬۵۰۰٬۰۰۰»), for a big gold numeral whose unit «تومان» is written beside it in
 * body text. The same rounding as `formatToman` (`app/lib/course-format.ts`), which writes the unit itself.
 */
export function tomanDigits(rial: number): string {
  return formatNumberFa(Math.round(rial / 10));
}

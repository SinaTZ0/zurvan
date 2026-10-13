import { toLatinDigits } from "~/lib/digits";

/*===== Normalization =====*/
/**
 * Folds a piece of text so that the ways Persian gets typed all compare equal: Arabic ي/ك become ی/ک, diacritics, the
 * tatweel, ZWNJ and spaces disappear («سگ همدم» and «سگ‌همدم» and «سگهمدم» are one word), Persian and Arabic-Indic digits
 * become Latin, and Latin letters lose their case.
 */
export function normalizeForSearch(text: string): string {
  return toLatinDigits(text)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ً-ٟـ‌‍\s]+/g, "")
    .toLowerCase();
}

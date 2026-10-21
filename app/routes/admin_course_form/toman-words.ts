/*===== Toman in Words =====*/
// The price spelled out the way a bank slip writes it, so a missing or extra zero is read before saving: «۴۵۰۰۰۰» and
// «۴۵۰۰۰۰۰» look alike, «چهارصد و پنجاه هزار» and «چهار میلیون و پانصد هزار» don't.

const ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const SCALES = ["", "هزار", "میلیون", "میلیارد", "هزار میلیارد"];

/** 0–999 in words, parts joined by «و». */
function belowThousand(value: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (hundreds) parts.push(HUNDREDS[hundreds]);
  if (rest >= 10 && rest < 20) parts.push(TEENS[rest - 10]);
  else {
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    if (tens) parts.push(TENS[tens]);
    if (ones) parts.push(ONES[ones]);
  }
  return parts.join(" و ");
}

/**
 * A whole number of Toman in Persian words: `4500000` → «چهار میلیون و پانصد هزار». «هزار» alone for one thousand,
 * as people write it. Returns null for zero, negatives and anything past the scales above (the form's price limit is
 * far below that).
 */
export function tomanInWords(value: number): string | null {
  if (!Number.isSafeInteger(value) || value <= 0) return null;

  const groups: string[] = [];
  let rest = value;
  let scale = 0;
  while (rest > 0) {
    if (scale >= SCALES.length) return null;
    const group = rest % 1000;
    if (group) {
      const words = group === 1 && scale === 1 ? "" : belowThousand(group);
      groups.unshift([words, SCALES[scale]].filter(Boolean).join(" "));
    }
    rest = Math.floor(rest / 1000);
    scale += 1;
  }
  return groups.join(" و ");
}

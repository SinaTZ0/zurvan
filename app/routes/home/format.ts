/*===== Price =====*/
const amountFormat = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 });

/**
 * Formats a toman amount the way prices are said, shortened to "هزار" or "میلیون":
 * `1_850_000` → "۱٫۸۵ میلیون تومان", `950_000` → "۹۵۰ هزار تومان".
 */
export function formatToman(amount: number): string {
  if (amount >= 1_000_000) return `${amountFormat.format(amount / 1_000_000)} میلیون تومان`;
  if (amount >= 1_000) return `${amountFormat.format(amount / 1_000)} هزار تومان`;
  return `${amountFormat.format(amount)} تومان`;
}

/*===== Dates =====*/
// Pinned to Tehran so the server and the browser print the same Jalali day, whatever their own time zone.
const TIME_ZONE = "Asia/Tehran";
const dayMonthFormat = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
});
const dayFormat = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", timeZone: TIME_ZONE });
const monthFormat = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", timeZone: TIME_ZONE });
const weekdayFormat = new Intl.DateTimeFormat("fa-IR", { weekday: "long", timeZone: TIME_ZONE });

/** "۲۵ مهر" */
export function formatDayMonth(date: Date): string {
  return dayMonthFormat.format(date);
}

/** The parts of a date shown separately in a calendar block: "۲۵", "مهر", "شنبه". */
export function dateParts(date: Date) {
  return { day: dayFormat.format(date), month: monthFormat.format(date), weekday: weekdayFormat.format(date) };
}

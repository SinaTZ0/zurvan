/*===== Waiting Time =====*/
/** `YYYY-MM-DD` of a moment on the Tehran calendar, the day the Admin is living in (the server may run in UTC). */
function tehranDay(moment: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(moment);
}

/** Whole calendar days between two `YYYY-MM-DD` days. */
function daysBetween({ from, to }: { from: string; to: string }): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/**
 * How long ago a request came in, in calendar days (not 24-hour spans): a request sent at 23:50 is «دیروز» just after
 * midnight. Returns the number of days; the row words it.
 */
export function daysSince({ moment, now = new Date() }: { moment: Date; now?: Date }): number {
  return Math.max(0, daysBetween({ from: tehranDay(moment), to: tehranDay(now) }));
}

import { toLatinDigits } from "~/lib/digits";
import { tehranToUtc, utcToTehranParts } from "~/lib/tehran-time";
import { addDaysIso } from "~/routes/trainer_schedule/week";

/*===== Open Times Plan =====*/
// The composer's arithmetic, kept apart from the form so the live count line and the submit read the same list.

export const OPEN_WEEKS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Clock times one composer can hold; the API takes at most 60 slots in all. */
export const MAX_TIME_FIELDS = 6;

/**
 * `HH:mm` from what the trainer typed: Persian or Latin digits, «۷:۳۰» or «17». Null when it isn't a time of day.
 */
export function parseClockTime(text: string): string | null {
  const match = /^(\d{1,2})(?::(\d{2}))?$/.exec(toLatinDigits(text).trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * The instants a composer opens: every chosen weekday in the `weeks * 7` days from `startDate`, at every clock time.
 * Times that have already passed are dropped (the API only opens the future) and counted in `past`.
 */
export function planSlots({
  weekdays,
  times,
  startDate,
  weeks,
  now,
}: {
  /** Saturday is 0. */
  weekdays: readonly number[];
  /** `HH:mm`, already parsed. */
  times: readonly string[];
  /** `YYYY-MM-DD`, Gregorian, Tehran calendar. */
  startDate: string;
  weeks: number;
  now: Date;
}): { startsAt: Date[]; past: number } {
  const startsAt: Date[] = [];
  let past = 0;

  for (let offset = 0; offset < weeks * 7; offset++) {
    const date = addDaysIso({ date: startDate, days: offset });
    const { weekday } = utcToTehranParts(tehranToUtc({ date, time: "12:00" }));
    if (!weekdays.includes(weekday)) continue;

    for (const time of new Set(times)) {
      const instant = tehranToUtc({ date, time });
      if (instant.getTime() > now.getTime()) startsAt.push(instant);
      else past++;
    }
  }

  // Oldest first, so «از … تا …» reads from the first to the last.
  startsAt.sort((a, b) => a.getTime() - b.getTime());
  return { startsAt, past };
}

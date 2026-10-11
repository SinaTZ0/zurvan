import { toPersianDigits } from "~/lib/digits";
import { formatSlotDay, formatSlotTime, utcToTehranParts } from "~/lib/tehran-time";
import type { AvailableSlot } from "~/orpc/assessment/contract";

/*===== Diary Slots =====*/
// Arman's open times grouped into the diary's ruled rows. Pure and browser-safe: the page renders on the server and
// hydrates in the browser, and both must lay the rail out identically.

/** The rail's span: his working day. Times outside it are clamped to its ends, never dropped. */
export const RAIL_START_HOUR = 9;
export const RAIL_END_HOUR = 21;
/** The hours that carry a label on the rail; every hour carries a faint tick. */
export const RAIL_LABEL_HOURS = [9, 12, 15, 18, 21] as const;

/**
 * How much of the rail a pill covers, in hours. A pill is 48 px (`lg:w-12`) and the rail runs from about 35 px an hour
 * (1024 px screens) to 41 px (1440), so 1.4 is safe at both: times an hour apart always take separate lines.
 */
const PILL_WIDTH_HOURS = 1.4;

export type DiaryTime = {
  slot: AvailableSlot;
  /** «۱۷:۰۰». */
  label: string;
  /** 0 to 100: where the time sits on the rail, from the 9:00 end. */
  position: number;
  /** Which line of the rail it sits on, so two times close together don't overlap. */
  lane: number;
};

export type DiaryDay = {
  /** `YYYY-MM-DD` on the Tehran calendar. */
  date: string;
  weekday: string;
  /** «۱۹ مهر». */
  dayMonth: string;
  times: DiaryTime[];
  laneCount: number;
};

/**
 * Groups open slots by Tehran day, in time order. Days without open times simply don't appear.
 *
 * On the rail each time sits at its hour; when a pill would cover the previous one in its line (times an hour apart
 * on a narrow rail), it drops to the next line.
 */
export function groupSlotsByDay(slots: readonly AvailableSlot[]): DiaryDay[] {
  // `sort` is on a fresh array, and the project's ES2022 target has no `toSorted`.
  // oxlint-disable-next-line unicorn/no-array-sort
  const sorted = [...slots].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const days = new Map<string, DiaryDay>();
  const laneEnds = new Map<string, number[]>();

  for (const slot of sorted) {
    const { date, time } = utcToTehranParts(slot.startsAt);
    const [hour = 0, minute = 0] = time.split(":").map(Number);
    const hours = hour + minute / 60;
    const clamped = Math.min(Math.max(hours, RAIL_START_HOUR), RAIL_END_HOUR);
    const position = ((clamped - RAIL_START_HOUR) / (RAIL_END_HOUR - RAIL_START_HOUR)) * 100;

    let day = days.get(date);
    if (!day) {
      const [weekday = "", ...rest] = formatSlotDay(slot.startsAt).split(" ");
      day = { date, weekday, dayMonth: rest.join(" "), times: [], laneCount: 1 };
      days.set(date, day);
      laneEnds.set(date, []);
    }

    const ends = laneEnds.get(date) ?? [];
    let lane = ends.findIndex((end) => clamped - end >= PILL_WIDTH_HOURS);
    if (lane === -1) lane = ends.length;
    ends[lane] = clamped;
    laneEnds.set(date, ends);

    day.times.push({ slot, label: formatSlotTime(slot.startsAt), position, lane });
    day.laneCount = Math.max(day.laneCount, lane + 1);
  }

  return [...days.values()];
}

/** «۱۷» for a time on the hour, «۱۷:۳۰» otherwise: how a person says the time in a sentence. */
export function formatSpokenTime(date: Date): string {
  const { time } = utcToTehranParts(date);
  return toPersianDigits(time.endsWith(":00") ? time.slice(0, 2) : time);
}

/** «۹», «۱۲», …: the hour labels above the rail. */
export function formatRailHour(hour: number): string {
  return toPersianDigits(String(hour));
}

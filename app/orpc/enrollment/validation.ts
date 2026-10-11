import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import { MAX_SCHEDULE_RANGE_DAYS } from "~/orpc/assessment/constants";
import {
  ENROLLMENT_NOTE_MAX_LENGTH,
  ENROLLMENT_RESULTS,
  ENROLLMENT_STATUSES,
  MAX_PLANNED_SESSIONS,
  SESSION_DEFAULT_DURATION_MINUTES,
  SESSION_MAX_DURATION_MINUTES,
  SESSION_MIN_DURATION_MINUTES,
  SESSION_NOTE_MAX_LENGTH,
  SESSION_OUTCOMES,
  SESSION_PLACE_KINDS,
  SESSION_PLACE_MAX_LENGTH,
} from "~/orpc/enrollment/constants";

/*===== Fields =====*/
/** Optional free text: surrounding space goes, and empty means "not given", so it is stored as null. */
function optionalText({ max, message }: { max: number; message: string }) {
  return z
    .string()
    .trim()
    .max(max, message)
    .nullish()
    .transform((value) => value || null);
}

function requiredText({ max, empty, tooLong }: { max: number; empty: string; tooLong: string }) {
  return z.string().trim().min(1, empty).max(max, tooLong);
}

const MINUTE_MS = 60_000;

const placeKind = z.enum(SESSION_PLACE_KINDS, { error: "محل جلسه را انتخاب کن." });

const placeText = requiredText({
  max: SESSION_PLACE_MAX_LENGTH,
  empty: "نشانی یا محل جلسه را بنویس.",
  tooLong: `نشانی حداکثر ${formatNumberFa(SESSION_PLACE_MAX_LENGTH)} حرف است.`,
});

const durationMinutes = z
  .number()
  .int("مدت را با دقیقه‌ی کامل بنویس.")
  .min(SESSION_MIN_DURATION_MINUTES, `مدت حداقل ${formatNumberFa(SESSION_MIN_DURATION_MINUTES)} دقیقه است.`)
  .max(SESSION_MAX_DURATION_MINUTES, `مدت حداکثر ${formatNumberFa(SESSION_MAX_DURATION_MINUTES)} دقیقه است.`);

const sessionNote = optionalText({
  max: SESSION_NOTE_MAX_LENGTH,
  message: `یادداشت حداکثر ${formatNumberFa(SESSION_NOTE_MAX_LENGTH)} حرف است.`,
});

/**
 * A session's start, cut to the minute and checked against `now` here rather than at module load, so a long-running
 * server never judges "the future" by its start time.
 */
function futureStart({ now }: { now: Date }) {
  return z
    .date()
    .refine((time) => time.getTime() > now.getTime(), "فقط برای آینده جلسه بگذار.")
    .transform((time) => new Date(Math.floor(time.getTime() / MINUTE_MS) * MINUTE_MS));
}

/*===== Listing =====*/
export const trainerListInputSchema = z.object({
  status: z.enum(ENROLLMENT_STATUSES, { error: "وضعیت را درست انتخاب کن." }).optional(),
});

/*===== Week View =====*/
const DAY_MS = 86_400_000;

export const sessionsRangeInputSchema = z
  .object({ from: z.date(), to: z.date() })
  .refine(({ from, to }) => from.getTime() <= to.getTime(), { path: ["to"], message: "بازه را درست انتخاب کن." })
  .refine(({ from, to }) => to.getTime() - from.getTime() <= MAX_SCHEDULE_RANGE_DAYS * DAY_MS, {
    path: ["to"],
    message: `بازه حداکثر ${formatNumberFa(MAX_SCHEDULE_RANGE_DAYS)} روز است.`,
  });

/*===== Scheduling =====*/
/** The enrollment id is passed through: one that isn't the trainer's is I/O, so the service decides. */
export function scheduleSessionInputSchema({ now }: { now: Date }) {
  return z.object({
    startsAt: futureStart({ now }),
    durationMinutes: durationMinutes.optional().default(SESSION_DEFAULT_DURATION_MINUTES),
    placeKind,
    place: placeText,
  });
}

/** Left-out fields keep the session's current value, so the trainer can move it without retyping where. */
export function rescheduleSessionInputSchema({ now }: { now: Date }) {
  return z.object({
    startsAt: futureStart({ now }),
    durationMinutes: durationMinutes.optional(),
    placeKind: placeKind.optional(),
    place: placeText.optional(),
  });
}

/*===== Recording =====*/
export const markSessionInputSchema = z.object({
  status: z.enum(SESSION_OUTCOMES, { error: "بنویس جلسه برگزار شد یا از دست رفت." }),
  trainerNote: sessionNote,
});

export const sessionNoteInputSchema = z.object({ trainerNote: sessionNote });

/*===== Planned Sessions =====*/
// "At least as many as were used" needs the enrollment, so the service checks it.
export const plannedSessionsInputSchema = z.object({
  plannedSessions: z
    .number()
    .int("تعداد جلسه‌ها باید عدد صحیح باشد.")
    .min(1, "حداقل یک جلسه لازم است.")
    .max(MAX_PLANNED_SESSIONS, `حداکثر ${formatNumberFa(MAX_PLANNED_SESSIONS)} جلسه.`),
});

/*===== Result =====*/
export const recordResultInputSchema = z.object({
  result: z.enum(ENROLLMENT_RESULTS, { error: "نتیجه را قبول یا مردود انتخاب کن." }),
  trainerNote: requiredText({
    max: ENROLLMENT_NOTE_MAX_LENGTH,
    empty: "یادداشتی برای مشتری بنویس.",
    tooLong: `یادداشت حداکثر ${formatNumberFa(ENROLLMENT_NOTE_MAX_LENGTH)} حرف است.`,
  }),
});

/*===== Id =====*/
const idSchema = z.guid();

/** Whether the text can be an id. A malformed one would make Postgres throw, so it is treated as "no such row". */
export function isUuid(value: string): boolean {
  return idSchema.safeParse(value).success;
}

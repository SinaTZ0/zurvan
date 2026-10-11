import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import {
  ASSESSMENT_CUSTOMER_NOTE_MAX_LENGTH,
  ASSESSMENT_DEFAULT_DURATION_MINUTES,
  ASSESSMENT_MAX_DURATION_MINUTES,
  ASSESSMENT_MIN_DURATION_MINUTES,
  ASSESSMENT_PLACE_MAX_LENGTH,
  ASSESSMENT_REASON_MAX_LENGTH,
  ASSESSMENT_TRAINER_NOTES_MAX_LENGTH,
  MAX_RECOMMENDED_COURSES,
  MAX_SCHEDULE_RANGE_DAYS,
  MAX_SLOTS_PER_OPEN,
  MEETING_PLACE_KINDS,
  TRAINING_GOALS,
} from "~/orpc/assessment/constants";

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

const reasonTooLong = `دلیل حداکثر ${formatNumberFa(ASSESSMENT_REASON_MAX_LENGTH)} حرف است.`;

/*===== Booking =====*/
// Ids are passed through: a slot or dog that isn't there, or isn't the customer's, is I/O, so the service decides.
export const bookInputSchema = z.object({
  slotId: z.string(),
  dogId: z.string(),
  trainingGoal: z.enum(TRAINING_GOALS, { error: "هدف آموزش را انتخاب کن." }),
  customerNote: requiredText({
    max: ASSESSMENT_CUSTOMER_NOTE_MAX_LENGTH,
    empty: "بنویس چه چیزی را می‌خواهی تغییر بدهی.",
    tooLong: `این متن حداکثر ${formatNumberFa(ASSESSMENT_CUSTOMER_NOTE_MAX_LENGTH)} حرف است.`,
  }),
  placeKind: z.enum(MEETING_PLACE_KINDS, { error: "محل دیدار را انتخاب کن." }),
  place: requiredText({
    max: ASSESSMENT_PLACE_MAX_LENGTH,
    empty: "نشانی یا محل دیدار را بنویس.",
    tooLong: `نشانی حداکثر ${formatNumberFa(ASSESSMENT_PLACE_MAX_LENGTH)} حرف است.`,
  }),
});

export type BookInput = z.output<typeof bookInputSchema>;

/*===== Cancelling =====*/
export const customerCancelInputSchema = z.object({
  reason: optionalText({ max: ASSESSMENT_REASON_MAX_LENGTH, message: reasonTooLong }),
});

export const trainerCancelInputSchema = z.object({
  reason: requiredText({
    max: ASSESSMENT_REASON_MAX_LENGTH,
    empty: "دلیل لغو را بنویس تا مشتری بداند.",
    tooLong: reasonTooLong,
  }),
});

/*===== Outcome =====*/
export const completeInputSchema = z.object({
  trainerNotes: requiredText({
    max: ASSESSMENT_TRAINER_NOTES_MAX_LENGTH,
    empty: "یادداشتی برای مشتری بنویس.",
    tooLong: `یادداشت حداکثر ${formatNumberFa(ASSESSMENT_TRAINER_NOTES_MAX_LENGTH)} حرف است.`,
  }),
  recommendedCourseSlugs: z
    .array(z.string())
    .max(MAX_RECOMMENDED_COURSES, `حداکثر ${formatNumberFa(MAX_RECOMMENDED_COURSES)} دوره پیشنهاد بده.`)
    .refine((slugs) => new Set(slugs).size === slugs.length, "یک دوره را فقط یک بار پیشنهاد بده."),
});

export const markNoShowInputSchema = z.object({
  trainerNotes: optionalText({
    max: ASSESSMENT_TRAINER_NOTES_MAX_LENGTH,
    message: `یادداشت حداکثر ${formatNumberFa(ASSESSMENT_TRAINER_NOTES_MAX_LENGTH)} حرف است.`,
  }),
});

/*===== Schedule =====*/
const DAY_MS = 86_400_000;

export const scheduleInputSchema = z
  .object({ from: z.date(), to: z.date() })
  .refine(({ from, to }) => from.getTime() <= to.getTime(), { path: ["to"], message: "بازه را درست انتخاب کن." })
  .refine(({ from, to }) => to.getTime() - from.getTime() <= MAX_SCHEDULE_RANGE_DAYS * DAY_MS, {
    path: ["to"],
    message: `بازه حداکثر ${formatNumberFa(MAX_SCHEDULE_RANGE_DAYS)} روز است.`,
  });

/*===== Slots =====*/
const MINUTE_MS = 60_000;

/**
 * The times a trainer opens. Each is cut to the minute, and a time given twice counts once. They are checked against
 * `now` here rather than at module load, so a long-running server never judges "the future" by its start time.
 */
export function openSlotsInputSchema({ now }: { now: Date }) {
  return z.object({
    startsAt: z
      .array(z.date())
      .min(1, "حداقل یک زمان انتخاب کن.")
      .max(MAX_SLOTS_PER_OPEN, `در هر بار حداکثر ${formatNumberFa(MAX_SLOTS_PER_OPEN)} وقت باز می‌شود.`)
      .refine((times) => times.every((time) => time.getTime() > now.getTime()), "فقط برای آینده وقت باز کن.")
      .transform((times) => {
        const minutes = times.map((time) => Math.floor(time.getTime() / MINUTE_MS) * MINUTE_MS);
        // `sort` is on a fresh array, and the project's ES2022 target has no `toSorted`.
        // oxlint-disable-next-line unicorn/no-array-sort
        return [...new Set(minutes)].sort((a, b) => a - b).map((time) => new Date(time));
      }),
    durationMinutes: z
      .number()
      .int("مدت را با دقیقه‌ی کامل بنویس.")
      .min(ASSESSMENT_MIN_DURATION_MINUTES, `مدت حداقل ${formatNumberFa(ASSESSMENT_MIN_DURATION_MINUTES)} دقیقه است.`)
      .max(ASSESSMENT_MAX_DURATION_MINUTES, `مدت حداکثر ${formatNumberFa(ASSESSMENT_MAX_DURATION_MINUTES)} دقیقه است.`)
      .optional()
      .default(ASSESSMENT_DEFAULT_DURATION_MINUTES),
  });
}

/*===== Id =====*/
const idSchema = z.guid();

/** Whether the text can be an id. A malformed one would make Postgres throw, so it is treated as "no such row". */
export function isUuid(value: string): boolean {
  return idSchema.safeParse(value).success;
}

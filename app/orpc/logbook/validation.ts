import { z } from "zod";

import { formatNumberFa, toLatinDigits } from "~/lib/digits";
import { todayIso } from "~/lib/jalali";
import {
  LOGBOOK_EXERCISE_MAX_LENGTH,
  LOGBOOK_MAX_EXERCISES,
  LOGBOOK_NOTES_MAX_LENGTH,
  LOGBOOK_PROGRESS_MAX_LENGTH,
} from "~/orpc/logbook/constants";

/*===== Session Entry =====*/
// The domain rules for one session the trainer writes down. The form checks the same things for a nicer message; this is
// the authority.

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Whether the text is a real calendar date (rejects `2024-02-30`, which `Date` would roll over). */
function isRealDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const occurredOnSchema = z
  .string()
  .transform((value) => toLatinDigits(value).trim())
  .refine(isRealDate, "تاریخ جلسه را درست وارد کن.")
  // A session is written down after it happened (or the same day), so a future day is a slip.
  .refine((value) => value <= todayIso(), "تاریخ جلسه نمی‌تواند در آینده باشد.");

const notesSchema = z
  .string()
  .trim()
  .min(1, "بنویس توی جلسه چه کار کردید.")
  .max(LOGBOOK_NOTES_MAX_LENGTH, `یادداشت حداکثر ${formatNumberFa(LOGBOOK_NOTES_MAX_LENGTH)} حرف است.`);

const exercisesSchema = z
  .array(
    z
      .string()
      .trim()
      .max(LOGBOOK_EXERCISE_MAX_LENGTH, `هر تمرین حداکثر ${formatNumberFa(LOGBOOK_EXERCISE_MAX_LENGTH)} حرف است.`),
  )
  // Blank lines are what a textarea leaves behind, not exercises; a repeated line is one exercise.
  .transform((lines) => [...new Set(lines.filter((line) => line !== ""))])
  .refine((lines) => lines.length <= LOGBOOK_MAX_EXERCISES, `حداکثر ${formatNumberFa(LOGBOOK_MAX_EXERCISES)} تمرین.`);

const progressSchema = z
  .string()
  .trim()
  .max(LOGBOOK_PROGRESS_MAX_LENGTH, `جمع‌بندی حداکثر ${formatNumberFa(LOGBOOK_PROGRESS_MAX_LENGTH)} حرف است.`)
  .nullish()
  .transform((value) => value || null);

export const sessionFieldsSchema = z.object({
  enrollmentId: z
    .string()
    .trim()
    .min(1)
    .nullish()
    .transform((value) => value ?? null),
  occurredOn: occurredOnSchema,
  notes: notesSchema,
  exercises: exercisesSchema,
  progress: progressSchema,
  isPublic: z.boolean(),
});

export type SessionFields = z.output<typeof sessionFieldsSchema>;

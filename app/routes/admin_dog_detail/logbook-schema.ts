import type { DefaultValues } from "react-hook-form";
import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import { isoToJalali, isValidJalali, jalaliToIso, todayIso } from "~/lib/jalali";
import {
  LOGBOOK_EXERCISE_MAX_LENGTH,
  LOGBOOK_MAX_EXERCISES,
  LOGBOOK_NOTES_MAX_LENGTH,
  LOGBOOK_PROGRESS_MAX_LENGTH,
} from "~/orpc/logbook/constants";
import type { LogbookEntry } from "~/orpc/logbook/contract";

/*===== Session Form =====*/
// Written for the person filling it in: the day is three Jalali selects, the exercises are one per line in a textarea.
// The server checks everything again (`app/orpc/logbook/validation.ts`); the two are kept separate on purpose
// (docs/frontend-guideline.md, "Forms").

const exerciseLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

export const sessionFormSchema = z
  .object({
    day: z.string(),
    month: z.string(),
    year: z.string(),
    /** An enrollment of this dog, or empty when the session belongs to no course. */
    enrollmentId: z.string(),
    notes: z
      .string()
      .trim()
      .min(1, "بنویس توی جلسه چه کار کردید.")
      .max(LOGBOOK_NOTES_MAX_LENGTH, `یادداشت حداکثر ${formatNumberFa(LOGBOOK_NOTES_MAX_LENGTH)} حرف است.`),
    exercises: z
      .string()
      .refine(
        (value) => exerciseLines(value).length <= LOGBOOK_MAX_EXERCISES,
        `حداکثر ${formatNumberFa(LOGBOOK_MAX_EXERCISES)} تمرین.`,
      )
      .refine(
        (value) => exerciseLines(value).every((line) => line.length <= LOGBOOK_EXERCISE_MAX_LENGTH),
        `هر تمرین حداکثر ${formatNumberFa(LOGBOOK_EXERCISE_MAX_LENGTH)} حرف است.`,
      ),
    progress: z
      .string()
      .trim()
      .max(LOGBOOK_PROGRESS_MAX_LENGTH, `جمع‌بندی حداکثر ${formatNumberFa(LOGBOOK_PROGRESS_MAX_LENGTH)} حرف است.`),
    /** The entry may be shown on the dog's public record (only if its owner makes the record public). */
    isPublic: z.boolean(),
  })
  .superRefine(
    (values, ctx) => {
      if (!values.day || !values.month || !values.year) {
        ctx.addIssue({ code: "custom", path: ["day"], message: "روز، ماه و سال جلسه را انتخاب کن." });
        return;
      }
      const date = { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
      if (!isValidJalali(date)) {
        ctx.addIssue({ code: "custom", path: ["day"], message: "این روز در این ماه نیست." });
      } else if (jalaliToIso(date) > todayIso()) {
        ctx.addIssue({ code: "custom", path: ["day"], message: "تاریخ جلسه نمی‌تواند در آینده باشد." });
      }
    },
    // The date parts are plain strings that always parse, so the date is checked even while another field fails.
    { when: () => true },
  );

export type SessionFormInput = z.input<typeof sessionFormSchema>;
export type SessionFormValues = z.output<typeof sessionFormSchema>;

/*===== To the API =====*/
/** The input of `logbook.admin.add` (without the dog) and `logbook.admin.update` (without the id). */
export function toSessionInput({ values }: { values: SessionFormValues }) {
  return {
    enrollmentId: values.enrollmentId || null,
    occurredOn: jalaliToIso({ year: Number(values.year), month: Number(values.month), day: Number(values.day) }),
    notes: values.notes,
    exercises: exerciseLines(values.exercises),
    progress: values.progress || null,
    isPublic: values.isPublic,
  };
}

/*===== From an Entry =====*/
/** The form's starting values: the entry's own, or today for a new session. */
export function toSessionDefaults(entry: LogbookEntry | null): DefaultValues<SessionFormInput> {
  const day = isoToJalali(entry?.occurredOn ?? todayIso());
  return {
    day: String(day.day),
    month: String(day.month),
    year: String(day.year),
    enrollmentId: "",
    notes: entry?.notes ?? "",
    exercises: entry?.exercises.join("\n") ?? "",
    progress: entry?.progress ?? "",
    isPublic: entry?.isPublic ?? false,
  };
}

/*===== Server Field Names =====*/
/** Where the server's field errors belong in this form. `exercises.3` and the like belong to the one exercises field. */
export function serverFieldToForm(field: string): keyof SessionFormInput | null {
  if (field === "occurredOn") return "day";
  if (field.startsWith("exercises")) return "exercises";
  if (field === "enrollmentId" || field === "notes" || field === "progress") return field;
  return null;
}

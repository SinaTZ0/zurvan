import { z } from "zod";

import { isoToJalali, isValidJalali, jalaliToIso, todayIso } from "~/lib/jalali";
import { EVALUATION_PERIODS, EVALUATION_WEEKDAYS } from "~/orpc/evaluation/constants";

/*===== Evaluation Request Form =====*/
// Written for the person filling it in: the earliest date is three selects (Jalali day, month, year) that become one
// Gregorian ISO date, and the days and times are lists of chips. The server checks everything again
// (`app/orpc/evaluation/validation.ts`); the two are kept separate on purpose (docs/frontend-guideline.md, "Forms").
// Photos and videos are uploaded by the media field before the form is sent, so the form only holds their ids.

export const evaluationRequestSchema = z
  .object({
    dogId: z.string().min(1, "کدوم سگ؟ یکی را انتخاب کن."),
    earliestDay: z.string(),
    earliestMonth: z.string(),
    earliestYear: z.string(),
    availableDays: z.array(z.enum(EVALUATION_WEEKDAYS)).min(1, "دست‌کم یک روز را انتخاب کن."),
    availablePeriods: z.array(z.enum(EVALUATION_PERIODS)).min(1, "دست‌کم یک زمان از روز را انتخاب کن."),
    photoMediaIds: z.array(z.string()),
    videoIds: z.array(z.string()),
  })
  .superRefine((values, context) => {
    /*------ Earliest Date ------*/
    const jalali = earliestJalali(values);
    if (!isValidJalali(jalali)) {
      context.addIssue({ code: "custom", path: ["earliestDay"], message: "این تاریخ در تقویم نیست." });
    } else if (jalaliToIso(jalali) < todayIso()) {
      context.addIssue({ code: "custom", path: ["earliestDay"], message: "تاریخ نباید گذشته باشد." });
    }
  })
  .transform((values) => ({
    dogId: values.dogId,
    earliestDate: jalaliToIso(earliestJalali(values)),
    availableDays: values.availableDays,
    availablePeriods: values.availablePeriods,
    photoMediaIds: values.photoMediaIds,
    videoIds: values.videoIds,
  }));

function earliestJalali(values: { earliestDay: string; earliestMonth: string; earliestYear: string }) {
  return { year: Number(values.earliestYear), month: Number(values.earliestMonth), day: Number(values.earliestDay) };
}

/** What the inputs hold. */
export type EvaluationRequestInput = z.input<typeof evaluationRequestSchema>;
/** What the API gets. */
export type EvaluationRequestValues = z.output<typeof evaluationRequestSchema>;

/*===== Defaults =====*/
/** Starts on today in Tehran, so the common answer («هر وقت زودتر») needs no typing. */
export function toFormDefaults({ dogId }: { dogId: string }): EvaluationRequestInput {
  const today = isoToJalali(todayIso());
  return {
    dogId,
    earliestDay: String(today.day),
    earliestMonth: String(today.month),
    earliestYear: String(today.year),
    availableDays: [],
    availablePeriods: [],
    photoMediaIds: [],
    videoIds: [],
  };
}

/*===== Server Field Names =====*/
/** The API's field name → the form's. Names not listed here are the same in both. */
export const SERVER_FIELD_TO_FORM: Record<string, keyof EvaluationRequestInput> = {
  earliestDate: "earliestDay",
};

const FORM_FIELDS = new Set<string>(["dogId", "availableDays", "availablePeriods", "photoMediaIds", "videoIds"]);

/** Where a server field's message goes, or null when the form has no such field (it becomes a form-level message). */
export function toFormField(serverField: string): keyof EvaluationRequestInput | null {
  // An item error can arrive as `photoMediaIds.2`; the list's field shows it.
  const [name = ""] = serverField.split(".");
  return SERVER_FIELD_TO_FORM[name] ?? (FORM_FIELDS.has(name) ? (name as keyof EvaluationRequestInput) : null);
}

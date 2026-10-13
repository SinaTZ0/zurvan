import { z } from "zod";

import { toLatinDigits } from "~/lib/digits";
import { utcToTehranParts } from "~/lib/tehran-time";
import {
  EVALUATION_MAX_PHOTOS,
  EVALUATION_MAX_VIDEOS,
  EVALUATION_PERIODS,
  EVALUATION_REASON_MAX_LENGTH,
  EVALUATION_WEEKDAYS,
} from "~/orpc/evaluation/constants";

/*===== Dates =====*/
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/*===== Request =====*/
// Domain rules for an evaluation request (F3). Messages are user-facing because they surface as field errors.
export const requestEvaluationSchema = z.object({
  dogId: z.string(),
  earliestDate: z
    .string()
    .transform((value) => toLatinDigits(value).trim())
    .refine(isRealDate, "تاریخ را درست وارد کنید.")
    // Today in Tehran, so "today" is never in the past for the customer.
    .refine((value) => value >= utcToTehranParts(new Date()).date, "تاریخ نمی‌تواند گذشته باشد."),
  availableDays: z
    .array(z.enum(EVALUATION_WEEKDAYS, { error: "روزها را از فهرست انتخاب کنید." }))
    .min(1, "دست‌کم یک روز را انتخاب کنید.")
    .transform((days) => [...new Set(days)]),
  availablePeriods: z
    .array(z.enum(EVALUATION_PERIODS, { error: "ساعت‌ها را از فهرست انتخاب کنید." }))
    .min(1, "دست‌کم یک زمان از روز را انتخاب کنید.")
    .transform((periods) => [...new Set(periods)]),
  photoMediaIds: z
    .array(z.string())
    .transform((ids) => [...new Set(ids)])
    .pipe(z.array(z.string()).max(EVALUATION_MAX_PHOTOS, `حداکثر ${EVALUATION_MAX_PHOTOS} عکس می‌شود فرستاد.`)),
  videoIds: z
    .array(z.string())
    .transform((ids) => [...new Set(ids)])
    .pipe(z.array(z.string()).max(EVALUATION_MAX_VIDEOS, `حداکثر ${EVALUATION_MAX_VIDEOS} ویدیو می‌شود فرستاد.`)),
});

/*===== Reason =====*/
export const rejectEvaluationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "دلیل رد را بنویسید.")
    .max(EVALUATION_REASON_MAX_LENGTH, `دلیل حداکثر ${EVALUATION_REASON_MAX_LENGTH} حرف است.`),
});

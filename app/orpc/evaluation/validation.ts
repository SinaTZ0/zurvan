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
import { m } from "~/paraglide/messages";

/*===== Dates =====*/
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/*===== Request =====*/
// Domain rules for an evaluation request (F3). Messages are user-facing because they surface as field errors, and are
// functions so each failure is worded in its own request's language (a sentence built at import would freeze the first
// request's). The counts keep the Latin digits the Persian has always shown.
export const requestEvaluationSchema = z.object({
  dogId: z.string(),
  earliestDate: z
    .string()
    .transform((value) => toLatinDigits(value).trim())
    .refine(isRealDate, { error: () => m.server_evaluation_date_invalid() })
    // Today in Tehran, so "today" is never in the past for the customer.
    .refine((value) => value >= utcToTehranParts(new Date()).date, { error: () => m.server_evaluation_date_past() }),
  availableDays: z
    .array(z.enum(EVALUATION_WEEKDAYS, { error: () => m.server_evaluation_weekday_unknown() }))
    .min(1, { error: () => m.server_evaluation_weekday_required() })
    .transform((days) => [...new Set(days)]),
  availablePeriods: z
    .array(z.enum(EVALUATION_PERIODS, { error: () => m.server_evaluation_period_unknown() }))
    .min(1, { error: () => m.server_evaluation_period_required() })
    .transform((periods) => [...new Set(periods)]),
  photoMediaIds: z
    .array(z.string())
    .transform((ids) => [...new Set(ids)])
    .pipe(
      z.array(z.string()).max(EVALUATION_MAX_PHOTOS, {
        error: () => m.server_evaluation_photos_max({ max: String(EVALUATION_MAX_PHOTOS) }),
      }),
    ),
  videoIds: z
    .array(z.string())
    .transform((ids) => [...new Set(ids)])
    .pipe(
      z.array(z.string()).max(EVALUATION_MAX_VIDEOS, {
        error: () => m.server_evaluation_videos_max({ max: String(EVALUATION_MAX_VIDEOS) }),
      }),
    ),
});

/*===== Reason =====*/
// The Admin's, so Persian only (the Admin has no English pages).
export const rejectEvaluationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "دلیل رد را بنویسید.")
    .max(EVALUATION_REASON_MAX_LENGTH, `دلیل حداکثر ${EVALUATION_REASON_MAX_LENGTH} حرف است.`),
});

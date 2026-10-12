import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import {
  BEHAVIOR_ADDRESS_MAX_LENGTH,
  BEHAVIOR_DESCRIPTION_MAX_LENGTH,
  BEHAVIOR_PLAN_MAX_PRICE,
  BEHAVIOR_PLAN_MAX_SESSIONS,
  BEHAVIOR_PLAN_MIN_PRICE,
  BEHAVIOR_PREFERRED_TIMES_MAX_LENGTH,
  BEHAVIOR_PROBLEM_CATEGORIES,
  BEHAVIOR_REQUEST_STATUSES,
  BEHAVIOR_TRAINER_NOTE_MAX_LENGTH,
  BEHAVIOR_VIDEO_MAX_COUNT,
} from "~/orpc/behavior-request/constants";

/*===== Fields =====*/
function requiredText({ max, empty, tooLong }: { max: number; empty: string; tooLong: string }) {
  return z.string().trim().min(1, empty).max(max, tooLong);
}

/*===== Submitting =====*/
// The dog and the video ids are I/O (the dog must be the customer's, each video the customer's own and not sent yet), so
// the service decides.
export const submitInputSchema = z.object({
  dogId: z.string(),
  problemCategory: z.enum(BEHAVIOR_PROBLEM_CATEGORIES, { error: "نوع مشکل را انتخاب کن." }),
  description: requiredText({
    max: BEHAVIOR_DESCRIPTION_MAX_LENGTH,
    empty: "مشکل را برای آرمان توضیح بده.",
    tooLong: `توضیح حداکثر ${formatNumberFa(BEHAVIOR_DESCRIPTION_MAX_LENGTH)} حرف است.`,
  }),
  address: requiredText({
    max: BEHAVIOR_ADDRESS_MAX_LENGTH,
    empty: "نشانی محل جلسه‌ها را بنویس.",
    tooLong: `نشانی حداکثر ${formatNumberFa(BEHAVIOR_ADDRESS_MAX_LENGTH)} حرف است.`,
  }),
  preferredTimes: requiredText({
    max: BEHAVIOR_PREFERRED_TIMES_MAX_LENGTH,
    empty: "بنویس چه روزها و ساعت‌هایی برایت مناسب است.",
    tooLong: `این متن حداکثر ${formatNumberFa(BEHAVIOR_PREFERRED_TIMES_MAX_LENGTH)} حرف است.`,
  }),
  videoIds: z
    .array(z.string())
    .min(1, "دست‌کم یک ویدیو از رفتار سگ بفرست.")
    .max(BEHAVIOR_VIDEO_MAX_COUNT, `حداکثر ${formatNumberFa(BEHAVIOR_VIDEO_MAX_COUNT)} ویدیو می‌شود فرستاد.`)
    .refine((ids) => new Set(ids).size === ids.length, "یک ویدیو را دوبار نفرست."),
});

/*===== The Trainer's Answer =====*/
export const proposeInputSchema = z.object({
  sessions: z
    .number()
    .int("تعداد جلسه‌ها باید عدد صحیح باشد.")
    .min(1, "حداقل یک جلسه لازم است.")
    .max(BEHAVIOR_PLAN_MAX_SESSIONS, `حداکثر ${formatNumberFa(BEHAVIOR_PLAN_MAX_SESSIONS)} جلسه.`),
  /** Rial. The form shows toman; this is the amount that moves. */
  price: z
    .number()
    .int("مبلغ را درست بنویس.")
    .min(BEHAVIOR_PLAN_MIN_PRICE, `مبلغ حداقل ${formatNumberFa(BEHAVIOR_PLAN_MIN_PRICE / 10)} تومان است.`)
    .max(BEHAVIOR_PLAN_MAX_PRICE, `مبلغ حداکثر ${formatNumberFa(BEHAVIOR_PLAN_MAX_PRICE / 10)} تومان است.`),
  note: requiredText({
    max: BEHAVIOR_TRAINER_NOTE_MAX_LENGTH,
    empty: "برنامه را برای صاحب سگ توضیح بده.",
    tooLong: `توضیح حداکثر ${formatNumberFa(BEHAVIOR_TRAINER_NOTE_MAX_LENGTH)} حرف است.`,
  }),
});

export const declineInputSchema = z.object({
  reason: requiredText({
    max: BEHAVIOR_TRAINER_NOTE_MAX_LENGTH,
    empty: "دلیل را بنویس؛ صاحب سگ آن را می‌بیند.",
    tooLong: `دلیل حداکثر ${formatNumberFa(BEHAVIOR_TRAINER_NOTE_MAX_LENGTH)} حرف است.`,
  }),
});

/*===== Listing =====*/
export const trainerListInputSchema = z.object({
  status: z.enum(BEHAVIOR_REQUEST_STATUSES, { error: "وضعیت را درست انتخاب کن." }).optional(),
});

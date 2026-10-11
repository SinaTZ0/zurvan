import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import { TRAINING_GOALS } from "~/orpc/assessment/constants";
import { ENROLLMENT_KINDS, ENROLLMENT_REASON_MAX_LENGTH } from "~/orpc/enrollment/constants";
import {
  BOOKING_ADDRESS_MAX_LENGTH,
  BOOKING_PREFERRED_TIMES_MAX_LENGTH,
  DISCOUNT_CODE_MAX_LENGTH,
} from "~/orpc/order/constants";

/*===== Booking =====*/
// The course, the dog and the assessment are I/O, so the service checks them. Whether an address is needed depends on
// boarding, which the course decides is allowed.
export const bookInputSchema = z.object({
  courseSlug: z.string(),
  kind: z.enum(ENROLLMENT_KINDS, { error: "دوره یا تست را انتخاب کن." }),
  dogId: z.string(),
  trainingGoal: z.enum(TRAINING_GOALS, { error: "هدف آموزش را انتخاب کن." }),
  boarding: z.boolean(),
  address: z
    .string()
    .trim()
    .max(BOOKING_ADDRESS_MAX_LENGTH, `نشانی حداکثر ${formatNumberFa(BOOKING_ADDRESS_MAX_LENGTH)} حرف است.`)
    .nullish()
    .transform((value) => value || null),
  preferredTimes: z
    .string()
    .trim()
    .min(1, "بنویس چه روزها و ساعت‌هایی برایت مناسب است.")
    .max(
      BOOKING_PREFERRED_TIMES_MAX_LENGTH,
      `این متن حداکثر ${formatNumberFa(BOOKING_PREFERRED_TIMES_MAX_LENGTH)} حرف است.`,
    ),
  /** The customer saw that the dog has passed this course and wants it again (spec 3.4). */
  confirmRetake: z.boolean().optional().default(false),
  /** The assessment that recommended it, when booked from the dog's page. */
  assessmentId: z
    .string()
    .nullish()
    .transform((value) => value || null),
});

export type BookInput = z.output<typeof bookInputSchema>;

/*===== Discount Code =====*/
/** Codes are matched case-insensitively and typed with stray spaces, so they are trimmed and upper-cased. */
export const discountCodeInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "کد تخفیف را بنویس.")
    .max(DISCOUNT_CODE_MAX_LENGTH, "این کد تخفیف معتبر نیست.")
    .transform((value) => value.toUpperCase()),
});

/*===== Cancelling =====*/
export const cancelInputSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(ENROLLMENT_REASON_MAX_LENGTH, `دلیل حداکثر ${formatNumberFa(ENROLLMENT_REASON_MAX_LENGTH)} حرف است.`)
    .nullish()
    .transform((value) => value || null),
});

/** The trainer or the Admin must say why: the customer gets it by SMS. */
export const staffCancelInputSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "دلیل لغو را بنویس؛ صاحب سگ آن را می‌بیند.")
    .max(ENROLLMENT_REASON_MAX_LENGTH, `دلیل حداکثر ${formatNumberFa(ENROLLMENT_REASON_MAX_LENGTH)} حرف است.`),
});

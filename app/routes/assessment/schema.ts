import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import {
  ASSESSMENT_CUSTOMER_NOTE_MAX_LENGTH,
  ASSESSMENT_PLACE_MAX_LENGTH,
  MEETING_PLACE_KINDS,
  TRAINING_GOALS,
} from "~/orpc/assessment/constants";

/*===== Booking Form =====*/
// Written for the person filling it in. The server checks everything again (`app/orpc/assessment/validation.ts`), and
// the two are kept separate on purpose (docs/frontend-guideline.md, "Forms"). Radios that nothing is checked in read as
// `null`, not `""`, so every radio field carries its own message for that case.

export const bookingFormSchema = z.object({
  dogId: z.string({ error: "کدام سگ؟ یکی را انتخاب کن." }).min(1, "کدام سگ؟ یکی را انتخاب کن."),
  trainingGoal: z.enum(TRAINING_GOALS, { error: "برای چه می‌خواهی؟ یکی را انتخاب کن." }),
  customerNote: z
    .string()
    .trim()
    .min(1, "بنویس چه چیزی را می‌خواهی تغییر بدهی.")
    .max(
      ASSESSMENT_CUSTOMER_NOTE_MAX_LENGTH,
      `این متن حداکثر ${formatNumberFa(ASSESSMENT_CUSTOMER_NOTE_MAX_LENGTH)} حرف است.`,
    ),
  placeKind: z.enum(MEETING_PLACE_KINDS, { error: "کجا ببینمش؟ یکی را انتخاب کن." }),
  place: z
    .string()
    .trim()
    .min(1, "نشانی یا محل دیدار را بنویس.")
    .max(ASSESSMENT_PLACE_MAX_LENGTH, `نشانی حداکثر ${formatNumberFa(ASSESSMENT_PLACE_MAX_LENGTH)} حرف است.`),
  slotId: z.string({ error: "یک وقت انتخاب کن." }).min(1, "یک وقت انتخاب کن."),
});

export type BookingFormInput = z.input<typeof bookingFormSchema>;
export type BookingFormValues = z.output<typeof bookingFormSchema>;

/** The form's starting values; `dogId` is set when a dog is preselected. */
export function toFormDefaults({ dogId }: { dogId: string }): BookingFormInput {
  return { dogId, trainingGoal: "home", customerNote: "", placeKind: "home", place: "", slotId: "" };
}

/** Where the server's field errors belong in this form. */
export const BOOKING_FORM_FIELDS = new Set<string>(Object.keys(bookingFormSchema.shape));

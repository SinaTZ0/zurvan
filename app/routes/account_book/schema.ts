import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import { TRAINING_GOALS } from "~/orpc/assessment/constants";
import { BOOKING_ADDRESS_MAX_LENGTH, BOOKING_PREFERRED_TIMES_MAX_LENGTH } from "~/orpc/order/constants";

/*===== Booking Form =====*/
// Written for the person filling it in. The server checks everything again (`app/orpc/order/validation.ts`), and the
// two are kept separate on purpose (docs/frontend-guideline.md, "Forms"). Radios that nothing is checked in read as
// `null`, not `""`, so every radio field carries its own message for that case.

/** Where the sessions happen. Boarding is the owner's kennel: no address, and a test never offers it. */
export const BOOKING_PLACES = ["home", "boarding"] as const;

export type BookingPlace = (typeof BOOKING_PLACES)[number];

/**
 * The schema knows which dogs would be retaking a course they passed, because the confirmation is only required for
 * those: a checkbox the customer never sees must not block them.
 */
export function createBookingFormSchema({ retakeDogIds }: { retakeDogIds: ReadonlySet<string> }) {
  return z
    .object({
      dogId: z.string({ error: "کدام سگ؟ یکی را انتخاب کن." }).min(1, "کدام سگ؟ یکی را انتخاب کن."),
      place: z.enum(BOOKING_PLACES, { error: "جلسه‌ها کجا باشد؟ یکی را انتخاب کن." }),
      address: z
        .string()
        .trim()
        .max(BOOKING_ADDRESS_MAX_LENGTH, `نشانی حداکثر ${formatNumberFa(BOOKING_ADDRESS_MAX_LENGTH)} حرف است.`),
      preferredTimes: z
        .string()
        .trim()
        .min(1, "بنویس چه روزها و ساعت‌هایی برایت مناسب است.")
        .max(
          BOOKING_PREFERRED_TIMES_MAX_LENGTH,
          `این متن حداکثر ${formatNumberFa(BOOKING_PREFERRED_TIMES_MAX_LENGTH)} حرف است.`,
        ),
      trainingGoal: z.enum(TRAINING_GOALS, { error: "برای چه می‌خواهی؟ یکی را انتخاب کن." }),
      confirmRetake: z.boolean(),
    })
    .superRefine((value, context) => {
      if (value.place === "home" && !value.address) {
        context.addIssue({ code: "custom", path: ["address"], message: "نشانی محل جلسه‌ها را بنویس." });
      }
      if (retakeDogIds.has(value.dogId) && !value.confirmRetake) {
        context.addIssue({
          code: "custom",
          path: ["confirmRetake"],
          message: "برای دوباره گرفتنش تأیید کن.",
        });
      }
    });
}

export type BookingFormSchema = ReturnType<typeof createBookingFormSchema>;
export type BookingFormInput = z.input<BookingFormSchema>;
export type BookingFormValues = z.output<BookingFormSchema>;

/** The form's starting values. */
export function toFormDefaults({ dogId }: { dogId: string }): BookingFormInput {
  return {
    dogId,
    place: "home",
    address: "",
    preferredTimes: "",
    trainingGoal: "home",
    confirmRetake: false,
  };
}

/** The server names `boarding` where the form names `place`; every other field is the same. */
export function toFormField(serverField: string): keyof BookingFormInput | null {
  if (serverField === "boarding") return "place";
  return serverField in toFormDefaults({ dogId: "" }) ? (serverField as keyof BookingFormInput) : null;
}

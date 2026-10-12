import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import {
  BEHAVIOR_ADDRESS_MAX_LENGTH,
  BEHAVIOR_DESCRIPTION_MAX_LENGTH,
  BEHAVIOR_PREFERRED_TIMES_MAX_LENGTH,
  BEHAVIOR_PROBLEM_CATEGORIES,
} from "~/orpc/behavior-request/constants";

/*===== Request Form =====*/
// Written for the person filling it in. The server checks everything again (`app/orpc/behavior-request/validation.ts`).
// The videos are not in this schema: they live in the uploader, which the form checks itself, because they are
// uploaded one by one before the form is sent.

export const requestFormSchema = z.object({
  dogId: z.string({ error: "کدام سگ؟ یکی را انتخاب کن." }).min(1, "کدام سگ؟ یکی را انتخاب کن."),
  problemCategory: z.enum(BEHAVIOR_PROBLEM_CATEGORIES, { error: "نوع مشکل را انتخاب کن." }),
  description: z
    .string()
    .trim()
    .min(1, "مشکل را برای آرمان توضیح بده.")
    .max(BEHAVIOR_DESCRIPTION_MAX_LENGTH, `توضیح حداکثر ${formatNumberFa(BEHAVIOR_DESCRIPTION_MAX_LENGTH)} حرف است.`),
  address: z
    .string()
    .trim()
    .min(1, "نشانی محل جلسه‌ها را بنویس.")
    .max(BEHAVIOR_ADDRESS_MAX_LENGTH, `نشانی حداکثر ${formatNumberFa(BEHAVIOR_ADDRESS_MAX_LENGTH)} حرف است.`),
  preferredTimes: z
    .string()
    .trim()
    .min(1, "بنویس چه روزها و ساعت‌هایی برایت مناسب است.")
    .max(
      BEHAVIOR_PREFERRED_TIMES_MAX_LENGTH,
      `این متن حداکثر ${formatNumberFa(BEHAVIOR_PREFERRED_TIMES_MAX_LENGTH)} حرف است.`,
    ),
});

export type RequestFormInput = z.input<typeof requestFormSchema>;
export type RequestFormValues = z.output<typeof requestFormSchema>;

/** Nothing is chosen at first, so every field starts empty; `dogId` is set when a dog is preselected. */
export function toRequestFormDefaults({ dogId }: { dogId: string }): Partial<RequestFormInput> {
  return { dogId, description: "", address: "", preferredTimes: "" };
}

/** Where the server's field errors belong in this form (the videos are handled by the uploader). */
export const REQUEST_FORM_FIELDS = new Set<string>(Object.keys(requestFormSchema.shape));

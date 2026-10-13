import { z } from "zod";

import { toLatinDigits } from "~/lib/digits";

/*===== Setting Form =====*/
// One text field holding a whole number. It is a string because the Admin types it with a Persian keyboard: Persian and
// Arabic-Indic digits are accepted and normalized, anything else (a decimal point, a minus, letters) is refused. The
// bounds come from the loader (the API's own definition of the setting), the message is written for him here. The
// server checks everything again (`app/orpc/setting/validation.ts`); the two are kept separate on purpose
// (docs/frontend-guideline.md, "Forms").

export type SettingFormInput = { value: string };
export type SettingFormValues = { value: number };

/**
 * The schema for one setting's field.
 *
 * @param min The lowest value the API accepts.
 * @param max The highest value the API accepts.
 * @param message What the field says for an empty, non-whole or out-of-range value.
 */
export function createSettingFormSchema({ min, max, message }: { min: number; max: number; message: string }) {
  return z.object({
    value: z
      .string()
      .transform((raw) => toLatinDigits(raw.trim()))
      .refine((digits) => /^\d{1,4}$/.test(digits) && Number(digits) >= min && Number(digits) <= max, message)
      .transform(Number),
  });
}

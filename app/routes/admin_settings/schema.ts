import { z } from "zod";

import { toLatinDigits } from "~/lib/digits";
import { commissionTiersError } from "~/orpc/commission/validation";

/*===== Setting Form =====*/
// One text field holding a whole number. It is a string because the Admin types it with a Persian keyboard: Persian and
// Arabic-Indic digits are accepted and normalized, anything else (a decimal point, a minus, letters) is refused. The
// bounds come from the API (the API's own definition of the setting), the message is written for him here. The
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

/*===== Commission Steps Form =====*/
// The same kind of fields, one pair per step. Each field only has to be a whole number; whether the steps make a table
// (the first from customer 1, each later one from a later customer, every percent 1 to 50) is the server's own rule,
// `commissionTiersError`, which is browser-safe, so the page shows its message as he types. The server checks again.

export type CommissionTiersFormInput = { tiers: { fromCustomer: string; percent: string }[] };
export type CommissionTiersFormValues = { tiers: { fromCustomer: number; percent: number }[] };

const wholeNumber = z
  .string()
  .transform((raw) => toLatinDigits(raw.trim()))
  .refine((digits) => /^\d{1,4}$/.test(digits), "همه‌ی خونه‌ها یه عدد صحیح لازم دارن.")
  .transform(Number);

export const commissionTiersFormSchema = z
  .object({ tiers: z.array(z.object({ fromCustomer: wholeNumber, percent: wholeNumber })) })
  .superRefine(({ tiers }, context) => {
    const error = commissionTiersError(tiers);
    if (error) context.addIssue({ code: "custom", message: error, path: ["tiers"] });
  });

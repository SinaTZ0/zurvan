import { z } from "zod";

import { formatNumberFa, toLatinDigits } from "~/lib/digits";
import { PET_AGE_MAX_YEARS, PET_BREED_MAX_LENGTH, PET_NAME_MAX_LENGTH, PET_SPECIES } from "~/orpc/pet/constants";

/*===== Add Pet Form =====*/
// Written for the form, not derived from the API's validation: the age arrives as text (Persian or
// Arabic digits allowed) and is converted here.
export const addPetFormSchema = z.object({
  species: z.enum(PET_SPECIES, { error: "گونه حیوان را انتخاب کنید." }),
  name: z
    .string()
    .trim()
    .min(1, "نام حیوان را وارد کنید.")
    .max(PET_NAME_MAX_LENGTH, `نام حیوان حداکثر ${formatNumberFa(PET_NAME_MAX_LENGTH)} حرف است.`),
  breed: z
    .string()
    .trim()
    .max(PET_BREED_MAX_LENGTH, `نژاد حداکثر ${formatNumberFa(PET_BREED_MAX_LENGTH)} حرف است.`),
  ageYears: z
    .string()
    .trim()
    .transform(toLatinDigits)
    .refine((value) => value === "" || /^\d{1,3}$/.test(value), "سن را فقط با عدد وارد کنید، مثلاً ۳.")
    .transform((value) => (value === "" ? undefined : Number(value)))
    .refine(
      (value) => value === undefined || value <= PET_AGE_MAX_YEARS,
      `سن حداکثر ${formatNumberFa(PET_AGE_MAX_YEARS)} سال است.`,
    ),
});

export type AddPetFormInput = z.input<typeof addPetFormSchema>;
export type AddPetFormOutput = z.output<typeof addPetFormSchema>;

import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import { PET_AGE_MAX_YEARS, PET_BREED_MAX_LENGTH, PET_NAME_MAX_LENGTH, PET_SPECIES } from "~/orpc/pet/constants";

/*===== New Pet =====*/
// Domain rules for a pet. Messages are user-facing because they surface as field errors.
export const newPetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "نام حیوان را وارد کنید.")
    .max(PET_NAME_MAX_LENGTH, `نام حیوان حداکثر ${formatNumberFa(PET_NAME_MAX_LENGTH)} حرف است.`),
  species: z.enum(PET_SPECIES, { error: "گونه حیوان را انتخاب کنید." }),
  // Empty text means "not given", so store null instead of "".
  breed: z
    .string()
    .trim()
    .max(PET_BREED_MAX_LENGTH, `نژاد حداکثر ${formatNumberFa(PET_BREED_MAX_LENGTH)} حرف است.`)
    .optional()
    .transform((value) => value || null),
  ageYears: z
    .number()
    .int("سن باید عدد صحیح باشد.")
    .min(0, "سن نمی‌تواند منفی باشد.")
    .max(PET_AGE_MAX_YEARS, `سن حداکثر ${formatNumberFa(PET_AGE_MAX_YEARS)} سال است.`)
    .optional()
    .transform((value) => value ?? null),
});

export type NewPet = z.output<typeof newPetSchema>;

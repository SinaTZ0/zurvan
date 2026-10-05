import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors } from "~/orpc/errors";
import { authErrors } from "~/orpc/middleware/auth/auth.errors";
import { PET_SPECIES } from "~/orpc/pet/constants";

/*===== Schemas =====*/
export const petSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.enum(PET_SPECIES),
  breed: z.string().nullable(),
  ageYears: z.number().int().nullable(),
  createdAt: z.date(),
});

export type Pet = z.infer<typeof petSchema>;

// Structure only. Trimming, allowed species, and limits are checked by `validation.ts`.
const createPetInputSchema = z.strictObject({
  name: z.string(),
  species: z.string(),
  breed: z.string().optional(),
  ageYears: z.number().optional(),
});

/*===== Procedures =====*/
export const listPetsContract = oc.errors({ ...commonErrors, ...authErrors }).output(z.array(petSchema));

export const createPetContract = oc
  .errors({ ...commonErrors, ...authErrors })
  .input(createPetInputSchema)
  .output(petSchema);

export const petContract = {
  list: listPetsContract,
  create: createPetContract,
};

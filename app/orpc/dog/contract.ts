import { oc } from "@orpc/contract";
import { z } from "zod";

import { DOG_SEXES, VACCINATION_STATUSES } from "~/orpc/dog/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
export const dogSchema = z.object({
  id: z.string(),
  name: z.string(),
  breed: z.string().nullable(),
  sex: z.enum(DOG_SEXES),
  /** `YYYY-MM-DD`, Gregorian. Age is calculated from it. */
  birthDate: z.string(),
  /** The owner gave an age, not a date, so `birthDate` is an estimate. */
  birthDateApproximate: z.boolean(),
  weightKg: z.number(),
  isNeutered: z.boolean(),
  microchipNumber: z.string().nullable(),
  vaccinationStatus: z.enum(VACCINATION_STATUSES),
  behaviorNotes: z.string().nullable(),
  medicalNotes: z.string().nullable(),
  /** `YYYY-MM-DD`. Set by a trainer or the Admin for a dog they already know. */
  knownSince: z.string().nullable(),
  /** Whether the dog has a record, so it can book its next course directly instead of starting with an assessment. */
  hasRecord: z.boolean(),
  createdAt: z.date(),
});

export type Dog = z.infer<typeof dogSchema>;

// Structure only. Trimming, empty-to-null, Persian digits, limits, the date rules and the allowed values are checked by
// `validation.ts`. `knownSince` is deliberately absent: customers can never set it, and `strictObject` rejects it.
const dogInputShape = {
  name: z.string(),
  breed: z.string().nullish(),
  sex: z.string(),
  birthDate: z.string(),
  birthDateApproximate: z.boolean().optional(),
  weightKg: z.number(),
  isNeutered: z.boolean(),
  microchipNumber: z.string().nullish(),
  vaccinationStatus: z.string().optional(),
  behaviorNotes: z.string().nullish(),
  medicalNotes: z.string().nullish(),
};

const createDogInputSchema = z.strictObject(dogInputShape);
const updateDogInputSchema = z.strictObject({ id: z.string(), ...dogInputShape });
const dogIdInputSchema = z.strictObject({ id: z.string() });

/*===== Errors =====*/
// Maps to HTTP 404 through oRPC's default status map. Also the answer for another owner's dog, a removed one and a
// malformed id, so the API never reveals that a dog exists.
const dogErrors = {
  NOT_FOUND: {
    message: "Dog not found.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
export const listDogsContract = oc.errors(baseErrors).output(z.array(dogSchema));

export const getDogContract = oc
  .errors({ ...baseErrors, ...dogErrors })
  .input(dogIdInputSchema)
  .output(dogSchema);

export const createDogContract = oc.errors(baseErrors).input(createDogInputSchema).output(dogSchema);

export const updateDogContract = oc
  .errors({ ...baseErrors, ...dogErrors })
  .input(updateDogInputSchema)
  .output(dogSchema);

export const removeDogContract = oc
  .errors({ ...baseErrors, ...dogErrors })
  .input(dogIdInputSchema)
  .output(z.object({ id: z.string() }));

export const dogContract = {
  list: listDogsContract,
  get: getDogContract,
  create: createDogContract,
  update: updateDogContract,
  remove: removeDogContract,
};

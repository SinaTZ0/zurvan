import { oc } from "@orpc/contract";
import { z } from "zod";

import { DOG_SEXES, VACCINATION_STATUSES } from "~/orpc/dog/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { mediaSchema } from "~/orpc/media/contract";
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
  /** F3: any of its evaluations is `evaluated`. Courses can only be bought once it is, and the birth date and breed lock. */
  isEvaluated: z.boolean(),
  /** F2: completed on the site, or marked by the Admin. Only the Admin edits them. */
  passedCourses: z.array(z.object({ slug: z.string(), title: z.string(), source: z.enum(["enrollment", "admin"]) })),
  /** Null until the owner adds one. */
  photo: mediaSchema.nullable(),
  createdAt: z.date(),
});

export type Dog = z.infer<typeof dogSchema>;

/** A dog as the Admin sees it: with its owner. */
export const adminDogSchema = dogSchema.extend({
  owner: z.object({ id: z.string(), name: z.string(), phoneNumber: z.string().nullable() }),
});

export type AdminDog = z.infer<typeof adminDogSchema>;

// Structure only. Trimming, empty-to-null, Persian digits, limits, the date rules and the allowed values are checked by
// `validation.ts`. `isEvaluated` and the passed courses are deliberately absent: customers can never set them, and `strictObject` rejects them.
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
  /** The ID of an image uploaded with `media.upload` (kind `dog`). Left out keeps the photo; `null` removes it. */
  photoMediaId: z.string().nullish(),
};

// The Admin edits any dog's details, but not its photo, which is the owner's upload.
const { photoMediaId: _photoMediaId, ...adminDogInputShape } = dogInputShape;

const createDogInputSchema = z.strictObject(dogInputShape);
const updateDogInputSchema = z.strictObject({ id: z.string(), ...dogInputShape });
const adminUpdateDogInputSchema = z.strictObject({ id: z.string(), ...adminDogInputShape });
const dogIdInputSchema = z.strictObject({ id: z.string() });
const setPassedCourseInputSchema = z.strictObject({ dogId: z.string(), courseSlug: z.string(), passed: z.boolean() });

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

/*===== Admin Procedures =====*/
export const adminListDogsContract = oc.errors(baseErrors).output(z.array(adminDogSchema));

export const adminGetDogContract = oc
  .errors({ ...baseErrors, ...dogErrors })
  .input(dogIdInputSchema)
  .output(adminDogSchema);

export const adminUpdateDogContract = oc
  .errors({ ...baseErrors, ...dogErrors })
  .input(adminUpdateDogInputSchema)
  .output(adminDogSchema);

/** Marks a course as passed for a dog the Admin already knows, or takes the mark off. */
export const setPassedCourseContract = oc
  .errors({ ...baseErrors, ...dogErrors })
  .input(setPassedCourseInputSchema)
  .output(adminDogSchema);

export const dogContract = {
  list: listDogsContract,
  get: getDogContract,
  create: createDogContract,
  update: updateDogContract,
  admin: {
    list: adminListDogsContract,
    get: adminGetDogContract,
    update: adminUpdateDogContract,
    setPassedCourse: setPassedCourseContract,
  },
};

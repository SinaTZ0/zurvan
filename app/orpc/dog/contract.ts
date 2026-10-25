import { oc } from "@orpc/contract";
import { z } from "zod";

import { qrLinkSchema } from "~/lib/qr";
import { DOG_BREED_PURITIES, DOG_SEXES, DOG_TRAINING_GOALS, VACCINATION_STATUSES } from "~/orpc/dog/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { mediaSchema } from "~/orpc/media/contract";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
export const dogSchema = z.object({
  id: z.string(),
  /** `ZD-` and ten characters; printed on the dog's QR code and certificates. Stable. */
  fileNumber: z.string(),
  name: z.string(),
  /** Null for a dog written before it was asked, until the Admin fills it in. */
  breedPurity: z.enum(DOG_BREED_PURITIES).nullable(),
  /** A purebred's breed, one parent of a cross, or what a mixed dog looks like. */
  breed: z.string().nullable(),
  /** The other parent of a cross; null otherwise. */
  breedSecondary: z.string().nullable(),
  sex: z.enum(DOG_SEXES),
  /** `YYYY-MM-DD`, Gregorian. Age is calculated from it. */
  birthDate: z.string(),
  /** The owner gave an age, not a date, so `birthDate` is an estimate. */
  birthDateApproximate: z.boolean(),
  weightKg: z.number(),
  isNeutered: z.boolean(),
  heightCm: z.number().nullable(),
  coatColor: z.string().nullable(),
  markings: z.string().nullable(),
  microchipNumber: z.string().nullable(),
  /** `YYYY-MM-DD`, Gregorian. */
  microchipImplantedOn: z.string().nullable(),
  vaccinationStatus: z.enum(VACCINATION_STATUSES),
  vaccinationNotes: z.string().nullable(),
  trainingGoals: z.array(z.enum(DOG_TRAINING_GOALS)),
  /** One problem per entry; shown above the diary. */
  behaviorProblems: z.array(z.string()),
  behaviorNotes: z.string().nullable(),
  medicalNotes: z.string().nullable(),
  /** F3: any of its evaluations is `evaluated`. Courses can only be bought once it is, and the birth date and breed lock. */
  isEvaluated: z.boolean(),
  /** F2: completed on the site, or marked by the Admin. Only the Admin edits them. */
  passedCourses: z.array(z.object({ slug: z.string(), title: z.string(), source: z.enum(["enrollment", "admin"]) })),
  /** Null until the owner adds one. */
  photo: mediaSchema.nullable(),
  /** The photos in the dog's file, each list in the owner's order. Only the owner adds them. */
  vaccinationPhotos: z.array(mediaSchema),
  medicalPhotos: z.array(mediaSchema),
  tattooPhoto: mediaSchema.nullable(),
  createdAt: z.date(),
});

export type Dog = z.infer<typeof dogSchema>;

/** A dog as the Admin sees it: with its owner. */
export const adminDogSchema = dogSchema.extend({
  owner: z.object({ id: z.string(), name: z.string(), phoneNumber: z.string().nullable() }),
});

export type AdminDog = z.infer<typeof adminDogSchema>;

/** The public address of a dog's record and that address as a QR code: the file card on its detail pages. */
const fileCardShape = { fileCard: qrLinkSchema };

/** One dog, as its detail pages open it. */
export const dogDetailSchema = dogSchema.extend(fileCardShape);

export const adminDogDetailSchema = adminDogSchema.extend(fileCardShape);

// Structure only. Trimming, empty-to-null, Persian digits, limits, the date rules and the allowed values are checked by
// `validation.ts`. `isEvaluated` and the passed courses are deliberately absent: customers can never set them, and `strictObject` rejects them.
const dogInputShape = {
  name: z.string(),
  breedPurity: z.string().nullish(),
  breed: z.string().nullish(),
  breedSecondary: z.string().nullish(),
  sex: z.string(),
  birthDate: z.string(),
  birthDateApproximate: z.boolean().optional(),
  weightKg: z.number(),
  isNeutered: z.boolean(),
  heightCm: z.number().nullish(),
  coatColor: z.string().nullish(),
  markings: z.string().nullish(),
  microchipNumber: z.string().nullish(),
  microchipImplantedOn: z.string().nullish(),
  vaccinationStatus: z.string().optional(),
  vaccinationNotes: z.string().nullish(),
  /** Left out keeps the stored goals. */
  trainingGoals: z.array(z.string()).optional(),
  /** One problem per entry. Left out keeps the stored ones. */
  behaviorProblems: z.array(z.string()).optional(),
  behaviorNotes: z.string().nullish(),
  medicalNotes: z.string().nullish(),
  /** The ID of an image uploaded with `media.upload` (kind `dog`). Left out keeps the photo; `null` removes it. */
  photoMediaId: z.string().nullish(),
  /**
   * IDs of images uploaded with `media.upload` (kind `record`), in order. Left out keeps the stored photos; the list
   * replaces them, and the ones no longer listed are deleted.
   */
  vaccinationPhotoIds: z.array(z.string()).optional(),
  medicalPhotoIds: z.array(z.string()).optional(),
  /** At most one. */
  tattooPhotoIds: z.array(z.string()).optional(),
};

// The Admin edits any dog's details, but not its photos, which are the owner's uploads.
const {
  photoMediaId: _photoMediaId,
  vaccinationPhotoIds: _vaccinationPhotoIds,
  medicalPhotoIds: _medicalPhotoIds,
  tattooPhotoIds: _tattooPhotoIds,
  ...adminDogInputShape
} = dogInputShape;

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
  .output(dogDetailSchema);

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
  .output(adminDogDetailSchema);

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

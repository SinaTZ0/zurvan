import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** Where a signed-in person should go for a dog file number: their own dog's page, or the Admin's page for any dog. */
export const locatedDogSchema = z.object({ path: z.string() }).nullable();

export type LocatedDog = z.infer<typeof locatedDogSchema>;

/** One session in a dog's diary, as its owner and the Admin read it. */
export const logbookEntrySchema = z.object({
  id: z.string(),
  dogId: z.string(),
  /** `YYYY-MM-DD`, Gregorian: the day of the session. */
  occurredOn: z.string(),
  notes: z.string(),
  exercises: z.array(z.string()),
  progress: z.string().nullable(),
  /** The trainer marked it as showable on the public record (only if the owner makes the record public). */
  isPublic: z.boolean(),
  /** The course the session belongs to, when it belongs to one. */
  course: z.object({ slug: z.string(), title: z.string() }).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LogbookEntry = z.infer<typeof logbookEntrySchema>;

/** Whether the owner can make the dog's record public, and whether it is. */
export const publicStatusSchema = z.object({
  /** Approved consent wording exists, so the owner can be offered the choice. False means the record can only be private. */
  available: z.boolean(),
  isPublic: z.boolean(),
  /** The wording's version in force; null when there is none. */
  version: z.string().nullable(),
  /** When the owner agreed, while the record is public. */
  since: z.date().nullable(),
});

export type PublicStatus = z.infer<typeof publicStatusSchema>;

/**
 * What anyone may see of a **public** record, built field by field (never from a whole row): the dog's name, breed and
 * age, the courses it finished, its valid certificates, and the diary entries the trainer marked public. No owner, no
 * phone, no address, no payment, no weight, no microchip, no notes about behavior or health, no photo, no exact birth date.
 */
export const publicRecordSchema = z.object({
  fileNumber: z.string(),
  dog: z.object({ name: z.string(), breed: z.string().nullable(), ageText: z.string() }),
  courses: z.array(z.object({ title: z.string(), latinName: z.string(), completedAt: z.date() })),
  certificates: z.array(z.object({ number: z.string(), courseTitle: z.string(), issuedAt: z.date() })),
  entries: z.array(
    z.object({
      occurredOn: z.string(),
      notes: z.string(),
      exercises: z.array(z.string()),
      progress: z.string().nullable(),
      courseTitle: z.string().nullable(),
    }),
  ),
});

export type PublicRecord = z.infer<typeof publicRecordSchema>;

/** What the record page answers for anyone: the public record, or «private», the same for every other case. */
export const recordAnswerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("public"), record: publicRecordSchema }),
  z.object({ kind: z.literal("private") }),
]);

export type RecordAnswer = z.infer<typeof recordAnswerSchema>;

// Structure only; trimming, the date, the limits and whether the course is the dog's are checked by `validation.ts`.
const sessionShape = {
  /** An enrollment of this dog; left out or `null` when the session belongs to no course. */
  enrollmentId: z.string().nullish(),
  /** `YYYY-MM-DD`, Gregorian (Persian digits are accepted). Not in the future. */
  occurredOn: z.string(),
  notes: z.string(),
  /** One short line each; blank lines are dropped. */
  exercises: z.array(z.string()),
  progress: z.string().nullish(),
  isPublic: z.boolean(),
};

const dogIdInputSchema = z.strictObject({ dogId: z.string() });
const setPublicInputSchema = z.strictObject({ dogId: z.string(), isPublic: z.boolean() });
const recordInputSchema = z.strictObject({ fileNumber: z.string() });
const addEntryInputSchema = z.strictObject({ dogId: z.string(), ...sessionShape });
const updateEntryInputSchema = z.strictObject({ id: z.string(), ...sessionShape });

/*===== Errors =====*/
// Also the answer for another owner's dog, an entry that isn't there and a malformed id, so the API never reveals that
// either exists.
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

/** Making a record public when no approved consent wording exists: there is nothing to agree to, so nothing changes. */
const notPublishedError = {
  NOT_PUBLISHED: {
    message: "There is no consent wording to agree to.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
/**
 * Where the signed-in person's own view of the dog with this file number is, or `null`. The Admin gets any dog; a customer
 * only their own; anyone else, and a number that doesn't exist, get the same `null`, so this can't be used to find out
 * which numbers exist. The public record page uses it to send an owner who scans their own QR code to their dog's page.
 */
export const locateDogContract = oc
  .errors(baseErrors)
  .input(z.strictObject({ fileNumber: z.string() }))
  .output(locatedDogSchema);

/** The diary of one of the customer's own dogs, newest session first. */
export const listLogbookContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(dogIdInputSchema)
  .output(z.array(logbookEntrySchema));

/** The diary of any dog, for the Admin. */
export const adminListLogbookContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(dogIdInputSchema)
  .output(z.array(logbookEntrySchema));

/** Writes one session down. `INVALID_INPUT` carries a message per field; `NOT_FOUND` is a dog that doesn't exist. */
export const adminAddEntryContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(addEntryInputSchema)
  .output(logbookEntrySchema);

/** Corrects a session. The dog and the author stay as they were. */
export const adminUpdateEntryContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(updateEntryInputSchema)
  .output(logbookEntrySchema);

/** Whether the owner's dog record can be made public and whether it is. Only the owner's own dogs. */
export const publicStatusContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(dogIdInputSchema)
  .output(publicStatusSchema);

/**
 * Makes the owner's dog record public or private again. Public needs approved consent wording (`NOT_PUBLISHED` otherwise)
 * and records the owner's agreement with its version and time; private is always allowed and takes effect at once. The
 * record of having agreed stays.
 */
export const setPublicContract = oc
  .errors({ ...baseErrors, ...notFoundError, ...notPublishedError })
  .input(setPublicInputSchema)
  .output(publicStatusSchema);

/** Public: no sign-in. The record behind a file number if its owner made it public, otherwise «private», the same for every other case. */
export const recordContract = oc.errors(commonErrors).input(recordInputSchema).output(recordAnswerSchema);

export const logbookContract = {
  locate: locateDogContract,
  record: recordContract,
  list: listLogbookContract,
  publicStatus: publicStatusContract,
  setPublic: setPublicContract,
  admin: {
    list: adminListLogbookContract,
    add: adminAddEntryContract,
    update: adminUpdateEntryContract,
  },
};

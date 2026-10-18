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

export const logbookContract = {
  locate: locateDogContract,
  list: listLogbookContract,
  admin: {
    list: adminListLogbookContract,
    add: adminAddEntryContract,
    update: adminUpdateEntryContract,
  },
};

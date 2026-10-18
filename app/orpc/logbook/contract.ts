import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors } from "~/orpc/errors";
import { authErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** Where a signed-in person should go for a dog file number: their own dog's page, or the Admin's page for any dog. */
export const locatedDogSchema = z.object({ path: z.string() }).nullable();

export type LocatedDog = z.infer<typeof locatedDogSchema>;

/*===== Errors =====*/
const baseErrors = { ...commonErrors, ...authErrors };

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

export const logbookContract = {
  locate: locateDogContract,
};

import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** A certificate as the dog's owner and the Admin see it. */
export const certificateSchema = z.object({
  id: z.string(),
  /** `ZC-` and ten characters: what its QR code and verification page carry. */
  number: z.string(),
  enrollmentId: z.string(),
  course: z.object({ slug: z.string(), title: z.string(), latinName: z.string() }),
  dog: z.object({ id: z.string(), name: z.string() }),
  issuedAt: z.date(),
  /** Set when the Admin revoked it; the reason is his and is not in the API's answer. */
  revokedAt: z.date().nullable(),
});

export type Certificate = z.infer<typeof certificateSchema>;

/**
 * What the public verification page may say, for anyone holding a number. A valid certificate says which course and when;
 * a revoked one says only that it is revoked; a number that isn't one, or isn't any certificate's, says it wasn't found.
 * `dogName` is the dog's name **only if its owner has made the dog's record public**; otherwise null (F14).
 */
export const certificateVerificationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("valid"),
    number: z.string(),
    issuedAt: z.date(),
    course: z.object({ title: z.string(), latinName: z.string() }),
    dogName: z.string().nullable(),
  }),
  z.object({ kind: z.literal("revoked"), number: z.string(), revokedAt: z.date() }),
  z.object({ kind: z.literal("unknown") }),
]);

export type CertificateVerification = z.infer<typeof certificateVerificationSchema>;

const dogIdInputSchema = z.strictObject({ dogId: z.string() });
const issueInputSchema = z.strictObject({ enrollmentId: z.string() });
const revokeInputSchema = z.strictObject({ id: z.string(), reason: z.string() });
const verifyInputSchema = z.strictObject({ number: z.string() });

/*===== Errors =====*/
// Also the answer for another owner's dog, a certificate or enrollment that isn't there and a malformed id.
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const issueErrors = {
  ...notFoundError,
  /** The enrollment is not `completed`: a certificate is for a finished course. */
  NOT_COMPLETED: {
    message: "The enrollment is not completed.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
/** The certificates of one of the customer's own dogs, newest first. */
export const listMyCertificatesContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(dogIdInputSchema)
  .output(z.array(certificateSchema));

/** The certificates of any dog, for the Admin. */
export const adminListCertificatesContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(dogIdInputSchema)
  .output(z.array(certificateSchema));

/**
 * Issues the certificate of a **completed** enrollment. Issuing again is the same as issuing once: the existing
 * certificate comes back. `NOT_COMPLETED` for an enrollment that isn't finished.
 */
export const adminIssueCertificateContract = oc
  .errors({ ...baseErrors, ...issueErrors })
  .input(issueInputSchema)
  .output(certificateSchema);

/**
 * Revokes a certificate with a reason (required, kept private). Revoking one that is revoked is the same as once. The
 * certificate stays on record; its verification page says it is revoked.
 */
export const adminRevokeCertificateContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(revokeInputSchema)
  .output(certificateSchema);

/** Public: no sign-in. Whether a number is a valid certificate, and nothing private about the dog or its owner. */
export const verifyCertificateContract = oc
  .errors(commonErrors)
  .input(verifyInputSchema)
  .output(certificateVerificationSchema);

export const certificateContract = {
  listMine: listMyCertificatesContract,
  verify: verifyCertificateContract,
  admin: {
    list: adminListCertificatesContract,
    issue: adminIssueCertificateContract,
    revoke: adminRevokeCertificateContract,
  },
};

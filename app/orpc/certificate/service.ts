import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { normalizeCertificateNumber } from "~/lib/certificate";
import { issuesToErrorData } from "~/lib/schema-issues";
import { z } from "zod";
import type { Certificate, CertificateVerification } from "~/orpc/certificate/contract";
import { toCertificate } from "~/orpc/certificate/mapper";
import {
  findCertificateByEnrollment,
  findCertificateById,
  findCertificateByNumber,
  findCertificatesByDog,
  findEnrollmentForCertificate,
  insertCertificate,
  markRevoked,
} from "~/orpc/certificate/repository";
import { isDogId } from "~/orpc/dog/validation";
import { isUuid } from "~/lib/uuid";
import { findDogOwner } from "~/orpc/logbook/repository";

/*===== Types =====*/
type NotFoundResult = { kind: "not-found" };
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };

/** Why a certificate is revoked: the Admin's own note, private, kept with the record. */
const CERTIFICATE_REVOKE_REASON_MAX_LENGTH = 300;

/*===== Reading =====*/
type ListResult = { kind: "success"; certificates: Certificate[] } | NotFoundResult;

/** A dog's certificates for its owner. Another owner's dog, a made-up id and a malformed one all read as `not-found`. */
export async function listMyCertificates({
  db,
  ownerId,
  dogId,
}: {
  db: DatabaseOrTransaction;
  ownerId: string;
  dogId: string;
}): Promise<ListResult> {
  if (!isDogId(dogId)) return { kind: "not-found" };
  const found = await findDogOwner({ db, dogId });
  if (!found || found.ownerId !== ownerId) return { kind: "not-found" };
  return { kind: "success", certificates: (await findCertificatesByDog({ db, dogId })).map(toCertificate) };
}

/** A dog's certificates for the Admin. */
export async function adminListCertificates({
  db,
  dogId,
}: {
  db: DatabaseOrTransaction;
  dogId: string;
}): Promise<ListResult> {
  if (!isDogId(dogId) || !(await findDogOwner({ db, dogId }))) return { kind: "not-found" };
  return { kind: "success", certificates: (await findCertificatesByDog({ db, dogId })).map(toCertificate) };
}

/*===== Issuing and Revoking =====*/
type IssueResult = { kind: "success"; certificate: Certificate } | NotFoundResult | { kind: "not-completed" };

/**
 * Issues the certificate of a completed enrollment, as the Admin. Issuing again returns the one that exists (a unique
 * index holds one per enrollment, so two clicks make one). An enrollment that is active or cancelled is `not-completed`.
 */
export async function adminIssueCertificate({
  db,
  issuerId,
  enrollmentId,
  now = new Date(),
}: {
  db: Database;
  issuerId: string;
  enrollmentId: string;
  now?: Date;
}): Promise<IssueResult> {
  if (!isUuid(enrollmentId)) return { kind: "not-found" };
  const found = await findEnrollmentForCertificate({ db, enrollmentId });
  if (!found) return { kind: "not-found" };
  if (found.status !== "completed") return { kind: "not-completed" };

  await insertCertificate({ db, enrollmentId, issuedBy: issuerId, issuedAt: now });
  const saved = await findCertificateByEnrollment({ db, enrollmentId });
  if (!saved) throw new Error(`adminIssueCertificate: certificate for ${enrollmentId} could not be read back`);
  return { kind: "success", certificate: toCertificate(saved) };
}

type RevokeResult = { kind: "success"; certificate: Certificate } | NotFoundResult | InvalidResult;

const reasonSchema = z
  .string()
  .trim()
  .min(1, "دلیل باطل کردن را بنویس.")
  .max(CERTIFICATE_REVOKE_REASON_MAX_LENGTH, `دلیل حداکثر ${CERTIFICATE_REVOKE_REASON_MAX_LENGTH} حرف است.`);

/** Revokes a certificate with a reason. Revoking again keeps the first time and reason. */
export async function adminRevokeCertificate({
  db,
  id,
  reason,
  now = new Date(),
}: {
  db: Database;
  id: string;
  reason: string;
  now?: Date;
}): Promise<RevokeResult> {
  if (!isUuid(id)) return { kind: "not-found" };
  if (!(await findCertificateById({ db, id }))) return { kind: "not-found" };

  const parsed = reasonSchema.safeParse(reason);
  if (!parsed.success) {
    const { errors, fields } = issuesToErrorData(parsed.error.issues.map((issue) => ({ ...issue, path: ["reason"] })));
    return { kind: "invalid", errors, fields };
  }

  await markRevoked({ db, id, reason: parsed.data, revokedAt: now });
  const saved = await findCertificateById({ db, id });
  if (!saved) throw new Error(`adminRevokeCertificate: certificate ${id} could not be read back`);
  return { kind: "success", certificate: toCertificate(saved) };
}

/*===== Verifying =====*/
/**
 * What anyone holding a certificate number may be told. Valid: the course and the day. Revoked: only that it is. Not a
 * certificate number or not any certificate's: «unknown». The dog's name is left out (`dogName: null`): it is the dog's
 * owner's to publish, and no record can be public yet (F14).
 */
export async function verifyCertificate({
  db,
  number,
}: {
  db: DatabaseOrTransaction;
  number: string;
}): Promise<CertificateVerification> {
  const normalized = normalizeCertificateNumber(number);
  if (!normalized) return { kind: "unknown" };

  const found = await findCertificateByNumber({ db, number: normalized });
  if (!found) return { kind: "unknown" };

  if (found.certificate.revokedAt) {
    return { kind: "revoked", number: found.certificate.number, revokedAt: found.certificate.revokedAt };
  }
  return {
    kind: "valid",
    number: found.certificate.number,
    issuedAt: found.certificate.issuedAt,
    course: { title: found.course.title, latinName: found.course.latinName },
    dogName: null,
  };
}

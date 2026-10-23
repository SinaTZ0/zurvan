import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { recordAudit } from "~/lib/audit.server";
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
import { isRecordPublic, type PublicRecordRules } from "~/orpc/logbook/public";
import { findDogOwner } from "~/orpc/logbook/repository";
import type { Locale } from "~/paraglide/runtime";

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
  locale = "fa",
}: {
  db: DatabaseOrTransaction;
  ownerId: string;
  dogId: string;
  /** The language of the courses' names (the dog's page has an English one). */
  locale?: Locale;
}): Promise<ListResult> {
  if (!isDogId(dogId)) return { kind: "not-found" };
  const found = await findDogOwner({ db, dogId });
  if (!found || found.ownerId !== ownerId) return { kind: "not-found" };
  const rows = await findCertificatesByDog({ db, dogId });
  return { kind: "success", certificates: rows.map((row) => toCertificate(row, { locale })) };
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
  return {
    kind: "success",
    certificates: (await findCertificatesByDog({ db, dogId })).map((row) => toCertificate(row)),
  };
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

  // The certificate and its line in the audit trail stand or fall together; a second press writes neither again.
  const saved = await db.transaction(async (tx) => {
    const written = await insertCertificate({ db: tx, enrollmentId, issuedBy: issuerId, issuedAt: now });
    const row = await findCertificateByEnrollment({ db: tx, enrollmentId });
    if (!row) throw new Error(`adminIssueCertificate: certificate for ${enrollmentId} could not be read back`);
    if (written) {
      await recordAudit({
        db: tx,
        actorId: issuerId,
        action: "certificate.issued",
        entityType: "certificate",
        entityId: row.certificate.id,
        data: { number: row.certificate.number, enrollmentId },
      });
    }
    return row;
  });
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
  adminId,
  id,
  reason,
  now = new Date(),
}: {
  db: Database;
  adminId: string;
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

  const saved = await db.transaction(async (tx) => {
    const revoked = await markRevoked({ db: tx, id, reason: parsed.data, revokedAt: now });
    const row = await findCertificateById({ db: tx, id });
    if (!row) throw new Error(`adminRevokeCertificate: certificate ${id} could not be read back`);
    // The reason is the Admin's own and stays out of the trail; the trail says that it was revoked, by whom and when.
    if (revoked) {
      await recordAudit({
        db: tx,
        actorId: adminId,
        action: "certificate.revoked",
        entityType: "certificate",
        entityId: id,
        data: { number: row.certificate.number },
      });
    }
    return row;
  });
  return { kind: "success", certificate: toCertificate(saved) };
}

/*===== Verifying =====*/
/**
 * What anyone holding a certificate number may be told. Valid: the course and the day. Revoked: only that it is. Not a
 * certificate number or not any certificate's: «unknown». The dog's name is left out (`dogName: null`) unless its owner
 * has made the dog's record public (F14): the name is theirs to publish.
 */
export async function verifyCertificate({
  db,
  number,
  rules,
  locale = "fa",
}: {
  db: DatabaseOrTransaction;
  number: string;
  /** The public-record wording in force; the registry's by default. */
  rules?: PublicRecordRules;
  /** The language of the course's name (the check is a public page, with an English one). */
  locale?: Locale;
}): Promise<CertificateVerification> {
  const normalized = normalizeCertificateNumber(number);
  if (!normalized) return { kind: "unknown" };

  const found = await findCertificateByNumber({ db, number: normalized });
  if (!found) return { kind: "unknown" };

  if (found.certificate.revokedAt) {
    return { kind: "revoked", number: found.certificate.number, revokedAt: found.certificate.revokedAt };
  }
  const owner = await findDogOwner({ db, dogId: found.dog.id });
  const isPublic =
    owner !== undefined &&
    (await isRecordPublic({
      db,
      ownerId: owner.ownerId,
      dogId: found.dog.id,
      ...(rules === undefined ? {} : { rules }),
    }));
  return {
    kind: "valid",
    number: found.certificate.number,
    issuedAt: found.certificate.issuedAt,
    course: {
      title: locale === "en" && found.course.titleEn ? found.course.titleEn : found.course.title,
      latinName: found.course.latinName,
    },
    dogName: isPublic ? found.dog.name : null,
  };
}

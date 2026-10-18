import { and, desc, eq, isNull } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { certificate, course, dog, enrollment } from "~/db/schema";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type CertificateRecord = typeof certificate.$inferSelect;

export type CertificateRow = {
  certificate: CertificateRecord;
  course: { slug: string; title: string; latinName: string };
  dog: { id: string; name: string };
};

/*===== Reads =====*/
const selection = {
  certificate,
  course: { slug: course.slug, title: course.title, latinName: course.latinName },
  dog: { id: dog.id, name: dog.name },
};

/** A dog's certificates, newest first. */
export function findCertificatesByDog({ db, dogId }: Executor & { dogId: string }): Promise<CertificateRow[]> {
  return db
    .select(selection)
    .from(certificate)
    .innerJoin(enrollment, eq(certificate.enrollmentId, enrollment.id))
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .innerJoin(dog, eq(enrollment.dogId, dog.id))
    .where(eq(enrollment.dogId, dogId))
    .orderBy(desc(certificate.issuedAt), desc(certificate.id));
}

export async function findCertificateByNumber({
  db,
  number,
}: Executor & { number: string }): Promise<CertificateRow | undefined> {
  const [row] = await db
    .select(selection)
    .from(certificate)
    .innerJoin(enrollment, eq(certificate.enrollmentId, enrollment.id))
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .innerJoin(dog, eq(enrollment.dogId, dog.id))
    .where(eq(certificate.number, number));
  return row;
}

export async function findCertificateById({ db, id }: Executor & { id: string }): Promise<CertificateRow | undefined> {
  const [row] = await db
    .select(selection)
    .from(certificate)
    .innerJoin(enrollment, eq(certificate.enrollmentId, enrollment.id))
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .innerJoin(dog, eq(enrollment.dogId, dog.id))
    .where(eq(certificate.id, id));
  return row;
}

export async function findCertificateByEnrollment({
  db,
  enrollmentId,
}: Executor & { enrollmentId: string }): Promise<CertificateRow | undefined> {
  const [row] = await db
    .select(selection)
    .from(certificate)
    .innerJoin(enrollment, eq(certificate.enrollmentId, enrollment.id))
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .innerJoin(dog, eq(enrollment.dogId, dog.id))
    .where(eq(certificate.enrollmentId, enrollmentId));
  return row;
}

/** The enrollment's status and dog, for deciding whether a certificate can be issued. */
export async function findEnrollmentForCertificate({
  db,
  enrollmentId,
}: Executor & { enrollmentId: string }): Promise<{ id: string; status: string; dogId: string } | undefined> {
  const [row] = await db
    .select({ id: enrollment.id, status: enrollment.status, dogId: enrollment.dogId })
    .from(enrollment)
    .where(eq(enrollment.id, enrollmentId));
  return row;
}

/*===== Writes =====*/
/** Issues the certificate; one that already exists for the enrollment is left (a unique index decides). Returns whether a row was written. */
export async function insertCertificate({
  db,
  enrollmentId,
  issuedBy,
  issuedAt,
}: Executor & { enrollmentId: string; issuedBy: string; issuedAt: Date }): Promise<boolean> {
  const rows = await db
    .insert(certificate)
    .values({ enrollmentId, issuedBy, issuedAt })
    .onConflictDoNothing()
    .returning({ id: certificate.id });
  return rows.length > 0;
}

/**
 * Marks a certificate revoked, once: a conditional update, so an already revoked one keeps its first time and reason.
 * Returns whether this call revoked it.
 */
export async function markRevoked({
  db,
  id,
  reason,
  revokedAt,
}: Executor & { id: string; reason: string; revokedAt: Date }): Promise<boolean> {
  const rows = await db
    .update(certificate)
    .set({ revokedAt, revokedReason: reason })
    .where(and(eq(certificate.id, id), isNull(certificate.revokedAt)))
    .returning({ id: certificate.id });
  return rows.length > 0;
}

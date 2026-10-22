import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { course, dog, enrollment, media, user } from "~/db/schema";
import type { MediaRecord } from "~/orpc/media/repository";

/*===== Types =====*/
export type EnrollmentRow = {
  enrollment: typeof enrollment.$inferSelect;
  /** `titleEn` is null until the Admin writes it. */
  course: { slug: string; title: string; titleEn: string | null; latinName: string };
  dog: { id: string; name: string };
  dogPhoto: MediaRecord | null;
  customer: { id: string; name: string; phoneNumber: string | null };
};

/*===== Reads =====*/
/**
 * Enrollments with their course, dog and customer, filtered by any of `id`, `customerId`, `dogId` and `status`. Active
 * ones come first (they are the ones waiting for the Admin), then newest first.
 */
export function findEnrollments({
  db,
  id,
  customerId,
  dogId,
  status,
}: {
  db: DatabaseOrTransaction;
  id?: string;
  customerId?: string;
  dogId?: string;
  status?: string;
}): Promise<EnrollmentRow[]> {
  return db
    .select({
      enrollment,
      course: { slug: course.slug, title: course.title, titleEn: course.titleEn, latinName: course.latinName },
      dog: { id: dog.id, name: dog.name },
      dogPhoto: media,
      customer: { id: user.id, name: user.name, phoneNumber: user.phoneNumber },
    })
    .from(enrollment)
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .innerJoin(dog, eq(enrollment.dogId, dog.id))
    .innerJoin(user, eq(enrollment.customerId, user.id))
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .where(
      and(
        id ? eq(enrollment.id, id) : undefined,
        customerId ? eq(enrollment.customerId, customerId) : undefined,
        dogId ? eq(enrollment.dogId, dogId) : undefined,
        status ? eq(enrollment.status, status) : undefined,
      ),
    )
    .orderBy(sql`(${enrollment.status} = 'active') desc`, desc(enrollment.createdAt), asc(enrollment.id));
}

/*===== Writes =====*/
/**
 * Ends an active enrollment: a conditional update (F12, statuses only move forward), so completing and cancelling at
 * once can't both win.
 *
 * @returns Whether this call ended it.
 */
export async function endActiveEnrollment({
  db,
  id,
  status,
  now,
}: {
  db: DatabaseOrTransaction;
  id: string;
  status: "completed" | "cancelled";
  now: Date;
}): Promise<boolean> {
  const rows = await db
    .update(enrollment)
    .set(status === "completed" ? { status, completedAt: now } : { status, cancelledAt: now })
    .where(and(eq(enrollment.id, id), eq(enrollment.status, "active")))
    .returning({ id: enrollment.id });
  return rows.length > 0;
}

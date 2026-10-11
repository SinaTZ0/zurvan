import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { course, coursePrerequisite, refundPolicy } from "~/db/schema";

/*===== Types =====*/
export type CourseRecord = typeof course.$inferSelect;
export type RefundPolicyRecord = typeof refundPolicy.$inferSelect;

export type CourseWithRefundPolicyRecord = { course: CourseRecord; refundPolicy: RefundPolicyRecord };

/** One required course of `courseId`, with just what the storefront shows about it. */
export type PrerequisiteRecord = { courseId: string; slug: string; title: string; hasTest: boolean };

/*===== Reads =====*/
/** Lists every approved course in catalogue order. */
export function findApprovedCourses({ db }: { db: Database }): Promise<CourseRecord[]> {
  return db.select().from(course).where(eq(course.status, "approved")).orderBy(asc(course.position));
}

/** Finds the approved courses with these slugs, in catalogue order. A slug that isn't an approved course is left out. */
export function findApprovedCoursesBySlugs({
  db,
  slugs,
}: {
  db: DatabaseOrTransaction;
  slugs: string[];
}): Promise<CourseRecord[]> {
  if (slugs.length === 0) return Promise.resolve([]);

  return db
    .select()
    .from(course)
    .where(and(eq(course.status, "approved"), inArray(course.slug, slugs)))
    .orderBy(asc(course.position));
}

/** Finds one approved course by slug, joined with its refund policy. */
export async function findApprovedCourseBySlug({
  db,
  slug,
}: {
  db: Database;
  slug: string;
}): Promise<CourseWithRefundPolicyRecord | undefined> {
  const [row] = await db
    .select({ course, refundPolicy })
    .from(course)
    .innerJoin(refundPolicy, eq(course.refundPolicyId, refundPolicy.id))
    .where(and(eq(course.slug, slug), eq(course.status, "approved")))
    .limit(1);

  return row;
}

/**
 * Lists the prerequisites of several courses in one query, so a catalogue costs two queries instead of one per course.
 * The required course is shown as-is, whatever its status: the link only names it.
 */
export function findPrerequisitesByCourseIds({
  db,
  courseIds,
}: {
  db: Database;
  courseIds: string[];
}): Promise<PrerequisiteRecord[]> {
  if (courseIds.length === 0) return Promise.resolve([]);

  const required = alias(course, "required_course");

  return db
    .select({
      courseId: coursePrerequisite.courseId,
      slug: required.slug,
      title: required.title,
      hasTest: sql<boolean>`${required.testPrice} is not null`,
    })
    .from(coursePrerequisite)
    .innerJoin(required, eq(coursePrerequisite.requiredCourseId, required.id))
    .where(inArray(coursePrerequisite.courseId, courseIds))
    .orderBy(asc(required.slug));
}

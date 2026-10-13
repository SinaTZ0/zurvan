import { and, asc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { course, coursePrerequisite } from "~/db/schema";

/*===== Types =====*/
export type CourseRecord = typeof course.$inferSelect;

/** One required course of `courseId`, with just what the storefront shows about it. */
export type PrerequisiteRecord = { courseId: string; requiredCourseId: string; slug: string; title: string };

/*===== Reads =====*/
/** Lists every approved course in catalogue order. */
export function findApprovedCourses({ db }: { db: DatabaseOrTransaction }): Promise<CourseRecord[]> {
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

/** Finds one approved course by slug. */
export async function findApprovedCourseBySlug({
  db,
  slug,
}: {
  db: DatabaseOrTransaction;
  slug: string;
}): Promise<CourseRecord | undefined> {
  const [row] = await db
    .select()
    .from(course)
    .where(and(eq(course.slug, slug), eq(course.status, "approved")))
    .limit(1);

  return row;
}

/** Finds the courses with these ids, whatever their status. */
export function findCoursesByIds({ db, ids }: { db: DatabaseOrTransaction; ids: string[] }): Promise<CourseRecord[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return db.select().from(course).where(inArray(course.id, ids));
}

/** Finds the courses with these slugs, whatever their status. */
export function findCoursesBySlugs({
  db,
  slugs,
}: {
  db: DatabaseOrTransaction;
  slugs: string[];
}): Promise<CourseRecord[]> {
  if (slugs.length === 0) return Promise.resolve([]);
  return db.select().from(course).where(inArray(course.slug, slugs));
}

/** Finds one course by slug whatever its status, for the Admin. */
export async function findCourseBySlug({
  db,
  slug,
}: {
  db: DatabaseOrTransaction;
  slug: string;
}): Promise<CourseRecord | undefined> {
  const [row] = await db.select().from(course).where(eq(course.slug, slug)).limit(1);
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
  db: DatabaseOrTransaction;
  courseIds: string[];
}): Promise<PrerequisiteRecord[]> {
  if (courseIds.length === 0) return Promise.resolve([]);

  const required = alias(course, "required_course");

  return db
    .select({
      courseId: coursePrerequisite.courseId,
      requiredCourseId: required.id,
      slug: required.slug,
      title: required.title,
    })
    .from(coursePrerequisite)
    .innerJoin(required, eq(coursePrerequisite.requiredCourseId, required.id))
    .where(inArray(coursePrerequisite.courseId, courseIds))
    .orderBy(asc(required.slug));
}

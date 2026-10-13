import { and, asc, count, eq, inArray, max, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { course, coursePrerequisite, enrollment } from "~/db/schema";

/*===== Types =====*/
export type CourseRecord = typeof course.$inferSelect;

/** One required course of `courseId`, with just what the storefront shows about it. */
export type PrerequisiteRecord = { courseId: string; requiredCourseId: string; slug: string; title: string };

/** What the Admin form writes into a course row. The cover columns are left out when the cover stays. */
export type CourseValues = Pick<
  typeof course.$inferInsert,
  | "title"
  | "latinName"
  | "family"
  | "summary"
  | "highlights"
  | "commands"
  | "coverAlt"
  | "minAgeMonths"
  | "maxAgeMonths"
  | "sessionCount"
  | "place"
  | "price"
  | "boardingPrice"
>;

export type CourseCoverValues = Pick<typeof course.$inferInsert, "coverImage" | "coverWidth" | "coverHeight">;

/** How many enrollments a course has: all of them, and the ones still running. */
export type EnrollmentCountRecord = { courseId: string; total: number; active: number };

/** A course that lists `requiredCourseId` as a prerequisite. */
export type RequiredByRecord = { requiredCourseId: string; slug: string; title: string; status: string };

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

/*===== Admin Reads =====*/
/** Lists every course, whatever its status, in catalogue order. Ties on `position` break by id so the order is stable. */
export function findAllCourses({ db }: { db: DatabaseOrTransaction }): Promise<CourseRecord[]> {
  return db.select().from(course).orderBy(asc(course.position), asc(course.id));
}

/**
 * Like {@link findAllCourses}, but locks the rows until the transaction ends, so two moves at once queue up instead of
 * each renumbering from the order it read.
 */
export function lockAllCourses({ db }: { db: DatabaseOrTransaction }): Promise<CourseRecord[]> {
  return db.select().from(course).orderBy(asc(course.position), asc(course.id)).for("update");
}

/** Counts the enrollments of these courses in one query. A course with none has no row. */
export function findEnrollmentCounts({
  db,
  courseIds,
}: {
  db: DatabaseOrTransaction;
  courseIds: string[];
}): Promise<EnrollmentCountRecord[]> {
  if (courseIds.length === 0) return Promise.resolve([]);

  return db
    .select({
      courseId: enrollment.courseId,
      total: count(),
      active: sql<number>`count(*) filter (where ${enrollment.status} = 'active')`.mapWith(Number),
    })
    .from(enrollment)
    .where(inArray(enrollment.courseId, courseIds))
    .groupBy(enrollment.courseId);
}

/** Finds the courses that list any of these as a prerequisite, whatever their status. */
export function findRequiredBy({
  db,
  courseIds,
}: {
  db: DatabaseOrTransaction;
  courseIds: string[];
}): Promise<RequiredByRecord[]> {
  if (courseIds.length === 0) return Promise.resolve([]);

  return db
    .select({
      requiredCourseId: coursePrerequisite.requiredCourseId,
      slug: course.slug,
      title: course.title,
      status: course.status,
    })
    .from(coursePrerequisite)
    .innerJoin(course, eq(coursePrerequisite.courseId, course.id))
    .where(inArray(coursePrerequisite.requiredCourseId, courseIds))
    .orderBy(asc(course.position), asc(course.id));
}

/** Every prerequisite link in the catalogue as `[courseId, requiredCourseId]`, for the cycle check. */
export async function findAllPrerequisiteLinks({
  db,
}: {
  db: DatabaseOrTransaction;
}): Promise<{ courseId: string; requiredCourseId: string }[]> {
  return db
    .select({ courseId: coursePrerequisite.courseId, requiredCourseId: coursePrerequisite.requiredCourseId })
    .from(coursePrerequisite);
}

/** The highest catalogue position, or 0 for an empty catalogue. */
export async function findMaxPosition({ db }: { db: DatabaseOrTransaction }): Promise<number> {
  const [row] = await db.select({ value: max(course.position) }).from(course);
  return row?.value ?? 0;
}

/*===== Admin Writes =====*/
/**
 * Inserts a course, unless the slug is taken. The unique index decides, so two creates racing for one slug cannot both
 * win.
 *
 * @returns The new course's id, or undefined when the slug was already taken.
 */
export async function insertCourseOnce({
  db,
  slug,
  values,
  cover,
  position,
}: {
  db: DatabaseOrTransaction;
  slug: string;
  values: CourseValues;
  cover: CourseCoverValues;
  position: number;
}): Promise<string | undefined> {
  const [row] = await db
    .insert(course)
    .values({ ...values, ...cover, slug, status: "approved", position })
    .onConflictDoNothing({ target: course.slug })
    .returning({ id: course.id });
  return row?.id;
}

/** Overwrites the form's fields of one course, and its cover when a new one is given. */
export async function updateCourseById({
  db,
  id,
  values,
  cover,
}: {
  db: DatabaseOrTransaction;
  id: string;
  values: CourseValues;
  cover?: CourseCoverValues | undefined;
}): Promise<void> {
  await db
    .update(course)
    .set({ ...values, ...cover })
    .where(eq(course.id, id));
}

/** Replaces the prerequisites of a course with exactly these. */
export async function replacePrerequisites({
  db,
  courseId,
  requiredCourseIds,
}: {
  db: DatabaseOrTransaction;
  courseId: string;
  requiredCourseIds: string[];
}): Promise<void> {
  await db.delete(coursePrerequisite).where(eq(coursePrerequisite.courseId, courseId));
  if (requiredCourseIds.length === 0) return;

  await db
    .insert(coursePrerequisite)
    .values(requiredCourseIds.map((requiredCourseId) => ({ courseId, requiredCourseId })));
}

/** Sets the status of one course. Setting the one it already has is fine. */
export async function updateCourseStatus({
  db,
  id,
  status,
}: {
  db: DatabaseOrTransaction;
  id: string;
  status: string;
}): Promise<void> {
  await db.update(course).set({ status }).where(eq(course.id, id));
}

/** Sets one course's catalogue position. */
export async function updateCoursePosition({
  db,
  id,
  position,
}: {
  db: DatabaseOrTransaction;
  id: string;
  position: number;
}): Promise<void> {
  await db.update(course).set({ position }).where(eq(course.id, id));
}

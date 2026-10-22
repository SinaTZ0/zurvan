import { and, asc, desc, eq } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { course, dog, enrollment, logbookEntry } from "~/db/schema";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type LogbookEntryRecord = typeof logbookEntry.$inferSelect;

/** An entry with the course it belongs to, if any. */
export type LogbookEntryRow = {
  entry: LogbookEntryRecord;
  /** `titleEn` is null until the Admin writes it. */
  course: { slug: string; title: string; titleEn: string | null } | null;
};

/** What a session writes. Never `dogId`'s owner, the author's id or the times: those are the service's. */
export type LogbookEntryValues = Pick<
  typeof logbookEntry.$inferInsert,
  "enrollmentId" | "occurredOn" | "notes" | "exercises" | "progress" | "isPublic"
>;

/*===== Dogs =====*/
/** The dog with this file number: only what deciding who may see it needs. */
export async function findDogByFileNumber({
  db,
  fileNumber,
}: Executor & { fileNumber: string }): Promise<{ id: string; ownerId: string } | undefined> {
  const [row] = await db.select({ id: dog.id, ownerId: dog.ownerId }).from(dog).where(eq(dog.fileNumber, fileNumber));
  return row;
}

/** The dog behind a file number, with only what a public record may show (and who owns it, to ask about consent). */
export async function findDogForPublicRecord({ db, fileNumber }: Executor & { fileNumber: string }): Promise<
  | {
      id: string;
      ownerId: string;
      fileNumber: string;
      name: string;
      breed: string | null;
      birthDate: string;
      birthDateApproximate: boolean;
    }
  | undefined
> {
  const [row] = await db
    .select({
      id: dog.id,
      ownerId: dog.ownerId,
      fileNumber: dog.fileNumber,
      name: dog.name,
      breed: dog.breed,
      birthDate: dog.birthDate,
      birthDateApproximate: dog.birthDateApproximate,
    })
    .from(dog)
    .where(eq(dog.fileNumber, fileNumber));
  return row;
}

/** The courses a dog finished, oldest first: the timeline a public record shows. */
export function findCompletedCourses({
  db,
  dogId,
}: Executor & { dogId: string }): Promise<
  { title: string; titleEn: string | null; latinName: string; completedAt: Date }[]
> {
  return db
    .select({
      title: course.title,
      titleEn: course.titleEn,
      latinName: course.latinName,
      completedAt: enrollment.completedAt,
    })
    .from(enrollment)
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .where(and(eq(enrollment.dogId, dogId), eq(enrollment.status, "completed")))
    .orderBy(asc(enrollment.completedAt), asc(enrollment.id))
    .then((rows) => rows.flatMap((row) => (row.completedAt ? [{ ...row, completedAt: row.completedAt }] : [])));
}

/** The dog with this id, and who owns it. */
export async function findDogOwner({
  db,
  dogId,
}: Executor & { dogId: string }): Promise<{ id: string; ownerId: string } | undefined> {
  const [row] = await db.select({ id: dog.id, ownerId: dog.ownerId }).from(dog).where(eq(dog.id, dogId));
  return row;
}

/** Whether the enrollment belongs to the dog. */
export async function enrollmentBelongsToDog({
  db,
  enrollmentId,
  dogId,
}: Executor & { enrollmentId: string; dogId: string }): Promise<boolean> {
  const [row] = await db
    .select({ id: enrollment.id })
    .from(enrollment)
    .where(and(eq(enrollment.id, enrollmentId), eq(enrollment.dogId, dogId)));
  return row !== undefined;
}

/*===== Entries =====*/
const entrySelection = {
  entry: logbookEntry,
  course: { slug: course.slug, title: course.title, titleEn: course.titleEn },
};

/** A dog's diary, newest session first (`createdAt` then `id` break ties on the same day). */
export async function findEntriesByDog({ db, dogId }: Executor & { dogId: string }): Promise<LogbookEntryRow[]> {
  const rows = await db
    .select(entrySelection)
    .from(logbookEntry)
    .leftJoin(enrollment, eq(logbookEntry.enrollmentId, enrollment.id))
    .leftJoin(course, eq(enrollment.courseId, course.id))
    .where(eq(logbookEntry.dogId, dogId))
    .orderBy(desc(logbookEntry.occurredOn), desc(logbookEntry.createdAt), desc(logbookEntry.id));
  return rows;
}

export async function findEntryById({ db, id }: Executor & { id: string }): Promise<LogbookEntryRow | undefined> {
  const [row] = await db
    .select(entrySelection)
    .from(logbookEntry)
    .leftJoin(enrollment, eq(logbookEntry.enrollmentId, enrollment.id))
    .leftJoin(course, eq(enrollment.courseId, course.id))
    .where(eq(logbookEntry.id, id));
  return row;
}

export async function insertEntry({
  db,
  dogId,
  authorId,
  values,
}: Executor & { dogId: string; authorId: string; values: LogbookEntryValues }): Promise<string> {
  const [row] = await db
    .insert(logbookEntry)
    .values({ ...values, dogId, authorId })
    .returning({ id: logbookEntry.id });
  if (!row) throw new Error("The logbook entry was not saved.");
  return row.id;
}

/** Replaces what a session says. The dog, the author and the creation time stay. */
export async function updateEntry({
  db,
  id,
  values,
}: Executor & { id: string; values: LogbookEntryValues }): Promise<void> {
  await db.update(logbookEntry).set(values).where(eq(logbookEntry.id, id));
}

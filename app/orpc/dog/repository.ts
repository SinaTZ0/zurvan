import { and, asc, desc, eq, exists, inArray, sql } from "drizzle-orm";

import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { course, dog, dogPassedCourse, dogRecordPhoto, enrollment, evaluation, media, user } from "~/db/schema";
import type { DogRecordPhotoPurpose } from "~/orpc/dog/constants";
import type { MediaRecord } from "~/orpc/media/repository";

/*===== Types =====*/
/** A stored dog with its photo's media row, and whether it is evaluated (F3). Both are read in the same query. */
export type DogRecord = typeof dog.$inferSelect & { photo: MediaRecord | null; isEvaluated: boolean };

/** What an owner may write. Never `ownerId`. */
export type DogValues = Pick<
  typeof dog.$inferInsert,
  | "name"
  | "breedPurity"
  | "breed"
  | "breedSecondary"
  | "sex"
  | "birthDate"
  | "birthDateApproximate"
  | "weightKg"
  | "isNeutered"
  | "heightCm"
  | "coatColor"
  | "markings"
  | "microchipNumber"
  | "microchipImplantedOn"
  | "vaccinationStatus"
  | "vaccinationNotes"
  // `undefined` leaves the stored list as it is on update.
  | "trainingGoals"
  | "behaviorProblems"
  | "behaviorNotes"
  | "medicalNotes"
  // `undefined` leaves the photo as it is on update; `null` clears it.
  | "photoMediaId"
>;

/** A course a dog has passed, and how: finished on the site, or marked by the Admin (F2). */
export type PassedCourseRecord = {
  dogId: string;
  courseId: string;
  slug: string;
  title: string;
  /** Null until the Admin writes it. */
  titleEn: string | null;
  source: "enrollment" | "admin";
};

export type DogOwnerRecord = { id: string; name: string; phoneNumber: string | null };

/** A photo in a dog's file (`dog_record_photo`) with its media row. `purpose` is plain text in the database. */
export type DogRecordPhotoRecord = { dogId: string; purpose: string; media: MediaRecord };

/*===== Selection =====*/
// One query returns the dog, its photo and whether it is evaluated, so a list never costs a query per dog.
type DogRow = { dog: typeof dog.$inferSelect; photo: MediaRecord | null; isEvaluated: boolean };

function toRecord({ dog: row, photo, isEvaluated }: DogRow): DogRecord {
  return { ...row, photo, isEvaluated };
}

/** The columns every dog read selects. `db` only builds the subquery. */
function dogSelection(db: DatabaseOrTransaction) {
  return {
    dog,
    photo: media,
    // F3: a dog is evaluated when any of its evaluations is.
    isEvaluated: sql<boolean>`${exists(
      db
        .select({ one: sql`1` })
        .from(evaluation)
        .where(and(eq(evaluation.dogId, dog.id), eq(evaluation.status, "evaluated"))),
    )}`,
  };
}

/** Reads one dog with its photo by ID alone. Callers that need ownership checked have already done it. */
export async function findDogWithPhoto({
  db,
  id,
}: {
  db: DatabaseOrTransaction;
  id: string;
}): Promise<DogRecord | undefined> {
  const [row] = await db
    .select(dogSelection(db))
    .from(dog)
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .where(eq(dog.id, id))
    .limit(1);

  return row && toRecord(row);
}

/*===== Reads =====*/
// The owner's queries are scoped to the owner, so a service cannot forget it.

/** Lists one owner's dogs, oldest first, so a family's first dog stays first. */
export function findDogsByOwner({ db, ownerId }: { db: DatabaseOrTransaction; ownerId: string }): Promise<DogRecord[]> {
  return (
    db
      .select(dogSelection(db))
      .from(dog)
      .leftJoin(media, eq(dog.photoMediaId, media.id))
      .where(eq(dog.ownerId, ownerId))
      // `id` breaks ties between dogs added in the same instant.
      .orderBy(asc(dog.createdAt), asc(dog.id))
      .then((rows) => rows.map(toRecord))
  );
}

/** Finds one of the owner's dogs. Another owner's dog reads as not there. */
export async function findDogByOwner({
  db,
  ownerId,
  id,
}: {
  db: DatabaseOrTransaction;
  ownerId: string;
  id: string;
}): Promise<DogRecord | undefined> {
  const [row] = await db
    .select(dogSelection(db))
    .from(dog)
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .where(and(eq(dog.id, id), eq(dog.ownerId, ownerId)))
    .limit(1);

  return row && toRecord(row);
}

/**
 * Same as {@link findDogByOwner}, and locks the dog's row until the transaction ends. Requesting an evaluation, marking
 * it evaluated and checking out all take this lock, so one can't slip past the check of another.
 */
export async function findDogByOwnerForUpdate({
  db,
  ownerId,
  id,
}: {
  db: DatabaseOrTransaction;
  ownerId: string;
  id: string;
}): Promise<DogRecord | undefined> {
  const [row] = await db
    .select(dogSelection(db))
    .from(dog)
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .where(and(eq(dog.id, id), eq(dog.ownerId, ownerId)))
    .limit(1)
    // Postgres can't lock the nullable side of the outer join, so only the dog row is locked.
    .for("update", { of: dog });

  return row && toRecord(row);
}

/** Locks a dog by ID alone, for the Admin's actions. */
export async function lockDogById({ db, id }: { db: DatabaseOrTransaction; id: string }): Promise<boolean> {
  const rows = await db.select({ id: dog.id }).from(dog).where(eq(dog.id, id)).for("update");
  return rows.length > 0;
}

/** Every dog with its owner, newest first, for the Admin. */
export async function findAllDogs({
  db,
}: {
  db: DatabaseOrTransaction;
}): Promise<{ record: DogRecord; owner: DogOwnerRecord }[]> {
  const rows = await db
    .select({ ...dogSelection(db), owner: { id: user.id, name: user.name, phoneNumber: user.phoneNumber } })
    .from(dog)
    .innerJoin(user, eq(dog.ownerId, user.id))
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .orderBy(desc(dog.createdAt), asc(dog.id));

  return rows.map(({ owner, ...row }) => ({ record: toRecord(row), owner }));
}

/** The owner of a dog, for the Admin. */
export async function findDogOwner({
  db,
  dogId,
}: {
  db: DatabaseOrTransaction;
  dogId: string;
}): Promise<DogOwnerRecord | undefined> {
  const [row] = await db
    .select({ id: user.id, name: user.name, phoneNumber: user.phoneNumber })
    .from(dog)
    .innerJoin(user, eq(dog.ownerId, user.id))
    .where(eq(dog.id, dogId));
  return row;
}

/**
 * Whether any dog uses this media as its photo. Keeps one upload from becoming the photo of two dogs, which would make
 * replacing it on one delete it from the other.
 */
export async function isDogPhotoInUse({ db, mediaId }: { db: Database; mediaId: string }): Promise<boolean> {
  const rows = await db.select({ id: dog.id }).from(dog).where(eq(dog.photoMediaId, mediaId)).limit(1);
  return rows.length > 0;
}

/**
 * The courses these dogs have passed (F2): completed enrollments and the ones the Admin marked. A course that is both
 * is listed once, as an enrollment.
 */
export async function findPassedCourses({
  db,
  dogIds,
}: {
  db: DatabaseOrTransaction;
  dogIds: string[];
}): Promise<PassedCourseRecord[]> {
  if (dogIds.length === 0) return [];

  const finished = await db
    .selectDistinct({
      dogId: enrollment.dogId,
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      titleEn: course.titleEn,
    })
    .from(enrollment)
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .where(and(inArray(enrollment.dogId, dogIds), eq(enrollment.status, "completed")));
  const marked = await db
    .select({
      dogId: dogPassedCourse.dogId,
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      titleEn: course.titleEn,
    })
    .from(dogPassedCourse)
    .innerJoin(course, eq(dogPassedCourse.courseId, course.id))
    .where(inArray(dogPassedCourse.dogId, dogIds));

  const records = new Map<string, PassedCourseRecord>();
  for (const row of marked) records.set(`${row.dogId}:${row.courseId}`, { ...row, source: "admin" });
  for (const row of finished) records.set(`${row.dogId}:${row.courseId}`, { ...row, source: "enrollment" });
  // oxlint-disable-next-line unicorn/no-array-sort -- a fresh array from the spread.
  return [...records.values()].sort((a, b) => a.title.localeCompare(b.title));
}

/*===== Record Photos =====*/
/** The photos in these dogs' files in one query, each purpose's in the order the owner put them. */
export async function findRecordPhotos({
  db,
  dogIds,
}: {
  db: DatabaseOrTransaction;
  dogIds: string[];
}): Promise<DogRecordPhotoRecord[]> {
  if (dogIds.length === 0) return [];
  return db
    .select({ dogId: dogRecordPhoto.dogId, purpose: dogRecordPhoto.purpose, media })
    .from(dogRecordPhoto)
    .innerJoin(media, eq(dogRecordPhoto.mediaId, media.id))
    .where(inArray(dogRecordPhoto.dogId, dogIds))
    .orderBy(asc(dogRecordPhoto.position));
}

/** The IDs of one purpose's photos in a dog's file. */
export async function findRecordPhotoIds({
  db,
  dogId,
  purpose,
}: {
  db: DatabaseOrTransaction;
  dogId: string;
  purpose: DogRecordPhotoPurpose;
}): Promise<string[]> {
  const rows = await db
    .select({ mediaId: dogRecordPhoto.mediaId })
    .from(dogRecordPhoto)
    .where(and(eq(dogRecordPhoto.dogId, dogId), eq(dogRecordPhoto.purpose, purpose)));
  return rows.map((row) => row.mediaId);
}

/** Which of these images are already in some dog's file, so one upload can't end up in two. */
export async function findUsedRecordPhotoIds({
  db,
  mediaIds,
}: {
  db: DatabaseOrTransaction;
  mediaIds: string[];
}): Promise<Set<string>> {
  if (mediaIds.length === 0) return new Set();
  const rows = await db
    .select({ mediaId: dogRecordPhoto.mediaId })
    .from(dogRecordPhoto)
    .where(inArray(dogRecordPhoto.mediaId, mediaIds));
  return new Set(rows.map((row) => row.mediaId));
}

/** Replaces one purpose's photos in a dog's file with `mediaIds`, in that order. */
export async function replaceRecordPhotos({
  db,
  dogId,
  purpose,
  mediaIds,
}: {
  db: DatabaseOrTransaction;
  dogId: string;
  purpose: DogRecordPhotoPurpose;
  mediaIds: string[];
}): Promise<void> {
  await db.delete(dogRecordPhoto).where(and(eq(dogRecordPhoto.dogId, dogId), eq(dogRecordPhoto.purpose, purpose)));
  if (mediaIds.length === 0) return;
  await db.insert(dogRecordPhoto).values(mediaIds.map((mediaId, position) => ({ dogId, mediaId, purpose, position })));
}

/*===== Writes =====*/
/** Inserts a dog for its owner and returns the stored row. */
export async function insertDog({
  db,
  ownerId,
  values,
}: {
  db: DatabaseOrTransaction;
  ownerId: string;
  values: DogValues;
}): Promise<DogRecord> {
  const [inserted] = await db
    .insert(dog)
    .values({ ...values, ownerId })
    .returning({ id: dog.id });
  if (!inserted) throw new Error("insertDog: insert returned no row");

  const record = await findDogWithPhoto({ db, id: inserted.id });
  if (!record) throw new Error("insertDog: the inserted dog could not be read back");
  return record;
}

/** Updates one of the owner's dogs in a single statement, so the ownership check and the write can't drift apart. */
export async function updateDogByOwner({
  db,
  ownerId,
  id,
  values,
}: {
  db: DatabaseOrTransaction;
  ownerId: string;
  id: string;
  values: DogValues;
}): Promise<DogRecord | undefined> {
  const [updated] = await db
    .update(dog)
    .set(values)
    .where(and(eq(dog.id, id), eq(dog.ownerId, ownerId)))
    .returning({ id: dog.id });

  if (!updated) return undefined;
  return findDogWithPhoto({ db, id: updated.id });
}

/** The Admin's update: any dog, and never its photo. */
export async function updateDogById({
  db,
  id,
  values,
}: {
  db: Database;
  id: string;
  values: Omit<DogValues, "photoMediaId">;
}): Promise<DogRecord | undefined> {
  const [updated] = await db.update(dog).set(values).where(eq(dog.id, id)).returning({ id: dog.id });
  if (!updated) return undefined;
  return findDogWithPhoto({ db, id: updated.id });
}

/** Marks a course as passed for a dog; marking it twice changes nothing. */
export async function insertPassedCourse({
  db,
  dogId,
  courseId,
  markedBy,
}: {
  db: DatabaseOrTransaction;
  dogId: string;
  courseId: string;
  markedBy: string;
}): Promise<void> {
  await db.insert(dogPassedCourse).values({ dogId, courseId, markedBy }).onConflictDoNothing();
}

/** Takes the Admin's mark off. A course passed by completing an enrollment stays passed. */
export async function deletePassedCourse({
  db,
  dogId,
  courseId,
}: {
  db: DatabaseOrTransaction;
  dogId: string;
  courseId: string;
}): Promise<void> {
  await db.delete(dogPassedCourse).where(and(eq(dogPassedCourse.dogId, dogId), eq(dogPassedCourse.courseId, courseId)));
}

import { and, asc, eq, exists, isNull, sql } from "drizzle-orm";

import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { assessment, dog, enrollment, media, trainingSession } from "~/db/schema";
import type { MediaRecord } from "~/orpc/media/repository";

/*===== Types =====*/
/**
 * A stored dog with its photo's media row, and whether it has a record event: a completed assessment, or an enrollment
 * with a held session. Both are read in the same query.
 */
export type DogRecord = typeof dog.$inferSelect & { photo: MediaRecord | null; hasRecordEvent: boolean };

/** What an owner may write. Never `knownSince`, `ownerId` or `deletedAt`. */
export type DogValues = Pick<
  typeof dog.$inferInsert,
  | "name"
  | "breed"
  | "sex"
  | "birthDate"
  | "birthDateApproximate"
  | "weightKg"
  | "isNeutered"
  | "microchipNumber"
  | "vaccinationStatus"
  | "behaviorNotes"
  | "medicalNotes"
  // `undefined` leaves the photo as it is on update; `null` clears it.
  | "photoMediaId"
>;

/*===== Selection =====*/
// One query returns the dog, its photo and whether it has a record through an assessment or a session, so a list never
// costs a query per dog.
type DogRow = { dog: typeof dog.$inferSelect; photo: MediaRecord | null; hasRecordEvent: boolean };

function toRecord({ dog: row, photo, hasRecordEvent }: DogRow): DogRecord {
  return { ...row, photo, hasRecordEvent };
}

/** The columns every dog read selects. `db` only builds the subquery. */
function dogSelection(db: DatabaseOrTransaction) {
  return {
    dog,
    photo: media,
    // Spec: a completed assessment, an enrollment with a held session, or `knownSince` (checked by the mapper).
    hasRecordEvent: sql<boolean>`${exists(
      db
        .select({ one: sql`1` })
        .from(assessment)
        .where(and(eq(assessment.dogId, dog.id), eq(assessment.status, "completed"))),
    )} or ${exists(
      db
        .select({ one: sql`1` })
        .from(trainingSession)
        .innerJoin(enrollment, eq(trainingSession.enrollmentId, enrollment.id))
        .where(and(eq(enrollment.dogId, dog.id), eq(trainingSession.status, "held"))),
    )}`,
  };
}

/**
 * Reads one dog with its photo by ID alone, removed or not. Callers that need ownership checked have already done it.
 */
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
// Every query is scoped to the owner and skips removed dogs, so a service cannot forget either.

/** Lists one owner's dogs, oldest first, so a family's first dog stays first. */
export function findDogsByOwner({ db, ownerId }: { db: Database; ownerId: string }): Promise<DogRecord[]> {
  return (
    db
      .select(dogSelection(db))
      .from(dog)
      .leftJoin(media, eq(dog.photoMediaId, media.id))
      .where(and(eq(dog.ownerId, ownerId), isNull(dog.deletedAt)))
      // `id` breaks ties between dogs added in the same instant.
      .orderBy(asc(dog.createdAt), asc(dog.id))
      .then((rows) => rows.map(toRecord))
  );
}

/** Finds one of the owner's dogs. Another owner's dog and a removed one read the same: not there. */
export async function findDogByOwner({
  db,
  ownerId,
  id,
}: {
  db: Database;
  ownerId: string;
  id: string;
}): Promise<DogRecord | undefined> {
  const [row] = await db
    .select(dogSelection(db))
    .from(dog)
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .where(and(eq(dog.id, id), eq(dog.ownerId, ownerId), isNull(dog.deletedAt)))
    .limit(1);

  return row && toRecord(row);
}

/**
 * Same as {@link findDogByOwner}, and locks the dog's row until the transaction ends. Booking an assessment and
 * removing the dog both take this lock, so one can't slip a booking in while the other checks for it.
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
    .where(and(eq(dog.id, id), eq(dog.ownerId, ownerId), isNull(dog.deletedAt)))
    .limit(1)
    // Postgres can't lock the nullable side of the outer join, so only the dog row is locked.
    .for("update", { of: dog });

  return row && toRecord(row);
}

/** Whether the dog has an assessment that is booked and still to come. */
export async function hasBookedAssessment({
  db,
  dogId,
}: {
  db: DatabaseOrTransaction;
  dogId: string;
}): Promise<boolean> {
  const rows = await db
    .select({ id: assessment.id })
    .from(assessment)
    .where(and(eq(assessment.dogId, dogId), eq(assessment.status, "booked")))
    .limit(1);
  return rows.length > 0;
}

/**
 * Whether any dog, removed ones included, uses this media as its photo. Keeps one upload from becoming the photo of two
 * dogs, which would make replacing it on one delete it from the other.
 */
export async function isDogPhotoInUse({ db, mediaId }: { db: Database; mediaId: string }): Promise<boolean> {
  const rows = await db.select({ id: dog.id }).from(dog).where(eq(dog.photoMediaId, mediaId)).limit(1);
  return rows.length > 0;
}

/*===== Writes =====*/
/** Inserts a dog for its owner and returns the stored row. */
export async function insertDog({
  db,
  ownerId,
  values,
}: {
  db: Database;
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
  db: Database;
  ownerId: string;
  id: string;
  values: DogValues;
}): Promise<DogRecord | undefined> {
  const [updated] = await db
    .update(dog)
    .set(values)
    .where(and(eq(dog.id, id), eq(dog.ownerId, ownerId), isNull(dog.deletedAt)))
    .returning({ id: dog.id });

  if (!updated) return undefined;
  return findDogWithPhoto({ db, id: updated.id });
}

/** Marks one of the owner's dogs as deleted. Returns whether a dog was removed. */
export async function softDeleteDogByOwner({
  db,
  ownerId,
  id,
}: {
  db: DatabaseOrTransaction;
  ownerId: string;
  id: string;
}): Promise<boolean> {
  const rows = await db
    .update(dog)
    .set({ deletedAt: new Date() })
    .where(and(eq(dog.id, id), eq(dog.ownerId, ownerId), isNull(dog.deletedAt)))
    .returning({ id: dog.id });

  return rows.length > 0;
}

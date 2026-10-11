import { and, asc, eq, isNull } from "drizzle-orm";

import type { Database } from "~/db/client.server";
import { dog, media } from "~/db/schema";
import type { MediaRecord } from "~/orpc/media/repository";

/*===== Types =====*/
/** A stored dog with its photo's media row, joined in the same query. */
export type DogRecord = typeof dog.$inferSelect & { photo: MediaRecord | null };

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
// One query returns the dog and its photo, so a list never costs a query per dog.
type DogWithPhoto = { dog: typeof dog.$inferSelect; photo: MediaRecord | null };

function toRecord({ dog: row, photo }: DogWithPhoto): DogRecord {
  return { ...row, photo };
}

/** Reads one dog with its photo by ID alone. Callers that need ownership checked have already done it. */
async function findDogWithPhoto({ db, id }: { db: Database; id: string }): Promise<DogRecord | undefined> {
  const [row] = await db
    .select({ dog, photo: media })
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
      .select({ dog, photo: media })
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
    .select({ dog, photo: media })
    .from(dog)
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .where(and(eq(dog.id, id), eq(dog.ownerId, ownerId), isNull(dog.deletedAt)))
    .limit(1);

  return row && toRecord(row);
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
  db: Database;
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

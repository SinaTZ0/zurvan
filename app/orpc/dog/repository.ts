import { and, asc, eq, isNull } from "drizzle-orm";

import type { Database } from "~/db/client.server";
import { dog } from "~/db/schema";

/*===== Types =====*/
export type DogRecord = typeof dog.$inferSelect;

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
>;

/*===== Reads =====*/
// Every query is scoped to the owner and skips removed dogs, so a service cannot forget either.

/** Lists one owner's dogs, oldest first, so a family's first dog stays first. */
export function findDogsByOwner({ db, ownerId }: { db: Database; ownerId: string }): Promise<DogRecord[]> {
  return (
    db
      .select()
      .from(dog)
      .where(and(eq(dog.ownerId, ownerId), isNull(dog.deletedAt)))
      // `id` breaks ties between dogs added in the same instant.
      .orderBy(asc(dog.createdAt), asc(dog.id))
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
    .select()
    .from(dog)
    .where(and(eq(dog.id, id), eq(dog.ownerId, ownerId), isNull(dog.deletedAt)))
    .limit(1);

  return row;
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
  const [row] = await db
    .insert(dog)
    .values({ ...values, ownerId })
    .returning();
  if (!row) throw new Error("insertDog: insert returned no row");
  return row;
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
  const [row] = await db
    .update(dog)
    .set(values)
    .where(and(eq(dog.id, id), eq(dog.ownerId, ownerId), isNull(dog.deletedAt)))
    .returning();

  return row;
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

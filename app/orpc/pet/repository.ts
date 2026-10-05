import { desc, eq } from "drizzle-orm";

import type { Database } from "~/db/client.server";
import { pet } from "~/db/schema";

/*===== Types =====*/
export type PetRecord = typeof pet.$inferSelect;
type NewPetRecord = typeof pet.$inferInsert;

/*===== Reads =====*/
/** Lists one owner's pets, newest first. */
export function findPetsByOwner({ db, ownerId }: { db: Database; ownerId: string }): Promise<PetRecord[]> {
  return db.select().from(pet).where(eq(pet.ownerId, ownerId)).orderBy(desc(pet.createdAt));
}

/*===== Writes =====*/
/** Inserts a pet and returns the stored row. */
export async function insertPet({ db, values }: { db: Database; values: NewPetRecord }): Promise<PetRecord> {
  const [row] = await db.insert(pet).values(values).returning();
  if (!row) throw new Error("insertPet: insert returned no row");
  return row;
}

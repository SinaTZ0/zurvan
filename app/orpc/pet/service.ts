import type { Database } from "~/db/client.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import type { Pet } from "~/orpc/pet/contract";
import { toPublicPet } from "~/orpc/pet/mapper";
import { findPetsByOwner, insertPet } from "~/orpc/pet/repository";
import { newPetSchema } from "~/orpc/pet/validation";

/*===== List =====*/
/** Returns the owner's pets, newest first. */
export async function listPets({ db, ownerId }: { db: Database; ownerId: string }): Promise<Pet[]> {
  const records = await findPetsByOwner({ db, ownerId });
  return records.map(toPublicPet);
}

/*===== Add =====*/
type AddPetResult = { kind: "success"; pet: Pet } | { kind: "invalid"; fields: Record<string, string> };

/**
 * Validates and stores a new pet for its owner.
 *
 * @returns `invalid` with per-field messages when the input breaks a domain rule.
 */
export async function addPet({
  db,
  ownerId,
  input,
}: {
  db: Database;
  ownerId: string;
  input: unknown;
}): Promise<AddPetResult> {
  const parsed = newPetSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", fields: issuesToErrorData(parsed.error.issues).fields };

  const record = await insertPet({ db, values: { ...parsed.data, ownerId } });
  return { kind: "success", pet: toPublicPet(record) };
}

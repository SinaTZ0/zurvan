import type { Database } from "~/db/client.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import type { Dog } from "~/orpc/dog/contract";
import { toPublicDog } from "~/orpc/dog/mapper";
import {
  findDogByOwner,
  findDogsByOwner,
  insertDog,
  softDeleteDogByOwner,
  updateDogByOwner,
} from "~/orpc/dog/repository";
import { dogInputSchema, isDogId } from "~/orpc/dog/validation";

/*===== Types =====*/
type Owned = { db: Database; ownerId: string };

type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };
type NotFoundResult = { kind: "not-found" };

/*===== List =====*/
/** Returns the owner's dogs, oldest first. */
export async function listDogs({ db, ownerId }: Owned): Promise<Dog[]> {
  const records = await findDogsByOwner({ db, ownerId });
  return records.map(toPublicDog);
}

/*===== Get =====*/
type GetDogResult = { kind: "success"; dog: Dog } | NotFoundResult;

/** @returns `not-found` for another owner's dog, a removed one and a malformed id alike. */
export async function getDog({ db, ownerId, id }: Owned & { id: string }): Promise<GetDogResult> {
  if (!isDogId(id)) return { kind: "not-found" };

  const record = await findDogByOwner({ db, ownerId, id });
  return record ? { kind: "success", dog: toPublicDog(record) } : { kind: "not-found" };
}

/*===== Create =====*/
type CreateDogResult = { kind: "success"; dog: Dog } | InvalidResult;

/**
 * Validates and stores a new dog for its owner. A customer's dog never has `knownSince`: only a trainer or the Admin
 * sets it, so it isn't part of the input.
 *
 * @returns `invalid` with per-field messages when the input breaks a domain rule.
 */
export async function createDog({ db, ownerId, input }: Owned & { input: unknown }): Promise<CreateDogResult> {
  const parsed = dogInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const record = await insertDog({ db, ownerId, values: parsed.data });
  return { kind: "success", dog: toPublicDog(record) };
}

/*===== Update =====*/
type UpdateDogResult = { kind: "success"; dog: Dog } | InvalidResult | NotFoundResult;

/**
 * Replaces a dog's details. `knownSince` is left as it is.
 *
 * @returns `not-found` when the dog isn't the owner's or was removed (checked first, so a stranger learns nothing from
 * validation messages), `invalid` with per-field messages when the input breaks a domain rule.
 */
export async function updateDog({
  db,
  ownerId,
  id,
  input,
}: Owned & { id: string; input: unknown }): Promise<UpdateDogResult> {
  if (!isDogId(id) || !(await findDogByOwner({ db, ownerId, id }))) return { kind: "not-found" };

  const parsed = dogInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  // The write repeats the ownership check, so a dog removed in between still reads as not found.
  const record = await updateDogByOwner({ db, ownerId, id, values: parsed.data });
  return record ? { kind: "success", dog: toPublicDog(record) } : { kind: "not-found" };
}

/*===== Remove =====*/
type RemoveDogResult = { kind: "success"; id: string } | NotFoundResult;

/**
 * Soft-deletes one of the owner's dogs; its history stays.
 *
 * TODO: Refuse while the dog has a Scheduling or Active enrollment or a Booked assessment, once those entities exist.
 *
 * @returns `not-found` when the dog isn't the owner's or was already removed.
 */
export async function removeDog({ db, ownerId, id }: Owned & { id: string }): Promise<RemoveDogResult> {
  if (!isDogId(id)) return { kind: "not-found" };

  const removed = await softDeleteDogByOwner({ db, ownerId, id });
  return removed ? { kind: "success", id } : { kind: "not-found" };
}

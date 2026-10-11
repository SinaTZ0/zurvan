import type { Database } from "~/db/client.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import type { Dog } from "~/orpc/dog/contract";
import { toPublicDog } from "~/orpc/dog/mapper";
import {
  findDogByOwner,
  findDogByOwnerForUpdate,
  findDogsByOwner,
  hasBookedAssessment,
  insertDog,
  isDogPhotoInUse,
  softDeleteDogByOwner,
  updateDogByOwner,
} from "~/orpc/dog/repository";
import { dogInputSchema, isDogId } from "~/orpc/dog/validation";
import { attachMedia, deleteMedia, isMediaId } from "~/orpc/media/service";

/*===== Types =====*/
type Owned = { db: Database; ownerId: string };

type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };
type NotFoundResult = { kind: "not-found" };

const PHOTO_INVALID: InvalidResult = {
  kind: "invalid",
  errors: [],
  fields: { photoMediaId: "عکس را دوباره بارگذاری کن." },
};

/*===== Photo =====*/
/**
 * Claims an uploaded image as a dog's photo.
 *
 * @returns Whether it can be used: it must be a dog photo uploaded by this owner and not already some dog's photo.
 */
async function attachDogPhoto({ db, ownerId, mediaId }: Owned & { mediaId: string }): Promise<boolean> {
  if (!isMediaId(mediaId) || (await isDogPhotoInUse({ db, mediaId }))) return false;

  const outcome = await attachMedia({ db, mediaId, kind: "dog", userId: ownerId });
  return outcome.kind === "ok";
}

/**
 * Deletes a photo that is no longer a dog's. The dog is already saved at this point, so a failure is logged instead of
 * failing the request; it leaves an unused image behind, never a dog pointing at a missing one.
 */
async function discardPhoto({ db, mediaId }: { db: Database; mediaId: string }): Promise<void> {
  try {
    await deleteMedia({ db, mediaId });
  } catch (error) {
    console.error(`[dog] could not delete media ${mediaId}`, error);
  }
}

/** `undefined` means "not given", and an empty ID means "no photo", like `null`. */
function requestedPhoto(photoMediaId: string | null | undefined): string | null | undefined {
  return photoMediaId === undefined ? undefined : photoMediaId || null;
}

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
 * @returns `invalid` with per-field messages when the input breaks a domain rule, or the photo isn't a usable upload.
 */
export async function createDog({ db, ownerId, input }: Owned & { input: unknown }): Promise<CreateDogResult> {
  const parsed = dogInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const { photoMediaId, ...details } = parsed.data;
  const photo = requestedPhoto(photoMediaId) ?? null;

  if (photo && !(await attachDogPhoto({ db, ownerId, mediaId: photo }))) return PHOTO_INVALID;

  try {
    const record = await insertDog({ db, ownerId, values: { ...details, photoMediaId: photo } });
    return { kind: "success", dog: toPublicDog(record) };
  } catch (error) {
    // The dog wasn't saved, so the photo that was just claimed belongs to nothing.
    if (photo) await discardPhoto({ db, mediaId: photo });
    throw error;
  }
}

/*===== Update =====*/
type UpdateDogResult = { kind: "success"; dog: Dog } | InvalidResult | NotFoundResult;

/**
 * Replaces a dog's details. `knownSince` is left as it is. The photo stays unless `photoMediaId` is given: a new ID
 * replaces it and `null` removes it, and the old image is deleted once the dog is saved.
 *
 * @returns `not-found` when the dog isn't the owner's or was removed (checked first, so a stranger learns nothing from
 * validation messages), `invalid` with per-field messages when the input breaks a domain rule, or the photo isn't a
 * usable upload.
 */
export async function updateDog({
  db,
  ownerId,
  id,
  input,
}: Owned & { id: string; input: unknown }): Promise<UpdateDogResult> {
  const current = isDogId(id) ? await findDogByOwner({ db, ownerId, id }) : undefined;
  if (!current) return { kind: "not-found" };

  const parsed = dogInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  /*------ Photo ------*/
  const { photoMediaId, ...details } = parsed.data;
  const requested = requestedPhoto(photoMediaId);
  const oldPhoto = current.photoMediaId;
  // Sending back the current photo is a no-op (a form that didn't touch it), not a second claim on it.
  const changed = requested !== undefined && requested !== oldPhoto;
  const newPhoto = changed ? requested : null;

  if (newPhoto && !(await attachDogPhoto({ db, ownerId, mediaId: newPhoto }))) return PHOTO_INVALID;

  /*------ Save ------*/
  let record;
  try {
    // The write repeats the ownership check, so a dog removed in between still reads as not found.
    record = await updateDogByOwner({
      db,
      ownerId,
      id,
      values: changed ? { ...details, photoMediaId: requested } : details,
    });
  } catch (error) {
    if (newPhoto) await discardPhoto({ db, mediaId: newPhoto });
    throw error;
  }

  if (!record) {
    if (newPhoto) await discardPhoto({ db, mediaId: newPhoto });
    return { kind: "not-found" };
  }

  // Only now that the dog points at the new photo (or none) is the old one safe to delete.
  if (changed && oldPhoto) await discardPhoto({ db, mediaId: oldPhoto });

  return { kind: "success", dog: toPublicDog(record) };
}

/*===== Remove =====*/
type RemoveDogResult = { kind: "success"; id: string } | { kind: "has-booking"; errors: string[] } | NotFoundResult;

/**
 * Soft-deletes one of the owner's dogs; its history stays. The dog's row is locked while it is checked, so a booking
 * can't be made for it in between.
 *
 * TODO: Also refuse while the dog has a Scheduling or Active enrollment, once enrollments exist.
 *
 * @returns `not-found` when the dog isn't the owner's or was already removed, `has-booking` while it has a booked
 * assessment: the owner cancels that first, so a trainer isn't left waiting for a dog that is gone.
 */
export async function removeDog({ db, ownerId, id }: Owned & { id: string }): Promise<RemoveDogResult> {
  if (!isDogId(id)) return { kind: "not-found" };

  return db.transaction(async (tx): Promise<RemoveDogResult> => {
    const current = await findDogByOwnerForUpdate({ db: tx, ownerId, id });
    if (!current) return { kind: "not-found" };

    if (await hasBookedAssessment({ db: tx, dogId: id })) {
      return { kind: "has-booking", errors: ["این سگ یک ارزیابی رزروشده دارد. اول آن را لغو کن."] };
    }

    const removed = await softDeleteDogByOwner({ db: tx, ownerId, id });
    return removed ? { kind: "success", id } : { kind: "not-found" };
  });
}

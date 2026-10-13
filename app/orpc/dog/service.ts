import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import { findCourseBySlug } from "~/orpc/course/repository";
import type { AdminDog, Dog } from "~/orpc/dog/contract";
import { toPublicDog } from "~/orpc/dog/mapper";
import {
  deletePassedCourse,
  findAllDogs,
  findDogByOwner,
  findDogOwner,
  findDogsByOwner,
  findDogWithPhoto,
  findPassedCourses,
  insertDog,
  insertPassedCourse,
  isDogPhotoInUse,
  lockDogById,
  updateDogByOwner,
  updateDogById,
  type DogRecord,
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

/*===== Passed Courses =====*/
/** Converts stored dogs into public ones, reading all their passed courses in one query. */
async function toPublicDogs({ db, records }: { db: DatabaseOrTransaction; records: DogRecord[] }): Promise<Dog[]> {
  const passed = await findPassedCourses({ db, dogIds: records.map((record) => record.id) });
  return records.map((record) => toPublicDog({ record, passed }));
}

async function toPublicDogOf({ db, record }: { db: DatabaseOrTransaction; record: DogRecord }): Promise<Dog> {
  const [dog] = await toPublicDogs({ db, records: [record] });
  if (!dog) throw new Error(`toPublicDogOf: dog ${record.id} was lost`);
  return dog;
}

/*===== Locked Fields =====*/
const LOCKED_MESSAGE = "بعد از ارزیابی فقط مدیر می‌تواند این را تغییر دهد.";

/**
 * F2: once a dog is evaluated, the fields that decide eligibility (F4) are locked for the customer, or a customer could
 * change a birth date to get past an age range.
 *
 * @returns The locked fields the input tries to change, as field messages; empty when it changes none.
 */
function lockedFieldChanges({
  current,
  details,
}: {
  current: DogRecord;
  details: { birthDate: string; breed: string | null };
}): Record<string, string> {
  if (!current.isEvaluated) return {};
  const fields: Record<string, string> = {};
  if (details.birthDate !== current.birthDate) fields.birthDate = LOCKED_MESSAGE;
  if (details.breed !== current.breed) fields.breed = LOCKED_MESSAGE;
  return fields;
}

/*===== List =====*/
/** Returns the owner's dogs, oldest first. */
export async function listDogs({ db, ownerId }: { db: DatabaseOrTransaction; ownerId: string }): Promise<Dog[]> {
  return toPublicDogs({ db, records: await findDogsByOwner({ db, ownerId }) });
}

/*===== Get =====*/
type GetDogResult = { kind: "success"; dog: Dog } | NotFoundResult;

/** @returns `not-found` for another owner's dog and a malformed id alike. */
export async function getDog({ db, ownerId, id }: Owned & { id: string }): Promise<GetDogResult> {
  if (!isDogId(id)) return { kind: "not-found" };

  const record = await findDogByOwner({ db, ownerId, id });
  return record ? { kind: "success", dog: await toPublicDogOf({ db, record }) } : { kind: "not-found" };
}

/*===== Create =====*/
type CreateDogResult = { kind: "success"; dog: Dog } | InvalidResult;

/**
 * Validates and stores a new dog for its owner. A new dog is never evaluated: only an evaluation makes it so.
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
    return { kind: "success", dog: await toPublicDogOf({ db, record }) };
  } catch (error) {
    // The dog wasn't saved, so the photo that was just claimed belongs to nothing.
    if (photo) await discardPhoto({ db, mediaId: photo });
    throw error;
  }
}

/*===== Update =====*/
type UpdateDogResult = { kind: "success"; dog: Dog } | InvalidResult | NotFoundResult;

/**
 * Replaces a dog's details. The photo stays unless `photoMediaId` is given: a new ID replaces it and `null` removes it,
 * and the old image is deleted once the dog is saved.
 *
 * @returns `not-found` when the dog isn't the owner's (checked first, so a stranger learns nothing from validation
 * messages), `invalid` with per-field messages when the input breaks a domain rule, changes a locked field of an
 * evaluated dog, or the photo isn't a usable upload.
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

  const locked = lockedFieldChanges({ current, details: parsed.data });
  if (Object.keys(locked).length > 0) return { kind: "invalid", errors: [], fields: locked };

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
    // The write repeats the ownership check.
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

  return { kind: "success", dog: await toPublicDogOf({ db, record }) };
}

/*===== Admin =====*/
// The Admin sees and edits every dog (F2). A dog is never deleted, by anyone.

type AdminDogResult = { kind: "success"; dog: AdminDog } | NotFoundResult;

async function toAdminDog({ db, record }: { db: DatabaseOrTransaction; record: DogRecord }): Promise<AdminDogResult> {
  const owner = await findDogOwner({ db, dogId: record.id });
  if (!owner) return { kind: "not-found" };
  return { kind: "success", dog: { ...(await toPublicDogOf({ db, record })), owner } };
}

/** Every dog with its owner, newest first. */
export async function adminListDogs({ db }: { db: DatabaseOrTransaction }): Promise<AdminDog[]> {
  const rows = await findAllDogs({ db });
  const dogs = await toPublicDogs({ db, records: rows.map((row) => row.record) });
  return dogs.flatMap((dog, index) => {
    const owner = rows[index]?.owner;
    return owner ? [{ ...dog, owner }] : [];
  });
}

export async function adminGetDog({ db, id }: { db: DatabaseOrTransaction; id: string }): Promise<AdminDogResult> {
  if (!isDogId(id)) return { kind: "not-found" };
  const record = await findDogWithPhoto({ db, id });
  return record ? toAdminDog({ db, record }) : { kind: "not-found" };
}

/** The Admin changes the details of any dog, including the fields locked for the customer. Not its photo. */
export async function adminUpdateDog({
  db,
  id,
  input,
}: {
  db: Database;
  id: string;
  input: unknown;
}): Promise<AdminDogResult | InvalidResult> {
  if (!isDogId(id)) return { kind: "not-found" };

  const parsed = dogInputSchema.omit({ photoMediaId: true }).safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const record = await updateDogById({ db, id, values: parsed.data });
  return record ? toAdminDog({ db, record }) : { kind: "not-found" };
}

/**
 * Marks a course as passed for a dog the Admin already knows (it was trained before the site existed), or takes his
 * mark off. A course the dog passed by completing an enrollment stays passed either way.
 */
export async function adminSetPassedCourse({
  db,
  adminId,
  dogId,
  courseSlug,
  passed,
}: {
  db: Database;
  adminId: string;
  dogId: string;
  courseSlug: string;
  passed: boolean;
}): Promise<AdminDogResult> {
  if (!isDogId(dogId)) return { kind: "not-found" };

  const found = await findCourseBySlug({ db, slug: courseSlug });
  if (!found || !(await lockDogById({ db, id: dogId }))) return { kind: "not-found" };

  if (passed) await insertPassedCourse({ db, dogId, courseId: found.id, markedBy: adminId });
  else await deletePassedCourse({ db, dogId, courseId: found.id });

  return adminGetDog({ db, id: dogId });
}

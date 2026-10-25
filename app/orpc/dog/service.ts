import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import { findCourseBySlug } from "~/orpc/course/repository";
import { DOG_RECORD_PHOTO_PURPOSES, type DogRecordPhotoPurpose } from "~/orpc/dog/constants";
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
  findRecordPhotoIds,
  findRecordPhotos,
  findUsedRecordPhotoIds,
  insertDog,
  insertPassedCourse,
  isDogPhotoInUse,
  lockDogById,
  replaceRecordPhotos,
  updateDogByOwner,
  updateDogById,
  type DogRecord,
} from "~/orpc/dog/repository";
import { adminDogInputSchema, dogInputSchema, isDogId, type DogInput } from "~/orpc/dog/validation";
import { attachMedia, deleteMedia, isMediaId } from "~/orpc/media/service";
import { m } from "~/paraglide/messages";
import { getLocale, type Locale } from "~/paraglide/runtime";

/*===== Types =====*/
type Owned = { db: Database; ownerId: string };

type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };
type NotFoundResult = { kind: "not-found" };

/** A function, not a constant, so the sentence is in the language of the request that fails (not the first one). */
function photoInvalid(): InvalidResult {
  return { kind: "invalid", errors: [], fields: { photoMediaId: m.server_dog_photo_reupload() } };
}

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

/*===== Record Photos =====*/
// The photos in a dog's file (F2): its vaccination card, medical papers and tattoo. Each purpose's list is replaced as a
// whole when it is given; the images that are new to it are claimed before the save and the ones dropped from it are
// deleted after.

/** The input field that carries each purpose's IDs, which is also where its error is shown. */
const RECORD_PHOTO_FIELDS = {
  vaccination: "vaccinationPhotoIds",
  medical: "medicalPhotoIds",
  tattoo: "tattooPhotoIds",
} as const satisfies Record<DogRecordPhotoPurpose, keyof DogInput>;

type RecordPhotoLists = Partial<Record<DogRecordPhotoPurpose, string[]>>;

/** The purposes the input gives a list for; a purpose left out keeps its photos. */
function requestedRecordPhotos(input: DogInput): RecordPhotoLists {
  const lists: RecordPhotoLists = {};
  for (const purpose of DOG_RECORD_PHOTO_PURPOSES) {
    const ids = input[RECORD_PHOTO_FIELDS[purpose]];
    if (ids !== undefined) lists[purpose] = ids;
  }
  return lists;
}

type RecordPhotoPlan = {
  /** Newly claimed images: deleted again if the dog isn't saved. */
  claimed: string[];
  /** Images dropped from their list: deleted once the dog is saved. */
  dropped: string[];
};

/**
 * Claims the images that are new to each requested list as this owner's file photos. An image already in the same list
 * of the same dog stays as it is.
 *
 * @returns The plan, or `invalid` on the first list with an image that is unknown, not a `record` upload of this owner's,
 * or already in some dog's file; what was claimed so far is deleted again.
 */
async function claimRecordPhotos({
  db,
  ownerId,
  dogId,
  requested,
}: Owned & { dogId: string | null; requested: RecordPhotoLists }): Promise<RecordPhotoPlan | InvalidResult> {
  const plan: RecordPhotoPlan = { claimed: [], dropped: [] };

  for (const purpose of DOG_RECORD_PHOTO_PURPOSES) {
    const ids = requested[purpose];
    if (ids === undefined) continue;

    const current = dogId ? await findRecordPhotoIds({ db, dogId, purpose }) : [];
    const added = ids.filter((id) => !current.includes(id));
    plan.dropped.push(...current.filter((id) => !ids.includes(id)));

    const used = await findUsedRecordPhotoIds({ db, mediaIds: added.filter(isMediaId) });
    for (const mediaId of added) {
      const outcome =
        isMediaId(mediaId) && !used.has(mediaId)
          ? await attachMedia({ db, mediaId, kind: "record", userId: ownerId })
          : ({ kind: "invalid" } as const);
      if (outcome.kind !== "ok") {
        await discardPhotos({ db, mediaIds: plan.claimed });
        return {
          kind: "invalid",
          errors: [],
          fields: { [RECORD_PHOTO_FIELDS[purpose]]: m.server_dog_record_photos_reupload() },
        };
      }
      plan.claimed.push(mediaId);
    }
  }

  return plan;
}

/** Writes each requested list. Runs in the dog's save transaction, after the dog row exists. */
async function saveRecordPhotos({
  db,
  dogId,
  requested,
}: {
  db: DatabaseOrTransaction;
  dogId: string;
  requested: RecordPhotoLists;
}): Promise<void> {
  for (const purpose of DOG_RECORD_PHOTO_PURPOSES) {
    const mediaIds = requested[purpose];
    if (mediaIds !== undefined) await replaceRecordPhotos({ db, dogId, purpose, mediaIds });
  }
}

async function discardPhotos({ db, mediaIds }: { db: Database; mediaIds: string[] }): Promise<void> {
  await Promise.all(mediaIds.map((mediaId) => discardPhoto({ db, mediaId })));
}

/*===== Breed Purity =====*/
/**
 * F2: the customer says whether the dog is purebred, a cross or mixed, which decides what the breed inputs ask. Required
 * on every save the customer can still change it on; an evaluated dog written before it was asked keeps none, since
 * only the Admin may set the locked fields.
 */
function purityMissing({ details, locked }: { details: DogInput; locked: boolean }): InvalidResult | null {
  if (locked || details.breedPurity !== null) return null;
  return { kind: "invalid", errors: [], fields: { breedPurity: m.server_dog_purity_required() } };
}

/** Everything the dog row stores from the input: the photos are saved apart. */
function dogDetails(input: DogInput) {
  const {
    photoMediaId: _photoMediaId,
    vaccinationPhotoIds: _vaccinationPhotoIds,
    medicalPhotoIds: _medicalPhotoIds,
    tattooPhotoIds: _tattooPhotoIds,
    ...details
  } = input;
  return details;
}

/*===== Passed Courses =====*/
/** Converts stored dogs into public ones, reading all their passed courses in one query. */
async function toPublicDogs({
  db,
  records,
  locale = getLocale(),
}: {
  db: DatabaseOrTransaction;
  records: DogRecord[];
  /** The page's language by default; the Admin's views pass "fa". */
  locale?: Locale;
}): Promise<Dog[]> {
  const dogIds = records.map((record) => record.id);
  const [passed, recordPhotos] = await Promise.all([
    findPassedCourses({ db, dogIds }),
    findRecordPhotos({ db, dogIds }),
  ]);
  return records.map((record) => toPublicDog({ record, passed, recordPhotos, locale }));
}

async function toPublicDogOf({
  db,
  record,
  locale,
}: {
  db: DatabaseOrTransaction;
  record: DogRecord;
  locale?: Locale;
}): Promise<Dog> {
  const [dog] = await toPublicDogs({ db, records: [record], locale });
  if (!dog) throw new Error(`toPublicDogOf: dog ${record.id} was lost`);
  return dog;
}

/*===== Locked Fields =====*/
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
  details: { birthDate: string; breedPurity: string | null; breed: string | null; breedSecondary: string | null };
}): Record<string, string> {
  if (!current.isEvaluated) return {};
  const fields: Record<string, string> = {};
  if (details.birthDate !== current.birthDate) fields.birthDate = m.server_dog_field_locked();
  if (details.breedPurity !== current.breedPurity) fields.breedPurity = m.server_dog_field_locked();
  if (details.breed !== current.breed) fields.breed = m.server_dog_field_locked();
  if (details.breedSecondary !== current.breedSecondary) fields.breedSecondary = m.server_dog_field_locked();
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
 * Validates and stores a new dog for its owner, with the photos in its file. A new dog is never evaluated: only an
 * evaluation makes it so.
 *
 * @returns `invalid` with per-field messages when the input breaks a domain rule, or a photo isn't a usable upload.
 */
export async function createDog({ db, ownerId, input }: Owned & { input: unknown }): Promise<CreateDogResult> {
  const parsed = dogInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const missing = purityMissing({ details: parsed.data, locked: false });
  if (missing) return missing;

  const details = dogDetails(parsed.data);
  const photo = requestedPhoto(parsed.data.photoMediaId) ?? null;
  const recordPhotos = requestedRecordPhotos(parsed.data);

  if (photo && !(await attachDogPhoto({ db, ownerId, mediaId: photo }))) return photoInvalid();
  const plan = await claimRecordPhotos({ db, ownerId, dogId: null, requested: recordPhotos });
  if ("kind" in plan) {
    if (photo) await discardPhoto({ db, mediaId: photo });
    return plan;
  }

  try {
    const record = await db.transaction(async (tx) => {
      const inserted = await insertDog({ db: tx, ownerId, values: { ...details, photoMediaId: photo } });
      await saveRecordPhotos({ db: tx, dogId: inserted.id, requested: recordPhotos });
      return inserted;
    });
    return { kind: "success", dog: await toPublicDogOf({ db, record }) };
  } catch (error) {
    // The dog wasn't saved, so the photos that were just claimed belong to nothing.
    await discardPhotos({ db, mediaIds: photo ? [photo, ...plan.claimed] : plan.claimed });
    throw error;
  }
}

/*===== Update =====*/
type UpdateDogResult = { kind: "success"; dog: Dog } | InvalidResult | NotFoundResult;

/**
 * Replaces a dog's details. The photo stays unless `photoMediaId` is given: a new ID replaces it and `null` removes it,
 * and the old image is deleted once the dog is saved. Each list of file photos works the same way: left out keeps it,
 * given replaces it.
 *
 * @returns `not-found` when the dog isn't the owner's (checked first, so a stranger learns nothing from validation
 * messages), `invalid` with per-field messages when the input breaks a domain rule, changes a locked field of an
 * evaluated dog, or a photo isn't a usable upload.
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

  const missing = purityMissing({ details: parsed.data, locked: current.isEvaluated });
  if (missing) return missing;

  /*------ Photo ------*/
  const details = dogDetails(parsed.data);
  const requested = requestedPhoto(parsed.data.photoMediaId);
  const oldPhoto = current.photoMediaId;
  // Sending back the current photo is a no-op (a form that didn't touch it), not a second claim on it.
  const changed = requested !== undefined && requested !== oldPhoto;
  const newPhoto = changed ? requested : null;

  if (newPhoto && !(await attachDogPhoto({ db, ownerId, mediaId: newPhoto }))) return photoInvalid();

  /*------ File Photos ------*/
  const recordPhotos = requestedRecordPhotos(parsed.data);
  const plan = await claimRecordPhotos({ db, ownerId, dogId: id, requested: recordPhotos });
  if ("kind" in plan) {
    if (newPhoto) await discardPhoto({ db, mediaId: newPhoto });
    return plan;
  }
  const claimed = newPhoto ? [newPhoto, ...plan.claimed] : plan.claimed;

  /*------ Save ------*/
  let record;
  try {
    record = await db.transaction(async (tx) => {
      // The write repeats the ownership check.
      const updated = await updateDogByOwner({
        db: tx,
        ownerId,
        id,
        values: changed ? { ...details, photoMediaId: requested } : details,
      });
      if (updated) await saveRecordPhotos({ db: tx, dogId: id, requested: recordPhotos });
      return updated;
    });
  } catch (error) {
    await discardPhotos({ db, mediaIds: claimed });
    throw error;
  }

  if (!record) {
    await discardPhotos({ db, mediaIds: claimed });
    return { kind: "not-found" };
  }

  // Only now that the dog points at the new photos (or none) are the old ones safe to delete.
  await discardPhotos({ db, mediaIds: changed && oldPhoto ? [oldPhoto, ...plan.dropped] : plan.dropped });

  return { kind: "success", dog: await toPublicDogOf({ db, record }) };
}

/*===== Admin =====*/
// The Admin sees and edits every dog (F2). A dog is never deleted, by anyone.

type AdminDogResult = { kind: "success"; dog: AdminDog } | NotFoundResult;

async function toAdminDog({ db, record }: { db: DatabaseOrTransaction; record: DogRecord }): Promise<AdminDogResult> {
  const owner = await findDogOwner({ db, dogId: record.id });
  if (!owner) return { kind: "not-found" };
  return { kind: "success", dog: { ...(await toPublicDogOf({ db, record, locale: "fa" })), owner } };
}

/** Every dog with its owner, newest first. */
export async function adminListDogs({ db }: { db: DatabaseOrTransaction }): Promise<AdminDog[]> {
  const rows = await findAllDogs({ db });
  const dogs = await toPublicDogs({ db, records: rows.map((row) => row.record), locale: "fa" });
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

/**
 * The Admin changes the details of any dog, including the fields locked for the customer. Not its photos. She may leave
 * the breed's purity unstated: she fills it in when she knows the dog.
 */
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

  const parsed = adminDogInputSchema.safeParse(input);
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

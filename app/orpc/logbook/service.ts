import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { normalizeFileNumber } from "~/lib/dog-file";
import { issuesToErrorData } from "~/lib/schema-issues";
import type { UserRole } from "~/lib/user-constants";
import { isDogId } from "~/orpc/dog/validation";
import type { LogbookEntry } from "~/orpc/logbook/contract";
import { toLogbookEntry } from "~/orpc/logbook/mapper";
import {
  enrollmentBelongsToDog,
  findDogByFileNumber,
  findDogOwner,
  findEntriesByDog,
  findEntryById,
  insertEntry,
  updateEntry,
} from "~/orpc/logbook/repository";
import { sessionFieldsSchema } from "~/orpc/logbook/validation";

/*===== Types =====*/
type NotFoundResult = { kind: "not-found" };
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };

/*===== Locate =====*/
/**
 * Where this person's own page for the dog with this file number is. The Admin's is any dog's; a customer's is their own
 * dog's; nobody else gets one, and neither does a number that is malformed or doesn't exist: all of those are `null`.
 */
export async function locateDog({
  db,
  user,
  fileNumber,
}: {
  db: DatabaseOrTransaction;
  user: { id: string; role: UserRole };
  fileNumber: string;
}): Promise<{ path: string } | null> {
  const normalized = normalizeFileNumber(fileNumber);
  if (!normalized) return null;

  const found = await findDogByFileNumber({ db, fileNumber: normalized });
  if (!found) return null;

  if (user.role === "admin") return { path: `/admin/dogs/${found.id}` };
  if (user.role === "customer" && found.ownerId === user.id) return { path: `/account/dogs/${found.id}` };
  return null;
}

/*===== Reading =====*/
type ListResult = { kind: "success"; entries: LogbookEntry[] } | NotFoundResult;

/**
 * A dog's diary for its owner. Another owner's dog, a made-up id and a malformed one read the same: `not-found`, so the
 * API never says a dog exists.
 */
export async function listDogLogbook({
  db,
  ownerId,
  dogId,
}: {
  db: DatabaseOrTransaction;
  ownerId: string;
  dogId: string;
}): Promise<ListResult> {
  if (!isDogId(dogId)) return { kind: "not-found" };
  const found = await findDogOwner({ db, dogId });
  if (!found || found.ownerId !== ownerId) return { kind: "not-found" };
  return { kind: "success", entries: (await findEntriesByDog({ db, dogId })).map(toLogbookEntry) };
}

/** A dog's diary for the Admin. */
export async function adminListDogLogbook({
  db,
  dogId,
}: {
  db: DatabaseOrTransaction;
  dogId: string;
}): Promise<ListResult> {
  if (!isDogId(dogId)) return { kind: "not-found" };
  if (!(await findDogOwner({ db, dogId }))) return { kind: "not-found" };
  return { kind: "success", entries: (await findEntriesByDog({ db, dogId })).map(toLogbookEntry) };
}

/*===== Writing =====*/
type WriteResult = { kind: "success"; entry: LogbookEntry } | NotFoundResult | InvalidResult;

/** A session's course, if given, must be one of this dog's. */
async function checkEnrollment({
  db,
  dogId,
  enrollmentId,
}: {
  db: DatabaseOrTransaction;
  dogId: string;
  enrollmentId: string | null;
}): Promise<InvalidResult | null> {
  if (enrollmentId === null) return null;
  // A malformed id would make Postgres throw, and it can't be this dog's enrollment either way.
  if (!isDogId(enrollmentId) || !(await enrollmentBelongsToDog({ db, enrollmentId, dogId }))) {
    return { kind: "invalid", errors: [], fields: { enrollmentId: "این دوره مال این سگ نیست." } };
  }
  return null;
}

/** The Admin writes one session down for a dog. */
export async function adminAddEntry({
  db,
  authorId,
  input,
}: {
  db: Database;
  authorId: string;
  input: { dogId: string } & Record<string, unknown>;
}): Promise<WriteResult> {
  if (!isDogId(input.dogId) || !(await findDogOwner({ db, dogId: input.dogId }))) return { kind: "not-found" };

  const { dogId, ...fields } = input;
  const parsed = sessionFieldsSchema.safeParse(fields);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const refused = await checkEnrollment({ db, dogId, enrollmentId: parsed.data.enrollmentId });
  if (refused) return refused;

  const id = await insertEntry({ db, dogId, authorId, values: parsed.data });
  const saved = await findEntryById({ db, id });
  if (!saved) throw new Error(`adminAddEntry: entry ${id} could not be read back`);
  return { kind: "success", entry: toLogbookEntry(saved) };
}

/** The Admin corrects a session. */
export async function adminUpdateEntry({
  db,
  input,
}: {
  db: Database;
  input: { id: string } & Record<string, unknown>;
}): Promise<WriteResult> {
  if (!isDogId(input.id)) return { kind: "not-found" };
  const existing = await findEntryById({ db, id: input.id });
  if (!existing) return { kind: "not-found" };

  const { id, ...fields } = input;
  const parsed = sessionFieldsSchema.safeParse(fields);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const refused = await checkEnrollment({ db, dogId: existing.entry.dogId, enrollmentId: parsed.data.enrollmentId });
  if (refused) return refused;

  await updateEntry({ db, id, values: parsed.data });
  const saved = await findEntryById({ db, id });
  if (!saved) throw new Error(`adminUpdateEntry: entry ${id} could not be read back`);
  return { kind: "success", entry: toLogbookEntry(saved) };
}

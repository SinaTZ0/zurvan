import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { dog, evaluation, evaluationPhoto, evaluationVideo, media, user } from "~/db/schema";
import type { MediaRecord } from "~/orpc/media/repository";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type EvaluationRecord = typeof evaluation.$inferSelect;
export type EvaluationVideoRecord = typeof evaluationVideo.$inferSelect;

/** An evaluation with the dog, its photo and the customer around it, read in one query. */
export type EvaluationRow = {
  evaluation: EvaluationRecord;
  dog: { id: string; name: string };
  dogPhoto: MediaRecord | null;
  customer: { id: string; name: string; phoneNumber: string | null };
};

export type EvaluationPhotoRecord = { evaluationId: string; media: MediaRecord };

/*===== Reads =====*/
/**
 * Evaluations with their dog and customer, filtered by any of `id`, `customerId`, `dogId` and `status`. Waiting
 * requests come first (the Admin answers those), then newest first.
 */
export async function findEvaluations({
  db,
  id,
  customerId,
  dogId,
  status,
}: Executor & { id?: string; customerId?: string; dogId?: string; status?: string }): Promise<EvaluationRow[]> {
  const rows = await db
    .select({
      evaluation,
      dog: { id: dog.id, name: dog.name },
      dogPhoto: media,
      customer: { id: user.id, name: user.name, phoneNumber: user.phoneNumber },
    })
    .from(evaluation)
    .innerJoin(dog, eq(evaluation.dogId, dog.id))
    .innerJoin(user, eq(evaluation.customerId, user.id))
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .where(
      and(
        id ? eq(evaluation.id, id) : undefined,
        customerId ? eq(evaluation.customerId, customerId) : undefined,
        dogId ? eq(evaluation.dogId, dogId) : undefined,
        status ? eq(evaluation.status, status) : undefined,
      ),
    )
    .orderBy(sql`(${evaluation.status} = 'requested') desc`, desc(evaluation.createdAt), asc(evaluation.id));
  return rows;
}

/** The dog's `requested` or `evaluated` evaluation, if any: the one that stops it requesting another (F3). */
export async function findOpenEvaluation({
  db,
  dogId,
}: Executor & { dogId: string }): Promise<EvaluationRecord | undefined> {
  const [row] = await db
    .select()
    .from(evaluation)
    .where(and(eq(evaluation.dogId, dogId), inArray(evaluation.status, ["requested", "evaluated"])));
  return row;
}

/** The photos of several evaluations in one query, each evaluation's in the order the customer put them. */
export async function findPhotosByEvaluations({
  db,
  evaluationIds,
}: Executor & { evaluationIds: string[] }): Promise<EvaluationPhotoRecord[]> {
  if (evaluationIds.length === 0) return [];
  return db
    .select({ evaluationId: evaluationPhoto.evaluationId, media })
    .from(evaluationPhoto)
    .innerJoin(media, eq(evaluationPhoto.mediaId, media.id))
    .where(inArray(evaluationPhoto.evaluationId, evaluationIds))
    .orderBy(asc(evaluationPhoto.position));
}

/** The videos of several evaluations in one query, each evaluation's in the order the customer put them. */
export function findVideosByEvaluations({
  db,
  evaluationIds,
}: Executor & { evaluationIds: string[] }): Promise<EvaluationVideoRecord[]> {
  if (evaluationIds.length === 0) return Promise.resolve([]);
  return db
    .select()
    .from(evaluationVideo)
    .where(inArray(evaluationVideo.evaluationId, evaluationIds))
    .orderBy(asc(evaluationVideo.position), asc(evaluationVideo.id));
}

/** Which of these media are already some evaluation's photo. One upload can't be sent twice. */
export async function findUsedPhotoIds({ db, mediaIds }: Executor & { mediaIds: string[] }): Promise<Set<string>> {
  if (mediaIds.length === 0) return new Set();
  const rows = await db
    .select({ mediaId: evaluationPhoto.mediaId })
    .from(evaluationPhoto)
    .where(inArray(evaluationPhoto.mediaId, mediaIds));
  return new Set(rows.map((row) => row.mediaId));
}

/*===== Writes =====*/
export async function insertEvaluation({
  db,
  values,
}: Executor & { values: typeof evaluation.$inferInsert }): Promise<EvaluationRecord> {
  const [row] = await db.insert(evaluation).values(values).returning();
  if (!row) throw new Error("insertEvaluation: no row returned");
  return row;
}

export async function insertPhotos({
  db,
  evaluationId,
  mediaIds,
}: Executor & { evaluationId: string; mediaIds: string[] }): Promise<void> {
  if (mediaIds.length === 0) return;
  await db.insert(evaluationPhoto).values(mediaIds.map((mediaId, position) => ({ evaluationId, mediaId, position })));
}

/**
 * Moves an evaluation out of `requested`: a conditional update (F12, statuses only move forward), so two answers at
 * once can't both win. `customerId` makes it the customer's own (withdrawing).
 *
 * @returns The updated row's id, or undefined when it isn't there, isn't theirs or has been answered already.
 */
export async function answerRequestedEvaluation({
  db,
  id,
  customerId,
  values,
}: Executor & {
  id: string;
  customerId?: string;
  values: Pick<typeof evaluation.$inferInsert, "status" | "rejectionReason" | "decidedAt">;
}): Promise<string | undefined> {
  const [row] = await db
    .update(evaluation)
    .set(values)
    .where(
      and(
        eq(evaluation.id, id),
        eq(evaluation.status, "requested"),
        customerId ? eq(evaluation.customerId, customerId) : undefined,
      ),
    )
    .returning({ id: evaluation.id });
  return row?.id;
}

/*===== Videos =====*/
export async function insertVideo({
  db,
  values,
}: Executor & { values: typeof evaluationVideo.$inferInsert }): Promise<EvaluationVideoRecord> {
  const [row] = await db.insert(evaluationVideo).values(values).returning();
  if (!row) throw new Error("insertVideo: no row returned");
  return row;
}

export async function findVideoById({ db, id }: Executor & { id: string }): Promise<EvaluationVideoRecord | undefined> {
  const [row] = await db.select().from(evaluationVideo).where(eq(evaluationVideo.id, id));
  return row;
}

/** The uploader's videos among `ids` that are not part of an evaluation yet, locked so two requests can't claim one. */
export function lockUnsentVideos({
  db,
  uploadedBy,
  ids,
}: Executor & { uploadedBy: string; ids: string[] }): Promise<EvaluationVideoRecord[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return db
    .select()
    .from(evaluationVideo)
    .where(
      and(
        inArray(evaluationVideo.id, ids),
        eq(evaluationVideo.uploadedBy, uploadedBy),
        isNull(evaluationVideo.evaluationId),
      ),
    )
    .orderBy(asc(evaluationVideo.id))
    .for("update");
}

/** Makes the videos part of the evaluation, in the order of `ids`. */
export async function attachVideos({
  db,
  evaluationId,
  ids,
}: Executor & { evaluationId: string; ids: string[] }): Promise<void> {
  for (const [position, id] of ids.entries()) {
    await db.update(evaluationVideo).set({ evaluationId, position }).where(eq(evaluationVideo.id, id));
  }
}

export async function deleteVideoRow({ db, id }: Executor & { id: string }): Promise<void> {
  await db.delete(evaluationVideo).where(eq(evaluationVideo.id, id));
}

/** The customer whose evaluation a video belongs to. Undefined for a video that isn't part of one. */
export async function findVideoOwnership({
  db,
  id,
}: Executor & { id: string }): Promise<{ customerId: string } | undefined> {
  const [row] = await db
    .select({ customerId: evaluation.customerId })
    .from(evaluationVideo)
    .innerJoin(evaluation, eq(evaluationVideo.evaluationId, evaluation.id))
    .where(eq(evaluationVideo.id, id));
  return row;
}

/** How many videos the user has uploaded and not sent with an evaluation yet. */
export async function countUnsentVideos({ db, uploadedBy }: Executor & { uploadedBy: string }): Promise<number> {
  const rows = await db
    .select({ id: evaluationVideo.id })
    .from(evaluationVideo)
    .where(and(eq(evaluationVideo.uploadedBy, uploadedBy), isNull(evaluationVideo.evaluationId)));
  return rows.length;
}

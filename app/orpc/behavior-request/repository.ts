import { and, asc, desc, eq, inArray, isNull, lt, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { DatabaseOrTransaction } from "~/db/client.server";
import {
  behaviorRequest,
  behaviorRequestVideo,
  course,
  customerOrder,
  dog,
  enrollment,
  media,
  orderItem,
  refundPolicy,
  user,
} from "~/db/schema";
import { LIVE_ENROLLMENT_STATUSES } from "~/orpc/enrollment/constants";
import type { BehaviorRequestStatus } from "~/orpc/behavior-request/constants";
import type { MediaRecord } from "~/orpc/media/repository";

/*===== Types =====*/
export type BehaviorRequestRecord = typeof behaviorRequest.$inferSelect;
export type BehaviorVideoRecord = typeof behaviorRequestVideo.$inferSelect;
export type CourseRecord = typeof course.$inferSelect;

/** What the screens show of a person. */
export type PersonRecord = Pick<
  typeof user.$inferSelect,
  "id" | "name" | "firstName" | "lastName" | "role" | "phoneNumber"
>;

/** A request with the people, dog and enrollment around it, read in one query. Its videos are read separately. */
export type BehaviorRequestRow = {
  request: BehaviorRequestRecord;
  dog: { id: string; name: string };
  photo: MediaRecord | null;
  trainer: PersonRecord;
  customer: PersonRecord;
  /** The enrollment the paid plan created. */
  enrollmentId: string | null;
};

type Executor = { db: DatabaseOrTransaction };

/*===== Selection =====*/
const trainerUser = alias(user, "trainer_user");
const customerUser = alias(user, "customer_user");

// Generic so the aliased copies of `user` fit too: they have the same columns under another table name.
function personColumns<
  T extends { id: unknown; name: unknown; firstName: unknown; lastName: unknown; role: unknown; phoneNumber: unknown },
>(table: T) {
  return {
    id: table.id,
    name: table.name,
    firstName: table.firstName,
    lastName: table.lastName,
    role: table.role,
    phoneNumber: table.phoneNumber,
  } as Pick<T, "id" | "name" | "firstName" | "lastName" | "role" | "phoneNumber">;
}

/** One query for the request, its dog and photo, both people and the enrollment, so a list never costs a query per row. */
function selectRequestRows({ db, where }: Executor & { where: SQL | undefined }): Promise<BehaviorRequestRow[]> {
  return db
    .select({
      request: behaviorRequest,
      dog: { id: dog.id, name: dog.name },
      photo: media,
      trainer: personColumns(trainerUser),
      customer: personColumns(customerUser),
      enrollmentId: enrollment.id,
    })
    .from(behaviorRequest)
    .innerJoin(dog, eq(behaviorRequest.dogId, dog.id))
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .innerJoin(trainerUser, eq(behaviorRequest.trainerId, trainerUser.id))
    .innerJoin(customerUser, eq(behaviorRequest.customerId, customerUser.id))
    .leftJoin(enrollment, eq(enrollment.behaviorRequestId, behaviorRequest.id))
    .where(where)
    .orderBy(desc(behaviorRequest.createdAt), desc(behaviorRequest.id));
}

/*===== Reads =====*/
// Every read is scoped to the customer or the trainer it is for, so a service cannot forget either.

/** The customer's requests, newest first. */
export function findRequestsByCustomer({ db, customerId }: Executor & { customerId: string }) {
  return selectRequestRows({ db, where: eq(behaviorRequest.customerId, customerId) });
}

/** The trainer's requests, newest first, optionally of one status. */
export function findRequestsByTrainer({
  db,
  trainerId,
  status,
}: Executor & { trainerId: string; status?: BehaviorRequestStatus }) {
  return selectRequestRows({
    db,
    where: and(eq(behaviorRequest.trainerId, trainerId), status ? eq(behaviorRequest.status, status) : undefined),
  });
}

/** One request of the trainer's, in any status. Another trainer's reads as not there. */
export async function findRequestByTrainer({
  db,
  trainerId,
  id,
}: Executor & { trainerId: string; id: string }): Promise<BehaviorRequestRow | undefined> {
  const [row] = await selectRequestRows({
    db,
    where: and(eq(behaviorRequest.id, id), eq(behaviorRequest.trainerId, trainerId)),
  });
  return row;
}

/** The videos of several requests in one query, each request's in the order the customer put them. */
export function findVideosByRequests({
  db,
  requestIds,
}: Executor & { requestIds: string[] }): Promise<BehaviorVideoRecord[]> {
  if (requestIds.length === 0) return Promise.resolve([]);
  return db
    .select()
    .from(behaviorRequestVideo)
    .where(inArray(behaviorRequestVideo.behaviorRequestId, requestIds))
    .orderBy(asc(behaviorRequestVideo.position), asc(behaviorRequestVideo.id));
}

/** The behavior modification course, which every plan is an enrollment of, with its refund policy. */
export async function findBehaviorCourse({
  db,
}: Executor): Promise<{ course: CourseRecord; refundPolicy: typeof refundPolicy.$inferSelect } | undefined> {
  const [row] = await db
    .select({ course, refundPolicy })
    .from(course)
    .innerJoin(refundPolicy, eq(course.refundPolicyId, refundPolicy.id))
    .where(and(eq(course.bookingKind, "behavior-request"), eq(course.status, "approved")))
    .orderBy(asc(course.position))
    .limit(1);
  return row;
}

/** The ids of the pending orders that pay this request's plan. */
export async function findPendingOrderIdsOfRequest({
  db,
  requestId,
}: Executor & { requestId: string }): Promise<string[]> {
  const rows = await db
    .selectDistinct({ id: customerOrder.id })
    .from(customerOrder)
    .innerJoin(orderItem, eq(orderItem.orderId, customerOrder.id))
    .where(and(eq(orderItem.behaviorRequestId, requestId), eq(customerOrder.paymentStatus, "pending")));
  return rows.map((row) => row.id);
}

/** The dogs, among these, that have a request being worked on, with that request. */
export function findOpenRequestsOfDogs({
  db,
  dogIds,
}: Executor & { dogIds: string[] }): Promise<{ dogId: string; requestId: string }[]> {
  if (dogIds.length === 0) return Promise.resolve([]);
  return db
    .select({ dogId: behaviorRequest.dogId, requestId: behaviorRequest.id })
    .from(behaviorRequest)
    .where(and(inArray(behaviorRequest.dogId, dogIds), inArray(behaviorRequest.status, ["submitted", "proposed"])));
}

/** The dogs, among these, that are in a behavior plan now, with that enrollment. */
export function findLiveBehaviorEnrollmentsOfDogs({
  db,
  dogIds,
}: Executor & { dogIds: string[] }): Promise<{ dogId: string; enrollmentId: string }[]> {
  if (dogIds.length === 0) return Promise.resolve([]);
  return db
    .select({ dogId: enrollment.dogId, enrollmentId: enrollment.id })
    .from(enrollment)
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .where(
      and(
        inArray(enrollment.dogId, dogIds),
        eq(course.bookingKind, "behavior-request"),
        inArray(enrollment.status, [...LIVE_ENROLLMENT_STATUSES]),
      ),
    );
}

/*===== Writes =====*/
export async function insertRequest({
  db,
  values,
}: Executor & { values: typeof behaviorRequest.$inferInsert }): Promise<BehaviorRequestRecord> {
  const [row] = await db.insert(behaviorRequest).values(values).returning();
  if (!row) throw new Error("insertRequest: no row returned");
  return row;
}

/** Locks a request for the rest of the database transaction, so two answers to it run one after the other. */
export async function lockRequest({ db, id }: Executor & { id: string }): Promise<BehaviorRequestRecord | undefined> {
  const [row] = await db.select().from(behaviorRequest).where(eq(behaviorRequest.id, id)).for("update");
  return row;
}

export async function updateRequest({
  db,
  id,
  values,
}: Executor & { id: string; values: Partial<typeof behaviorRequest.$inferInsert> }) {
  await db.update(behaviorRequest).set(values).where(eq(behaviorRequest.id, id));
}

/**
 * Marks the proposals whose time to pay ran out as expired. Reads call it first, so a list never shows a plan that can
 * no longer be paid as live and a new request is never blocked by one. Paying checks the deadline itself, so this is
 * tidiness, not correctness: a background job can take it over later.
 */
export async function expireDueRequests({ db, now }: Executor & { now: Date }) {
  await db
    .update(behaviorRequest)
    .set({ status: "expired" })
    .where(and(eq(behaviorRequest.status, "proposed"), lt(behaviorRequest.proposalExpiresAt, now)));
}

/*===== Videos =====*/
export async function insertVideo({
  db,
  values,
}: Executor & { values: typeof behaviorRequestVideo.$inferInsert }): Promise<BehaviorVideoRecord> {
  const [row] = await db.insert(behaviorRequestVideo).values(values).returning();
  if (!row) throw new Error("insertVideo: no row returned");
  return row;
}

export async function findVideoById({ db, id }: Executor & { id: string }): Promise<BehaviorVideoRecord | undefined> {
  const [row] = await db.select().from(behaviorRequestVideo).where(eq(behaviorRequestVideo.id, id));
  return row;
}

/** The uploader's videos among `ids` that are not part of a request yet, locked so two requests can't claim one. */
export function lockUnsentVideos({
  db,
  uploadedBy,
  ids,
}: Executor & { uploadedBy: string; ids: string[] }): Promise<BehaviorVideoRecord[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return db
    .select()
    .from(behaviorRequestVideo)
    .where(
      and(
        inArray(behaviorRequestVideo.id, ids),
        eq(behaviorRequestVideo.uploadedBy, uploadedBy),
        isNull(behaviorRequestVideo.behaviorRequestId),
      ),
    )
    .orderBy(asc(behaviorRequestVideo.id))
    .for("update");
}

/** Makes the videos part of the request, in the order of `ids`. */
export async function attachVideos({ db, requestId, ids }: Executor & { requestId: string; ids: string[] }) {
  for (const [position, id] of ids.entries()) {
    await db
      .update(behaviorRequestVideo)
      .set({ behaviorRequestId: requestId, position })
      .where(eq(behaviorRequestVideo.id, id));
  }
}

export async function deleteVideoRow({ db, id }: Executor & { id: string }) {
  await db.delete(behaviorRequestVideo).where(eq(behaviorRequestVideo.id, id));
}

/** The request a video belongs to, with the people who may see it. Undefined for a video that isn't part of one. */
export async function findVideoOwnership({
  db,
  id,
}: Executor & { id: string }): Promise<{ customerId: string; trainerId: string } | undefined> {
  const [row] = await db
    .select({ customerId: behaviorRequest.customerId, trainerId: behaviorRequest.trainerId })
    .from(behaviorRequestVideo)
    .innerJoin(behaviorRequest, eq(behaviorRequestVideo.behaviorRequestId, behaviorRequest.id))
    .where(eq(behaviorRequestVideo.id, id));
  return row;
}

/** How many videos the user has uploaded and not sent with a request yet. */
export async function countUnsentVideos({ db, uploadedBy }: Executor & { uploadedBy: string }): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(behaviorRequestVideo)
    .where(and(eq(behaviorRequestVideo.uploadedBy, uploadedBy), isNull(behaviorRequestVideo.behaviorRequestId)));
  return row?.total ?? 0;
}

import { and, asc, desc, eq, gt, gte, inArray, lt, lte, ne, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { assessment, assessmentRecommendation, assessmentSlot, course, dog, media, user } from "~/db/schema";
import type { AssessmentStatus, AssessmentSlotStatus } from "~/orpc/assessment/constants";
import type { MediaRecord } from "~/orpc/media/repository";

/*===== Types =====*/
export type SlotRecord = typeof assessmentSlot.$inferSelect;
export type AssessmentRecord = typeof assessment.$inferSelect;

/** What the screens show of a person: enough for a name, a role flag and an SMS. */
export type PersonRecord = Pick<
  typeof user.$inferSelect,
  "id" | "name" | "firstName" | "lastName" | "role" | "phoneNumber"
>;

/** An assessment with everything its screens need, read in one query. */
export type AssessmentRow = {
  assessment: AssessmentRecord;
  slot: SlotRecord;
  dog: { id: string; name: string };
  photo: MediaRecord | null;
  trainer: PersonRecord;
  customer: PersonRecord;
};

export type OpenSlotRow = { slot: SlotRecord; trainer: PersonRecord };

export type ScheduleRow = {
  slot: SlotRecord;
  assessment: AssessmentRecord | null;
  dog: { name: string } | null;
  photo: MediaRecord | null;
  customer: { name: string } | null;
};

export type RecommendationRow = { assessmentId: string; slug: string; title: string; latinName: string };

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

/** One query for the assessment, its slot, dog, photo and both people, so a list never costs a query per row. */
function selectAssessmentRows({ db, where }: Executor & { where: SQL | undefined }): Promise<AssessmentRow[]> {
  return (
    db
      .select({
        assessment,
        slot: assessmentSlot,
        dog: { id: dog.id, name: dog.name },
        photo: media,
        trainer: personColumns(trainerUser),
        customer: personColumns(customerUser),
      })
      .from(assessment)
      .innerJoin(assessmentSlot, eq(assessment.slotId, assessmentSlot.id))
      .innerJoin(dog, eq(assessment.dogId, dog.id))
      .leftJoin(media, eq(dog.photoMediaId, media.id))
      .innerJoin(trainerUser, eq(assessment.trainerId, trainerUser.id))
      .innerJoin(customerUser, eq(assessment.customerId, customerUser.id))
      .where(where)
      // Newest slot first; `id` breaks ties.
      .orderBy(desc(assessmentSlot.startsAt), desc(assessment.id))
  );
}

/*===== Assessment Reads =====*/
// Every read is scoped to the customer or the trainer it is for, so a service cannot forget either.

/** Lists a customer's assessments, newest slot first, those of removed dogs included. */
export function findAssessmentsByCustomer({
  db,
  customerId,
  dogId,
}: Executor & { customerId: string; dogId?: string }): Promise<AssessmentRow[]> {
  return selectAssessmentRows({
    db,
    where: and(eq(assessment.customerId, customerId), dogId ? eq(assessment.dogId, dogId) : undefined),
  });
}

/** Finds one of the customer's assessments. Another customer's reads the same as one that isn't there. */
export async function findAssessmentByCustomer({
  db,
  customerId,
  id,
}: Executor & { customerId: string; id: string }): Promise<AssessmentRow | undefined> {
  const [row] = await selectAssessmentRows({
    db,
    where: and(eq(assessment.id, id), eq(assessment.customerId, customerId)),
  });
  return row;
}

/** Finds one assessment of the trainer's, in any status. Another trainer's reads as not there. */
export async function findAssessmentByTrainer({
  db,
  trainerId,
  id,
}: Executor & { trainerId: string; id: string }): Promise<AssessmentRow | undefined> {
  const [row] = await selectAssessmentRows({
    db,
    where: and(eq(assessment.id, id), eq(assessment.trainerId, trainerId)),
  });
  return row;
}

/** The recommended courses of several assessments in one query, each assessment's in the order to take them. */
export function findRecommendations({
  db,
  assessmentIds,
}: Executor & { assessmentIds: string[] }): Promise<RecommendationRow[]> {
  if (assessmentIds.length === 0) return Promise.resolve([]);

  return db
    .select({
      assessmentId: assessmentRecommendation.assessmentId,
      slug: course.slug,
      title: course.title,
      latinName: course.latinName,
    })
    .from(assessmentRecommendation)
    .innerJoin(course, eq(assessmentRecommendation.courseId, course.id))
    .where(inArray(assessmentRecommendation.assessmentId, assessmentIds))
    .orderBy(asc(assessmentRecommendation.assessmentId), asc(assessmentRecommendation.position));
}

/*===== Slot Reads =====*/
/** Lists the head trainer's open slots that start after `after` and no later than `until`, soonest first. */
export function findOpenSlots({ db, after, until }: Executor & { after: Date; until: Date }): Promise<OpenSlotRow[]> {
  return db
    .select({ slot: assessmentSlot, trainer: personColumns(user) })
    .from(assessmentSlot)
    .innerJoin(user, eq(assessmentSlot.trainerId, user.id))
    .where(
      and(
        eq(assessmentSlot.status, "open"),
        gt(assessmentSlot.startsAt, after),
        lte(assessmentSlot.startsAt, until),
        // The owner wants customers to book the head trainer only for now; the assistant's slots stay on her own
        // schedule. TODO: the Trainer Profile's head-trainer flag instead of the role, when entity 2 exists.
        eq(user.role, "admin"),
      ),
    )
    .orderBy(asc(assessmentSlot.startsAt), asc(assessmentSlot.id));
}

/** The trainer's slots that start from `from` up to, not including, `to`, each with its live assessment if any. */
export function findScheduleRows({
  db,
  trainerId,
  from,
  to,
}: Executor & { trainerId: string; from: Date; to: Date }): Promise<ScheduleRow[]> {
  return (
    db
      .select({
        slot: assessmentSlot,
        assessment,
        dog: { name: dog.name },
        photo: media,
        customer: { name: customerUser.name },
      })
      .from(assessmentSlot)
      // A cancelled assessment no longer holds the slot, so it never shows on the schedule.
      .leftJoin(assessment, and(eq(assessment.slotId, assessmentSlot.id), ne(assessment.status, "cancelled")))
      .leftJoin(dog, eq(assessment.dogId, dog.id))
      .leftJoin(media, eq(dog.photoMediaId, media.id))
      .leftJoin(customerUser, eq(assessment.customerId, customerUser.id))
      .where(
        and(
          eq(assessmentSlot.trainerId, trainerId),
          gte(assessmentSlot.startsAt, from),
          lt(assessmentSlot.startsAt, to),
        ),
      )
      .orderBy(asc(assessmentSlot.startsAt), asc(assessmentSlot.id))
  );
}

/** The start and length of the trainer's slots that aren't closed and start within a range, to find overlaps. */
export function findLiveSlotTimes({
  db,
  trainerId,
  from,
  to,
}: Executor & { trainerId: string; from: Date; to: Date }): Promise<{ startsAt: Date; durationMinutes: number }[]> {
  return db
    .select({ startsAt: assessmentSlot.startsAt, durationMinutes: assessmentSlot.durationMinutes })
    .from(assessmentSlot)
    .where(
      and(
        eq(assessmentSlot.trainerId, trainerId),
        ne(assessmentSlot.status, "closed"),
        gte(assessmentSlot.startsAt, from),
        lte(assessmentSlot.startsAt, to),
      ),
    );
}

/*===== Slot Writes =====*/
/**
 * Inserts open slots, leaving out a time the trainer already has a live slot at (the partial unique index decides, so
 * two requests at once can't both open it).
 *
 * @returns The start times that were inserted.
 */
export async function insertOpenSlots({
  db,
  trainerId,
  startsAt,
  durationMinutes,
}: Executor & { trainerId: string; startsAt: Date[]; durationMinutes: number }): Promise<Date[]> {
  if (startsAt.length === 0) return [];

  const rows = await db
    .insert(assessmentSlot)
    .values(startsAt.map((time) => ({ trainerId, startsAt: time, durationMinutes })))
    // No target: any unique violation here means "that time is already open".
    .onConflictDoNothing()
    .returning({ startsAt: assessmentSlot.startsAt });

  return rows.map((row) => row.startsAt);
}

/**
 * Books a slot in one conditional statement: it only changes an open slot that hasn't started, so of two customers
 * racing for it exactly one gets a row back.
 *
 * @returns The slot, or `undefined` when it isn't open, has started or doesn't exist.
 */
export async function claimOpenSlot({
  db,
  slotId,
  now,
}: Executor & { slotId: string; now: Date }): Promise<SlotRecord | undefined> {
  const [row] = await db
    .update(assessmentSlot)
    .set({ status: "booked" })
    .where(and(eq(assessmentSlot.id, slotId), eq(assessmentSlot.status, "open"), gt(assessmentSlot.startsAt, now)))
    .returning();
  return row;
}

/**
 * Moves a slot from `booked` to another status in one conditional statement. A cancelled assessment frees its slot
 * (`open`) when the customer cancels, and closes it (`closed`) when the trainer does.
 *
 * @returns Whether the slot was booked.
 */
export async function releaseBookedSlot({
  db,
  slotId,
  status,
  now,
}: Executor & {
  slotId: string;
  status: Extract<AssessmentSlotStatus, "open" | "closed">;
  now: Date;
}): Promise<boolean> {
  const rows = await db
    .update(assessmentSlot)
    .set({ status })
    // A slot that has started stays as it is: its time has been used.
    .where(and(eq(assessmentSlot.id, slotId), eq(assessmentSlot.status, "booked"), gt(assessmentSlot.startsAt, now)))
    .returning({ id: assessmentSlot.id });
  return rows.length > 0;
}

/** Closes one of the trainer's open slots. Returns whether it was theirs and open. */
export async function closeOpenSlotByTrainer({
  db,
  trainerId,
  slotId,
}: Executor & { trainerId: string; slotId: string }): Promise<boolean> {
  const rows = await db
    .update(assessmentSlot)
    .set({ status: "closed" })
    .where(
      and(eq(assessmentSlot.id, slotId), eq(assessmentSlot.trainerId, trainerId), eq(assessmentSlot.status, "open")),
    )
    .returning({ id: assessmentSlot.id });
  return rows.length > 0;
}

/** Reads one of the trainer's slots, to tell "not yours" from "not open". */
export async function findSlotByTrainer({
  db,
  trainerId,
  slotId,
}: Executor & { trainerId: string; slotId: string }): Promise<SlotRecord | undefined> {
  const [row] = await db
    .select()
    .from(assessmentSlot)
    .where(and(eq(assessmentSlot.id, slotId), eq(assessmentSlot.trainerId, trainerId)))
    .limit(1);
  return row;
}

/*===== Assessment Writes =====*/
export type NewAssessmentValues = Pick<
  typeof assessment.$inferInsert,
  "slotId" | "dogId" | "customerId" | "trainerId" | "trainingGoal" | "customerNote" | "placeKind" | "place"
>;

/** Inserts a booked assessment. Throws a unique violation when the slot or the dog is already taken. */
export async function insertAssessment({ db, values }: Executor & { values: NewAssessmentValues }): Promise<string> {
  const [inserted] = await db.insert(assessment).values(values).returning({ id: assessment.id });
  if (!inserted) throw new Error("insertAssessment: insert returned no row");
  return inserted.id;
}

/**
 * Cancels a booked assessment in one conditional statement, scoped to the person cancelling.
 *
 * @returns The slot it held, or `undefined` when it isn't theirs or isn't booked any more.
 */
export async function markAssessmentCancelled({
  db,
  id,
  scope,
  cancelledBy,
  reason,
  now,
}: Executor & {
  id: string;
  scope: { customerId: string } | { trainerId: string };
  cancelledBy: string;
  reason: string | null;
  now: Date;
}): Promise<{ slotId: string } | undefined> {
  const [row] = await db
    .update(assessment)
    .set({ status: "cancelled" satisfies AssessmentStatus, cancelledBy, cancellationReason: reason, cancelledAt: now })
    .where(
      and(
        eq(assessment.id, id),
        eq(assessment.status, "booked"),
        "customerId" in scope ? eq(assessment.customerId, scope.customerId) : eq(assessment.trainerId, scope.trainerId),
      ),
    )
    .returning({ slotId: assessment.slotId });
  return row;
}

/**
 * Records the outcome of a booked assessment in one conditional statement.
 *
 * @returns Whether it was the trainer's and still booked.
 */
export async function markAssessmentOutcome({
  db,
  id,
  trainerId,
  status,
  trainerNotes,
  now,
}: Executor & {
  id: string;
  trainerId: string;
  status: Extract<AssessmentStatus, "completed" | "no-show">;
  trainerNotes: string | null;
  now: Date;
}): Promise<boolean> {
  const rows = await db
    .update(assessment)
    .set({ status, trainerNotes, completedAt: now })
    .where(and(eq(assessment.id, id), eq(assessment.trainerId, trainerId), eq(assessment.status, "booked")))
    .returning({ id: assessment.id });
  return rows.length > 0;
}

/** Saves the recommended courses in the order given. */
export async function insertRecommendations({
  db,
  assessmentId,
  courseIds,
}: Executor & { assessmentId: string; courseIds: string[] }): Promise<void> {
  if (courseIds.length === 0) return;

  await db
    .insert(assessmentRecommendation)
    .values(courseIds.map((courseId, position) => ({ assessmentId, courseId, position })));
}

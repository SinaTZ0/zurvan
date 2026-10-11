import { and, asc, desc, eq, gte, inArray, isNull, lt, ne, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { DatabaseOrTransaction } from "~/db/client.server";
import {
  assessment,
  assessmentSlot,
  course,
  customerOrder,
  dog,
  enrollment,
  media,
  orderItem,
  trainingSession,
  user,
} from "~/db/schema";
import type { EnrollmentStatus, SessionStatus } from "~/orpc/enrollment/constants";
import { SESSION_MAX_DURATION_MINUTES, USED_SESSION_STATUSES } from "~/orpc/enrollment/constants";
import type { MediaRecord } from "~/orpc/media/repository";

/*===== Types =====*/
export type EnrollmentRecord = typeof enrollment.$inferSelect;
export type SessionRecord = typeof trainingSession.$inferSelect;

/** What the screens show of a person: enough for a name, a role flag and an SMS. */
export type PersonRecord = Pick<
  typeof user.$inferSelect,
  "id" | "name" | "firstName" | "lastName" | "role" | "phoneNumber"
>;

/** An enrollment with everything its screens need, read in one query. Its sessions are read separately, in one query. */
export type EnrollmentRow = {
  enrollment: EnrollmentRecord;
  course: Pick<typeof course.$inferSelect, "slug" | "title" | "latinName">;
  dog: { id: string; name: string };
  photo: MediaRecord | null;
  trainer: PersonRecord;
  customer: PersonRecord;
  /** The money the customer paid for it and the refund policy they bought under. */
  item: Pick<
    typeof orderItem.$inferSelect,
    "orderId" | "paidAmount" | "refundedAmount" | "refundPolicyName" | "refundPolicyPercent"
  >;
  orderNumber: string;
};

/** A session on the trainer's week view with the enrollment's course and dog. */
export type TrainerSessionRow = {
  session: SessionRecord;
  courseTitle: string;
  dog: { name: string };
  photo: MediaRecord | null;
};

/** Something of the trainer's that a session being placed might run into. */
export type OverlapRow = { kind: "session" | "assessment"; startsAt: Date; durationMinutes: number; label: string };

export type AssessmentSummaryRecord = Pick<typeof assessment.$inferSelect, "id" | "completedAt" | "trainerNotes">;

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

/** One query for the enrollment, its course, dog, photo, both people and the order item, so a list never costs a query per row. */
function selectEnrollmentRows({ db, where }: Executor & { where: SQL | undefined }): Promise<EnrollmentRow[]> {
  return (
    db
      .select({
        enrollment,
        course: { slug: course.slug, title: course.title, latinName: course.latinName },
        dog: { id: dog.id, name: dog.name },
        photo: media,
        trainer: personColumns(trainerUser),
        customer: personColumns(customerUser),
        item: {
          orderId: orderItem.orderId,
          paidAmount: orderItem.paidAmount,
          refundedAmount: orderItem.refundedAmount,
          refundPolicyName: orderItem.refundPolicyName,
          refundPolicyPercent: orderItem.refundPolicyPercent,
        },
        orderNumber: customerOrder.number,
      })
      .from(enrollment)
      .innerJoin(course, eq(enrollment.courseId, course.id))
      .innerJoin(dog, eq(enrollment.dogId, dog.id))
      .leftJoin(media, eq(dog.photoMediaId, media.id))
      .innerJoin(trainerUser, eq(enrollment.trainerId, trainerUser.id))
      .innerJoin(customerUser, eq(enrollment.customerId, customerUser.id))
      .innerJoin(orderItem, eq(enrollment.orderItemId, orderItem.id))
      .innerJoin(customerOrder, eq(orderItem.orderId, customerOrder.id))
      // A soft-deleted enrollment is gone for everyone.
      .where(and(isNull(enrollment.deletedAt), where))
      // Newest first; `id` breaks ties.
      .orderBy(desc(enrollment.createdAt), desc(enrollment.id))
  );
}

/*===== Enrollment Reads =====*/
// Every read is scoped to the customer or the trainer it is for, so a service cannot forget either.

/** Lists a customer's enrollments, newest first, those of removed dogs included. */
export function findEnrollmentsByCustomer({
  db,
  customerId,
  dogId,
}: Executor & { customerId: string; dogId?: string }): Promise<EnrollmentRow[]> {
  return selectEnrollmentRows({
    db,
    where: and(eq(enrollment.customerId, customerId), dogId ? eq(enrollment.dogId, dogId) : undefined),
  });
}

/** Finds one of the customer's enrollments. Another customer's reads the same as one that isn't there. */
export async function findEnrollmentByCustomer({
  db,
  customerId,
  id,
}: Executor & { customerId: string; id: string }): Promise<EnrollmentRow | undefined> {
  const [row] = await selectEnrollmentRows({
    db,
    where: and(eq(enrollment.id, id), eq(enrollment.customerId, customerId)),
  });
  return row;
}

/** Lists a trainer's enrollments, newest first, optionally of one status. */
export function findEnrollmentsByTrainer({
  db,
  trainerId,
  status,
}: Executor & { trainerId: string; status?: EnrollmentStatus }): Promise<EnrollmentRow[]> {
  return selectEnrollmentRows({
    db,
    where: and(eq(enrollment.trainerId, trainerId), status ? eq(enrollment.status, status) : undefined),
  });
}

/** Finds one enrollment of the trainer's, in any status. Another trainer's reads as not there. */
export async function findEnrollmentByTrainer({
  db,
  trainerId,
  id,
}: Executor & { trainerId: string; id: string }): Promise<EnrollmentRow | undefined> {
  const [row] = await selectEnrollmentRows({
    db,
    where: and(eq(enrollment.id, id), eq(enrollment.trainerId, trainerId)),
  });
  return row;
}

/** The sessions of several enrollments in one query, each enrollment's oldest first. */
export function findSessionsByEnrollments({
  db,
  enrollmentIds,
}: Executor & { enrollmentIds: string[] }): Promise<SessionRecord[]> {
  if (enrollmentIds.length === 0) return Promise.resolve([]);

  return db
    .select()
    .from(trainingSession)
    .where(inArray(trainingSession.enrollmentId, enrollmentIds))
    .orderBy(asc(trainingSession.startsAt), asc(trainingSession.id));
}

/** The assessment that recommended the course, for the trainer's context. */
export async function findAssessmentSummary({
  db,
  id,
}: Executor & { id: string }): Promise<AssessmentSummaryRecord | undefined> {
  const [row] = await db
    .select({ id: assessment.id, completedAt: assessment.completedAt, trainerNotes: assessment.trainerNotes })
    .from(assessment)
    .where(eq(assessment.id, id))
    .limit(1);
  return row;
}

/*===== Session Reads =====*/
/**
 * Finds one session of an enrollment of the trainer's. It is scoped by the enrollment's trainer, so another trainer's
 * session reads as not there.
 */
export async function findSessionByTrainer({
  db,
  trainerId,
  id,
}: Executor & { trainerId: string; id: string }): Promise<SessionRecord | undefined> {
  const [row] = await db
    .select({ session: trainingSession })
    .from(trainingSession)
    .innerJoin(enrollment, eq(trainingSession.enrollmentId, enrollment.id))
    .where(and(eq(trainingSession.id, id), eq(enrollment.trainerId, trainerId), isNull(enrollment.deletedAt)))
    .limit(1);
  return row?.session;
}

/** The trainer's sessions that start from `from` up to, not including, `to`, cancelled ones left out, in time order. */
export function findTrainerSessionsInRange({
  db,
  trainerId,
  from,
  to,
}: Executor & { trainerId: string; from: Date; to: Date }): Promise<TrainerSessionRow[]> {
  return db
    .select({ session: trainingSession, courseTitle: course.title, dog: { name: dog.name }, photo: media })
    .from(trainingSession)
    .innerJoin(enrollment, eq(trainingSession.enrollmentId, enrollment.id))
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .innerJoin(dog, eq(enrollment.dogId, dog.id))
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .where(
      and(
        eq(trainingSession.trainerId, trainerId),
        ne(trainingSession.status, "cancelled" satisfies SessionStatus),
        gte(trainingSession.startsAt, from),
        lt(trainingSession.startsAt, to),
      ),
    )
    .orderBy(asc(trainingSession.startsAt), asc(trainingSession.id));
}

/**
 * The trainer's sessions (not cancelled) and booked assessments that intersect `[startsAt, endsAt)`, to warn about a
 * clash. `ignoreSessionId` leaves out the session being moved, which would otherwise overlap itself.
 */
export async function findOverlaps({
  db,
  trainerId,
  startsAt,
  endsAt,
  ignoreSessionId,
}: Executor & { trainerId: string; startsAt: Date; endsAt: Date; ignoreSessionId?: string }): Promise<OverlapRow[]> {
  // Something can reach into the range only if it starts within the longest session's length before it.
  const earliest = new Date(startsAt.getTime() - SESSION_MAX_DURATION_MINUTES * 60_000);

  const [sessions, assessments] = await Promise.all([
    db
      .select({
        id: trainingSession.id,
        startsAt: trainingSession.startsAt,
        durationMinutes: trainingSession.durationMinutes,
        courseTitle: course.title,
        dogName: dog.name,
      })
      .from(trainingSession)
      .innerJoin(enrollment, eq(trainingSession.enrollmentId, enrollment.id))
      .innerJoin(course, eq(enrollment.courseId, course.id))
      .innerJoin(dog, eq(enrollment.dogId, dog.id))
      .where(
        and(
          eq(trainingSession.trainerId, trainerId),
          ne(trainingSession.status, "cancelled" satisfies SessionStatus),
          gte(trainingSession.startsAt, earliest),
          lt(trainingSession.startsAt, endsAt),
        ),
      ),
    db
      .select({
        startsAt: assessmentSlot.startsAt,
        durationMinutes: assessmentSlot.durationMinutes,
        dogName: dog.name,
      })
      .from(assessment)
      .innerJoin(assessmentSlot, eq(assessment.slotId, assessmentSlot.id))
      .innerJoin(dog, eq(assessment.dogId, dog.id))
      .where(
        and(
          eq(assessment.trainerId, trainerId),
          eq(assessment.status, "booked"),
          gte(assessmentSlot.startsAt, earliest),
          lt(assessmentSlot.startsAt, endsAt),
        ),
      ),
  ]);

  const found: OverlapRow[] = [
    ...sessions
      .filter((session) => session.id !== ignoreSessionId)
      .map((session) => ({
        kind: "session" as const,
        startsAt: session.startsAt,
        durationMinutes: session.durationMinutes,
        label: `${session.courseTitle} · ${session.dogName}`,
      })),
    ...assessments.map((slot) => ({
      kind: "assessment" as const,
      startsAt: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      label: `ارزیابی ${slot.dogName}`,
    })),
  ];

  // The window above was widened to catch long sessions that started earlier; keep only those that really reach in.
  const reaching = found.filter(
    (other) => other.startsAt.getTime() + other.durationMinutes * 60_000 > startsAt.getTime(),
  );
  // `sort` is on the fresh array `filter` returned, and the project's ES2022 target has no `toSorted`.
  // oxlint-disable-next-line unicorn/no-array-sort
  return reaching.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/*===== Locking =====*/
/**
 * Locks one of the trainer's enrollments until the transaction ends, so two requests changing its sessions or its
 * result take turns and each re-checks the status it finds.
 */
export async function lockEnrollment({
  db,
  trainerId,
  id,
}: Executor & { trainerId: string; id: string }): Promise<EnrollmentRecord | undefined> {
  const [row] = await db
    .select()
    .from(enrollment)
    .where(and(eq(enrollment.id, id), eq(enrollment.trainerId, trainerId), isNull(enrollment.deletedAt)))
    .limit(1)
    .for("update");
  return row;
}

/** How many sessions of the enrollment are used up: held and missed. */
export async function findUsedSessionCount({ db, enrollmentId }: Executor & { enrollmentId: string }): Promise<number> {
  const rows = await db
    .select({ id: trainingSession.id })
    .from(trainingSession)
    .where(
      and(eq(trainingSession.enrollmentId, enrollmentId), inArray(trainingSession.status, [...USED_SESSION_STATUSES])),
    );
  return rows.length;
}

/*===== Session Writes =====*/
export type NewSessionValues = Pick<
  typeof trainingSession.$inferInsert,
  "enrollmentId" | "trainerId" | "startsAt" | "durationMinutes" | "placeKind" | "place"
>;

/** Inserts a scheduled session and returns its id. */
export async function insertSession({ db, values }: Executor & { values: NewSessionValues }): Promise<string> {
  const [inserted] = await db.insert(trainingSession).values(values).returning({ id: trainingSession.id });
  if (!inserted) throw new Error("insertSession: insert returned no row");
  return inserted.id;
}

/**
 * Moves a scheduled session. A conditional update, so a session that was marked or cancelled in the meantime is left
 * alone.
 *
 * @returns Whether it was still scheduled.
 */
export async function updateScheduledSession({
  db,
  id,
  values,
}: Executor & {
  id: string;
  values: Partial<Pick<NewSessionValues, "startsAt" | "durationMinutes" | "placeKind" | "place">>;
}): Promise<boolean> {
  const rows = await db
    .update(trainingSession)
    .set(values)
    .where(and(eq(trainingSession.id, id), eq(trainingSession.status, "scheduled" satisfies SessionStatus)))
    .returning({ id: trainingSession.id });
  return rows.length > 0;
}

/** Cancels a scheduled session. Returns whether it was still scheduled. */
export async function cancelScheduledSession({ db, id }: Executor & { id: string }): Promise<boolean> {
  const rows = await db
    .update(trainingSession)
    .set({ status: "cancelled" satisfies SessionStatus })
    .where(and(eq(trainingSession.id, id), eq(trainingSession.status, "scheduled" satisfies SessionStatus)))
    .returning({ id: trainingSession.id });
  return rows.length > 0;
}

/** Records a scheduled session as held or missed, with the trainer's note. Returns whether it was still scheduled. */
export async function markScheduledSession({
  db,
  id,
  status,
  trainerNote,
}: Executor & {
  id: string;
  status: Extract<SessionStatus, "held" | "missed">;
  trainerNote: string | null;
}): Promise<boolean> {
  const rows = await db
    .update(trainingSession)
    .set({ status, trainerNote })
    .where(and(eq(trainingSession.id, id), eq(trainingSession.status, "scheduled" satisfies SessionStatus)))
    .returning({ id: trainingSession.id });
  return rows.length > 0;
}

/** Changes the note of a session that was already held or missed. Returns whether it was. */
export async function updateRecordedSessionNote({
  db,
  id,
  trainerNote,
}: Executor & { id: string; trainerNote: string | null }): Promise<boolean> {
  const rows = await db
    .update(trainingSession)
    .set({ trainerNote })
    .where(and(eq(trainingSession.id, id), inArray(trainingSession.status, [...USED_SESSION_STATUSES])))
    .returning({ id: trainingSession.id });
  return rows.length > 0;
}

/** Cancels every session of the enrollment that is still scheduled, when its result is recorded. */
export async function cancelScheduledSessionsOf({
  db,
  enrollmentId,
}: Executor & { enrollmentId: string }): Promise<void> {
  await db
    .update(trainingSession)
    .set({ status: "cancelled" satisfies SessionStatus })
    .where(
      and(
        eq(trainingSession.enrollmentId, enrollmentId),
        eq(trainingSession.status, "scheduled" satisfies SessionStatus),
      ),
    );
}

/*===== Enrollment Writes =====*/
/** Moves an enrollment from `scheduling` to `active` when its first session is scheduled. A no-op in any other status. */
export async function activateEnrollment({ db, id }: Executor & { id: string }): Promise<void> {
  await db
    .update(enrollment)
    .set({ status: "active" satisfies EnrollmentStatus })
    .where(and(eq(enrollment.id, id), eq(enrollment.status, "scheduling" satisfies EnrollmentStatus)));
}

/** Sets how many sessions the enrollment is planned for. */
export async function updatePlannedSessions({
  db,
  id,
  plannedSessions,
}: Executor & { id: string; plannedSessions: number }): Promise<void> {
  await db.update(enrollment).set({ plannedSessions }).where(eq(enrollment.id, id));
}

/**
 * Records the result of an active enrollment in one conditional statement.
 *
 * @returns Whether it was still active.
 */
export async function markEnrollmentResult({
  db,
  id,
  status,
  trainerNote,
  now,
}: Executor & {
  id: string;
  status: Extract<EnrollmentStatus, "passed" | "failed">;
  trainerNote: string;
  now: Date;
}): Promise<boolean> {
  const rows = await db
    .update(enrollment)
    .set({ status, trainerNote, completedAt: now })
    .where(and(eq(enrollment.id, id), eq(enrollment.status, "active" satisfies EnrollmentStatus)))
    .returning({ id: enrollment.id });
  return rows.length > 0;
}

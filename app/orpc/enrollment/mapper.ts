import { calculateEnrollmentRefund } from "~/lib/business-rules";
import { TRAINING_GOALS } from "~/orpc/assessment/constants";
import type { TrainingGoal } from "~/orpc/assessment/constants";
import type { Dog } from "~/orpc/dog/contract";
import {
  CANCELLED_BY_ROLES,
  ENROLLMENT_KINDS,
  ENROLLMENT_STATUSES,
  LIVE_ENROLLMENT_STATUSES,
  SESSION_PLACE_KINDS,
  SESSION_STATUSES,
  USED_SESSION_STATUSES,
} from "~/orpc/enrollment/constants";
import type {
  CancelledByRole,
  EnrollmentKind,
  EnrollmentStatus,
  SessionPlaceKind,
  SessionStatus,
} from "~/orpc/enrollment/constants";
import type {
  CustomerEnrollment,
  TrainerEnrollment,
  TrainerEnrollmentSummary,
  TrainerSession,
  TrainingSession,
} from "~/orpc/enrollment/contract";
import type {
  AssessmentSummaryRecord,
  EnrollmentRow,
  PersonRecord,
  SessionRecord,
  TrainerSessionRow,
} from "~/orpc/enrollment/repository";
import { toPublicMedia } from "~/orpc/media/mapper";

/*===== People =====*/
/** First and last name, which is how people are addressed; the account's single `name` is the fallback. */
export function fullName(person: Pick<PersonRecord, "name" | "firstName" | "lastName">): string {
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
  return name || person.name;
}

/**
 * Whether the trainer is the head trainer. For now that is every Admin (the owner holds the one Admin account);
 * TODO: read the Trainer Profile's flag when that entity lands.
 */
export function isHeadTrainer(person: Pick<PersonRecord, "role">): boolean {
  return person.role === "admin";
}

/*===== Session =====*/
/**
 * Converts a stored session into its public shape.
 *
 * @throws When `status` or `placeKind` isn't a known value. The service only writes valid values, so this means
 * corrupted data that should surface instead of being shown as a wrong status.
 */
export function toTrainingSession(record: SessionRecord): TrainingSession {
  if (!isSessionStatus(record.status)) throw new Error(`Session ${record.id} has an unknown status: ${record.status}`);
  if (!isSessionPlaceKind(record.placeKind)) {
    throw new Error(`Session ${record.id} has an unknown place kind: ${record.placeKind}`);
  }

  return {
    id: record.id,
    startsAt: record.startsAt,
    durationMinutes: record.durationMinutes,
    placeKind: record.placeKind,
    place: record.place,
    status: record.status,
    trainerNote: record.trainerNote,
  };
}

/** Converts a session on the trainer's week view. */
export function toTrainerSession({
  session,
  position,
  plannedSessions,
  courseTitle,
  dog,
  photo,
}: TrainerSessionRow): TrainerSession {
  return {
    ...toTrainingSession(session),
    enrollmentId: session.enrollmentId,
    position,
    plannedSessions,
    courseTitle,
    dog: { name: dog.name, photo: photo ? toPublicMedia(photo) : null },
  };
}

/*===== Progress =====*/
/** Held and missed sessions: both are used up (docs/business-logic.md, B11). */
function countUsed(sessions: TrainingSession[]): number {
  return sessions.filter((session) => (USED_SESSION_STATUSES as readonly string[]).includes(session.status)).length;
}

/** The earliest scheduled session, whether or not its time has passed. Sessions arrive oldest first. */
function earliestScheduled(sessions: TrainingSession[]): TrainingSession | null {
  return sessions.find((session) => session.status === "scheduled") ?? null;
}

/** The earliest scheduled session that starts after `now`: what the customer and the trainer are waiting for. */
function nextSessionOf({ sessions, now }: { sessions: TrainingSession[]; now: Date }): TrainingSession | null {
  return (
    sessions.find((session) => session.status === "scheduled" && session.startsAt.getTime() > now.getTime()) ?? null
  );
}

function isLive(status: EnrollmentStatus): boolean {
  return (LIVE_ENROLLMENT_STATUSES as readonly string[]).includes(status);
}

/*===== Shared Fields =====*/
type Common = Omit<
  CustomerEnrollment,
  "dog" | "paidAmount" | "refundedAmount" | "refundPolicy" | "canCancel" | "refundPreview"
>;

/**
 * What the customer's and the trainer's views share. Dropping the money from this is what keeps it out of the
 * trainer's view, which adds back only the refund basis.
 *
 * @throws When a stored value isn't a known one, for the reason {@link toTrainingSession} gives.
 */
function toCommon({ row, sessions, now }: { row: EnrollmentRow; sessions: SessionRecord[]; now: Date }): Common {
  const { enrollment } = row;
  if (!isEnrollmentKind(enrollment.kind)) {
    throw new Error(`Enrollment ${enrollment.id} has an unknown kind: ${enrollment.kind}`);
  }
  if (!isEnrollmentStatus(enrollment.status)) {
    throw new Error(`Enrollment ${enrollment.id} has an unknown status: ${enrollment.status}`);
  }
  if (!isTrainingGoal(enrollment.trainingGoal)) {
    throw new Error(`Enrollment ${enrollment.id} has an unknown training goal: ${enrollment.trainingGoal}`);
  }
  if (enrollment.cancelledByRole !== null && !isCancelledByRole(enrollment.cancelledByRole)) {
    throw new Error(`Enrollment ${enrollment.id} has an unknown canceller: ${enrollment.cancelledByRole}`);
  }

  const mapped = sessions.map(toTrainingSession);

  return {
    id: enrollment.id,
    kind: enrollment.kind,
    status: enrollment.status,
    course: { ...row.course, sessionDurationMinutes: null },
    trainer: { name: fullName(row.trainer), isHeadTrainer: isHeadTrainer(row.trainer) },
    trainingGoal: enrollment.trainingGoal,
    boarding: enrollment.boarding,
    address: enrollment.address,
    preferredTimes: enrollment.preferredTimes,
    plannedSessions: enrollment.plannedSessions,
    usedSessions: countUsed(mapped),
    isRetake: enrollment.isRetake,
    sessions: mapped,
    nextSession: nextSessionOf({ sessions: mapped, now }),
    trainerNote: enrollment.trainerNote,
    completedAt: enrollment.completedAt,
    cancelledByRole: enrollment.cancelledByRole,
    cancellationReason: enrollment.cancellationReason,
    cancelledAt: enrollment.cancelledAt,
    createdAt: enrollment.createdAt,
    order: { id: row.item.orderId, number: row.orderNumber },
  };
}

/*===== Customer Enrollment =====*/
/**
 * Converts a stored enrollment into what its customer sees: the course, dog and trainer by name, the sessions, what was
 * paid, and `canCancel` with the refund cancelling would give now. The preview uses the same function the cancelling
 * will, so the amount shown is the amount refunded; its test cut-off is measured from the earliest scheduled session,
 * even one whose time has passed without being recorded.
 *
 * @throws When a stored value isn't a known one, for the reason {@link toTrainingSession} gives.
 */
export function toCustomerEnrollment({
  row,
  sessions,
  now,
}: {
  row: EnrollmentRow;
  sessions: SessionRecord[];
  now: Date;
}): CustomerEnrollment {
  const common = toCommon({ row, sessions, now });
  const canCancel = isLive(common.status);

  return {
    ...common,
    dog: { id: row.dog.id, name: row.dog.name, photo: row.photo ? toPublicMedia(row.photo) : null },
    paidAmount: row.item.paidAmount,
    refundedAmount: row.item.refundedAmount,
    refundPolicy: { name: row.item.refundPolicyName, percent: row.item.refundPolicyPercent },
    canCancel,
    refundPreview: canCancel
      ? calculateEnrollmentRefund({
          kind: common.kind,
          paidAmount: row.item.paidAmount,
          plannedSessions: common.plannedSessions,
          usedSessions: common.usedSessions,
          policyPercent: row.item.refundPolicyPercent,
          cancelledBy: "customer",
          nextSessionStartsAt: earliestScheduled(common.sessions)?.startsAt ?? null,
          now,
        })
      : null,
  };
}

/*===== Trainer Enrollment =====*/
/**
 * Same as {@link toCustomerEnrollment} without the money (bar the refund basis), plus the whole dog (from the dog feature's own mapper, so the
 * trainer sees it as the owner does), the customer's contact details, the recommending assessment and what the trainer
 * may do now.
 */
export function toTrainerEnrollment({
  row,
  sessions,
  dog,
  assessment,
  now,
}: {
  row: EnrollmentRow;
  sessions: SessionRecord[];
  dog: Dog;
  assessment: AssessmentSummaryRecord | undefined;
  now: Date;
}): TrainerEnrollment {
  const common = toCommon({ row, sessions, now });

  return {
    ...common,
    dog,
    refundBasis: {
      paidAmount: row.item.paidAmount,
      refundedAmount: row.item.refundedAmount,
      policyPercent: row.item.refundPolicyPercent,
    },
    customer: { name: fullName(row.customer), phoneNumber: row.customer.phoneNumber },
    assessment: assessment
      ? { id: assessment.id, completedAt: assessment.completedAt, trainerNotes: assessment.trainerNotes }
      : null,
    canSchedule: isLive(common.status),
    canRecordResult: common.status === "active" && common.usedSessions >= 1,
  };
}

/*===== Trainer Summary =====*/
/** Converts an enrollment for the trainer's list: no sessions, just the progress and the next one. */
export function toTrainerEnrollmentSummary({
  row,
  sessions,
  now,
}: {
  row: EnrollmentRow;
  sessions: SessionRecord[];
  now: Date;
}): TrainerEnrollmentSummary {
  const common = toCommon({ row, sessions, now });

  return {
    id: common.id,
    kind: common.kind,
    status: common.status,
    course: { slug: common.course.slug, title: common.course.title },
    dog: { id: row.dog.id, name: row.dog.name, photo: row.photo ? toPublicMedia(row.photo) : null },
    customerName: fullName(row.customer),
    customerPhoneNumber: row.customer.phoneNumber,
    preferredTimes: common.preferredTimes,
    plannedSessions: common.plannedSessions,
    usedSessions: common.usedSessions,
    sessions: common.sessions,
    nextSession: common.nextSession,
    completedAt: common.completedAt,
    cancelledAt: common.cancelledAt,
    createdAt: common.createdAt,
  };
}

/** 0 for those waiting to be scheduled, 1 for those in training, 2 for the rest. */
function sortGroup(summary: TrainerEnrollmentSummary): number {
  return summary.status === "scheduling" ? 0 : summary.status === "active" ? 1 : 2;
}

/**
 * Orders the trainer's list by what needs them: enrollments waiting to be scheduled first, the longest-waiting at the
 * top; then those in training by the session coming up (those with none last); then the finished ones, newest first.
 */
export function sortTrainerSummaries(summaries: TrainerEnrollmentSummary[]): TrainerEnrollmentSummary[] {
  // `sort` is on a fresh array, and the project's ES2022 target has no `toSorted`.
  // oxlint-disable-next-line unicorn/no-array-sort
  return [...summaries].sort((a, b) => {
    const byGroup = sortGroup(a) - sortGroup(b);
    if (byGroup !== 0) return byGroup;

    if (a.status === "scheduling") return a.createdAt.getTime() - b.createdAt.getTime();
    if (a.status === "active") {
      const aNext = a.nextSession?.startsAt.getTime() ?? Infinity;
      const bNext = b.nextSession?.startsAt.getTime() ?? Infinity;
      if (aNext !== bNext) return aNext < bNext ? -1 : 1;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/*===== Type Guards =====*/
function isEnrollmentKind(value: string): value is EnrollmentKind {
  return (ENROLLMENT_KINDS as readonly string[]).includes(value);
}

function isEnrollmentStatus(value: string): value is EnrollmentStatus {
  return (ENROLLMENT_STATUSES as readonly string[]).includes(value);
}

function isSessionStatus(value: string): value is SessionStatus {
  return (SESSION_STATUSES as readonly string[]).includes(value);
}

function isSessionPlaceKind(value: string): value is SessionPlaceKind {
  return (SESSION_PLACE_KINDS as readonly string[]).includes(value);
}

function isTrainingGoal(value: string): value is TrainingGoal {
  return (TRAINING_GOALS as readonly string[]).includes(value);
}

function isCancelledByRole(value: string): value is CancelledByRole {
  return (CANCELLED_BY_ROLES as readonly string[]).includes(value);
}

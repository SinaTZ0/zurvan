import { oc } from "@orpc/contract";
import { z } from "zod";

import { dogSchema } from "~/orpc/dog/contract";
import {
  CANCELLED_BY_ROLES,
  ENROLLMENT_KINDS,
  ENROLLMENT_REFUND_RULES,
  ENROLLMENT_STATUSES,
  SESSION_PLACE_KINDS,
  SESSION_STATUSES,
} from "~/orpc/enrollment/constants";
import { TRAINING_GOALS } from "~/orpc/assessment/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { mediaSchema } from "~/orpc/media/contract";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
const dogSummarySchema = z.object({ id: z.string(), name: z.string(), photo: mediaSchema.nullable() });

/** One meeting of the trainer with the dog. */
export const trainingSessionSchema = z.object({
  id: z.string(),
  startsAt: z.date(),
  durationMinutes: z.number().int(),
  placeKind: z.enum(SESSION_PLACE_KINDS),
  /** The address, the meeting point, or the kennel. */
  place: z.string(),
  status: z.enum(SESSION_STATUSES),
  /** Shown to the customer. */
  trainerNote: z.string().nullable(),
});

export type TrainingSession = z.infer<typeof trainingSessionSchema>;

/** What both sides see of an enrollment; the money and the cancel preview are the customer's, the whole dog the trainer's. */
const enrollmentBaseShape = {
  id: z.string(),
  kind: z.enum(ENROLLMENT_KINDS),
  status: z.enum(ENROLLMENT_STATUSES),
  course: z.object({
    slug: z.string(),
    title: z.string(),
    latinName: z.string(),
    /** Null for now: a course has no session length yet, so screens use `SESSION_DEFAULT_DURATION_MINUTES`. */
    sessionDurationMinutes: z.number().int().nullable(),
  }),
  trainer: z.object({
    name: z.string(),
    /** The owner. For now that is every Admin; it becomes the Trainer Profile's flag when that entity lands. */
    isHeadTrainer: z.boolean(),
  }),
  trainingGoal: z.enum(TRAINING_GOALS),
  boarding: z.boolean(),
  address: z.string().nullable(),
  preferredTimes: z.string(),
  plannedSessions: z.number().int(),
  /** Held and missed sessions: both are used up. */
  usedSessions: z.number().int(),
  isRetake: z.boolean(),
  /** Oldest first, cancelled ones included. */
  sessions: z.array(trainingSessionSchema),
  /** The earliest scheduled session that starts after now. */
  nextSession: trainingSessionSchema.nullable(),
  /** The trainer's final feedback, set with the result. */
  trainerNote: z.string().nullable(),
  completedAt: z.date().nullable(),
  cancelledByRole: z.enum(CANCELLED_BY_ROLES).nullable(),
  cancellationReason: z.string().nullable(),
  cancelledAt: z.date().nullable(),
  createdAt: z.date(),
  order: z.object({ id: z.string(), number: z.string() }),
};

/** An enrollment as its customer sees it, with what they paid and what cancelling would give back. */
export const customerEnrollmentSchema = z.object({
  ...enrollmentBaseShape,
  dog: dogSummarySchema,
  /*------ Money ------*/
  /** Rial, from the order item. */
  paidAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundPolicy: z.object({ name: z.string(), percent: z.number().int() }),
  /*------ Cancelling ------*/
  /** Live (scheduling or active), so the customer may cancel it. */
  canCancel: z.boolean(),
  /**
   * What cancelling now gives back, from `calculateEnrollmentRefund`. Null unless `canCancel`. The cancelling itself
   * recomputes it, so the amount shown is the amount refunded.
   */
  refundPreview: z.object({ amount: z.number().int(), rule: z.enum(ENROLLMENT_REFUND_RULES) }).nullable(),
});

export type CustomerEnrollment = z.infer<typeof customerEnrollmentSchema>;

/**
 * An enrollment as its trainer sees it: the whole dog and the customer's contact details. Of the money, only what the
 * refund rule needs, so changing the planned sessions can show its effect on a refund before saving (B11).
 */
export const trainerEnrollmentSchema = z.object({
  ...enrollmentBaseShape,
  dog: dogSchema,
  /** For `calculateEnrollmentRefund`: Rial from the order item, and its refund policy's share. */
  refundBasis: z.object({
    paidAmount: z.number().int(),
    refundedAmount: z.number().int(),
    policyPercent: z.number().int(),
  }),
  customer: z.object({ name: z.string(), phoneNumber: z.string().nullable() }),
  /** The assessment that recommended the course, if the customer booked from one. */
  assessment: z
    .object({ id: z.string(), completedAt: z.date().nullable(), trainerNotes: z.string().nullable() })
    .nullable(),
  /** Live, so sessions can be scheduled. */
  canSchedule: z.boolean(),
  /** Active with a used session, so the result can be recorded. */
  canRecordResult: z.boolean(),
});

export type TrainerEnrollment = z.infer<typeof trainerEnrollmentSchema>;

export const trainerEnrollmentSummarySchema = z.object({
  id: z.string(),
  kind: z.enum(ENROLLMENT_KINDS),
  status: z.enum(ENROLLMENT_STATUSES),
  course: z.object({ slug: z.string(), title: z.string() }),
  dog: dogSummarySchema,
  customerName: z.string(),
  /** For the waiting list's call: the number to ring and when the customer said it suits them. */
  customerPhoneNumber: z.string().nullable(),
  preferredTimes: z.string(),
  plannedSessions: z.number().int(),
  usedSessions: z.number().int(),
  /** Oldest first, cancelled ones included, for the session strip. */
  sessions: z.array(trainingSessionSchema),
  nextSession: trainingSessionSchema.nullable(),
  completedAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
  createdAt: z.date(),
});

export type TrainerEnrollmentSummary = z.infer<typeof trainerEnrollmentSummarySchema>;

/** A session on the trainer's week view, with enough of its enrollment to label it. */
export const trainerSessionSchema = trainingSessionSchema.extend({
  enrollmentId: z.string(),
  /** 1-based place among the enrollment's sessions that weren't cancelled, as on its session card: «جلسه‌ی ۳ از ۷». */
  position: z.number().int(),
  plannedSessions: z.number().int(),
  courseTitle: z.string(),
  dog: z.object({ name: z.string(), photo: mediaSchema.nullable() }),
});

export type TrainerSession = z.infer<typeof trainerSessionSchema>;

/** Something else the trainer has at the same time as a session being placed. A warning, never a block. */
export const sessionOverlapSchema = z.object({
  kind: z.enum(["session", "assessment"]),
  startsAt: z.date(),
  /** «دوره‌ی خانه‌داری · رکس» or «ارزیابی رکس». */
  label: z.string(),
});

export type SessionOverlap = z.infer<typeof sessionOverlapSchema>;

export const scheduledSessionResultSchema = z.object({
  enrollment: trainerEnrollmentSchema,
  overlaps: z.array(sessionOverlapSchema),
});

// Structure only. Allowed values, trimming, limits, future times and the range of the week view are checked by
// `validation.ts`.
const listMineInputSchema = z.strictObject({ dogId: z.string().optional() });
const enrollmentIdInputSchema = z.strictObject({ id: z.string() });
const trainerListInputSchema = z.strictObject({ status: z.string().optional() });
const sessionsInputSchema = z.strictObject({ from: z.date(), to: z.date() });
const scheduleSessionInputSchema = z.strictObject({
  enrollmentId: z.string(),
  startsAt: z.date(),
  durationMinutes: z.number().optional(),
  placeKind: z.string(),
  place: z.string(),
});
const rescheduleSessionInputSchema = z.strictObject({
  sessionId: z.string(),
  startsAt: z.date(),
  durationMinutes: z.number().optional(),
  placeKind: z.string().optional(),
  place: z.string().optional(),
});
const sessionIdInputSchema = z.strictObject({ sessionId: z.string() });
const markSessionInputSchema = z.strictObject({
  sessionId: z.string(),
  status: z.string(),
  trainerNote: z.string().nullish(),
});
const updateSessionNoteInputSchema = z.strictObject({ sessionId: z.string(), trainerNote: z.string().nullish() });
const setPlannedSessionsInputSchema = z.strictObject({ id: z.string(), plannedSessions: z.number() });
const recordResultInputSchema = z.strictObject({ id: z.string(), result: z.string(), trainerNote: z.string() });

/*===== Errors =====*/
// Each is a conflict with the current state of the enrollment or the session (HTTP 409, see `errors.ts`), and carries a
// Persian message in `data.errors` for the UI to show as it is. NOT_FOUND maps to 404 through oRPC's default status
// map, and is also the answer for someone else's enrollment or session and for a malformed id, so the API never
// reveals that one exists.
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const scheduleErrors = {
  ...notFoundError,
  NOT_SCHEDULABLE: {
    message: "The enrollment or session can't be scheduled now.",
    data: errorDataSchema,
  },
};

const recordErrors = {
  ...notFoundError,
  NOT_RECORDABLE: {
    message: "This can't be recorded now.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Customer Procedures =====*/
export const listMyEnrollmentsContract = oc
  .errors(baseErrors)
  .input(listMineInputSchema)
  .output(z.array(customerEnrollmentSchema));

export const getMyEnrollmentContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(enrollmentIdInputSchema)
  .output(customerEnrollmentSchema);

/*===== Trainer Procedures =====*/
export const trainerListEnrollmentsContract = oc
  .errors(baseErrors)
  .input(trainerListInputSchema)
  .output(z.array(trainerEnrollmentSummarySchema));

export const trainerGetEnrollmentContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(enrollmentIdInputSchema)
  .output(trainerEnrollmentSchema);

export const trainerSessionsContract = oc
  .errors(baseErrors)
  .input(sessionsInputSchema)
  .output(z.array(trainerSessionSchema));

export const trainerScheduleSessionContract = oc
  .errors({ ...baseErrors, ...scheduleErrors })
  .input(scheduleSessionInputSchema)
  .output(scheduledSessionResultSchema);

export const trainerRescheduleSessionContract = oc
  .errors({ ...baseErrors, ...scheduleErrors })
  .input(rescheduleSessionInputSchema)
  .output(scheduledSessionResultSchema);

export const trainerCancelSessionContract = oc
  .errors({ ...baseErrors, ...scheduleErrors })
  .input(sessionIdInputSchema)
  .output(trainerEnrollmentSchema);

export const trainerMarkSessionContract = oc
  .errors({ ...baseErrors, ...recordErrors })
  .input(markSessionInputSchema)
  .output(trainerEnrollmentSchema);

export const trainerUpdateSessionNoteContract = oc
  .errors({ ...baseErrors, ...recordErrors })
  .input(updateSessionNoteInputSchema)
  .output(trainerEnrollmentSchema);

export const trainerSetPlannedSessionsContract = oc
  .errors({ ...baseErrors, ...scheduleErrors })
  .input(setPlannedSessionsInputSchema)
  .output(trainerEnrollmentSchema);

export const trainerRecordResultContract = oc
  .errors({ ...baseErrors, ...recordErrors })
  .input(recordResultInputSchema)
  .output(trainerEnrollmentSchema);

export const enrollmentContract = {
  listMine: listMyEnrollmentsContract,
  get: getMyEnrollmentContract,
  trainer: {
    list: trainerListEnrollmentsContract,
    get: trainerGetEnrollmentContract,
    sessions: trainerSessionsContract,
    scheduleSession: trainerScheduleSessionContract,
    rescheduleSession: trainerRescheduleSessionContract,
    cancelSession: trainerCancelSessionContract,
    markSession: trainerMarkSessionContract,
    updateSessionNote: trainerUpdateSessionNoteContract,
    setPlannedSessions: trainerSetPlannedSessionsContract,
    recordResult: trainerRecordResultContract,
  },
};

import { oc } from "@orpc/contract";
import { z } from "zod";

import {
  ASSESSMENT_STATUSES,
  MEETING_PLACE_KINDS,
  TRAINING_GOALS,
  ASSESSMENT_SLOT_STATUSES,
} from "~/orpc/assessment/constants";
import { dogSchema } from "~/orpc/dog/contract";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { mediaSchema } from "~/orpc/media/contract";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
const trainerSummarySchema = z.object({
  name: z.string(),
  /** The owner. For now that is every Admin; it becomes the Trainer Profile's flag when that entity lands. */
  isHeadTrainer: z.boolean(),
});

export const availableSlotSchema = z.object({
  id: z.string(),
  startsAt: z.date(),
  durationMinutes: z.number().int(),
  trainer: trainerSummarySchema.extend({ id: z.string() }),
});

export type AvailableSlot = z.infer<typeof availableSlotSchema>;

export const recommendedCourseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  latinName: z.string(),
});

/** An assessment as its customer sees it. */
export const assessmentSchema = z.object({
  id: z.string(),
  status: z.enum(ASSESSMENT_STATUSES),
  startsAt: z.date(),
  durationMinutes: z.number().int(),
  trainingGoal: z.enum(TRAINING_GOALS),
  customerNote: z.string(),
  placeKind: z.enum(MEETING_PLACE_KINDS),
  place: z.string(),
  dog: z.object({ id: z.string(), name: z.string(), photo: mediaSchema.nullable() }),
  trainer: trainerSummarySchema,
  /** Shown to the customer. Set when the trainer records the outcome. */
  trainerNotes: z.string().nullable(),
  /** In the order to take them. Only a completed assessment has any. */
  recommendations: z.array(recommendedCourseSchema),
  cancelledBy: z.enum(["customer", "trainer"]).nullable(),
  cancellationReason: z.string().nullable(),
  /** Booked and not started yet. */
  canCancel: z.boolean(),
  /** When the outcome was recorded, for a completed assessment and a no-show alike. */
  completedAt: z.date().nullable(),
});

export type Assessment = z.infer<typeof assessmentSchema>;

/** An assessment as its trainer sees it: the whole dog and the customer's contact details. */
export const trainerAssessmentSchema = assessmentSchema.extend({
  dog: dogSchema,
  customer: z.object({ name: z.string(), phoneNumber: z.string().nullable() }),
  /**
   * What the trainer's recommendations start with. For a booked assessment it is the owner's standing recommendations
   * (docs/business-logic.md, B16); for a completed one, what was saved.
   */
  suggestedCourseSlugs: z.array(z.string()),
  /** Booked and started, so the trainer can mark it completed or a no-show. */
  canRecordOutcome: z.boolean(),
});

export type TrainerAssessment = z.infer<typeof trainerAssessmentSchema>;

export const scheduleSlotSchema = z.object({
  id: z.string(),
  startsAt: z.date(),
  durationMinutes: z.number().int(),
  status: z.enum(ASSESSMENT_SLOT_STATUSES),
  /** The slot's live (not cancelled) assessment, if any. */
  assessment: z
    .object({
      id: z.string(),
      status: z.enum(ASSESSMENT_STATUSES),
      dog: z.object({ name: z.string(), photo: mediaSchema.nullable() }),
      customerName: z.string(),
      trainingGoal: z.enum(TRAINING_GOALS),
    })
    .nullable(),
});

export type ScheduleSlot = z.infer<typeof scheduleSlotSchema>;

// Structure only. Trimming, limits, allowed values, future times and the range of the schedule are checked by
// `validation.ts`.
const bookInputSchema = z.strictObject({
  slotId: z.string(),
  dogId: z.string(),
  trainingGoal: z.string(),
  customerNote: z.string(),
  placeKind: z.string(),
  place: z.string(),
});
const listMineInputSchema = z.strictObject({ dogId: z.string().optional() });
const customerCancelInputSchema = z.strictObject({ id: z.string(), reason: z.string().nullish() });

const scheduleInputSchema = z.strictObject({ from: z.date(), to: z.date() });
const openSlotsInputSchema = z.strictObject({ startsAt: z.array(z.date()), durationMinutes: z.number().optional() });
const closeSlotInputSchema = z.strictObject({ slotId: z.string() });
const assessmentIdInputSchema = z.strictObject({ id: z.string() });
const completeInputSchema = z.strictObject({
  id: z.string(),
  trainerNotes: z.string(),
  recommendedCourseSlugs: z.array(z.string()),
});
const markNoShowInputSchema = z.strictObject({ id: z.string(), trainerNotes: z.string().nullish() });
const trainerCancelInputSchema = z.strictObject({ id: z.string(), reason: z.string() });

/*===== Errors =====*/
// Each is a conflict with the current state of the slot or the assessment (HTTP 409, see `errors.ts`), and carries a
// Persian message in `data.errors` for the UI to show as it is. NOT_FOUND maps to 404 through oRPC's default status
// map, and is also the answer for someone else's assessment, dog or slot and for a malformed id, so the API never
// reveals that one exists.
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const bookingErrors = {
  ...notFoundError,
  HAS_RECORD: {
    message: "The dog already has a record.",
    data: errorDataSchema,
  },
  ALREADY_BOOKED: {
    message: "The dog already has a booked assessment.",
    data: errorDataSchema,
  },
  SLOT_TAKEN: {
    message: "The slot is no longer available.",
    data: errorDataSchema,
  },
};

const cancelErrors = {
  ...notFoundError,
  NOT_CANCELLABLE: {
    message: "The assessment can no longer be cancelled.",
    data: errorDataSchema,
  },
};

const recordErrors = {
  ...notFoundError,
  NOT_RECORDABLE: {
    message: "The outcome can't be recorded now.",
    data: errorDataSchema,
  },
};

const closeSlotErrors = {
  ...notFoundError,
  NOT_OPEN: {
    message: "The slot isn't open.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Public Procedures =====*/
export const availableSlotsContract = oc.errors(commonErrors).output(z.array(availableSlotSchema));

/*===== Customer Procedures =====*/
export const bookAssessmentContract = oc
  .errors({ ...baseErrors, ...bookingErrors })
  .input(bookInputSchema)
  .output(assessmentSchema);

export const listMyAssessmentsContract = oc
  .errors(baseErrors)
  .input(listMineInputSchema)
  .output(z.array(assessmentSchema));

export const cancelAssessmentContract = oc
  .errors({ ...baseErrors, ...cancelErrors })
  .input(customerCancelInputSchema)
  .output(assessmentSchema);

/*===== Trainer Procedures =====*/
export const trainerScheduleContract = oc
  .errors(baseErrors)
  .input(scheduleInputSchema)
  .output(z.array(scheduleSlotSchema));

export const trainerOpenSlotsContract = oc
  .errors(baseErrors)
  .input(openSlotsInputSchema)
  .output(z.object({ opened: z.number().int(), skipped: z.array(z.date()) }));

export const trainerCloseSlotContract = oc
  .errors({ ...baseErrors, ...closeSlotErrors })
  .input(closeSlotInputSchema)
  .output(z.object({ slotId: z.string() }));

export const trainerGetAssessmentContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(assessmentIdInputSchema)
  .output(trainerAssessmentSchema);

export const trainerCompleteAssessmentContract = oc
  .errors({ ...baseErrors, ...recordErrors })
  .input(completeInputSchema)
  .output(trainerAssessmentSchema);

export const trainerMarkNoShowContract = oc
  .errors({ ...baseErrors, ...recordErrors })
  .input(markNoShowInputSchema)
  .output(trainerAssessmentSchema);

export const trainerCancelAssessmentContract = oc
  .errors({ ...baseErrors, ...cancelErrors })
  .input(trainerCancelInputSchema)
  .output(trainerAssessmentSchema);

export const assessmentContract = {
  availableSlots: availableSlotsContract,
  book: bookAssessmentContract,
  listMine: listMyAssessmentsContract,
  cancel: cancelAssessmentContract,
  trainer: {
    schedule: trainerScheduleContract,
    openSlots: trainerOpenSlotsContract,
    closeSlot: trainerCloseSlotContract,
    get: trainerGetAssessmentContract,
    complete: trainerCompleteAssessmentContract,
    markNoShow: trainerMarkNoShowContract,
    cancel: trainerCancelAssessmentContract,
  },
};

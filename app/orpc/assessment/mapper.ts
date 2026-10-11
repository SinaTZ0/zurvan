import {
  ASSESSMENT_SLOT_STATUSES,
  ASSESSMENT_STATUSES,
  MEETING_PLACE_KINDS,
  TRAINING_GOALS,
} from "~/orpc/assessment/constants";
import type {
  AssessmentSlotStatus,
  AssessmentStatus,
  MeetingPlaceKind,
  TrainingGoal,
} from "~/orpc/assessment/constants";
import type { Assessment, AvailableSlot, ScheduleSlot, TrainerAssessment } from "~/orpc/assessment/contract";
import type {
  AssessmentRow,
  OpenSlotRow,
  PersonRecord,
  RecommendationRow,
  ScheduleRow,
} from "~/orpc/assessment/repository";
import type { Dog } from "~/orpc/dog/contract";
import { toPublicMedia } from "~/orpc/media/mapper";

/*===== People =====*/
/** First and last name, which is how people are addressed; the account's single `name` is the fallback. */
function fullName(person: Pick<PersonRecord, "name" | "firstName" | "lastName">): string {
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
  return name || person.name;
}

/**
 * Whether the trainer is the head trainer. For now that is every Admin (the owner holds the one Admin account);
 * TODO: read the Trainer Profile's flag when that entity lands.
 */
function isHeadTrainer(person: Pick<PersonRecord, "role">): boolean {
  return person.role === "admin";
}

/*===== Available Slot =====*/
/** Converts an open slot into its public shape, with just enough about the trainer to choose by. */
export function toAvailableSlot({ slot, trainer }: OpenSlotRow): AvailableSlot {
  return {
    id: slot.id,
    startsAt: slot.startsAt,
    durationMinutes: slot.durationMinutes,
    trainer: { id: trainer.id, name: fullName(trainer), isHeadTrainer: isHeadTrainer(trainer) },
  };
}

/*===== Customer Assessment =====*/
/**
 * Converts a stored assessment into what its customer sees: the slot's time, the dog and trainer by name, and
 * `canCancel`, which is the one rule the UI must not recompute, so it can't disagree with the server. Recommendations
 * are shown only once the assessment is completed.
 *
 * @throws When `status`, `trainingGoal` or `placeKind` isn't a known value. The service only writes valid values, so
 * this means corrupted data that should surface instead of being shown as a wrong status.
 */
export function toCustomerAssessment({
  row,
  recommendations,
  now,
}: {
  row: AssessmentRow;
  recommendations: RecommendationRow[];
  now: Date;
}): Assessment {
  const { assessment, slot } = row;
  if (!isAssessmentStatus(assessment.status)) {
    throw new Error(`Assessment ${assessment.id} has an unknown status: ${assessment.status}`);
  }
  if (!isTrainingGoal(assessment.trainingGoal)) {
    throw new Error(`Assessment ${assessment.id} has an unknown training goal: ${assessment.trainingGoal}`);
  }
  if (!isMeetingPlaceKind(assessment.placeKind)) {
    throw new Error(`Assessment ${assessment.id} has an unknown place kind: ${assessment.placeKind}`);
  }

  return {
    id: assessment.id,
    status: assessment.status,
    startsAt: slot.startsAt,
    durationMinutes: slot.durationMinutes,
    trainingGoal: assessment.trainingGoal,
    customerNote: assessment.customerNote,
    placeKind: assessment.placeKind,
    place: assessment.place,
    dog: { id: row.dog.id, name: row.dog.name, photo: row.photo ? toPublicMedia(row.photo) : null },
    trainer: { name: fullName(row.trainer), isHeadTrainer: isHeadTrainer(row.trainer) },
    trainerNotes: assessment.trainerNotes,
    recommendations:
      assessment.status === "completed"
        ? recommendations
            .filter((recommendation) => recommendation.assessmentId === assessment.id)
            .map(({ slug, title, latinName }) => ({ slug, title, latinName }))
        : [],
    // Either side may cancel; the column holds a user id, which is the customer's or else the trainer's.
    cancelledBy:
      assessment.cancelledBy === null
        ? null
        : assessment.cancelledBy === assessment.customerId
          ? "customer"
          : "trainer",
    cancellationReason: assessment.cancellationReason,
    canCancel: assessment.status === "booked" && slot.startsAt.getTime() > now.getTime(),
    completedAt: assessment.completedAt,
  };
}

/*===== Trainer Assessment =====*/
/**
 * Same as {@link toCustomerAssessment}, plus the whole dog, the customer's contact details and what the trainer's
 * recommendations start with. The dog comes from the dog feature's own mapper, so the trainer sees it as the owner does.
 */
export function toTrainerAssessment({
  row,
  dog,
  recommendations,
  suggestedCourseSlugs,
  now,
}: {
  row: AssessmentRow;
  dog: Dog;
  recommendations: RecommendationRow[];
  suggestedCourseSlugs: string[];
  now: Date;
}): TrainerAssessment {
  const customerView = toCustomerAssessment({ row, recommendations, now });

  return {
    ...customerView,
    dog,
    customer: { name: fullName(row.customer), phoneNumber: row.customer.phoneNumber },
    suggestedCourseSlugs,
    canRecordOutcome: row.assessment.status === "booked" && row.slot.startsAt.getTime() <= now.getTime(),
  };
}

/*===== Schedule =====*/
/**
 * Converts a slot of the trainer's schedule, with its live assessment, into its shape.
 *
 * @throws When the slot or its assessment holds a value that isn't a known one, for the reason {@link toCustomerAssessment}
 * gives.
 */
export function toScheduleSlot({ slot, assessment, dog, photo, customer }: ScheduleRow): ScheduleSlot {
  if (!isSlotStatus(slot.status)) throw new Error(`Assessment slot ${slot.id} has an unknown status: ${slot.status}`);

  const base = { id: slot.id, startsAt: slot.startsAt, durationMinutes: slot.durationMinutes, status: slot.status };
  if (!assessment) return { ...base, assessment: null };

  // The joins are left joins only because a slot may have no assessment; one that has it always has these.
  if (!dog || !customer) throw new Error(`Assessment ${assessment.id} on the schedule is missing its dog or customer.`);
  if (!isAssessmentStatus(assessment.status) || !isTrainingGoal(assessment.trainingGoal)) {
    throw new Error(`Assessment ${assessment.id} has an unknown status or training goal.`);
  }

  return {
    ...base,
    assessment: {
      id: assessment.id,
      status: assessment.status,
      dog: { name: dog.name, photo: photo ? toPublicMedia(photo) : null },
      customerName: customer.name,
      trainingGoal: assessment.trainingGoal,
    },
  };
}

/*===== Type Guards =====*/
function isSlotStatus(value: string): value is AssessmentSlotStatus {
  return (ASSESSMENT_SLOT_STATUSES as readonly string[]).includes(value);
}

function isAssessmentStatus(value: string): value is AssessmentStatus {
  return (ASSESSMENT_STATUSES as readonly string[]).includes(value);
}

function isTrainingGoal(value: string): value is TrainingGoal {
  return (TRAINING_GOALS as readonly string[]).includes(value);
}

function isMeetingPlaceKind(value: string): value is MeetingPlaceKind {
  return (MEETING_PLACE_KINDS as readonly string[]).includes(value);
}

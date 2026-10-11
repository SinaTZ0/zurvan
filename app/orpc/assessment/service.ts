import { TransactionRollbackError } from "drizzle-orm";

import type { Database } from "~/db/client.server";
import { sendSms } from "~/lib/sms.server";
import { formatSlotDay, formatSlotTime, utcToTehranParts } from "~/lib/tehran-time";
import { issuesToErrorData } from "~/lib/schema-issues";
import { isUuid } from "~/lib/uuid";
import {
  ASSESSMENT_BOOKING_WINDOW_DAYS,
  ASSESSMENT_MAX_DURATION_MINUTES,
  BMC_COURSE_SLUG,
  BMC_SOON_MONTHS,
  CGC_COURSE_SLUG,
} from "~/orpc/assessment/constants";
import type { Assessment, AvailableSlot, ScheduleSlot, TrainerAssessment } from "~/orpc/assessment/contract";
import { toAvailableSlot, toCustomerAssessment, toScheduleSlot, toTrainerAssessment } from "~/orpc/assessment/mapper";
import {
  claimOpenSlot,
  closeOpenSlotByTrainer,
  findAssessmentByCustomer,
  findAssessmentByTrainer,
  findAssessmentsByCustomer,
  findLiveSlotTimes,
  findOpenSlots,
  findRecommendations,
  findScheduleRows,
  findSlotByTrainer,
  insertAssessment,
  insertOpenSlots,
  insertRecommendations,
  markAssessmentCancelled,
  markAssessmentOutcome,
  releaseBookedSlot,
} from "~/orpc/assessment/repository";
import type { AssessmentRow } from "~/orpc/assessment/repository";
import {
  bookInputSchema,
  completeInputSchema,
  customerCancelInputSchema,
  markNoShowInputSchema,
  openSlotsInputSchema,
  scheduleInputSchema,
  trainerCancelInputSchema,
} from "~/orpc/assessment/validation";
import { findApprovedCoursesBySlugs } from "~/orpc/course/repository";
import { findDogCourseHistory } from "~/orpc/order/repository";
import { toPublicDog } from "~/orpc/dog/mapper";
import { findDogByOwnerForUpdate, findDogWithPhoto, hasBookedAssessment } from "~/orpc/dog/repository";

/*===== Types =====*/
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };
type NotFoundResult = { kind: "not-found" };
/** The request is fine, but it contradicts the current state. `errors` is the Persian message for the user. */
type ConflictResult<Kind extends string> = { kind: Kind; errors: string[] };

/** `now` is a dependency so a test can stand at any moment; callers leave it out. */
type Clock = { now?: Date };

/*===== Constraints =====*/
// The partial unique indexes in `app/db/schema.ts`: the last line of defence when two requests race past the checks.
const SLOT_LIVE_INDEX = "assessment_slot_live_idx";
const DOG_BOOKED_INDEX = "assessment_dog_booked_idx";

/** The name of the unique index a database error violated, or `null` when it is some other error. */
function violatedUniqueIndex(error: unknown): string | null {
  // Drizzle wraps the driver's error as `cause`.
  let current: unknown = error;
  for (let depth = 0; depth < 3 && typeof current === "object" && current !== null; depth++) {
    const { code, constraint, cause } = current as { code?: unknown; constraint?: unknown; cause?: unknown };
    if (code === "23505") return typeof constraint === "string" ? constraint : "";
    current = cause;
  }
  return null;
}

/*===== Messages =====*/
const SLOT_TAKEN_MESSAGE = "این وقت همین الان رزرو شد. یک وقت دیگر انتخاب کن.";
const NOT_CANCELLABLE_MESSAGE = "این ارزیابی دیگر لغو نمی‌شود.";
const NOT_STARTED_MESSAGE = "نتیجه‌ی این ارزیابی بعد از شروع وقتش ثبت می‌شود.";
const ALREADY_RECORDED_MESSAGE = "این ارزیابی قبلاً ثبت شده.";

/*===== Notifications =====*/
/** «شنبه ۱۹ مهر ساعت ۱۷:۰۰» */
function whenText(startsAt: Date): string {
  return `${formatSlotDay(startsAt)} ساعت ${formatSlotTime(startsAt)}`;
}

/**
 * Sends an SMS after the change it reports has been committed. A failure is logged instead of failing the request: the
 * booking or cancellation has happened and the screens show it, so the person is better off than if it were undone.
 */
async function notify({
  phoneNumber,
  kind,
  body,
}: {
  phoneNumber: string | null;
  kind: "assessment-booked" | "assessment-cancelled";
  body: string;
}): Promise<void> {
  if (!phoneNumber) return;

  try {
    await sendSms({ phoneNumber, kind, body });
  } catch (error) {
    console.error(`[assessment] could not send the ${kind} SMS`, error);
  }
}

/*===== Reading =====*/
async function toCustomerView({ db, row, now }: { db: Database; row: AssessmentRow; now: Date }): Promise<Assessment> {
  const recommendations =
    row.assessment.status === "completed" ? await findRecommendations({ db, assessmentIds: [row.assessment.id] }) : [];
  return toCustomerAssessment({ row, recommendations, now });
}

/** Whole months from `birthDate` to `onDate`, both `YYYY-MM-DD`: a month is complete on the same day of the month. */
function ageInMonths({ birthDate, onDate }: { birthDate: string; onDate: string }): number {
  const [birthYear = 0, birthMonth = 0, birthDay = 0] = birthDate.split("-").map(Number);
  const [year = 0, month = 0, day = 0] = onDate.split("-").map(Number);
  return (year - birthYear) * 12 + (month - birthMonth) - (day < birthDay ? 1 : 0);
}

/**
 * What a trainer's recommendations start with (docs/business-logic.md, B16): CGC for a dog that hasn't passed it or its
 * test, and BMC for a dog that hasn't taken it and is or soon will be in its age range on the day of the assessment.
 * Only courses that are approved are offered. "Taken" means passed or under way: a dog enrolled in CGC now doesn't
 * need it suggested again.
 */
async function prefilledRecommendations({
  db,
  dogId,
  birthDate,
  startsAt,
}: {
  db: Database;
  dogId: string;
  birthDate: string;
  startsAt: Date;
}): Promise<string[]> {
  const courses = await findApprovedCoursesBySlugs({ db, slugs: [CGC_COURSE_SLUG, BMC_COURSE_SLUG] });
  const history = await findDogCourseHistory({ db, dogIds: [dogId] });
  const taken = new Set(history.map((row) => row.courseId));
  const slugs: string[] = [];

  const cgc = courses.find((course) => course.slug === CGC_COURSE_SLUG);
  if (cgc && !taken.has(cgc.id)) slugs.push(CGC_COURSE_SLUG);

  const bmc = courses.find((course) => course.slug === BMC_COURSE_SLUG);
  if (bmc?.minAgeMonths != null && !taken.has(bmc.id)) {
    // The age is counted on the Tehran calendar day of the meeting, which is the day the owner thinks of.
    const age = ageInMonths({ birthDate, onDate: utcToTehranParts(startsAt).date });
    // "Soon" starts a couple of months before the minimum age; with no maximum, the range has no end.
    if (age >= bmc.minAgeMonths - BMC_SOON_MONTHS && age < (bmc.maxAgeMonths ?? Infinity)) slugs.push(BMC_COURSE_SLUG);
  }

  return slugs;
}

async function toTrainerView({
  db,
  row,
  now,
}: {
  db: Database;
  row: AssessmentRow;
  now: Date;
}): Promise<TrainerAssessment> {
  // The dog may have been removed since; the trainer still sees the dog they met, in full.
  const dogRecord = await findDogWithPhoto({ db, id: row.dog.id });
  if (!dogRecord) throw new Error(`Assessment ${row.assessment.id} points at a dog that doesn't exist`);

  const recommendations =
    row.assessment.status === "completed" ? await findRecommendations({ db, assessmentIds: [row.assessment.id] }) : [];

  const suggestedCourseSlugs =
    row.assessment.status === "completed"
      ? recommendations.map((recommendation) => recommendation.slug)
      : row.assessment.status === "booked"
        ? await prefilledRecommendations({
            db,
            dogId: dogRecord.id,
            birthDate: dogRecord.birthDate,
            startsAt: row.slot.startsAt,
          })
        : [];

  return toTrainerAssessment({
    row,
    dog: toPublicDog(dogRecord),
    recommendations,
    suggestedCourseSlugs,
    now,
  });
}

/*===== Available Slots =====*/
const DAY_MS = 86_400_000;

/** Lists the open slots a customer can book, soonest first: those that haven't started, within the booking window. */
export async function listAvailableSlots({ db, now = new Date() }: { db: Database } & Clock): Promise<AvailableSlot[]> {
  const until = new Date(now.getTime() + ASSESSMENT_BOOKING_WINDOW_DAYS * DAY_MS);
  const rows = await findOpenSlots({ db, after: now, until });
  return rows.map(toAvailableSlot);
}

/*===== Book =====*/
type BookResult =
  | { kind: "success"; assessment: Assessment }
  | InvalidResult
  | NotFoundResult
  | ConflictResult<"has-record">
  | ConflictResult<"already-booked">
  | ConflictResult<"slot-taken">;

/**
 * Books a slot for one of the customer's dogs, in one transaction: the dog is locked, checked (it must be the
 * customer's, have no record and no booked assessment), and then the slot is claimed with a single conditional update,
 * so of any number of customers racing for it exactly one succeeds. Both parties get an SMS after the commit.
 *
 * @returns `invalid` with per-field messages; `not-found` for another customer's dog, a removed one and a malformed
 * id alike; `has-record` for a dog that can book its course directly; `already-booked` for a dog with an upcoming
 * assessment; `slot-taken` when the slot isn't open any more, has started, or doesn't exist.
 */
export async function bookAssessment({
  db,
  customerId,
  input,
  now = new Date(),
}: { db: Database; customerId: string; input: unknown } & Clock): Promise<BookResult> {
  const parsed = bookInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  const { slotId, dogId, ...details } = parsed.data;

  if (!isUuid(dogId)) return { kind: "not-found" };

  let assessmentId: string;
  try {
    const outcome = await db.transaction(async (tx): Promise<BookResult | { kind: "booked"; id: string }> => {
      /*------ Dog ------*/
      const record = await findDogByOwnerForUpdate({ db: tx, ownerId: customerId, id: dogId });
      if (!record) return { kind: "not-found" };

      if (record.knownSince !== null || record.hasRecordEvent) {
        return {
          kind: "has-record",
          errors: [`${record.name} پرونده دارد و می‌تواند مستقیم دوره رزرو کند.`],
        };
      }
      if (await hasBookedAssessment({ db: tx, dogId })) {
        return { kind: "already-booked", errors: [`${record.name} یک ارزیابی رزروشده دارد.`] };
      }

      /*------ Slot ------*/
      // A malformed id reads the same as a slot that was just taken: from the customer's side it isn't available.
      const slot = isUuid(slotId) ? await claimOpenSlot({ db: tx, slotId, now }) : undefined;
      if (!slot) return { kind: "slot-taken", errors: [SLOT_TAKEN_MESSAGE] };

      /*------ Assessment ------*/
      const id = await insertAssessment({
        db: tx,
        values: { slotId: slot.id, dogId, customerId, trainerId: slot.trainerId, ...details },
      });
      return { kind: "booked", id };
    });

    if (outcome.kind !== "booked") return outcome;
    assessmentId = outcome.id;
  } catch (error) {
    // Two requests can both pass the checks above; the partial unique indexes then let exactly one insert through.
    const index = violatedUniqueIndex(error);
    if (index === SLOT_LIVE_INDEX) return { kind: "slot-taken", errors: [SLOT_TAKEN_MESSAGE] };
    if (index === DOG_BOOKED_INDEX) {
      return { kind: "already-booked", errors: ["این سگ یک ارزیابی رزروشده دارد."] };
    }
    throw error;
  }

  /*------ Notify ------*/
  const row = await findAssessmentByCustomer({ db, customerId, id: assessmentId });
  if (!row) throw new Error(`bookAssessment: assessment ${assessmentId} could not be read back`);

  const when = whenText(row.slot.startsAt);
  await notify({
    phoneNumber: row.customer.phoneNumber,
    kind: "assessment-booked",
    body: `آموزش K9: ارزیابی ${row.dog.name} برای ${when} رزرو شد.`,
  });
  await notify({
    phoneNumber: row.trainer.phoneNumber,
    kind: "assessment-booked",
    body: `آموزش K9: ارزیابی تازه برای ${row.dog.name} (${row.customer.name}) در ${when} رزرو شد.`,
  });

  return { kind: "success", assessment: await toCustomerView({ db, row, now }) };
}

/*===== List Mine =====*/
/** Lists the customer's own assessments, newest slot first, whether or not their dogs are still on the account. */
export async function listMyAssessments({
  db,
  customerId,
  dogId,
  now = new Date(),
}: { db: Database; customerId: string; dogId?: string } & Clock): Promise<Assessment[]> {
  // A malformed dog id can match nothing, and would make Postgres throw.
  if (dogId !== undefined && !isUuid(dogId)) return [];

  const rows = await findAssessmentsByCustomer({ db, customerId, dogId });
  // One query for every completed assessment's recommendations, not one per row.
  const recommendations = await findRecommendations({
    db,
    assessmentIds: rows.filter((row) => row.assessment.status === "completed").map((row) => row.assessment.id),
  });

  return rows.map((row) => toCustomerAssessment({ row, recommendations, now }));
}

/*===== Cancel =====*/
/**
 * Cancels a booked assessment and frees or closes its slot, in one transaction. If the slot has started by the time
 * the update runs, nothing changes.
 *
 * @returns Whether it was cancelled.
 */
async function cancelBooked({
  db,
  id,
  scope,
  cancelledBy,
  reason,
  slotStatus,
  now,
}: {
  db: Database;
  id: string;
  scope: { customerId: string } | { trainerId: string };
  cancelledBy: string;
  reason: string | null;
  slotStatus: "open" | "closed";
  now: Date;
}): Promise<boolean> {
  try {
    await db.transaction(async (tx) => {
      const cancelled = await markAssessmentCancelled({ db: tx, id, scope, cancelledBy, reason, now });
      if (!cancelled) return tx.rollback();

      const released = await releaseBookedSlot({ db: tx, slotId: cancelled.slotId, status: slotStatus, now });
      // The slot's time came between the check and the update: undo the cancellation too.
      if (!released) return tx.rollback();
    });
    return true;
  } catch (error) {
    if (error instanceof TransactionRollbackError) return false;
    throw error;
  }
}

type CancelCustomerResult =
  { kind: "success"; assessment: Assessment } | InvalidResult | NotFoundResult | ConflictResult<"not-cancellable">;

/**
 * Cancels the customer's own booked assessment before it starts; its slot opens again for someone else. The trainer
 * gets an SMS.
 *
 * @returns `not-found` for another customer's assessment and a malformed id alike; `not-cancellable` when it isn't
 * booked any more or its slot has started.
 */
export async function cancelMyAssessment({
  db,
  customerId,
  id,
  input,
  now = new Date(),
}: { db: Database; customerId: string; id: string; input: unknown } & Clock): Promise<CancelCustomerResult> {
  const current = isUuid(id) ? await findAssessmentByCustomer({ db, customerId, id }) : undefined;
  if (!current) return { kind: "not-found" };

  const parsed = customerCancelInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const conflict: CancelCustomerResult = { kind: "not-cancellable", errors: [NOT_CANCELLABLE_MESSAGE] };
  if (current.assessment.status !== "booked" || current.slot.startsAt.getTime() <= now.getTime()) return conflict;

  const cancelled = await cancelBooked({
    db,
    id,
    scope: { customerId },
    cancelledBy: customerId,
    reason: parsed.data.reason,
    slotStatus: "open",
    now,
  });
  if (!cancelled) return conflict;

  await notify({
    phoneNumber: current.trainer.phoneNumber,
    kind: "assessment-cancelled",
    body: `آموزش K9: ارزیابی ${current.dog.name} (${current.customer.name}) در ${whenText(current.slot.startsAt)} لغو شد.`,
  });

  const row = await findAssessmentByCustomer({ db, customerId, id });
  if (!row) throw new Error(`cancelMyAssessment: assessment ${id} could not be read back`);
  return { kind: "success", assessment: await toCustomerView({ db, row, now }) };
}

/*===== Schedule =====*/
type ScheduleResult = { kind: "success"; slots: ScheduleSlot[] } | InvalidResult;

/** The trainer's slots from `from` up to, not including, `to`, each with its live assessment, in time order. */
export async function getTrainerSchedule({
  db,
  trainerId,
  input,
}: {
  db: Database;
  trainerId: string;
  input: unknown;
}): Promise<ScheduleResult> {
  const parsed = scheduleInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const rows = await findScheduleRows({ db, trainerId, ...parsed.data });
  return { kind: "success", slots: rows.map(toScheduleSlot) };
}

/*===== Open Slots =====*/
const MINUTE_MS = 60_000;

type OpenSlotsResult = { kind: "success"; opened: number; skipped: Date[] } | InvalidResult;

/**
 * Opens slots at the given times. A time is skipped, not an error, when the trainer already has a slot that isn't
 * closed there, or one that overlaps it: `[start, start + duration)` intersecting another's. Times in the same request
 * count against each other, so "10:00 and 10:30" for hour-long slots opens only the first.
 *
 * @returns How many were opened and which times were skipped; `invalid` for a time in the past, an empty or too long
 * list, or a duration outside the allowed range.
 */
export async function openTrainerSlots({
  db,
  trainerId,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; input: unknown } & Clock): Promise<OpenSlotsResult> {
  const parsed = openSlotsInputSchema({ now }).safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  const { startsAt, durationMinutes } = parsed.data;

  const length = durationMinutes * MINUTE_MS;
  const first = startsAt[0];
  const last = startsAt[startsAt.length - 1];
  if (!first || !last) return { kind: "success", opened: 0, skipped: [] };

  // An existing slot can overlap a new one only if it starts within the longest slot's length before the first time,
  // or before the last one ends.
  const existing = await findLiveSlotTimes({
    db,
    trainerId,
    from: new Date(first.getTime() - ASSESSMENT_MAX_DURATION_MINUTES * MINUTE_MS),
    to: new Date(last.getTime() + length),
  });
  const taken = existing.map((slot) => ({
    start: slot.startsAt.getTime(),
    end: slot.startsAt.getTime() + slot.durationMinutes * MINUTE_MS,
  }));

  const accepted: Date[] = [];
  for (const time of startsAt) {
    const start = time.getTime();
    const end = start + length;
    if (taken.some((other) => start < other.end && other.start < end)) continue;

    accepted.push(time);
    // Later times in this request must not overlap this one.
    taken.push({ start, end });
  }

  // The unique index has the last word: a time another request opened in between comes back as not inserted.
  const inserted = new Set(
    (await insertOpenSlots({ db, trainerId, startsAt: accepted, durationMinutes })).map((time) => time.getTime()),
  );
  const skipped = startsAt.filter((time) => !inserted.has(time.getTime()));

  return { kind: "success", opened: inserted.size, skipped };
}

/*===== Close Slot =====*/
type CloseSlotResult = { kind: "success"; slotId: string } | NotFoundResult | ConflictResult<"not-open">;

/**
 * Closes one of the trainer's open slots, so no one can book it.
 *
 * @returns `not-found` for another trainer's slot and a malformed id alike; `not-open` for one that is booked or
 * already closed (a booked slot is let go by cancelling its assessment).
 */
export async function closeTrainerSlot({
  db,
  trainerId,
  slotId,
}: {
  db: Database;
  trainerId: string;
  slotId: string;
}): Promise<CloseSlotResult> {
  const slot = isUuid(slotId) ? await findSlotByTrainer({ db, trainerId, slotId }) : undefined;
  if (!slot) return { kind: "not-found" };

  const closed = await closeOpenSlotByTrainer({ db, trainerId, slotId });
  return closed
    ? { kind: "success", slotId }
    : { kind: "not-open", errors: ["این وقت باز نیست. اگر رزرو شده، ارزیابی‌اش را لغو کن."] };
}

/*===== Get =====*/
type GetTrainerAssessmentResult = { kind: "success"; assessment: TrainerAssessment } | NotFoundResult;

/** @returns `not-found` for another trainer's assessment and a malformed id alike. */
export async function getTrainerAssessment({
  db,
  trainerId,
  id,
  now = new Date(),
}: { db: Database; trainerId: string; id: string } & Clock): Promise<GetTrainerAssessmentResult> {
  const row = isUuid(id) ? await findAssessmentByTrainer({ db, trainerId, id }) : undefined;
  if (!row) return { kind: "not-found" };

  return { kind: "success", assessment: await toTrainerView({ db, row, now }) };
}

/*===== Complete =====*/
type RecordOutcomeResult =
  | { kind: "success"; assessment: TrainerAssessment }
  | InvalidResult
  | NotFoundResult
  | ConflictResult<"not-recordable">;

/** Why an outcome can't be recorded now, as the message for the trainer, or `null` when it can. */
function outcomeBlocker({ row, now }: { row: AssessmentRow; now: Date }): string | null {
  if (row.assessment.status !== "booked") return ALREADY_RECORDED_MESSAGE;
  // The meeting is the thing being recorded, so it can't be recorded before it starts.
  if (row.slot.startsAt.getTime() > now.getTime()) return NOT_STARTED_MESSAGE;
  return null;
}

/**
 * Records a booked assessment as completed once its slot has started: the notes the customer will read and the
 * recommended courses in the order to take them, in one transaction. The dog's record follows from the completed
 * assessment (see `toPublicDog`).
 *
 * @returns `not-found` for another trainer's assessment and a malformed id alike; `invalid` with per-field messages,
 * including a recommended course that isn't an approved course; `not-recordable` when it isn't booked or hasn't started.
 */
export async function completeAssessment({
  db,
  trainerId,
  id,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; id: string; input: unknown } & Clock): Promise<RecordOutcomeResult> {
  const row = isUuid(id) ? await findAssessmentByTrainer({ db, trainerId, id }) : undefined;
  if (!row) return { kind: "not-found" };

  const parsed = completeInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const blocker = outcomeBlocker({ row, now });
  if (blocker) return { kind: "not-recordable", errors: [blocker] };

  /*------ Courses ------*/
  const { trainerNotes, recommendedCourseSlugs } = parsed.data;
  const courses = await findApprovedCoursesBySlugs({ db, slugs: recommendedCourseSlugs });
  const courseIds = recommendedCourseSlugs.flatMap((slug) => {
    const found = courses.find((course) => course.slug === slug);
    return found ? [found.id] : [];
  });
  if (courseIds.length !== recommendedCourseSlugs.length) {
    return {
      kind: "invalid",
      errors: [],
      fields: { recommendedCourseSlugs: "یکی از دوره‌های پیشنهادی پیدا نشد." },
    };
  }

  /*------ Save ------*/
  const recorded = await db.transaction(async (tx) => {
    const updated = await markAssessmentOutcome({
      db: tx,
      id,
      trainerId,
      status: "completed",
      trainerNotes,
      now,
    });
    if (!updated) return false;

    await insertRecommendations({ db: tx, assessmentId: id, courseIds });
    return true;
  });
  // Someone else recorded or cancelled it between the check and the update.
  if (!recorded) return { kind: "not-recordable", errors: [ALREADY_RECORDED_MESSAGE] };

  const fresh = await findAssessmentByTrainer({ db, trainerId, id });
  if (!fresh) throw new Error(`completeAssessment: assessment ${id} could not be read back`);
  return { kind: "success", assessment: await toTrainerView({ db, row: fresh, now }) };
}

/*===== No-Show =====*/
/**
 * Records that the customer didn't come to a booked assessment whose slot has started. The slot stays booked: the
 * trainer's time was used.
 *
 * @returns As {@link completeAssessment}, without the recommendations.
 */
export async function markAssessmentNoShow({
  db,
  trainerId,
  id,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; id: string; input: unknown } & Clock): Promise<RecordOutcomeResult> {
  const row = isUuid(id) ? await findAssessmentByTrainer({ db, trainerId, id }) : undefined;
  if (!row) return { kind: "not-found" };

  const parsed = markNoShowInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const blocker = outcomeBlocker({ row, now });
  if (blocker) return { kind: "not-recordable", errors: [blocker] };

  const recorded = await markAssessmentOutcome({
    db,
    id,
    trainerId,
    status: "no-show",
    trainerNotes: parsed.data.trainerNotes,
    now,
  });
  if (!recorded) return { kind: "not-recordable", errors: [ALREADY_RECORDED_MESSAGE] };

  const fresh = await findAssessmentByTrainer({ db, trainerId, id });
  if (!fresh) throw new Error(`markAssessmentNoShow: assessment ${id} could not be read back`);
  return { kind: "success", assessment: await toTrainerView({ db, row: fresh, now }) };
}

/*===== Trainer Cancel =====*/
type CancelTrainerResult =
  | { kind: "success"; assessment: TrainerAssessment }
  | InvalidResult
  | NotFoundResult
  | ConflictResult<"not-cancellable">;

/**
 * Cancels the trainer's booked assessment before it starts. The slot is closed, not reopened: the trainer can't make
 * that time. The customer gets an SMS with the reason, asking them to pick another time.
 *
 * @returns `not-found` for another trainer's assessment and a malformed id alike; `invalid` without a reason;
 * `not-cancellable` when it isn't booked any more or its slot has started.
 */
export async function cancelAssessmentAsTrainer({
  db,
  trainerId,
  id,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; id: string; input: unknown } & Clock): Promise<CancelTrainerResult> {
  const current = isUuid(id) ? await findAssessmentByTrainer({ db, trainerId, id }) : undefined;
  if (!current) return { kind: "not-found" };

  const parsed = trainerCancelInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const conflict: CancelTrainerResult = { kind: "not-cancellable", errors: [NOT_CANCELLABLE_MESSAGE] };
  if (current.assessment.status !== "booked" || current.slot.startsAt.getTime() <= now.getTime()) return conflict;

  const cancelled = await cancelBooked({
    db,
    id,
    scope: { trainerId },
    cancelledBy: trainerId,
    reason: parsed.data.reason,
    slotStatus: "closed",
    now,
  });
  if (!cancelled) return conflict;

  await notify({
    phoneNumber: current.customer.phoneNumber,
    kind: "assessment-cancelled",
    body: `آموزش K9: ارزیابی ${current.dog.name} در ${whenText(current.slot.startsAt)} لغو شد. دلیل: ${parsed.data.reason}. یک وقت دیگر انتخاب کن.`,
  });

  const fresh = await findAssessmentByTrainer({ db, trainerId, id });
  if (!fresh) throw new Error(`cancelAssessmentAsTrainer: assessment ${id} could not be read back`);
  return { kind: "success", assessment: await toTrainerView({ db, row: fresh, now }) };
}

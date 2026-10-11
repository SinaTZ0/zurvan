import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import { sendSms } from "~/lib/sms.server";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import { toPublicDog } from "~/orpc/dog/mapper";
import { findDogWithPhoto } from "~/orpc/dog/repository";
import { LIVE_ENROLLMENT_STATUSES } from "~/orpc/enrollment/constants";
import type { EnrollmentResult } from "~/orpc/enrollment/constants";
import type {
  CustomerEnrollment,
  SessionOverlap,
  TrainerEnrollment,
  TrainerEnrollmentSummary,
  TrainerSession,
} from "~/orpc/enrollment/contract";
import {
  sortTrainerSummaries,
  toCustomerEnrollment,
  toTrainerEnrollment,
  toTrainerEnrollmentSummary,
  toTrainerSession,
} from "~/orpc/enrollment/mapper";
import {
  activateEnrollment,
  cancelScheduledSession,
  cancelScheduledSessionsOf,
  findAssessmentSummary,
  findEnrollmentByCustomer,
  findEnrollmentByTrainer,
  findEnrollmentsByCustomer,
  findEnrollmentsByTrainer,
  findOverlaps,
  findSessionByTrainer,
  findSessionsByEnrollments,
  findTrainerSessionsInRange,
  findUsedSessionCount,
  insertSession,
  lockEnrollment,
  markEnrollmentResult,
  markScheduledSession,
  updatePlannedSessions,
  updateRecordedSessionNote,
  updateScheduledSession,
} from "~/orpc/enrollment/repository";
import type { EnrollmentRecord, EnrollmentRow, SessionRecord } from "~/orpc/enrollment/repository";
import {
  isUuid,
  markSessionInputSchema,
  plannedSessionsInputSchema,
  recordResultInputSchema,
  rescheduleSessionInputSchema,
  scheduleSessionInputSchema,
  sessionNoteInputSchema,
  sessionsRangeInputSchema,
  trainerListInputSchema,
} from "~/orpc/enrollment/validation";

/*===== Types =====*/
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };
type NotFoundResult = { kind: "not-found" };
/** The request is fine, but it contradicts the current state. `errors` is the Persian message for the user. */
type ConflictResult<Kind extends string> = { kind: Kind; errors: string[] };

/** `now` is a dependency so a test can stand at any moment; callers leave it out. */
type Clock = { now?: Date };

const MINUTE_MS = 60_000;

/*===== Messages =====*/
const ENROLLMENT_CLOSED_MESSAGE = "این دوره دیگر جلسه‌ی تازه نمی‌گیرد.";
const SESSION_NOT_SCHEDULED_MESSAGE = "این جلسه دیگر زمان‌بندی‌شده نیست.";
const SESSION_NOT_STARTED_MESSAGE = "این جلسه بعد از شروع وقتش ثبت می‌شود.";
const SESSION_ALREADY_RECORDED_MESSAGE = "این جلسه قبلاً ثبت شده یا لغو شده است.";
const NOTE_NEEDS_RECORDED_MESSAGE = "فقط یادداشت جلسه‌ی ثبت‌شده را می‌شود تغییر داد.";
const RESULT_NEEDS_SESSION_MESSAGE = "بعد از برگزاری دست‌کم یک جلسه، نتیجه ثبت می‌شود.";
const RESULT_CLOSED_MESSAGE = "نتیجه‌ی این دوره قبلاً ثبت شده یا دوره لغو شده است.";
const TEST_FIXED_MESSAGE = "آزمون همیشه یک جلسه است.";

/*===== Notifications =====*/
/** «شنبه ۱۹ مهر ساعت ۱۷:۰۰» */
function whenText(startsAt: Date): string {
  return `${formatSlotDay(startsAt)} ساعت ${formatSlotTime(startsAt)}`;
}

/**
 * Sends an SMS after the change it reports has been committed. A failure is logged instead of failing the request: the
 * session has been changed and the screens show it, so the person is better off than if it were undone.
 */
async function notify({
  phoneNumber,
  kind,
  body,
}: {
  phoneNumber: string | null;
  kind: "session-scheduled" | "session-rescheduled" | "session-cancelled" | "enrollment-result";
  body: string;
}): Promise<void> {
  if (!phoneNumber) return;

  try {
    await sendSms({ phoneNumber, kind, body });
  } catch (error) {
    console.error(`[enrollment] could not send the ${kind} SMS`, error);
  }
}

/*===== Reading =====*/
/** The sessions of several enrollments in one query, grouped by enrollment. */
async function sessionsByEnrollment({
  db,
  rows,
}: {
  db: DatabaseOrTransaction;
  rows: EnrollmentRow[];
}): Promise<Map<string, SessionRecord[]>> {
  const sessions = await findSessionsByEnrollments({ db, enrollmentIds: rows.map((row) => row.enrollment.id) });

  const grouped = new Map<string, SessionRecord[]>();
  for (const session of sessions) {
    grouped.set(session.enrollmentId, [...(grouped.get(session.enrollmentId) ?? []), session]);
  }
  return grouped;
}

async function toCustomerView({
  db,
  row,
  now,
}: {
  db: Database;
  row: EnrollmentRow;
  now: Date;
}): Promise<CustomerEnrollment> {
  const sessions = (await sessionsByEnrollment({ db, rows: [row] })).get(row.enrollment.id) ?? [];
  return toCustomerEnrollment({ row, sessions, now });
}

async function toTrainerView({
  db,
  row,
  now,
}: {
  db: Database;
  row: EnrollmentRow;
  now: Date;
}): Promise<TrainerEnrollment> {
  // The dog may have been removed since; the trainer still sees the dog they train, in full.
  const dogRecord = await findDogWithPhoto({ db, id: row.dog.id });
  if (!dogRecord) throw new Error(`Enrollment ${row.enrollment.id} points at a dog that doesn't exist`);

  const sessions = (await sessionsByEnrollment({ db, rows: [row] })).get(row.enrollment.id) ?? [];
  const assessment = row.enrollment.assessmentId
    ? await findAssessmentSummary({ db, id: row.enrollment.assessmentId })
    : undefined;

  return toTrainerEnrollment({ row, sessions, dog: toPublicDog(dogRecord), assessment, now });
}

function isLive(status: string): boolean {
  return (LIVE_ENROLLMENT_STATUSES as readonly string[]).includes(status);
}

/*===== List Mine =====*/
/** Lists the customer's own enrollments, newest first, whether or not their dogs are still on the account. */
export async function listMyEnrollments({
  db,
  customerId,
  dogId,
  now = new Date(),
}: { db: Database; customerId: string; dogId?: string } & Clock): Promise<CustomerEnrollment[]> {
  // A malformed dog id can match nothing, and would make Postgres throw.
  if (dogId !== undefined && !isUuid(dogId)) return [];

  const rows = await findEnrollmentsByCustomer({ db, customerId, dogId });
  // One query for every enrollment's sessions, not one per row.
  const sessions = await sessionsByEnrollment({ db, rows });

  return rows.map((row) => toCustomerEnrollment({ row, sessions: sessions.get(row.enrollment.id) ?? [], now }));
}

/*===== Get Mine =====*/
type GetMyEnrollmentResult = { kind: "success"; enrollment: CustomerEnrollment } | NotFoundResult;

/** @returns `not-found` for another customer's enrollment and a malformed id alike. */
export async function getMyEnrollment({
  db,
  customerId,
  id,
  now = new Date(),
}: { db: Database; customerId: string; id: string } & Clock): Promise<GetMyEnrollmentResult> {
  const row = isUuid(id) ? await findEnrollmentByCustomer({ db, customerId, id }) : undefined;
  if (!row) return { kind: "not-found" };

  return { kind: "success", enrollment: await toCustomerView({ db, row, now }) };
}

/*===== Trainer: List =====*/
type TrainerListResult = { kind: "success"; enrollments: TrainerEnrollmentSummary[] } | InvalidResult;

/**
 * Lists the trainer's enrollments in the order that needs them: waiting to be scheduled (longest first), then in
 * training by the next session, then the finished ones.
 */
export async function listTrainerEnrollments({
  db,
  trainerId,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; input: unknown } & Clock): Promise<TrainerListResult> {
  const parsed = trainerListInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const rows = await findEnrollmentsByTrainer({ db, trainerId, status: parsed.data.status });
  const sessions = await sessionsByEnrollment({ db, rows });

  const summaries = rows.map((row) =>
    toTrainerEnrollmentSummary({ row, sessions: sessions.get(row.enrollment.id) ?? [], now }),
  );
  return { kind: "success", enrollments: sortTrainerSummaries(summaries) };
}

/*===== Trainer: Get =====*/
type GetTrainerEnrollmentResult = { kind: "success"; enrollment: TrainerEnrollment } | NotFoundResult;

/** @returns `not-found` for another trainer's enrollment and a malformed id alike. */
export async function getTrainerEnrollment({
  db,
  trainerId,
  id,
  now = new Date(),
}: { db: Database; trainerId: string; id: string } & Clock): Promise<GetTrainerEnrollmentResult> {
  const row = isUuid(id) ? await findEnrollmentByTrainer({ db, trainerId, id }) : undefined;
  if (!row) return { kind: "not-found" };

  return { kind: "success", enrollment: await toTrainerView({ db, row, now }) };
}

/*===== Trainer: Week View =====*/
type TrainerSessionsResult = { kind: "success"; sessions: TrainerSession[] } | InvalidResult;

/** The trainer's sessions from `from` up to, not including, `to`, cancelled ones left out, in time order. */
export async function listTrainerSessions({
  db,
  trainerId,
  input,
}: {
  db: Database;
  trainerId: string;
  input: unknown;
}): Promise<TrainerSessionsResult> {
  const parsed = sessionsRangeInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const rows = await findTrainerSessionsInRange({ db, trainerId, ...parsed.data });
  return { kind: "success", sessions: rows.map(toTrainerSession) };
}

/*===== Locking =====*/
/**
 * Inside a transaction: locks the enrollment of one of the trainer's sessions, then reads the session, so what the
 * caller checks is what no other request can change until the transaction ends.
 *
 * @returns `undefined` for another trainer's session and a session that isn't there.
 */
async function lockSession({
  db,
  trainerId,
  sessionId,
}: {
  db: DatabaseOrTransaction;
  trainerId: string;
  sessionId: string;
}): Promise<{ enrollment: EnrollmentRecord; session: SessionRecord } | undefined> {
  // The enrollment id never changes, so this first read only finds which row to lock.
  const found = await findSessionByTrainer({ db, trainerId, id: sessionId });
  if (!found) return undefined;

  const enrollment = await lockEnrollment({ db, trainerId, id: found.enrollmentId });
  if (!enrollment) return undefined;

  const session = await findSessionByTrainer({ db, trainerId, id: sessionId });
  return session ? { enrollment, session } : undefined;
}

/** Reads the enrollment back for the response; it was there a moment ago, so a miss is a bug. */
async function readBack({
  db,
  trainerId,
  id,
  now,
  caller,
}: {
  db: Database;
  trainerId: string;
  id: string;
  now: Date;
  caller: string;
}): Promise<{ row: EnrollmentRow; enrollment: TrainerEnrollment }> {
  const row = await findEnrollmentByTrainer({ db, trainerId, id });
  if (!row) throw new Error(`${caller}: enrollment ${id} could not be read back`);
  return { row, enrollment: await toTrainerView({ db, row, now }) };
}

function toOverlaps(rows: { kind: "session" | "assessment"; startsAt: Date; label: string }[]): SessionOverlap[] {
  return rows.map(({ kind, startsAt, label }) => ({ kind, startsAt, label }));
}

/*===== Schedule Session =====*/
type PlaceSessionResult =
  | { kind: "success"; enrollment: TrainerEnrollment; overlaps: SessionOverlap[] }
  | InvalidResult
  | NotFoundResult
  | ConflictResult<"not-schedulable">;

/**
 * Schedules a session of one of the trainer's live enrollments, in one transaction: the enrollment is locked, and the
 * first session moves it from `scheduling` to `active`. Scheduling more than the plan has room for is allowed; the
 * trainer adjusts the planned count separately. The customer gets an SMS after the commit.
 *
 * A clash with another session or a booked assessment of the trainer's is returned, never refused: the trainer decides.
 *
 * @returns `not-found` for another trainer's enrollment and a malformed id alike; `invalid` with per-field messages,
 * including a start that isn't in the future; `not-schedulable` when the enrollment is finished or cancelled.
 */
export async function scheduleSession({
  db,
  trainerId,
  enrollmentId,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; enrollmentId: string; input: unknown } & Clock): Promise<PlaceSessionResult> {
  const current = isUuid(enrollmentId) ? await findEnrollmentByTrainer({ db, trainerId, id: enrollmentId }) : undefined;
  if (!current) return { kind: "not-found" };

  const parsed = scheduleSessionInputSchema({ now }).safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  const { startsAt, durationMinutes, placeKind, place } = parsed.data;

  const outcome = await db.transaction(
    async (
      tx,
    ): Promise<NotFoundResult | ConflictResult<"not-schedulable"> | { kind: "placed"; overlaps: SessionOverlap[] }> => {
      /*------ Enrollment ------*/
      const locked = await lockEnrollment({ db: tx, trainerId, id: enrollmentId });
      if (!locked) return { kind: "not-found" };
      if (!isLive(locked.status)) return { kind: "not-schedulable", errors: [ENROLLMENT_CLOSED_MESSAGE] };

      /*------ Overlaps ------*/
      const endsAt = new Date(startsAt.getTime() + durationMinutes * MINUTE_MS);
      const overlaps = await findOverlaps({ db: tx, trainerId: locked.trainerId, startsAt, endsAt });

      /*------ Session ------*/
      await insertSession({
        db: tx,
        values: { enrollmentId, trainerId: locked.trainerId, startsAt, durationMinutes, placeKind, place },
      });
      await activateEnrollment({ db: tx, id: enrollmentId });

      return { kind: "placed", overlaps: toOverlaps(overlaps) };
    },
  );
  if (outcome.kind !== "placed") return outcome;

  /*------ Notify ------*/
  await notify({
    phoneNumber: current.customer.phoneNumber,
    kind: "session-scheduled",
    body: `آموزش K9: جلسه‌ی ${current.course.title} برای ${current.dog.name} ${whenText(startsAt)} تعیین شد. محل: ${place}.`,
  });

  const { enrollment } = await readBack({ db, trainerId, id: enrollmentId, now, caller: "scheduleSession" });
  return { kind: "success", enrollment, overlaps: outcome.overlaps };
}

/*===== Reschedule Session =====*/
/**
 * Moves a scheduled session to a new time in the future, and to a new length or place if given; what is left out stays
 * as it was. The customer gets an SMS after the commit.
 *
 * @returns As {@link scheduleSession}, with `not-found` for another trainer's session; `not-schedulable` when the
 * session isn't scheduled any more.
 */
export async function rescheduleSession({
  db,
  trainerId,
  sessionId,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; sessionId: string; input: unknown } & Clock): Promise<PlaceSessionResult> {
  const found = isUuid(sessionId) ? await findSessionByTrainer({ db, trainerId, id: sessionId }) : undefined;
  if (!found) return { kind: "not-found" };

  const parsed = rescheduleSessionInputSchema({ now }).safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  const { startsAt, durationMinutes, placeKind, place } = parsed.data;

  const outcome = await db.transaction(
    async (
      tx,
    ): Promise<
      NotFoundResult | ConflictResult<"not-schedulable"> | { kind: "placed"; overlaps: SessionOverlap[]; place: string }
    > => {
      const locked = await lockSession({ db: tx, trainerId, sessionId });
      if (!locked) return { kind: "not-found" };
      if (locked.session.status !== "scheduled") {
        return { kind: "not-schedulable", errors: [SESSION_NOT_SCHEDULED_MESSAGE] };
      }

      const values = {
        startsAt,
        durationMinutes: durationMinutes ?? locked.session.durationMinutes,
        placeKind: placeKind ?? locked.session.placeKind,
        place: place ?? locked.session.place,
      };

      const endsAt = new Date(startsAt.getTime() + values.durationMinutes * MINUTE_MS);
      const overlaps = await findOverlaps({
        db: tx,
        trainerId: locked.session.trainerId,
        startsAt,
        endsAt,
        // The session being moved would otherwise clash with its own old time.
        ignoreSessionId: sessionId,
      });

      const moved = await updateScheduledSession({ db: tx, id: sessionId, values });
      if (!moved) return { kind: "not-schedulable", errors: [SESSION_NOT_SCHEDULED_MESSAGE] };

      return { kind: "placed", overlaps: toOverlaps(overlaps), place: values.place };
    },
  );
  if (outcome.kind !== "placed") return outcome;

  /*------ Notify ------*/
  const { row, enrollment } = await readBack({
    db,
    trainerId,
    id: found.enrollmentId,
    now,
    caller: "rescheduleSession",
  });
  await notify({
    phoneNumber: row.customer.phoneNumber,
    kind: "session-rescheduled",
    body: `آموزش K9: جلسه‌ی ${row.course.title} برای ${row.dog.name} به ${whenText(startsAt)} منتقل شد. محل: ${outcome.place}.`,
  });

  return { kind: "success", enrollment, overlaps: outcome.overlaps };
}

/*===== Cancel Session =====*/
type CancelSessionResult =
  { kind: "success"; enrollment: TrainerEnrollment } | NotFoundResult | ConflictResult<"not-schedulable">;

/**
 * Cancels a scheduled session. The enrollment stays `active` even if no session is left: the trainer schedules another.
 * The customer gets an SMS after the commit.
 *
 * @returns `not-found` for another trainer's session and a malformed id alike; `not-schedulable` when the session
 * isn't scheduled any more.
 */
export async function cancelSession({
  db,
  trainerId,
  sessionId,
  now = new Date(),
}: { db: Database; trainerId: string; sessionId: string } & Clock): Promise<CancelSessionResult> {
  const found = isUuid(sessionId) ? await findSessionByTrainer({ db, trainerId, id: sessionId }) : undefined;
  if (!found) return { kind: "not-found" };

  const outcome = await db.transaction(
    async (tx): Promise<NotFoundResult | ConflictResult<"not-schedulable"> | { kind: "cancelled" }> => {
      const locked = await lockSession({ db: tx, trainerId, sessionId });
      if (!locked) return { kind: "not-found" };

      const cancelled = await cancelScheduledSession({ db: tx, id: sessionId });
      if (!cancelled) return { kind: "not-schedulable", errors: [SESSION_NOT_SCHEDULED_MESSAGE] };
      return { kind: "cancelled" };
    },
  );
  if (outcome.kind !== "cancelled") return outcome;

  const { row, enrollment } = await readBack({
    db,
    trainerId,
    id: found.enrollmentId,
    now,
    caller: "cancelSession",
  });
  await notify({
    phoneNumber: row.customer.phoneNumber,
    kind: "session-cancelled",
    body: `آموزش K9: جلسه‌ی ${row.course.title} برای ${row.dog.name} در ${whenText(found.startsAt)} لغو شد. مربی زمان تازه‌ای تعیین می‌کند.`,
  });

  return { kind: "success", enrollment };
}

/*===== Mark Session =====*/
type RecordSessionResult =
  | { kind: "success"; enrollment: TrainerEnrollment }
  | InvalidResult
  | NotFoundResult
  | ConflictResult<"not-recordable">;

/**
 * Records a scheduled session as held or missed once its time has started, with an optional note for the customer.
 * Both count as used for refunds (B11), and a held one gives the dog a record.
 *
 * @returns `not-found` for another trainer's session and a malformed id alike; `invalid` with per-field messages;
 * `not-recordable` when the session isn't scheduled or hasn't started.
 */
export async function markSession({
  db,
  trainerId,
  sessionId,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; sessionId: string; input: unknown } & Clock): Promise<RecordSessionResult> {
  const found = isUuid(sessionId) ? await findSessionByTrainer({ db, trainerId, id: sessionId }) : undefined;
  if (!found) return { kind: "not-found" };

  const parsed = markSessionInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const outcome = await db.transaction(
    async (tx): Promise<NotFoundResult | ConflictResult<"not-recordable"> | { kind: "recorded" }> => {
      const locked = await lockSession({ db: tx, trainerId, sessionId });
      if (!locked) return { kind: "not-found" };

      if (locked.session.status !== "scheduled") {
        return { kind: "not-recordable", errors: [SESSION_ALREADY_RECORDED_MESSAGE] };
      }
      // The meeting is the thing being recorded, so it can't be recorded before it starts.
      if (locked.session.startsAt.getTime() > now.getTime()) {
        return { kind: "not-recordable", errors: [SESSION_NOT_STARTED_MESSAGE] };
      }

      const recorded = await markScheduledSession({
        db: tx,
        id: sessionId,
        status: parsed.data.status,
        trainerNote: parsed.data.trainerNote,
      });
      if (!recorded) return { kind: "not-recordable", errors: [SESSION_ALREADY_RECORDED_MESSAGE] };
      return { kind: "recorded" };
    },
  );
  if (outcome.kind !== "recorded") return outcome;

  const { enrollment } = await readBack({ db, trainerId, id: found.enrollmentId, now, caller: "markSession" });
  return { kind: "success", enrollment };
}

/*===== Session Note =====*/
/**
 * Changes the note of a session that was already held or missed; an empty note clears it.
 *
 * @returns As {@link markSession}; `not-recordable` when the session hasn't been recorded yet.
 */
export async function updateSessionNote({
  db,
  trainerId,
  sessionId,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; sessionId: string; input: unknown } & Clock): Promise<RecordSessionResult> {
  const found = isUuid(sessionId) ? await findSessionByTrainer({ db, trainerId, id: sessionId }) : undefined;
  if (!found) return { kind: "not-found" };

  const parsed = sessionNoteInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  const outcome = await db.transaction(
    async (tx): Promise<NotFoundResult | ConflictResult<"not-recordable"> | { kind: "updated" }> => {
      const locked = await lockSession({ db: tx, trainerId, sessionId });
      if (!locked) return { kind: "not-found" };

      const updated = await updateRecordedSessionNote({ db: tx, id: sessionId, trainerNote: parsed.data.trainerNote });
      if (!updated) return { kind: "not-recordable", errors: [NOTE_NEEDS_RECORDED_MESSAGE] };
      return { kind: "updated" };
    },
  );
  if (outcome.kind !== "updated") return outcome;

  const { enrollment } = await readBack({ db, trainerId, id: found.enrollmentId, now, caller: "updateSessionNote" });
  return { kind: "success", enrollment };
}

/*===== Planned Sessions =====*/
type PlannedSessionsResult =
  | { kind: "success"; enrollment: TrainerEnrollment }
  | InvalidResult
  | NotFoundResult
  | ConflictResult<"not-schedulable">;

/**
 * Sets how many sessions the course is planned for, which refunds count unheld sessions against. A test stays at one.
 *
 * @returns `not-found` for another trainer's enrollment and a malformed id alike; `invalid` for a number outside the
 * range or below the sessions already used; `not-schedulable` for a test and for an enrollment that is finished or
 * cancelled.
 */
export async function setPlannedSessions({
  db,
  trainerId,
  id,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; id: string; input: unknown } & Clock): Promise<PlannedSessionsResult> {
  const current = isUuid(id) ? await findEnrollmentByTrainer({ db, trainerId, id }) : undefined;
  if (!current) return { kind: "not-found" };

  const parsed = plannedSessionsInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  const { plannedSessions } = parsed.data;

  const outcome = await db.transaction(
    async (tx): Promise<NotFoundResult | InvalidResult | ConflictResult<"not-schedulable"> | { kind: "set" }> => {
      const locked = await lockEnrollment({ db: tx, trainerId, id });
      if (!locked) return { kind: "not-found" };
      if (locked.kind === "test") return { kind: "not-schedulable", errors: [TEST_FIXED_MESSAGE] };
      if (!isLive(locked.status)) return { kind: "not-schedulable", errors: [ENROLLMENT_CLOSED_MESSAGE] };

      // Counted under the lock: a session recorded a moment ago can't slip below the new number.
      const used = await findUsedSessionCount({ db: tx, enrollmentId: id });
      if (plannedSessions < used) {
        return {
          kind: "invalid",
          errors: [],
          fields: { plannedSessions: "تعداد جلسه‌ها نمی‌تواند از جلسه‌های انجام‌شده کمتر باشد." },
        };
      }

      await updatePlannedSessions({ db: tx, id, plannedSessions });
      return { kind: "set" };
    },
  );
  if (outcome.kind !== "set") return outcome;

  const { enrollment } = await readBack({ db, trainerId, id, now, caller: "setPlannedSessions" });
  return { kind: "success", enrollment };
}

/*===== Record Result =====*/
type RecordResultResult =
  | { kind: "success"; enrollment: TrainerEnrollment }
  | InvalidResult
  | NotFoundResult
  | ConflictResult<"not-recordable">;

/**
 * Records the result of an active enrollment that has a used session: it becomes `passed` or `failed` with the note the
 * customer will read, and its sessions that are still scheduled are cancelled, in one transaction. The customer gets an
 * SMS after the commit.
 *
 * @returns `not-found` for another trainer's enrollment and a malformed id alike; `invalid` with per-field messages;
 * `not-recordable` when it isn't active or no session has been used yet.
 */
export async function recordResult({
  db,
  trainerId,
  id,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; id: string; input: unknown } & Clock): Promise<RecordResultResult> {
  const current = isUuid(id) ? await findEnrollmentByTrainer({ db, trainerId, id }) : undefined;
  if (!current) return { kind: "not-found" };

  const parsed = recordResultInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  const { result, trainerNote } = parsed.data;

  const outcome = await db.transaction(
    async (tx): Promise<NotFoundResult | ConflictResult<"not-recordable"> | { kind: "recorded" }> => {
      const locked = await lockEnrollment({ db: tx, trainerId, id });
      if (!locked) return { kind: "not-found" };
      if (locked.status !== "active") return { kind: "not-recordable", errors: [RESULT_CLOSED_MESSAGE] };

      if ((await findUsedSessionCount({ db: tx, enrollmentId: id })) === 0) {
        return { kind: "not-recordable", errors: [RESULT_NEEDS_SESSION_MESSAGE] };
      }

      const recorded = await markEnrollmentResult({ db: tx, id, status: result, trainerNote, now });
      if (!recorded) return { kind: "not-recordable", errors: [RESULT_CLOSED_MESSAGE] };

      // The course is over: a session still on the calendar would be a promise nobody keeps.
      await cancelScheduledSessionsOf({ db: tx, enrollmentId: id });
      return { kind: "recorded" };
    },
  );
  if (outcome.kind !== "recorded") return outcome;

  await notify({
    phoneNumber: current.customer.phoneNumber,
    kind: "enrollment-result",
    body: resultText({ result, course: current.course.title, dog: current.dog.name }),
  });

  const { enrollment } = await readBack({ db, trainerId, id, now, caller: "recordResult" });
  return { kind: "success", enrollment };
}

function resultText({ result, course, dog }: { result: EnrollmentResult; course: string; dog: string }): string {
  return result === "passed"
    ? `آموزش K9: تبریک! ${dog} دوره‌ی ${course} را با موفقیت گذراند. یادداشت مربی را در سایت ببین.`
    : `آموزش K9: نتیجه‌ی دوره‌ی ${course} برای ${dog} ثبت شد. یادداشت مربی را در سایت ببین.`;
}

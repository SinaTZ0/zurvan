import type { DatabaseOrTransaction } from "~/db/client.server";
import { notify } from "~/lib/notify.server";
import { isUuid } from "~/lib/uuid";
import { isDogId } from "~/orpc/dog/validation";
import { ENROLLMENT_STATUSES, type EnrollmentStatus } from "~/orpc/enrollment/constants";
import type { AdminEnrollment, Enrollment } from "~/orpc/enrollment/contract";
import { endActiveEnrollment, findEnrollments, type EnrollmentRow } from "~/orpc/enrollment/repository";
import { toPublicMedia } from "~/orpc/media/mapper";

/*===== Types =====*/
type NotFoundResult = { kind: "not-found" };
type ConflictResult = { kind: "not-active"; errors: string[] };

/*===== Mapping =====*/
/** @throws When `status` isn't a known value: corrupted data that should surface instead of a wrong status. */
function toEnrollment(row: EnrollmentRow): Enrollment {
  const { enrollment: record } = row;
  if (!isStatus(record.status)) throw new Error(`Enrollment ${record.id} has an unknown status: ${record.status}`);

  return {
    id: record.id,
    status: record.status,
    course: row.course,
    dog: { ...row.dog, photo: row.dogPhoto ? toPublicMedia(row.dogPhoto) : null },
    price: record.price,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
    cancelledAt: record.cancelledAt,
  };
}

function toAdminEnrollment(row: EnrollmentRow): AdminEnrollment {
  return { ...toEnrollment(row), customer: row.customer };
}

function isStatus(value: string): value is EnrollmentStatus {
  return (ENROLLMENT_STATUSES as readonly string[]).includes(value);
}

/*===== List =====*/
/** The customer's enrollments, active ones first; `dogId` narrows them to one dog's. */
export async function listMyEnrollments({
  db,
  customerId,
  dogId,
}: {
  db: DatabaseOrTransaction;
  customerId: string;
  dogId?: string;
}): Promise<Enrollment[]> {
  if (dogId !== undefined && !isDogId(dogId)) return [];
  return (await findEnrollments({ db, customerId, dogId })).map(toEnrollment);
}

export async function adminListEnrollments({
  db,
  status,
  dogId,
}: {
  db: DatabaseOrTransaction;
  status?: EnrollmentStatus;
  /** One dog's enrollments. A malformed id matches nothing, instead of asking Postgres for a bad uuid. */
  dogId?: string;
}): Promise<AdminEnrollment[]> {
  if (dogId !== undefined && !isDogId(dogId)) return [];
  return (await findEnrollments({ db, status, dogId })).map(toAdminEnrollment);
}

/*===== Complete and Cancel =====*/
type FinishResult = { kind: "success"; enrollment: AdminEnrollment } | NotFoundResult | ConflictResult;

/**
 * «تمام شد» or «لغو» (F6): ends an active enrollment. No note, no form. Completing makes the course passed for the dog,
 * which unlocks the courses that need it; cancelling refunds nothing (the money goes back outside the app) and leaves
 * the partner's commission alone. The customer is told.
 *
 * @returns `not-found` for a malformed or unknown id; `not-active` when it has ended already.
 */
export async function finishEnrollment({
  db,
  id,
  status,
  now = new Date(),
}: {
  db: DatabaseOrTransaction;
  id: string;
  status: "completed" | "cancelled";
  now?: Date;
}): Promise<FinishResult> {
  if (!isUuid(id)) return { kind: "not-found" };

  const [before] = await findEnrollments({ db, id });
  if (!before) return { kind: "not-found" };
  if (!(await endActiveEnrollment({ db, id, status, now }))) {
    return { kind: "not-active", errors: ["این آموزش دیگر فعال نیست."] };
  }

  const [after] = await findEnrollments({ db, id });
  if (!after) throw new Error(`finishEnrollment: enrollment ${id} could not be read back`);

  const label = `دوره‌ی ${after.course.title} برای ${after.dog.name}`;
  await notify({
    phoneNumber: after.customer.phoneNumber,
    kind: status === "completed" ? "enrollment-completed" : "enrollment-cancelled",
    body:
      status === "completed"
        ? `آموزش K9: ${label} تمام شد. به ${after.dog.name} تبریک می‌گوییم!`
        : `آموزش K9: ${label} لغو شد. برای جزئیات با شما تماس می‌گیریم.`,
  });
  return { kind: "success", enrollment: toAdminEnrollment(after) };
}

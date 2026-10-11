import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import { LIVE_ENROLLMENT_STATUSES } from "~/orpc/enrollment/constants";
import type { CustomerEnrollment } from "~/orpc/enrollment/contract";

/*===== Enrollment Words =====*/
// The customer's pages (My Training, Enrollment Detail, Dog Detail and the Dogs List) word an enrollment the same way.
// Browser-safe.

type NamedEnrollment = Pick<CustomerEnrollment, "kind" | "course">;

/** «CGC», or «تست CGC» for the test: a test is its own line in a dog's record. */
export function enrollmentTitle(enrollment: NamedEnrollment): string {
  return enrollment.kind === "test" ? `تست ${enrollment.course.title}` : enrollment.course.title;
}

/** What the customer calls the trainer: the head trainer by first name, anyone else by the name on the profile. */
export function trainerFirstName(trainer: CustomerEnrollment["trainer"]): string {
  return trainer.isHeadTrainer ? HEAD_TRAINER.firstName : trainer.name;
}

/** Scheduling or active: the enrollment can still be cancelled and has something coming. */
export function isLiveEnrollment(enrollment: Pick<CustomerEnrollment, "status">): boolean {
  return (LIVE_ENROLLMENT_STATUSES as readonly string[]).includes(enrollment.status);
}

/**
 * The one live enrollment a dog's next-step slot talks about: the one whose session comes first; one with no session
 * scheduled yet comes after those that have one. Null when the dog has none.
 */
export function pickNextEnrollment<T extends Pick<CustomerEnrollment, "status" | "nextSession">>(
  enrollments: T[],
): T | null {
  const live = enrollments.filter(isLiveEnrollment);
  const start = (enrollment: T) => enrollment.nextSession?.startsAt.getTime() ?? Number.POSITIVE_INFINITY;
  // oxlint-disable-next-line unicorn/no-array-sort -- `filter` made a fresh array.
  return live.sort((a, b) => start(a) - start(b))[0] ?? null;
}

/**
 * The next thing in one sentence: the next session's day (and time), or who calls to fix one. A live enrollment with
 * no session on the calendar is either brand new (the trainer calls for the first) or between sessions.
 *
 * @param withTime Left out in tight places such as the Dogs List.
 */
export function describeNextStep({
  enrollment,
  withTime = true,
}: {
  enrollment: Pick<CustomerEnrollment, "kind" | "status" | "nextSession" | "trainer">;
  withTime?: boolean;
}): string {
  const { nextSession } = enrollment;
  if (nextSession) {
    const label = enrollment.kind === "test" ? "زمان تست" : "جلسه‌ی بعد";
    const day = formatSlotDay(nextSession.startsAt);
    return withTime ? `${label}: ${day}، ساعت ${formatSlotTime(nextSession.startsAt)}` : `${label}: ${day}`;
  }
  if (enrollment.status === "scheduling") {
    const trainer = trainerFirstName(enrollment.trainer);
    return enrollment.kind === "test"
      ? `${trainer} برای وقت تست تماس می‌گیرد`
      : `${trainer} برای اولین جلسه تماس می‌گیرد`;
  }
  return "جلسه‌ی بعد هنوز زمان‌بندی نشده";
}

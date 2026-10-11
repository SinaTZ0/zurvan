import { formatNumberFa } from "~/lib/digits";
import { formatJalaliDate } from "~/lib/jalali";
import { formatSlotDay, formatSlotTime, utcToTehranParts } from "~/lib/tehran-time";
import type { SessionPlaceKind } from "~/orpc/enrollment/constants";
import type { TrainerEnrollment } from "~/orpc/enrollment/contract";

/*===== Places =====*/
/** What a session with a boarded dog gets as its place: the dog stays at the kennel and training continues there. */
export const KENNEL_PLACE = "پانسیون آموزش K9";

/**
 * The place a new session starts with, so the trainer rarely types it: the customer's address for a home session, the
 * kennel for a boarded dog's, and nothing for an outside meeting point (it is different every time).
 */
export function presetPlace({
  kind,
  enrollment,
}: {
  kind: SessionPlaceKind;
  enrollment: Pick<TrainerEnrollment, "address">;
}): string {
  if (kind === "home") return enrollment.address ?? "";
  if (kind === "boarding") return KENNEL_PLACE;
  return "";
}

/*===== Formatting =====*/
/** «۱۹ مهر ۱۴۰۵», the Tehran date an instant falls on. */
export function formatRecordedDate(date: Date): string {
  return formatJalaliDate(utcToTehranParts(date).date);
}

/** «شنبه ۱۹ مهر، ۱۷:۰۰». */
export function formatSessionWhen(date: Date): string {
  return `${formatSlotDay(date)}، ${formatSlotTime(date)}`;
}

/** «۶۰ دقیقه», the length of a session. */
export function formatMinutes(minutes: number): string {
  return `${formatNumberFa(minutes)} دقیقه`;
}

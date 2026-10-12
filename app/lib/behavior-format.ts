import { toPersianDigits } from "~/lib/digits";
import { isoToJalali, JALALI_MONTHS } from "~/lib/jalali";
import { formatSlotTime, utcToTehranParts, WEEKDAY_NAMES } from "~/lib/tehran-time";
import { BEHAVIOR_PLAN_VALID_DAYS } from "~/orpc/behavior-request/constants";

/*===== Plan Deadline =====*/
// A plan is payable for 7 days (B13). The pages show the time left as the plan slip's notches, and say it in words with
// these helpers. Browser-safe: `now` is a parameter so a page can render the same on the server and the browser.

const DAY_MS = 24 * 60 * 60_000;

/**
 * Whole days still left to pay, rounded up, so a plan with two hours left still reads «۱ روز» and is never shown as
 * already expired while the server would take the payment. 0 once `expiresAt` has passed.
 */
export function planDaysLeft({ expiresAt, now }: { expiresAt: Date; now: Date }): number {
  const left = expiresAt.getTime() - now.getTime();
  if (left <= 0) return 0;
  return Math.min(BEHAVIOR_PLAN_VALID_DAYS, Math.ceil(left / DAY_MS));
}

/** «شنبه ۲۶ مهر ساعت ۱۷:۰۰», the moment the plan stops being payable, on the Tehran clock. */
export function formatPlanDeadline(expiresAt: Date): string {
  const { date, weekday } = utcToTehranParts(expiresAt);
  const { month, day } = isoToJalali(date);
  return `${WEEKDAY_NAMES[weekday]} ${toPersianDigits(String(day))} ${JALALI_MONTHS[month - 1]} ساعت ${formatSlotTime(expiresAt)}`;
}

/** The plan slip's line under its notches: «۷ روز فرصت داری», «فقط تا فردا», «منقضی شد». */
export function describePlanDaysLeft(daysLeft: number): string {
  if (daysLeft <= 0) return "منقضی شد";
  if (daysLeft === 1) return "فقط تا فردا";
  return `${toPersianDigits(String(daysLeft))} روز فرصت داری`;
}

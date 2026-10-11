import { DEFAULT_TEST_REFUND_CUTOFF_HOURS } from "~/lib/business-rules";
import { formatNumberFa } from "~/lib/digits";
import type { EnrollmentKind } from "~/orpc/enrollment/constants";

/*===== Refund Sentence =====*/
/**
 * The one sentence on what comes back if plans change, from the order item's refund policy (copied onto the item at
 * booking, so it is the policy the customer agreed to). The order carries the percentage, not the owner's wording, so
 * this mirrors `calculateEnrollmentRefund`: a course returns everything until the first session and then the policy's
 * share of the unheld ones; a test returns everything until its cut-off.
 */
export function describeRefund({ kind, percent }: { kind: EnrollmentKind; percent: number }): string {
  if (kind === "test") {
    return `اگر دست‌کم ${formatNumberFa(DEFAULT_TEST_REFUND_CUTOFF_HOURS)} ساعت مانده به جلسه‌ی تست لغو کنی، کل مبلغ به کیف پولت برمی‌گردد.`;
  }

  const first = "تا اولین جلسه، کل مبلغ برمی‌گردد.";
  if (percent >= 100) return `${first} بعد از آن هم کل سهم جلسه‌های برگزارنشده برمی‌گردد.`;
  if (percent <= 0) return `${first} بعد از آن، مبلغی برنمی‌گردد.`;
  if (percent === 50) return `${first} بعد از آن، نصف سهم جلسه‌های برگزارنشده برمی‌گردد.`;
  return `${first} بعد از آن، ${formatNumberFa(percent)} درصد سهم جلسه‌های برگزارنشده برمی‌گردد.`;
}

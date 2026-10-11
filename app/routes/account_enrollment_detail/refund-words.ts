import { DEFAULT_TEST_REFUND_CUTOFF_HOURS } from "~/lib/business-rules";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import type { EnrollmentRefundRule } from "~/lib/business-rules";
import type { CustomerEnrollment } from "~/orpc/enrollment/contract";

/** «نصف» for 50, «کل» for 100, «۷۰٪ از» otherwise: how much of the unheld sessions' share comes back. */
function describeShare(percent: number): string {
  if (percent === 100) return "کل";
  if (percent === 50) return "نصف";
  return `${formatNumberFa(percent)}٪ از`;
}

/**
 * The refund the cancel dialog promises, and why, in one or two sentences. The amount is the API's own
 * `refundPreview` (the cancelling recomputes it), and the rule only decides how it is explained.
 */
export function describeRefund({
  enrollment,
  rule,
  amount,
}: {
  enrollment: Pick<CustomerEnrollment, "plannedSessions" | "usedSessions" | "refundPolicy">;
  rule: EnrollmentRefundRule;
  amount: number;
}): string {
  const money = formatToman(amount);
  const unheld = Math.max(enrollment.plannedSessions - enrollment.usedSessions, 0);

  switch (rule) {
    case "before-first-session":
      return `تا اولین جلسه کل مبلغ برمی‌گردد: ${money} به کیف پولت.`;
    case "policy":
      return amount === 0
        ? `${formatNumberFa(enrollment.usedSessions)} جلسه برگزار شده و طبق «${enrollment.refundPolicy.name}» پولی برنمی‌گردد.`
        : `${formatNumberFa(enrollment.usedSessions)} جلسه برگزار شده. ${describeShare(enrollment.refundPolicy.percent)} سهم ${formatNumberFa(unheld)} جلسه‌ی باقی‌مانده برمی‌گردد: ${money} به کیف پولت.`;
    case "test-before-cutoff":
      return `تست را بیش از ${formatNumberFa(DEFAULT_TEST_REFUND_CUTOFF_HOURS)} ساعت مانده به جلسه‌اش لغو می‌کنی، پس کل مبلغ برمی‌گردد: ${money} به کیف پولت.`;
    case "test-after-cutoff":
      return `کمتر از ${formatNumberFa(DEFAULT_TEST_REFUND_CUTOFF_HOURS)} ساعت به جلسه‌ی تست مانده، پس پولی برنمی‌گردد.`;
    case "staff":
      return `${money} به کیف پولت برمی‌گردد.`;
  }
}

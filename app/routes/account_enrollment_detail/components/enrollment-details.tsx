import { Link } from "~/components/link";
import { DEFAULT_TEST_REFUND_CUTOFF_HOURS } from "~/lib/business-rules";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { trainerFirstName } from "~/lib/enrollment-format";
import { TRAINING_GOAL_LABELS } from "~/orpc/assessment/constants";
import type { CustomerEnrollment } from "~/orpc/enrollment/contract";

/*===== Enrollment Details =====*/
/** The facts of the booking and its money as a ruled definition list, with the exact amounts. */
export function EnrollmentDetails({ enrollment }: { enrollment: CustomerEnrollment }) {
  const { refundPolicy } = enrollment;

  return (
    <dl className="divide-y border-y">
      <Row term="مربی">{trainerFirstName(enrollment.trainer)}</Row>
      <Row term="پانسیون">{enrollment.boarding ? "دارد؛ سگ در پانسیون می‌ماند" : "ندارد"}</Row>
      {enrollment.address && <Row term="نشانی">{enrollment.address}</Row>}
      <Row term="زمان‌های مناسب">{enrollment.preferredTimes}</Row>
      <Row term="هدف">{TRAINING_GOAL_LABELS[enrollment.trainingGoal]}</Row>
      <Row term="سفارش">
        <Link
          to={`/account/checkout/${enrollment.order.id}/result`}
          className="font-bold underline-offset-4 hover:text-primary hover:underline"
        >
          <bdi dir="ltr">{enrollment.order.number}</bdi>
        </Link>
      </Row>
      <Row term="مبلغ پرداخت‌شده">
        <span className="font-bold tabular-nums">{formatToman(enrollment.paidAmount)}</span>
      </Row>
      {enrollment.refundedAmount > 0 && (
        <Row term="برگشته به کیف پول">
          <span className="font-bold tabular-nums">{formatToman(enrollment.refundedAmount)}</span>
        </Row>
      )}
      <Row term="قوانین لغو">
        <span className="font-bold">{refundPolicy.name}</span>
        <span className="mt-1 block text-sm text-pretty text-muted-foreground">
          {enrollment.kind === "test"
            ? `اگر بیش از ${formatNumberFa(DEFAULT_TEST_REFUND_CUTOFF_HOURS)} ساعت مانده به جلسه لغو کنی، کل مبلغ برمی‌گردد.`
            : `تا اولین جلسه کل مبلغ برمی‌گردد؛ بعد از آن ${formatNumberFa(refundPolicy.percent)} درصد سهم جلسه‌های برگزارنشده.`}
        </span>
        <Link
          to="/help/refunds"
          className="mt-1 block w-fit text-sm font-bold text-primary underline-offset-4 hover:underline"
        >
          قوانین لغو و بازپرداخت
        </Link>
      </Row>
    </dl>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground sm:pt-0.5">{term}</dt>
      <dd className="text-pretty whitespace-pre-line">{children}</dd>
    </div>
  );
}

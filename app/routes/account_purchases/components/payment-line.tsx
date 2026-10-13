import { DogThumb } from "~/components/dog-thumb";
import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { formatToman } from "~/lib/course-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { Payment } from "~/orpc/checkout/contract";
import { ENROLLMENT_STATUSES, type EnrollmentStatus } from "~/orpc/enrollment/constants";

/*===== Enrollment Status Guard =====*/
// The contract types an enrollment's status as a plain string; the badge only knows the three real ones.
function isEnrollmentStatus(status: string): status is EnrollmentStatus {
  return (ENROLLMENT_STATUSES as readonly string[]).includes(status);
}

/*===== Enrollment Line =====*/
/**
 * What a paid item turned into. A failed or pending payment bought nothing yet, so it says nothing. A paid item with no
 * enrollment is the one case that needs the trainer (F5): the money arrived but the course was not registered, so the
 * page says so plainly instead of leaving the customer to guess. No refund UI.
 */
function EnrollmentLine({
  paymentStatus,
  enrollment,
}: {
  paymentStatus: Payment["status"];
  enrollment: Payment["items"][number]["enrollment"];
}) {
  if (paymentStatus !== "paid") return null;

  if (enrollment && isEnrollmentStatus(enrollment.status)) {
    return <EnrollmentStatusBadge status={enrollment.status} className="mt-2" />;
  }

  return (
    <p className="mt-2 max-w-md text-sm text-pretty text-muted-foreground">
      پرداخت شد، اما دوره‌ای برایش ثبت نشد. {HEAD_TRAINER.firstName} موضوع را می‌بیند و با شما تماس می‌گیرد.
    </p>
  );
}

/*===== Payment Line =====*/
/**
 * One bought course inside a slip. It wears the dog's face (a payment item carries only the dog's id and name, so the
 * thumb is the letter disc), and the dog's name leads to its page, where the enrollment lives.
 */
export function PaymentLine({
  item,
  paymentStatus,
}: {
  item: Payment["items"][number];
  paymentStatus: Payment["status"];
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-4">
      {/*------ Dog ------*/}
      <DogThumb name={item.dog.name} photo={null} className="row-span-2 size-12 sm:row-span-1" />

      {/*------ Words ------*/}
      <div className="min-w-0">
        <Link
          to={`/account/dogs/${item.dog.id}`}
          className="inline-block min-h-6 rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
        >
          <bdi>{item.dog.name}</bdi>
        </Link>
        <h3 className="font-sans text-base font-bold text-pretty">{item.course.title}</h3>
        <EnrollmentLine paymentStatus={paymentStatus} enrollment={item.enrollment} />
      </div>

      {/*------ Price ------*/}
      {/* Under the words on phones (the row is too narrow for a third column), at the end on wider screens. */}
      <p className="col-start-2 font-bold text-foreground sm:col-start-3 sm:row-start-1 sm:text-end">
        {formatToman(item.price)}
      </p>
    </li>
  );
}

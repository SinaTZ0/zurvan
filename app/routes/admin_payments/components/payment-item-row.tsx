import { CustomerContact } from "~/components/customer-contact";
import { DogThumb } from "~/components/dog-thumb";
import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { formatToman } from "~/lib/course-format";
import type { AdminPayment } from "~/orpc/checkout/contract";
import { ENROLLMENT_STATUSES, type EnrollmentStatus } from "~/orpc/enrollment/constants";

/*===== Enrollment Status Guard =====*/
// The contract types an enrollment's status as a plain string; the badge only knows the three real ones.
function isEnrollmentStatus(status: string): status is EnrollmentStatus {
  return (ENROLLMENT_STATUSES as readonly string[]).includes(status);
}

/*===== Torn Slip =====*/
/**
 * A paid item that got no enrollment: the torn part of the slip, under its line. The wording names what happened and
 * what to do, and never says the customer owes anything: the money was paid, and the app records no refunds, so the
 * flag can't be cleared from here.
 */
function TornSlip({ customer }: { customer: AdminPayment["customer"] }) {
  return (
    // Desktop: the words at the start and the call at the end, in one row; phones stack them.
    <div className="w-full rounded-xl border border-dashed border-destructive/50 bg-destructive/5 p-3 lg:flex lg:items-center lg:justify-between lg:gap-6">
      <div>
        <p className="text-sm font-bold">پرداخت شد ولی ثبت‌نام نشد</p>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          پول این مورد گرفته شده ولی دوره ثبت نشد. پولش را بیرون از برنامه برگردان.
        </p>
      </div>
      <div className="mt-3 shrink-0 lg:mt-0">
        <CustomerContact name={customer.name} phoneNumber={customer.phoneNumber} variant="call" />
      </div>
    </div>
  );
}

/*===== Payment Item Row =====*/
/**
 * One course bought in a paid payment. The dog is plain text: the Admin's dog page doesn't exist yet. A payment item
 * carries no photo, so the dog's letter stands in for it.
 */
export function PaymentItemRow({
  item,
  customer,
}: {
  item: AdminPayment["items"][number];
  customer: AdminPayment["customer"];
}) {
  const enrollment = item.enrollment;

  return (
    <li className="flex flex-wrap items-start gap-x-3 gap-y-2 py-3">
      <DogThumb name={item.dog.name} photo={null} className="size-10" />

      <div className="min-w-0 flex-1 basis-40">
        <p className="text-sm font-bold">
          <bdi>{item.dog.name}</bdi>
        </p>
        <p className="text-sm text-pretty text-muted-foreground">{item.course.title}</p>
        {!item.paidNotEnrolled && enrollment && isEnrollmentStatus(enrollment.status) && (
          <EnrollmentStatusBadge status={enrollment.status} className="mt-2" />
        )}
      </div>

      <p className="ms-auto text-sm font-bold tabular-nums">{formatToman(item.price)}</p>

      {item.paidNotEnrolled && <TornSlip customer={customer} />}
    </li>
  );
}

import { cn } from "cn";

import { CustomerContact } from "~/components/customer-contact";
import { DogThumb } from "~/components/dog-thumb";
import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { formatToman } from "~/lib/course-format";
import type { AdminPayment } from "~/orpc/checkout/contract";
import { ENROLLMENT_STATUSES, type EnrollmentStatus } from "~/orpc/enrollment/constants";

import { TORN_EDGE, TORN_PIECE } from "../slip-marks";

/*===== Enrollment Status Guard =====*/
// The contract types an enrollment's status as a plain string; the badge only knows the three real ones.
function isEnrollmentStatus(status: string): status is EnrollmentStatus {
  return (ENROLLMENT_STATUSES as readonly string[]).includes(status);
}

/*===== Payment Item Row =====*/
/**
 * One course bought in a paid payment: the dog's initial disc (a payment item carries no photo), the dog's name leading
 * to its Dog Detail, the course, what it turned into and the price at the end. On phones the chip drops under the
 * course; from `sm` it sits before the price.
 *
 * A paid item that got no enrollment is the torn piece of the slip: the same line inside a dashed destructive outline
 * with a torn bottom edge, then what happened, what to do and the call. It never says the customer owes anything: the
 * money was paid. Giving it back is recorded under «بازپرداخت‌ها» at the foot of the same slip.
 */
export function PaymentItemRow({
  item,
  customer,
}: {
  item: AdminPayment["items"][number];
  customer: AdminPayment["customer"];
}) {
  const enrollment = item.enrollment;
  const chip = !item.paidNotEnrolled && enrollment && isEnrollmentStatus(enrollment.status) ? enrollment.status : null;

  /*------ Line ------*/
  const line = (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-x-4">
      <DogThumb name={item.dog.name} photo={null} className="row-span-2 size-10 text-base sm:row-span-1" />

      <div className="min-w-0">
        <Link
          to={`/admin/dogs/${encodeURIComponent(item.dog.id)}`}
          className="inline-flex min-h-6 items-center rounded-sm text-sm font-bold underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <bdi>{item.dog.name}</bdi>
        </Link>
        <p className="text-sm text-pretty text-muted-foreground">{item.course.title}</p>
      </div>

      {chip && (
        <EnrollmentStatusBadge status={chip} className="col-start-2 row-start-2 w-fit sm:col-start-3 sm:row-start-1" />
      )}

      <p className="col-start-3 row-start-1 text-sm font-bold whitespace-nowrap sm:col-start-4">
        {formatToman(item.price)}
      </p>
    </div>
  );

  if (!item.paidNotEnrolled) return <li className="py-3.5 first:pt-0">{line}</li>;

  /*------ Torn Piece ------*/
  return (
    <li className="py-3.5 first:pt-0">
      <div className={cn("rounded-t-2xl p-3 pb-5 sm:p-4 sm:pb-6", TORN_PIECE, TORN_EDGE)}>
        {line}

        {/* Desktop: the words at the start and the call at the end; phones stack them. */}
        <div className="mt-3 flex flex-col gap-3 border-t border-dashed border-destructive/30 pt-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="min-w-0">
            <p className="text-sm font-bold">پرداخت شد ولی ثبت‌نام نشد</p>
            <p className="mt-0.5 max-w-prose text-sm text-pretty text-muted-foreground">
              پول این مورد گرفته شده ولی دوره ثبت نشد. اگه قراره پس بدی، پایین همین برگه بازپرداخت رو ثبت کن.
            </p>
          </div>
          <CustomerContact
            name={customer.name}
            phoneNumber={customer.phoneNumber}
            variant="call"
            className="shrink-0"
          />
        </div>
      </div>
    </li>
  );
}

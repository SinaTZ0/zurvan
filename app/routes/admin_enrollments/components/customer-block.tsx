import { CustomerContact } from "~/components/customer-contact";
import { formatNumberFa } from "~/lib/digits";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import { EnrollmentLine } from "~/routes/admin_enrollments/components/enrollment-line";
import type { FinishKind } from "~/routes/admin_enrollments/components/finish-dialog";
import type { CustomerBlockData } from "~/routes/admin_enrollments/group-by-customer";

/*===== Customer Block =====*/
/**
 * One person to call and everything they bought (in the current filter). The number sits on the start side, because
 * dialling is the first thing the Admin does; the enrollments to close are listed beside it.
 *
 * Desktop: the contact is a sunken column of 4/12 beside the lines (8/12). Phones: it becomes a band on top with the
 * call button across the full width, so a thumb can hit it.
 */
export function CustomerBlock({
  block,
  showBadge,
  onFinish,
}: {
  block: CustomerBlockData;
  showBadge: boolean;
  onFinish: (args: { enrollment: AdminEnrollment; kind: FinishKind }) => void;
}) {
  const { customer, lines } = block;

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card lg:grid lg:grid-cols-12">
      {/*===== Who to Call =====*/}
      <div className="flex flex-col gap-3 border-b border-border bg-sunken p-4 lg:col-span-4 lg:border-e lg:border-b-0 lg:p-5">
        {/* The call link is the only anchor-button in the contact; widen it on phones without touching the component. */}
        <CustomerContact
          name={customer.name}
          phoneNumber={customer.phoneNumber}
          variant="call"
          className="max-lg:[&_a]:h-11 max-lg:[&_a]:w-full"
        />
        <p className="text-xs text-muted-foreground">{formatNumberFa(lines.length)} ثبت‌نام</p>
      </div>

      {/*===== Their Enrollments =====*/}
      <ul className="divide-y divide-border p-4 lg:col-span-8 lg:self-center lg:p-5">
        {lines.map((enrollment) => (
          <EnrollmentLine key={enrollment.id} enrollment={enrollment} showBadge={showBadge} onFinish={onFinish} />
        ))}
      </ul>
    </li>
  );
}

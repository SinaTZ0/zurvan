import { cn } from "cn";

import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { ADMIN_HAIRLINE, ADMIN_PLATE } from "~/lib/admin-plate";
import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";
import { INK_LINK, QUIET_LINE } from "~/routes/admin_dog_detail/surfaces";

/*===== Enrollments Section =====*/
/**
 * The dog's enrollments (F6), active ones first as the API sends them, as rows on one plate. Display only: the endings
 * («تمام شد», «لغو») are done on the Enrollments page, next to the customer's phone number, which the head links to.
 *
 * From `sm` each row is fixed columns (course, status, price and date), so the chips and the prices line up.
 */
export function EnrollmentsSection({ enrollments }: { enrollments: AdminEnrollment[] }) {
  return (
    <DetailSection
      id="enrollments"
      title="ثبت‌نام‌ها"
      action={
        <Link to="/admin/enrollments" className={INK_LINK}>
          همه‌ی ثبت‌نام‌ها
        </Link>
      }
    >
      {enrollments.length === 0 ? (
        <p className={QUIET_LINE}>هنوز ثبت‌نامی نداره.</p>
      ) : (
        <ul className={cn(ADMIN_PLATE, "divide-y px-4 sm:px-5", ADMIN_HAIRLINE)}>
          {enrollments.map((enrollment) => (
            <li
              key={enrollment.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3.5 sm:grid-cols-[minmax(0,1fr)_7.5rem_9.5rem]"
            >
              <p className="min-w-0 text-sm font-bold text-pretty">
                {enrollment.course.title}{" "}
                <bdi dir="ltr" className="text-xs font-normal text-muted-foreground">
                  {enrollment.course.latinName}
                </bdi>
              </p>
              <div className="sm:justify-self-start">
                <EnrollmentStatusBadge status={enrollment.status} quiet />
              </div>
              <div className="col-span-2 flex items-baseline justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:gap-0.5">
                <span className="text-sm font-bold whitespace-nowrap tabular-nums">
                  {formatToman(enrollment.price)}
                </span>
                <span className="text-xs whitespace-nowrap text-muted-foreground">{dateNote(enrollment)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}

/*===== Date Note =====*/
/** The buying date, or the day it ended once it did (the chip beside it says how). */
function dateNote({ status, createdAt, completedAt, cancelledAt }: AdminEnrollment): string {
  if (status === "completed" && completedAt) return `تمام شد ${formatJalaliTimestamp(completedAt)}`;
  if (status === "cancelled" && cancelledAt) return `لغو شد ${formatJalaliTimestamp(cancelledAt)}`;
  return `خرید ${formatJalaliTimestamp(createdAt)}`;
}

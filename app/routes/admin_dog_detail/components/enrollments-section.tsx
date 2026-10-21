import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";

/*===== Enrollments Section =====*/
/**
 * The dog's enrollments (F6), active ones first as the API sends them. Display only: the endings («تمام شد», «لغو») are
 * done on the Enrollments page, next to the customer's phone number, which the link goes to.
 */
export function EnrollmentsSection({ enrollments }: { enrollments: AdminEnrollment[] }) {
  return (
    <DetailSection
      id="enrollments"
      title="ثبت‌نام‌ها"
      action={
        <Link
          to="/admin/enrollments"
          className="inline-flex h-10 items-center rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          همه‌ی ثبت‌نام‌ها
        </Link>
      }
    >
      {enrollments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          ثبت‌نامی ندارد
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
          {enrollments.map((enrollment) => (
            <li
              key={enrollment.id}
              className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-sm font-bold text-pretty">{enrollment.course.title}</span>
                <EnrollmentStatusBadge status={enrollment.status} quiet />
              </div>
              <div className="flex items-baseline gap-3 text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{formatToman(enrollment.price)}</span>
                <span>{dateNote(enrollment)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}

/*===== Date Note =====*/
/** The buying date, or «تمام شد · date» / «لغو شد · date» once it ended. */
function dateNote({ status, createdAt, completedAt, cancelledAt }: AdminEnrollment): string {
  if (status === "completed" && completedAt) return `تمام شد · ${formatJalaliTimestamp(completedAt)}`;
  if (status === "cancelled" && cancelledAt) return `لغو شد · ${formatJalaliTimestamp(cancelledAt)}`;
  return formatJalaliTimestamp(createdAt);
}

import { DogThumb } from "~/components/dog-thumb";
import { Link } from "~/components/link";
import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Button } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import type { FinishKind } from "~/routes/admin_enrollments/components/finish-dialog";

/*===== Enrollment Line =====*/
/**
 * One dog taking one course, inside its customer's block. An active line carries the two endings; a finished one says
 * how it ended and when. `showBadge` is for the «همه» tab, where lines of every status share a list.
 *
 * Phones stack the line and give the buttons the width (44px tall, side by side); from `lg` it is one row.
 */
export function EnrollmentLine({
  enrollment,
  showBadge,
  onFinish,
}: {
  enrollment: AdminEnrollment;
  showBadge: boolean;
  onFinish: (args: { enrollment: AdminEnrollment; kind: FinishKind }) => void;
}) {
  const { dog, course, status } = enrollment;
  const isActive = status === "active";

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:grid lg:grid-cols-[minmax(0,1fr)_8rem_15rem] lg:items-center lg:gap-5">
      {/*------ Dog and Course ------*/}
      <div className="flex min-w-0 items-center gap-3">
        <DogThumb name={dog.name} photo={dog.photo} className="size-12" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {/* The dog's name opens its page (F2); the line's buttons stay the way to end the enrollment. */}
            <Link
              to={`/admin/dogs/${encodeURIComponent(dog.id)}`}
              className="rounded-sm underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <bdi>{dog.name}</bdi>
            </Link>
          </p>
          <p className="mt-0.5 text-sm text-pretty">
            {course.title}{" "}
            <bdi dir="ltr" className="text-xs text-muted-foreground">
              {course.latinName}
            </bdi>
          </p>
        </div>
      </div>

      {/*------ Price and Date ------*/}
      <div className="flex items-baseline justify-between gap-4 lg:flex-col lg:items-end lg:gap-0.5">
        <p className="text-sm font-extrabold">{formatToman(enrollment.price)}</p>
        <p className="text-xs text-muted-foreground">{formatJalaliTimestamp(enrollment.createdAt)}</p>
      </div>

      {/*------ Endings or Outcome ------*/}
      {isActive ? (
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
          {/* On a phone the badge gets its own line above the buttons, so they keep the full width. */}
          {showBadge && (
            <div className="max-lg:w-full lg:me-1">
              <EnrollmentStatusBadge status={status} />
            </div>
          )}
          <Button
            type="button"
            variant="solid"
            size="sm"
            className="h-11 flex-1 lg:h-10 lg:flex-none"
            onClick={() => onFinish({ enrollment, kind: "complete" })}
          >
            تمام شد
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 flex-1 text-destructive lg:h-10 lg:flex-none"
            onClick={() => onFinish({ enrollment, kind: "cancel" })}
          >
            لغو
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground lg:justify-end">
          <EnrollmentStatusBadge status={status} />
          <span>{finishedNote(enrollment)}</span>
        </div>
      )}
    </li>
  );
}

/*===== Outcome Note =====*/
/** «تمام شد · {date}» or «لغو شد · {date}»; an API row always has the matching date, the bare word is a fallback. */
function finishedNote({ status, completedAt, cancelledAt }: AdminEnrollment): string {
  const label = status === "completed" ? "تمام شد" : "لغو شد";
  const when = status === "completed" ? completedAt : cancelledAt;
  return when ? `${label} · ${formatJalaliTimestamp(when)}` : label;
}

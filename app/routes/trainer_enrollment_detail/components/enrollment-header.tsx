import { ChevronRightIcon } from "lucide-react";

import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import type { TrainerEnrollment } from "~/orpc/enrollment/contract";

/*===== Enrollment Header =====*/
/** The way back, the dog's name (the page's one Amiri line), the status and the course it is training for. */
export function EnrollmentHeader({ enrollment }: { enrollment: TrainerEnrollment }) {
  const { dog, status, course, kind } = enrollment;

  return (
    <header className="flex flex-col gap-6">
      <Link
        to="/trainer/enrollments"
        className="inline-flex w-fit items-center gap-1 rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        <ChevronRightIcon aria-hidden className="size-4" />
        شاگردها
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display text-4xl leading-tight font-bold text-balance lg:text-5xl">{dog.name}</h1>
          <EnrollmentStatusBadge status={status} />
        </div>
        <p className="mt-3 text-pretty text-muted-foreground">
          {kind === "test" ? "تست " : ""}
          <span className="font-bold text-foreground">{course.title}</span>
          <span className="ms-3">
            <span dir="ltr" className="inline-block text-sm">
              {course.latinName}
            </span>
          </span>
        </p>
      </div>
    </header>
  );
}

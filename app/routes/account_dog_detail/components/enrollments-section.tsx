import { cn } from "cn";
import { CheckIcon, LockKeyholeIcon, MinusIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { formatTimestamp } from "~/lib/locale-format";
import type { Enrollment } from "~/orpc/enrollment/contract";
import { EdgeDog } from "~/routes/account_dog_detail/components/edge-dog";
import { SectionHead } from "~/routes/account_dog_detail/components/section-head";
import { PLATE } from "~/routes/account_dog_detail/plate";
import { m } from "~/paraglide/messages";

/*===== Date Line =====*/
// Each status says the date that belongs to it; an ended enrollment's own date is always set, but falls back to the
// purchase date rather than showing nothing.
function describeDates(enrollment: Enrollment): string {
  if (enrollment.status === "completed" && enrollment.completedAt) {
    return m.account_dog_detail_date_completed({ date: formatTimestamp(enrollment.completedAt) });
  }
  if (enrollment.status === "cancelled" && enrollment.cancelledAt) {
    return m.account_dog_detail_date_cancelled({ date: formatTimestamp(enrollment.cancelledAt) });
  }
  return m.account_dog_detail_date_from({ date: formatTimestamp(enrollment.createdAt) });
}

/*===== Enrollments Section =====*/
/**
 * F6 on the dog's page: the courses it bought, active ones first (the API orders them), one ruled row each on a grained
 * plate. No prices; those are on Purchases. The mark at each row's start says the state before the badge does: a gold
 * dot that breathes for a course in training, a gold check for a finished one, a muted dash for a cancelled one.
 *
 * The `clipboard` dog stands on the plate's top edge at its end corner, his clipboard of ticked lines held up: he keeps
 * an eye on his buddy's courses.
 */
export function EnrollmentsSection({ enrollments, isEvaluated }: { enrollments: Enrollment[]; isEvaluated: boolean }) {
  return (
    <section aria-labelledby="enrollments-title">
      <SectionHead id="enrollments-title" title={m.account_dog_detail_enrollments_title()}>
        <EdgeDog name="clipboard" className="w-[5.25rem] sm:w-24">
          <ChalkBubble
            tail="left"
            className="lively-reveal-pop absolute bottom-[92%] left-[42%] max-w-[12rem] text-pretty"
          >
            {m.account_dog_detail_enrollments_bubble()}
          </ChalkBubble>
        </EdgeDog>
      </SectionHead>

      {enrollments.length === 0 ? (
        <div className={cn(PLATE, "flex items-start gap-4 p-5 sm:p-6")}>
          {isEvaluated ? (
            <div>
              <p className="font-bold">{m.account_dog_detail_enrollments_none()}</p>
              <Link
                to="/courses"
                className="mt-2 inline-block rounded-sm font-bold text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {m.account_dog_detail_enrollments_see_courses()}
              </Link>
            </div>
          ) : (
            <>
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground/25 text-muted-foreground"
              >
                <LockKeyholeIcon strokeWidth={1.8} className="size-5" />
              </span>
              <div>
                <p className="font-bold">{m.account_dog_detail_enrollments_locked_title()}</p>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">
                  {m.account_dog_detail_enrollments_locked_text()}
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <ul className={cn(PLATE, "divide-y divide-dashed divide-foreground/15 px-5 sm:px-6")}>
          {enrollments.map((enrollment) => (
            <li key={enrollment.id} className="flex items-start gap-4 py-4">
              <StatusMark status={enrollment.status} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                  <h3
                    className={cn(
                      "font-sans font-extrabold text-pretty",
                      enrollment.status === "cancelled" && "text-muted-foreground",
                    )}
                  >
                    {enrollment.course.title}
                  </h3>
                  <EnrollmentStatusBadge status={enrollment.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  <bdi dir="ltr">{enrollment.course.latinName}</bdi>
                  <span>{describeDates(enrollment)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/*===== Status Mark =====*/
function StatusMark({ status }: { status: Enrollment["status"] }) {
  if (status === "completed") {
    return (
      <span
        aria-hidden
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <CheckIcon strokeWidth={3} className="size-4" />
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span
        aria-hidden
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-foreground/20 text-muted-foreground"
      >
        <MinusIcon strokeWidth={2.4} className="size-4" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary/50"
    >
      <span className="lively-breathe size-3 rounded-full bg-primary" />
    </span>
  );
}

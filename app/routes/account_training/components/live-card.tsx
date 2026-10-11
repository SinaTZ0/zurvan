import { ChevronLeftIcon } from "lucide-react";

import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { SessionCard } from "~/components/session-card";
import { formatNumberFa } from "~/lib/digits";
import { describeNextStep, enrollmentTitle } from "~/lib/enrollment-format";
import type { CustomerEnrollment } from "~/orpc/enrollment/contract";
import { AssessmentDogMark } from "~/routes/account_assessments/components/assessment-dog";

/*===== Live Card =====*/
/**
 * One course or test in progress: the dog and what it is learning, the session card as a strip, and the next thing in
 * one sentence. The whole card opens the enrollment through a stretched link on the course's name.
 */
export function LiveCard({ enrollment }: { enrollment: CustomerEnrollment }) {
  const waiting = enrollment.status === "scheduling";

  return (
    <li className="group relative">
      <article
        aria-labelledby={`live-${enrollment.id}`}
        className="flex flex-col gap-4 rounded-xl bg-card p-5 shadow-sm ring-1 ring-border transition-colors group-hover:bg-primary/5"
      >
        {/*------ Dog and Course ------*/}
        <div className="flex items-center gap-4">
          <AssessmentDogMark dog={enrollment.dog} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{enrollment.dog.name}</p>
            <h3 id={`live-${enrollment.id}`} className="text-lg leading-snug font-extrabold text-pretty">
              <Link
                to={`/account/training/${enrollment.id}`}
                // The pseudo-element stretches the link over the card, so the focus ring goes on it too.
                className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
              >
                {enrollmentTitle(enrollment)}
              </Link>
            </h3>
          </div>
          <EnrollmentStatusBadge status={enrollment.status} className="self-start" />
        </div>

        {/*------ Session Strip ------*/}
        <div className="flex items-center justify-between gap-4">
          <SessionCard plannedSessions={enrollment.plannedSessions} sessions={enrollment.sessions} size="strip" />
          {/* A test is one box; counting it adds nothing. */}
          {enrollment.kind === "course" && (
            <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {formatNumberFa(enrollment.usedSessions)} از {formatNumberFa(enrollment.plannedSessions)}
            </p>
          )}
        </div>

        {/*------ Next Thing ------*/}
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <p className={waiting ? "text-pretty text-muted-foreground" : "font-bold text-pretty"}>
            {describeNextStep({ enrollment })}
          </p>
          <ChevronLeftIcon
            aria-hidden
            className="size-5 shrink-0 text-muted-foreground transition-transform motion-safe:group-hover:-translate-x-1"
          />
        </div>
      </article>
    </li>
  );
}

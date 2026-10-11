import { ChevronRightIcon } from "lucide-react";

import { AssessmentStatusBadge } from "~/components/assessment-status-badge";
import { Link } from "~/components/link";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import type { TrainerAssessment } from "~/orpc/assessment/contract";
import { CancelAssessment } from "~/routes/trainer_assessment_detail/components/cancel-assessment";
import { formatDuration } from "~/routes/trainer_assessment_detail/format";

/*===== Assessment Header =====*/
/**
 * The way back, the dog's name (the page's one Amiri line), the status and when. «لغو این ارزیابی» shows only for a
 * booking that hasn't started.
 */
export function AssessmentHeader({ assessment }: { assessment: TrainerAssessment }) {
  const { dog, status, startsAt, durationMinutes, canCancel } = assessment;

  return (
    <header className="flex flex-col gap-6">
      <Link
        to="/trainer"
        className="inline-flex w-fit items-center gap-1 rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        <ChevronRightIcon aria-hidden className="size-4" />
        برنامه‌ی من
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="font-display text-4xl leading-tight font-bold text-balance lg:text-5xl">{dog.name}</h1>
            <AssessmentStatusBadge status={status} />
          </div>
          <p className="mt-3 text-pretty text-muted-foreground">
            {formatSlotDay(startsAt)}،{" "}
            <time dateTime={startsAt.toISOString()} className="font-bold text-foreground tabular-nums">
              {formatSlotTime(startsAt)}
            </time>
            ، {formatDuration(durationMinutes)}
          </p>
        </div>
        {canCancel && <CancelAssessment assessmentId={assessment.id} dogName={dog.name} />}
      </div>
    </header>
  );
}

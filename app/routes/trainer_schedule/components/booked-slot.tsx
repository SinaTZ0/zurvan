import { cn } from "cn";

import { AssessmentStatusBadge } from "~/components/assessment-status-badge";
import { DogTag } from "~/components/dog-tag";
import { Link } from "~/components/link";
import { formatSlotTime } from "~/lib/tehran-time";
import { TRAINING_GOAL_LABELS } from "~/orpc/assessment/constants";
import type { ScheduleSlot } from "~/orpc/assessment/contract";

type BookedAssessment = NonNullable<ScheduleSlot["assessment"]>;

/*===== Booked Slot =====*/
/**
 * A booked time as the dog it is for: the engraved tag and name, not the customer's name, so the week reads as the
 * dogs he is meeting. Links to the assessment. A finished one is muted and carries its status.
 */
export function BookedSlot({ slot, assessment }: { slot: ScheduleSlot; assessment: BookedAssessment }) {
  const finished = assessment.status !== "booked";

  return (
    <Link
      to={`/trainer/assessments/${assessment.id}`}
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border bg-card p-3 shadow-xs transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50",
        finished && "text-muted-foreground shadow-none",
      )}
    >
      <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <time
          dateTime={slot.startsAt.toISOString()}
          className={cn("font-bold tabular-nums", !finished && "text-foreground")}
        >
          {formatSlotTime(slot.startsAt)}
        </time>
        {finished && <AssessmentStatusBadge status={assessment.status} />}
      </span>
      <span className="flex items-center gap-2.5">
        <DogTag name={assessment.dog.name} size="sm" className={cn(finished && "opacity-60")} />
        <span className="min-w-0">
          <span className={cn("block truncate font-bold", !finished && "text-foreground")}>{assessment.dog.name}</span>
          <span className="block text-xs">{TRAINING_GOAL_LABELS[assessment.trainingGoal]}</span>
        </span>
      </span>
    </Link>
  );
}

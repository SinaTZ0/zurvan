import { cn } from "cn";

import { DogTag } from "~/components/dog-tag";
import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { formatSlotTime } from "~/lib/tehran-time";
import { SESSION_STATUS_LABELS } from "~/orpc/enrollment/constants";
import type { TrainerSession } from "~/orpc/enrollment/contract";

/*===== Session Block =====*/
/**
 * A training session on the week: the dog's engraved tag and name, the course and «جلسه‌ی ۳ از ۷», linking to the
 * enrollment. Set apart from an assessment block by the course line, not by colour. A recorded one is muted and says
 * how it went.
 */
export function SessionBlock({ session }: { session: TrainerSession }) {
  const recorded = session.status === "held" || session.status === "missed";

  return (
    <Link
      to={`/trainer/enrollments/${session.enrollmentId}`}
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border bg-card p-3 shadow-xs transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50",
        recorded && "text-muted-foreground shadow-none",
      )}
    >
      <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <time
          dateTime={session.startsAt.toISOString()}
          className={cn("font-bold tabular-nums", !recorded && "text-foreground")}
        >
          {formatSlotTime(session.startsAt)}
        </time>
        {recorded && <span className="text-xs">{SESSION_STATUS_LABELS[session.status]}</span>}
      </span>
      <span className="flex items-center gap-2.5">
        <DogTag name={session.dog.name} size="sm" className={cn(recorded && "opacity-60")} />
        <span className="min-w-0">
          <span className={cn("block truncate font-bold", !recorded && "text-foreground")}>{session.dog.name}</span>
          <span className="block truncate text-xs">{session.courseTitle}</span>
          <span className="block text-xs tabular-nums">
            جلسه‌ی {formatNumberFa(session.position)} از {formatNumberFa(session.plannedSessions)}
          </span>
        </span>
      </span>
    </Link>
  );
}

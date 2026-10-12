import { ChevronRightIcon } from "lucide-react";

import { BehaviorStatusBadge } from "~/components/behavior-status-badge";
import { Link } from "~/components/link";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import { BEHAVIOR_PROBLEM_CATEGORY_LABELS } from "~/orpc/behavior-request/constants";
import type { TrainerBehaviorRequest } from "~/orpc/behavior-request/contract";

/*===== Request Header =====*/
/** The way back, the dog's name (the page's one Amiri line), the status, the problem and when it was sent. */
export function RequestHeader({ behaviorRequest }: { behaviorRequest: TrainerBehaviorRequest }) {
  const { dog, status, problemCategory, createdAt } = behaviorRequest;

  return (
    <header className="flex flex-col gap-6">
      <Link
        to="/trainer/behavior-requests"
        className="inline-flex w-fit items-center gap-1 rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        <ChevronRightIcon aria-hidden className="size-4" />
        درخواست‌ها
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display text-4xl leading-tight font-bold text-balance lg:text-5xl">{dog.name}</h1>
          <BehaviorStatusBadge status={status} />
        </div>
        <p className="mt-3 text-pretty text-muted-foreground">
          {BEHAVIOR_PROBLEM_CATEGORY_LABELS[problemCategory]}،{" "}
          <span>
            فرستاده‌شده {formatSlotDay(createdAt)}،{" "}
            <time dateTime={createdAt.toISOString()} className="font-bold text-foreground tabular-nums">
              {formatSlotTime(createdAt)}
            </time>
          </span>
        </p>
      </div>
    </header>
  );
}

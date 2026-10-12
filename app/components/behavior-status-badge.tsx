import { cn } from "cn";

import { BEHAVIOR_REQUEST_STATUS_LABELS, type BehaviorRequestStatus } from "~/orpc/behavior-request/constants";

/*===== Tones =====*/
// The same language as the enrollment badge: gold for what is still going on, green only for a paid plan, and the
// endings that need nothing from the reader stay quiet. A declined request is plain, never red: red is for acting.
const TONES: Record<BehaviorRequestStatus, string> = {
  submitted: "border-primary/50 text-primary",
  proposed: "border-primary/50 bg-primary/10 text-primary",
  paid: "border-success/40 bg-success/10 text-success",
  declined: "border-border text-muted-foreground",
  withdrawn: "border-transparent bg-muted text-muted-foreground",
  expired: "border-transparent bg-muted text-muted-foreground",
};

/*===== Behavior Status Badge =====*/
/** A behavior request's status as a small pill with its Persian label. */
export function BehaviorStatusBadge({ status, className }: { status: BehaviorRequestStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap",
        TONES[status],
        className,
      )}
    >
      {BEHAVIOR_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

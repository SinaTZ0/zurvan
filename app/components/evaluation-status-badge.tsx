import { cn } from "cn";

import { EVALUATION_STATUS_LABELS, type EvaluationStatus } from "~/orpc/evaluation/constants";

/*===== Tones =====*/
// One look per status, shared by the customer's and the Admin's pages. Gold marks what is still to come, green what
// happened; the two endings that didn't happen stay quiet, since neither is an error the reader must act on.
const TONES: Record<EvaluationStatus, string> = {
  requested: "border-primary/50 text-primary",
  evaluated: "border-success/40 bg-success/10 text-success",
  rejected: "border-border text-muted-foreground",
  withdrawn: "border-transparent bg-muted text-muted-foreground",
};

/*===== Evaluation Status Badge =====*/
/** An evaluation's status as a small pill with its Persian label. */
export function EvaluationStatusBadge({ status, className }: { status: EvaluationStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap",
        TONES[status],
        className,
      )}
    >
      {EVALUATION_STATUS_LABELS[status]}
    </span>
  );
}

import { cn } from "cn";

import { ENROLLMENT_STATUS_LABELS, type EnrollmentStatus } from "~/orpc/enrollment/constants";

/*===== Tones =====*/
// One look per status, shared by the customer's and the Admin's pages, in the evaluation badge's language: gold for
// what is still going on, green for a finished course, and the ending that needs nothing from the reader stays quiet.
const TONES: Record<EnrollmentStatus, string> = {
  active: "border-primary/50 bg-primary/10 text-primary",
  completed: "border-success/40 bg-success/10 text-success",
  cancelled: "border-transparent bg-muted text-muted-foreground",
};

/*===== Enrollment Status Badge =====*/
/** An enrollment's status as a small pill with its Persian label. */
export function EnrollmentStatusBadge({ status, className }: { status: EnrollmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap",
        TONES[status],
        className,
      )}
    >
      {ENROLLMENT_STATUS_LABELS[status]}
    </span>
  );
}

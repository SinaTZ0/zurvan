import { cn } from "cn";

import { ENROLLMENT_STATUS_LABELS, type EnrollmentStatus } from "~/orpc/enrollment/constants";

/*===== Tones =====*/
// One look per status, shared by the customer's and the trainer's pages, in the assessment badge's language: gold for
// what is still going on, green for a pass, and the endings that need nothing from the reader stay quiet.
const TONES: Record<EnrollmentStatus, string> = {
  scheduling: "border-primary/50 text-primary",
  active: "border-primary/50 bg-primary/10 text-primary",
  passed: "border-success/40 bg-success/10 text-success",
  failed: "border-border text-muted-foreground",
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

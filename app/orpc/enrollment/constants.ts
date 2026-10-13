/*===== Enrollment Constants =====*/
// Browser-safe values shared by the API, the seed and the enrollment screens. Stored as plain text (see
// `app/db/schema.ts`). docs/app-spec.md, F6.

/*===== Status =====*/
// active → completed | cancelled. Both are final. A completed enrollment makes its course passed for the dog (F2).
export const ENROLLMENT_STATUSES = ["active", "completed", "cancelled"] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: "در حال آموزش",
  completed: "تمام شد",
  cancelled: "لغو شد",
};

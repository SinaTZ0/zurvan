import { m } from "~/paraglide/messages";

/*===== Enrollment Constants =====*/
// Browser-safe values shared by the API, the seed and the enrollment screens. Stored as plain text (see
// `app/db/schema.ts`). docs/app-spec.md, F6.
// Labels are getters over the messages (`messages/shared/`), read while rendering in the page's language; the Admin's
// pages are Persian only, so they read Persian.

/*===== Status =====*/
// active → completed | cancelled. Both are final. A completed enrollment makes its course passed for the dog (F2).
export const ENROLLMENT_STATUSES = ["active", "completed", "cancelled"] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  get active() {
    return m.shared_enrollment_status_active();
  },
  get completed() {
    return m.shared_enrollment_status_completed();
  },
  get cancelled() {
    return m.shared_enrollment_status_cancelled();
  },
};

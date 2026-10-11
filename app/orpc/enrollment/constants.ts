import type { EnrollmentRefundRule } from "~/lib/business-rules";

/*===== Enrollment Constants =====*/
// Browser-safe values shared by the API, the seed and the training screens. Stored as plain text (see
// `app/db/schema.ts`).

/*===== Kind =====*/
/** A course, or its test (spec 3.6): one session and a result. */
export const ENROLLMENT_KINDS = ["course", "test"] as const;

export type EnrollmentKind = (typeof ENROLLMENT_KINDS)[number];

/*===== Enrollment Status =====*/
// scheduling → active → passed | failed, and cancelled from either of the first two (spec 3.4).
export const ENROLLMENT_STATUSES = ["scheduling", "active", "passed", "failed", "cancelled"] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

/** The statuses in which a dog can't book the same course again. */
export const LIVE_ENROLLMENT_STATUSES = ["scheduling", "active"] as const satisfies readonly EnrollmentStatus[];

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  scheduling: "در انتظار زمان‌بندی",
  active: "در حال آموزش",
  passed: "قبول",
  failed: "مردود",
  cancelled: "لغو شد",
};

/** Who cancelled an enrollment, which decides the refund rule (docs/business-logic.md, B11). */
export const CANCELLED_BY_ROLES = ["customer", "trainer", "admin"] as const;

export type CancelledByRole = (typeof CANCELLED_BY_ROLES)[number];

/*===== Session Status =====*/
export const SESSION_STATUSES = ["scheduled", "held", "missed", "cancelled"] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

/** Held and missed sessions are both used up: refunds count them as held (B11). */
export const USED_SESSION_STATUSES = ["held", "missed"] as const satisfies readonly SessionStatus[];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "زمان‌بندی شده",
  held: "برگزار شد",
  missed: "از دست رفت",
  cancelled: "لغو شد",
};

/*===== Session Place =====*/
export const SESSION_PLACE_KINDS = ["home", "outside", "boarding"] as const;

export type SessionPlaceKind = (typeof SESSION_PLACE_KINDS)[number];

export const SESSION_PLACE_KIND_LABELS: Record<SessionPlaceKind, string> = {
  home: "خانه‌ی صاحب سگ",
  outside: "بیرون",
  boarding: "پانسیون",
};

/*===== Limits =====*/
export const SESSION_DEFAULT_DURATION_MINUTES = 60;

/** Also enforced by a check constraint on `training_session`. */
export const SESSION_MIN_DURATION_MINUTES = 15;
export const SESSION_MAX_DURATION_MINUTES = 480;

/** Also enforced by a check constraint on `enrollment`. */
export const MAX_PLANNED_SESSIONS = 100;

export const SESSION_PLACE_MAX_LENGTH = 300;
export const SESSION_NOTE_MAX_LENGTH = 2000;
export const ENROLLMENT_NOTE_MAX_LENGTH = 2000;
export const ENROLLMENT_REASON_MAX_LENGTH = 300;

/*===== Result =====*/
/** What a trainer records when a course or test ends: the enrollment becomes `passed` or `failed`. */
export const ENROLLMENT_RESULTS = ["passed", "failed"] as const satisfies readonly EnrollmentStatus[];

export type EnrollmentResult = (typeof ENROLLMENT_RESULTS)[number];

/** What a trainer records for a session whose time has come. */
export const SESSION_OUTCOMES = ["held", "missed"] as const satisfies readonly SessionStatus[];

export type SessionOutcome = (typeof SESSION_OUTCOMES)[number];

/*===== Refund Rules =====*/
/** The rules `calculateEnrollmentRefund` can answer with, for the preview on a live enrollment. */
export const ENROLLMENT_REFUND_RULES = [
  "before-first-session",
  "policy",
  "staff",
  "test-before-cutoff",
  "test-after-cutoff",
] as const satisfies readonly EnrollmentRefundRule[];

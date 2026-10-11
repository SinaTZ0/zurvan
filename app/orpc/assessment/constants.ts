/*===== Assessment Constants =====*/
// Browser-safe values shared by the API, the seed and the assessment screens. Stored as plain text (see
// `app/db/schema.ts`).

/*===== Slot Status =====*/
export const ASSESSMENT_SLOT_STATUSES = ["open", "booked", "closed"] as const;

export type AssessmentSlotStatus = (typeof ASSESSMENT_SLOT_STATUSES)[number];

/*===== Assessment Status =====*/
export const ASSESSMENT_STATUSES = ["booked", "completed", "no-show", "cancelled"] as const;

export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  booked: "رزرو شده",
  completed: "انجام شد",
  "no-show": "حاضر نشد",
  cancelled: "لغو شد",
};

/*===== Training Goal =====*/
export const TRAINING_GOALS = ["home", "sport", "work"] as const;

export type TrainingGoal = (typeof TRAINING_GOALS)[number];

export const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  home: "سگ خانواده",
  sport: "ورزشی",
  work: "کار",
};

/*===== Meeting Place =====*/
export const MEETING_PLACE_KINDS = ["home", "meeting-point"] as const;

export type MeetingPlaceKind = (typeof MEETING_PLACE_KINDS)[number];

export const MEETING_PLACE_KIND_LABELS: Record<MeetingPlaceKind, string> = {
  home: "خانه‌ی من",
  "meeting-point": "یک جای دیگر",
};

/*===== Slots =====*/
export const ASSESSMENT_DEFAULT_DURATION_MINUTES = 60;

/** Also enforced by a check constraint on `assessment_slot`. */
export const ASSESSMENT_MIN_DURATION_MINUTES = 15;
export const ASSESSMENT_MAX_DURATION_MINUTES = 240;

/** How far ahead open slots are listed to customers. */
export const ASSESSMENT_BOOKING_WINDOW_DAYS = 28;

/** Times a trainer can open in one request. */
export const MAX_SLOTS_PER_OPEN = 60;

/** The longest range of the trainer's schedule one request reads. */
export const MAX_SCHEDULE_RANGE_DAYS = 62;

/*===== Recommendations =====*/
// The owner's standing recommendations (docs/business-logic.md, B16). The site never states them as rules; they only
// pre-fill the trainer's list.
export const CGC_COURSE_SLUG = "cgc";
export const BMC_COURSE_SLUG = "bmc";

// TODO(business-logic): B16. "Will be 6-7 months old soon" is read as: at least this many months short of BMC's
// minimum age, and under its maximum age, on the day of the assessment.
export const BMC_SOON_MONTHS = 2;

export const MAX_RECOMMENDED_COURSES = 8;

/*===== Limits =====*/
export const ASSESSMENT_CUSTOMER_NOTE_MAX_LENGTH = 1000;
export const ASSESSMENT_PLACE_MAX_LENGTH = 300;
export const ASSESSMENT_TRAINER_NOTES_MAX_LENGTH = 2000;
export const ASSESSMENT_REASON_MAX_LENGTH = 300;

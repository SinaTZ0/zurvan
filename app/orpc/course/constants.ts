/*===== Course Constants =====*/
// Browser-safe values shared by the API, the seed and the storefront. Stored as plain text (see `app/db/schema.ts`).

/** The catalogue's families (spec 3.1). */
export const COURSE_FAMILIES = [
  "basics",
  "obedience",
  "companion",
  "six-month",
  "working",
  "sport",
  "behavior",
] as const;

export type CourseFamily = (typeof COURSE_FAMILIES)[number];

/** Behavior modification starts from a request with a video, every other course from booking. */
export const COURSE_BOOKING_KINDS = ["standard", "behavior-request"] as const;

export type CourseBookingKind = (typeof COURSE_BOOKING_KINDS)[number];

/** Only `approved` courses are public. The rest belong to the approval workflow (spec 3.2). */
export const COURSE_STATUSES = [
  "draft",
  "pending-approval",
  "awaiting-trainer-confirmation",
  "rejected",
  "approved",
  "archived",
] as const;

export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_PLACES = ["home", "outside", "mostly-outside"] as const;

export type CoursePlace = (typeof COURSE_PLACES)[number];

/** As the owner's cards say it. */
export const COURSE_PLACE_LABELS: Record<CoursePlace, string> = {
  home: "منزل",
  outside: "بیرون",
  "mostly-outside": "اکثراً بیرون",
};

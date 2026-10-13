/*===== Course Constants =====*/
// Browser-safe values shared by the API, the seed and the storefront. Stored as plain text (see `app/db/schema.ts`).

/** The catalogue's families (docs/zurvan-courses.md). */
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

/** Only `approved` courses are on sale; `archived` ones can't be bought but their enrollments continue (F8). */
export const COURSE_STATUSES = ["draft", "approved", "archived"] as const;

export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_PLACES = ["home", "outside", "mostly-outside"] as const;

export type CoursePlace = (typeof COURSE_PLACES)[number];

/** As the owner's cards say it. */
export const COURSE_PLACE_LABELS: Record<CoursePlace, string> = {
  home: "منزل",
  outside: "بیرون",
  "mostly-outside": "اکثراً بیرون",
};

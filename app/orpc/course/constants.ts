import { m } from "~/paraglide/messages";

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

/** The families the Admin can pick: `behavior` is dropped in app-spec. */
export const SELLABLE_COURSE_FAMILIES = COURSE_FAMILIES.filter((family) => family !== "behavior") as [
  Exclude<CourseFamily, "behavior">,
  ...Exclude<CourseFamily, "behavior">[],
];

/** Only `approved` courses are on sale; `archived` ones can't be bought but their enrollments continue (F8). */
export const COURSE_STATUSES = ["draft", "approved", "archived"] as const;

export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_PLACES = ["home", "outside", "mostly-outside"] as const;

export type CoursePlace = (typeof COURSE_PLACES)[number];

/** As the owner's cards say it, in the page's language (messages read through getters, so read them while rendering). */
export const COURSE_PLACE_LABELS: Readonly<Record<CoursePlace, string>> = {
  get home() {
    return m.shared_place_home();
  },
  get outside() {
    return m.shared_place_outside();
  },
  get "mostly-outside"() {
    return m.shared_place_mostly_outside();
  },
};

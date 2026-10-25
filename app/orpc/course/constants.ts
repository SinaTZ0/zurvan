import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

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

/**
 * Where a course can be taught, in the order every page lists them. The Admin ticks the ones each course offers and the
 * customer picks one in the cart; none ticked means it is settled after the evaluation. Only boarding costs extra, and
 * that is settled on the phone, never in the cart (app-spec F8, F5).
 */
export const COURSE_PLACES = ["home", "center", "outside", "boarding"] as const;

export type CoursePlace = (typeof COURSE_PLACES)[number];

const PLACE_MESSAGES = {
  home: m.shared_place_home,
  center: m.shared_place_center,
  outside: m.shared_place_outside,
  boarding: m.shared_place_boarding,
} as const satisfies Record<CoursePlace, unknown>;

/** A place as the owner says it: in `locale` when given (an SMS is Persian), else in the page's language. */
export function coursePlaceLabel({ place, locale }: { place: CoursePlace; locale?: Locale }): string {
  return PLACE_MESSAGES[place]({}, locale ? { locale } : {});
}

/** The same, by key, in the page's language (getters, so read them while rendering). */
export const COURSE_PLACE_LABELS: Readonly<Record<CoursePlace, string>> = {
  get home() {
    return coursePlaceLabel({ place: "home" });
  },
  get center() {
    return coursePlaceLabel({ place: "center" });
  },
  get outside() {
    return coursePlaceLabel({ place: "outside" });
  },
  get boarding() {
    return coursePlaceLabel({ place: "boarding" });
  },
};

/** Whether a stored or sent value is one of {@link COURSE_PLACES}. */
export function isCoursePlace(value: unknown): value is CoursePlace {
  return typeof value === "string" && (COURSE_PLACES as readonly string[]).includes(value);
}

/** Keeps the known places, once each, in {@link COURSE_PLACES} order, so a stray or repeated value never reaches a page. */
export function normalizeCoursePlaces(values: readonly unknown[]): CoursePlace[] {
  return COURSE_PLACES.filter((place) => values.includes(place));
}

/**
 * The place an item of the cart is bought with: the customer's pick when the course still offers it, the only place
 * when the course offers one, and otherwise none. A course that offers no place asks for none (it is settled after the
 * evaluation); one that offers several and has no valid pick needs the customer to choose before paying.
 */
export function resolveCoursePlace({
  offered,
  picked,
}: {
  offered: readonly CoursePlace[];
  picked: CoursePlace | null | undefined;
}): CoursePlace | null {
  if (picked && offered.includes(picked)) return picked;
  const [only] = offered;
  return offered.length === 1 && only ? only : null;
}

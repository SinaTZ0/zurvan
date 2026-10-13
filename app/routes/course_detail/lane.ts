import type { Course } from "~/orpc/course/contract";

/*===== Lane =====*/
// The courses taken one after another with this one, as the home page's course map lays them out: obedience
// (Elementary → Advanced) and companion (1 → 4) are lanes, and so are their two families as a pair of equal paths.
// The two basics and BMC stand alone. Working dogs, sport dogs and behavior modification have no ages yet, so no lane.

/** Just what the path section draws for each course in the lane. */
export type LaneCourse = Pick<Course, "slug" | "title" | "minAgeMonths" | "maxAgeMonths" | "sessionCount" | "place">;

export type CourseLane = {
  courses: LaneCourse[];
  /** The course after this one in its lane. */
  next: LaneCourse | null;
  /** The other lane that ends in the same place (spec 3.1), by its first course. */
  equalPath: { first: LaneCourse; count: number } | null;
};

const LANE_FAMILIES = new Set<Course["family"]>(["obedience", "companion"]);
const EQUAL_PATHS: Partial<Record<Course["family"], Course["family"]>> = {
  obedience: "companion",
  companion: "obedience",
};

function toLaneCourse({ slug, title, minAgeMonths, maxAgeMonths, sessionCount, place }: Course): LaneCourse {
  return { slug, title, minAgeMonths, maxAgeMonths, sessionCount, place };
}

/** The course's lane, or `null` when the course has no age to place it on the ruler. */
export function getLane({ course, catalogue }: { course: Course; catalogue: Course[] }): CourseLane | null {
  if (course.minAgeMonths === null) return null;

  // The catalogue is already in its order, which is also the order a lane is taken in.
  const family = (name: Course["family"]) => catalogue.filter((entry) => entry.family === name).map(toLaneCourse);

  const courses = LANE_FAMILIES.has(course.family) ? family(course.family) : [toLaneCourse(course)];
  const index = courses.findIndex((entry) => entry.slug === course.slug);
  const otherFamily = EQUAL_PATHS[course.family];
  const other = otherFamily ? family(otherFamily) : [];

  return {
    courses,
    next: courses[index + 1] ?? null,
    equalPath: other[0] ? { first: other[0], count: other.length } : null,
  };
}

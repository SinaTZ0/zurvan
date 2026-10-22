import type { MascotCutName } from "~/components/mascot-cut";
import type { CourseFamily } from "~/orpc/course/constants";
import { m } from "~/paraglide/messages";

/*===== Course Mascot =====*/
// Which of the mascot's eight course poses (image-reference/generated/courses/courses-8.png) stands for a course, for
// the catalogue's cards and Course Detail. The seeded courses each have a pose picked for what they teach; the Admin
// can create courses, so a slug nobody planned for falls back to its family's pose, and anything else to the default.
export type CourseMascotPose = Extract<MascotCutName, `course-${string}`>;

const BY_SLUG: Record<string, CourseMascotPose> = {
  "house-manner": "course-home",
  cgc: "course-manners",
  bmc: "course-young",
  elementary: "course-basics",
  advanced: "course-recall",
  "companion-1": "course-companion",
  "companion-2": "course-companion",
  "companion-3": "course-companion",
  "companion-4": "course-companion",
  "working-dogs": "course-working",
  sport: "course-sport",
};

const BY_FAMILY: Partial<Record<CourseFamily, CourseMascotPose>> = {
  basics: "course-manners",
  "six-month": "course-young",
  obedience: "course-basics",
  companion: "course-companion",
  working: "course-working",
  sport: "course-sport",
};

/** The polite sit with a paw offered: friendly for any course. */
const DEFAULT_POSE: CourseMascotPose = "course-manners";

/** The mascot pose for a course: by its slug, else by its family, else the default. Always returns a pose. */
export function courseMascotPose({ slug, family }: { slug: string; family: CourseFamily }): CourseMascotPose {
  return BY_SLUG[slug] ?? BY_FAMILY[family] ?? DEFAULT_POSE;
}

/** The pose that heads a family's group in the catalogue: one dog per family, so none repeats on the page. */
export function familyMascotPose(family: CourseFamily): CourseMascotPose {
  return BY_FAMILY[family] ?? DEFAULT_POSE;
}

/*===== Pose Lines =====*/
// What the dog says beside his pose on Course Detail. A line belongs to the pose, not the course, so a course the
// Admin adds later still gets one with its fallback pose. The lines describe what he is doing in the picture and how
// he feels; they never promise what the course will achieve.
// Messages (`messages/shared/`), so a line is read in the page's language when it is asked for.
const POSE_LINES: Record<CourseMascotPose, () => string> = {
  "course-home": m.shared_course_mascot_home,
  "course-manners": m.shared_course_mascot_manners,
  "course-young": m.shared_course_mascot_young,
  "course-basics": m.shared_course_mascot_basics,
  "course-recall": m.shared_course_mascot_recall,
  "course-companion": m.shared_course_mascot_companion,
  "course-working": m.shared_course_mascot_working,
  "course-sport": m.shared_course_mascot_sport,
}

/** The mascot's speech-bubble line for a pose. */
export function courseMascotLine(pose: CourseMascotPose): string {
  return POSE_LINES[pose]();
}

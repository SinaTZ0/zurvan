import type { Course } from "~/orpc/course/contract";

/*===== Next Step =====*/
// What the page asks the visitor to do, which depends on the course (storefront-design "Actions"). The hero, the closing
// section and the phone bar all show the same pair, so they can't drift apart.

export type CourseAction = { label: string; to: string };

export type CourseActions = {
  main: CourseAction;
  /** Always null until «افزودن به سبد» exists (F5): the course can't be bought from this page yet. */
  alternative: CourseAction | null;
  testOnly: CourseAction | null;
};

/** Every course asks for the free evaluation first (F3). Buying from this page returns with the page's rebuild. */
export function getCourseActions(_course: Pick<Course, "slug" | "price">): CourseActions {
  return { main: { label: "ارزیابی رایگان رزرو کن", to: "/assessment" }, alternative: null, testOnly: null };
}

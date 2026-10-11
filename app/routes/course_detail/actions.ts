import type { CourseDetail } from "~/orpc/course/contract";

/*===== Next Step =====*/
// What the page asks the visitor to do, which depends on the course (storefront-design "Actions"). The hero, the closing
// section and the phone bar all show the same pair, so they can't drift apart.

export type CourseAction = { label: string; to: string };

export type CourseActions = {
  main: CourseAction;
  /** The quieter alternative, for a dog that already has a record here. */
  alternative: CourseAction | null;
  /** The test instead of the course, for a course that has one; quieter still than the alternative. */
  testOnly: CourseAction | null;
};

/**
 * - Behavior modification starts from a request with a video, so that is its only action.
 * - Working and sport dogs have no list price yet; they can only start from the assessment.
 * - Every other course: a new dog books the free assessment, a dog with a record books the course directly from
 *   its booking page. A course with a test price also offers the test alone (a test needs no record, so it is how a
 *   dog trained elsewhere joins midway).
 *
 * The phone bar shows only `main`, so a third ask never crowds it; the hero and the closing section show all three.
 */
export function getCourseActions(
  course: Pick<CourseDetail, "slug" | "bookingKind" | "price" | "testPrice">,
): CourseActions {
  if (course.bookingKind === "behavior-request") {
    return {
      main: { label: "درخواست اصلاح رفتار", to: "/behavior-modification" },
      alternative: null,
      testOnly: null,
    };
  }
  const assessment = { label: "ارزیابی رایگان رزرو کن", to: "/assessment" };
  if (course.price === null) return { main: assessment, alternative: null, testOnly: null };
  const bookingPath = `/account/book/${course.slug}`;
  return {
    main: assessment,
    alternative: { label: "سگت پرونده دارد؟ مستقیم رزرو کن", to: bookingPath },
    testOnly: course.testPrice === null ? null : { label: "فقط تست", to: `${bookingPath}?kind=test` },
  };
}

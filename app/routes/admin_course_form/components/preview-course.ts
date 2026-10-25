import { normalizeCoursePlaces, SELLABLE_COURSE_FAMILIES } from "~/orpc/course/constants";
import type { AdminCourse, Course } from "~/orpc/course/contract";
import { type CourseFormInput, parseWholeNumber, splitLines } from "~/routes/admin_course_form/schema";

/*===== Constants =====*/
// A dark 3:2 stand-in while a new course has no photo, so the card's frame keeps its shape.
const EMPTY_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540'%3E%3Crect width='960' height='540' fill='%23161616'/%3E%3C/svg%3E";
const RIAL_PER_TOMAN = 10;

/*===== Preview Course =====*/
/**
 * The `Course` the public pages would get if the form were saved now, built leniently from what is typed: a field that
 * isn't valid yet just shows as empty (the card's own placeholders), because the preview never judges and never writes.
 */
export function buildPreviewCourse({
  values,
  course,
  coverSrc,
  titles,
}: {
  values: Partial<CourseFormInput>;
  /** The course being edited, for the parts the form doesn't change (its address). */
  course: AdminCourse | null;
  /** The uploaded photo's address, else the saved cover's. */
  coverSrc: string | null;
  /** Title per slug, to name the prerequisites ticked. */
  titles: ReadonlyMap<string, string>;
}): Course {
  const price = parseWholeNumber(values.price ?? "");
  const family = SELLABLE_COURSE_FAMILIES.find((candidate) => candidate === values.family);
  const places = normalizeCoursePlaces(values.places ?? []);
  const recommendedPlace = places.find((candidate) => candidate === values.recommendedPlace) ?? null;

  return {
    slug: course?.slug ?? (values.slug?.trim() || "slug"),
    title: values.title?.trim() || "نام دوره",
    latinName: values.latinName?.trim() ?? "",
    family: family ?? "basics",
    summary: values.summary?.trim() ?? "",
    highlights: splitLines(values.highlights ?? ""),
    commands: splitLines(values.commands ?? ""),
    cover: { src: coverSrc ?? EMPTY_COVER, alt: values.coverAlt?.trim() ?? "", width: 960, height: 540 },
    minAgeMonths: parseWholeNumber(values.minAgeMonths ?? ""),
    maxAgeMonths: parseWholeNumber(values.maxAgeMonths ?? ""),
    sessionCount: parseWholeNumber(values.sessionCount ?? ""),
    places,
    recommendedPlace,
    price: price === null ? null : price * RIAL_PER_TOMAN,
    prerequisites: (values.prerequisites ?? []).flatMap((slug) => {
      const title = titles.get(slug);
      return title ? [{ slug, title }] : [];
    }),
    // The preview is the Persian card; the other title only feeds search.
    otherTitle: null,
  };
}

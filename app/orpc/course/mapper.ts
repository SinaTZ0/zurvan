import { COURSE_BOOKING_KINDS, COURSE_FAMILIES, COURSE_PLACES } from "~/orpc/course/constants";
import type { CourseBookingKind, CourseFamily, CoursePlace } from "~/orpc/course/constants";
import type { Course, CourseDetail } from "~/orpc/course/contract";
import type { CourseRecord, PrerequisiteRecord, RefundPolicyRecord } from "~/orpc/course/repository";

/*===== Public Course =====*/
/**
 * Converts a stored course into its public shape: groups the cover columns, attaches its prerequisites, and narrows
 * `family`, `bookingKind` and `place`, which are plain text in the database.
 */
export function toPublicCourse({
  record,
  prerequisites,
}: {
  record: CourseRecord;
  prerequisites: PrerequisiteRecord[];
}): Course {
  return {
    slug: record.slug,
    title: record.title,
    latinName: record.latinName,
    // A family or booking kind removed from the lists later falls back to the most generic value instead of failing
    // output validation and taking the whole catalogue down.
    family: isCourseFamily(record.family) ? record.family : "basics",
    bookingKind: isCourseBookingKind(record.bookingKind) ? record.bookingKind : "standard",
    summary: record.summary,
    highlights: record.highlights,
    commands: record.commands,
    cover: {
      src: record.coverImage,
      alt: record.coverAlt,
      width: record.coverWidth,
      height: record.coverHeight,
    },
    minAgeMonths: record.minAgeMonths,
    maxAgeMonths: record.maxAgeMonths,
    sessionCount: record.sessionCount,
    // An unknown place reads the same as "decided after the assessment".
    place: isCoursePlace(record.place) ? record.place : null,
    price: record.price,
    boardingPrice: record.boardingPrice,
    testPrice: record.testPrice,
    prerequisites: prerequisites.map(({ slug, title, hasTest }) => ({ slug, title, hasTest })),
  };
}

/*===== Public Course Detail =====*/
/** Same as {@link toPublicCourse}, plus the refund policy shown on the course page. */
export function toPublicCourseDetail({
  record,
  refundPolicy,
  prerequisites,
}: {
  record: CourseRecord;
  refundPolicy: RefundPolicyRecord;
  prerequisites: PrerequisiteRecord[];
}): CourseDetail {
  return {
    ...toPublicCourse({ record, prerequisites }),
    refundPolicy: {
      name: refundPolicy.name,
      description: refundPolicy.customerDescription,
      unheldRefundPercent: refundPolicy.unheldRefundPercent,
    },
  };
}

/*===== Type Guards =====*/
function isCourseFamily(value: string): value is CourseFamily {
  return (COURSE_FAMILIES as readonly string[]).includes(value);
}

function isCourseBookingKind(value: string): value is CourseBookingKind {
  return (COURSE_BOOKING_KINDS as readonly string[]).includes(value);
}

function isCoursePlace(value: string | null): value is CoursePlace {
  return value !== null && (COURSE_PLACES as readonly string[]).includes(value);
}

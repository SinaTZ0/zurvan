import { COURSE_FAMILIES, COURSE_PLACES, COURSE_STATUSES } from "~/orpc/course/constants";
import type { CourseFamily, CoursePlace, CourseStatus } from "~/orpc/course/constants";
import type { AdminCourse, Course } from "~/orpc/course/contract";
import type {
  CourseRecord,
  EnrollmentCountRecord,
  PrerequisiteRecord,
  RequiredByRecord,
} from "~/orpc/course/repository";

/*===== Public Course =====*/
/**
 * Converts a stored course into its public shape: groups the cover columns, attaches its prerequisites, and narrows
 * `family` and `place`, which are plain text in the database.
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
    // A family removed from the list later falls back to the most generic value instead of failing output validation
    // and taking the whole catalogue down.
    family: isCourseFamily(record.family) ? record.family : "basics",
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
    // An unknown place reads the same as "decided after the evaluation".
    place: isCoursePlace(record.place) ? record.place : null,
    price: record.price,
    boardingPrice: record.boardingPrice,
    prerequisites: prerequisites.map(({ slug, title }) => ({ slug, title })),
  };
}

/*===== Admin Course =====*/
/**
 * The public shape plus what only the Admin needs: status, catalogue position, enrollment counts and the courses that
 * need this one. A course nobody enrolled in has no count row, which reads as zero.
 */
export function toAdminCourse({
  record,
  prerequisites,
  counts,
  requiredBy,
}: {
  record: CourseRecord;
  prerequisites: PrerequisiteRecord[];
  counts: EnrollmentCountRecord | undefined;
  requiredBy: RequiredByRecord[];
}): AdminCourse {
  return {
    ...toPublicCourse({ record, prerequisites }),
    // An unknown stored status reads as a draft: not on sale, and the Admin can still open and fix it.
    status: isCourseStatus(record.status) ? record.status : "draft",
    position: record.position,
    activeEnrollmentCount: counts?.active ?? 0,
    enrollmentCount: counts?.total ?? 0,
    requiredBy: requiredBy.map(({ slug, title, status }) => ({
      slug,
      title,
      status: isCourseStatus(status) ? status : "draft",
    })),
  };
}

/*===== Type Guards =====*/
function isCourseStatus(value: string): value is CourseStatus {
  return (COURSE_STATUSES as readonly string[]).includes(value);
}

function isCourseFamily(value: string): value is CourseFamily {
  return (COURSE_FAMILIES as readonly string[]).includes(value);
}

function isCoursePlace(value: string | null): value is CoursePlace {
  return value !== null && (COURSE_PLACES as readonly string[]).includes(value);
}

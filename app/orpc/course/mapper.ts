import { COURSE_FAMILIES, COURSE_STATUSES, isCoursePlace, normalizeCoursePlaces } from "~/orpc/course/constants";
import type { CourseFamily, CoursePlace, CourseStatus } from "~/orpc/course/constants";
import type { AdminCourse, Course } from "~/orpc/course/contract";
import type { Locale } from "~/paraglide/runtime";
import type {
  CourseRecord,
  EnrollmentCountRecord,
  PrerequisiteRecord,
  RequiredByRecord,
} from "~/orpc/course/repository";

/*===== Language =====*/
// docs/i18n/english-version-plan.md, step 9: a course's text in the page's language, with the Persian as the fallback
// for every part the Admin hasn't written in English yet. An empty English list counts as unwritten too.

/** The English value when the page is English and it is written, else the Persian one. */
function inLocale<Value extends string | string[]>({
  locale,
  fa,
  en,
}: {
  locale: Locale;
  fa: Value;
  en: Value | null;
}): Value {
  if (locale !== "en" || en === null) return fa;
  return (Array.isArray(en) ? en.length > 0 : en.trim() !== "") ? en : fa;
}

/** A course's name in the page's language, for the places that list a stored course (the cart). */
export function courseTitle({ locale, course }: { locale: Locale; course: Pick<CourseRecord, "title" | "titleEn"> }) {
  return inLocale({ locale, fa: course.title, en: course.titleEn });
}

/** A required course's name in the page's language. */
export function prerequisiteTitle({ locale, prerequisite }: { locale: Locale; prerequisite: PrerequisiteRecord }) {
  return inLocale({ locale, fa: prerequisite.title, en: prerequisite.titleEn });
}

/*===== Places =====*/
/**
 * Where a stored course can be taught and the place the Admin recommends. Plain text in the database: an unknown value
 * is dropped, and a recommendation the course no longer offers reads as none.
 */
export function coursePlaces(record: Pick<CourseRecord, "places" | "recommendedPlace">): {
  places: CoursePlace[];
  recommendedPlace: CoursePlace | null;
} {
  const places = normalizeCoursePlaces(record.places);
  const recommended = record.recommendedPlace;
  return {
    places,
    recommendedPlace: isCoursePlace(recommended) && places.includes(recommended) ? recommended : null,
  };
}

/*===== Public Course =====*/
/**
 * Converts a stored course into its public shape in `locale`: picks each text in that language (Persian where the
 * English is missing), groups the cover columns, attaches its prerequisites, and narrows `family` and the places, which
 * are plain text in the database.
 */
export function toPublicCourse({
  record,
  prerequisites,
  locale,
}: {
  record: CourseRecord;
  prerequisites: PrerequisiteRecord[];
  locale: Locale;
}): Course {
  const title = inLocale({ locale, fa: record.title, en: record.titleEn });
  const otherTitle = locale === "en" ? record.title : record.titleEn;

  return {
    slug: record.slug,
    title,
    latinName: record.latinName,
    // A family removed from the list later falls back to the most generic value instead of failing output validation
    // and taking the whole catalogue down.
    family: isCourseFamily(record.family) ? record.family : "basics",
    summary: inLocale({ locale, fa: record.summary, en: record.summaryEn }),
    highlights: inLocale({ locale, fa: record.highlights, en: record.highlightsEn }),
    commands: inLocale({ locale, fa: record.commands, en: record.commandsEn }),
    cover: {
      src: record.coverImage,
      alt: inLocale({ locale, fa: record.coverAlt, en: record.coverAltEn }),
      width: record.coverWidth,
      height: record.coverHeight,
    },
    minAgeMonths: record.minAgeMonths,
    maxAgeMonths: record.maxAgeMonths,
    sessionCount: record.sessionCount,
    ...coursePlaces(record),
    price: record.price,
    prerequisites: prerequisites.map((prerequisite) => ({
      slug: prerequisite.slug,
      title: prerequisiteTitle({ locale, prerequisite }),
    })),
    otherTitle: otherTitle && otherTitle !== title ? otherTitle : null,
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
    // The Admin's pages are Persian; the English text is passed as stored, for the course form.
    ...toPublicCourse({ record, prerequisites, locale: "fa" }),
    english: {
      title: record.titleEn,
      summary: record.summaryEn,
      highlights: record.highlightsEn,
      commands: record.commandsEn,
      coverAlt: record.coverAltEn,
    },
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

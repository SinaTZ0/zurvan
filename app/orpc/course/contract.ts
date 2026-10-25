import { oc } from "@orpc/contract";
import { z } from "zod";

import { COURSE_FAMILIES, COURSE_PLACES, COURSE_STATUSES, SELLABLE_COURSE_FAMILIES } from "~/orpc/course/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
export const courseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  latinName: z.string(),
  family: z.enum(COURSE_FAMILIES),
  summary: z.string(),
  highlights: z.array(z.string()),
  commands: z.array(z.string()),
  cover: z.object({ src: z.string(), alt: z.string(), width: z.number().int(), height: z.number().int() }),
  minAgeMonths: z.number().int().nullable(),
  maxAgeMonths: z.number().int().nullable(),
  sessionCount: z.number().int().nullable(),
  /** Where it can be taught, in `COURSE_PLACES` order; the customer picks one in the cart. Empty: after the evaluation. */
  places: z.array(z.enum(COURSE_PLACES)),
  /** One of `places`, marked by the Admin, or null. */
  recommendedPlace: z.enum(COURSE_PLACES).nullable(),
  /** Rial. Null when the course isn't sold online (F8). */
  price: z.number().int().nullable(),
  /** The courses a dog must have passed before buying this one (F4). */
  prerequisites: z.array(z.object({ slug: z.string(), title: z.string() })),
  /**
   * The title in the page's other language (Persian on `/en`, English on the Persian pages), or null when there is
   * none. For search only: a visitor finds a course by either name.
   */
  otherTitle: z.string().nullable(),
});

export type Course = z.infer<typeof courseSchema>;

/** A course's English text as stored: each part null until the Admin writes it (the English pages then show Persian). */
export const courseEnglishSchema = z.object({
  title: z.string().nullable(),
  summary: z.string().nullable(),
  highlights: z.array(z.string()).nullable(),
  commands: z.array(z.string()).nullable(),
  coverAlt: z.string().nullable(),
});

/**
 * A course as the Admin sees it: any status, its place in the catalogue and who uses it. The public fields are the
 * Persian ones (the Admin is Persian); the English text comes as stored in `english`.
 */
export const adminCourseSchema = courseSchema.extend({
  english: courseEnglishSchema,
  status: z.enum(COURSE_STATUSES),
  /** 1..n in catalogue order. */
  position: z.number().int(),
  /** Enrollments of this course that are still active, and how many were ever bought. */
  activeEnrollmentCount: z.number().int(),
  enrollmentCount: z.number().int(),
  /** Courses that list this one as a prerequisite, whatever their status. */
  requiredBy: z.array(z.object({ slug: z.string(), title: z.string(), status: z.enum(COURSE_STATUSES) })),
});

export type AdminCourse = z.infer<typeof adminCourseSchema>;

/**
 * What the Admin form sends, as typed (the server trims, drops blank lines and checks the limits). Money is Rial; a null
 * price means the course isn't sold online. `prerequisites` are slugs.
 */
export const courseInputSchema = z.strictObject({
  title: z.string(),
  latinName: z.string(),
  /** `behavior` is dropped (app-spec), so it can't be chosen. */
  family: z.enum(SELLABLE_COURSE_FAMILIES),
  summary: z.string(),
  highlights: z.array(z.string()),
  commands: z.array(z.string()),
  coverAlt: z.string(),
  minAgeMonths: z.number().int().nullable(),
  maxAgeMonths: z.number().int().nullable(),
  sessionCount: z.number().int().nullable(),
  places: z.array(z.enum(COURSE_PLACES)),
  recommendedPlace: z.enum(COURSE_PLACES).nullable(),
  price: z.number().int().nullable(),
  prerequisites: z.array(z.string()),
  // The English text (`/en`), all optional: blank is "not written yet", and an older client that sends none keeps
  // nothing (the update writes them as sent, so the form always sends all five).
  titleEn: z.string().optional(),
  summaryEn: z.string().optional(),
  highlightsEn: z.array(z.string()).optional(),
  commandsEn: z.array(z.string()).optional(),
  coverAltEn: z.string().optional(),
});

export type CourseInput = z.infer<typeof courseInputSchema>;

/*===== Errors =====*/
// Maps to HTTP 404 through oRPC's default status map.
const courseErrors = {
  NOT_FOUND: {
    message: "Course not found.",
    data: errorDataSchema,
  },
};

/*===== Procedures =====*/
export const listCoursesContract = oc.errors(commonErrors).output(z.array(courseSchema));

export const getCourseContract = oc
  .errors({ ...commonErrors, ...courseErrors })
  .input(z.strictObject({ slug: z.string() }))
  .output(courseSchema);

/*===== Admin Procedures =====*/
const adminErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/** Every course, any status, in catalogue order. */
export const adminListCoursesContract = oc.errors(adminErrors).output(z.array(adminCourseSchema));

export const adminGetCourseContract = oc
  .errors({ ...adminErrors, ...courseErrors })
  .input(z.strictObject({ slug: z.string() }))
  .output(adminCourseSchema);

/**
 * Appended at the end of the catalogue and on sale. Refusals are `INVALID_INPUT` with `fields.<name>` (`slug`, `title`,
 * `latinName`, `summary`, `highlights`, `commands`, `cover`, `coverAlt`, `minAgeMonths`, `maxAgeMonths`,
 * `sessionCount`, `places`, `recommendedPlace`, `price`, `prerequisites`). `coverMediaId` is a `course` image from `media.upload`.
 */
export const adminCreateCourseContract = oc
  .errors(adminErrors)
  .input(courseInputSchema.extend({ slug: z.string(), coverMediaId: z.string() }))
  .output(adminCourseSchema);

/** The slug never changes. No `coverMediaId` keeps the current cover. */
export const adminUpdateCourseContract = oc
  .errors({ ...adminErrors, ...courseErrors })
  .input(courseInputSchema.extend({ slug: z.string(), coverMediaId: z.string().optional() }))
  .output(adminCourseSchema);

/** Idempotent and reversible. Archiving touches nothing else: active enrollments continue (F8). */
export const adminSetCourseStatusContract = oc
  .errors({ ...adminErrors, ...courseErrors })
  .input(z.strictObject({ slug: z.string(), status: z.enum(["approved", "archived"]) }))
  .output(adminCourseSchema);

/** Swaps the course with its neighbour and renumbers positions 1..n; at either end it does nothing. Returns the list. */
export const adminMoveCourseContract = oc
  .errors({ ...adminErrors, ...courseErrors })
  .input(z.strictObject({ slug: z.string(), direction: z.enum(["up", "down"]) }))
  .output(z.array(adminCourseSchema));

export const courseContract = {
  list: listCoursesContract,
  get: getCourseContract,
  admin: {
    list: adminListCoursesContract,
    get: adminGetCourseContract,
    create: adminCreateCourseContract,
    update: adminUpdateCourseContract,
    setStatus: adminSetCourseStatusContract,
    move: adminMoveCourseContract,
  },
};

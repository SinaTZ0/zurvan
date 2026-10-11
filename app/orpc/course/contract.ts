import { oc } from "@orpc/contract";
import { z } from "zod";

import { COURSE_BOOKING_KINDS, COURSE_FAMILIES, COURSE_PLACES } from "~/orpc/course/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";

/*===== Schemas =====*/
export const courseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  latinName: z.string(),
  family: z.enum(COURSE_FAMILIES),
  bookingKind: z.enum(COURSE_BOOKING_KINDS),
  summary: z.string(),
  highlights: z.array(z.string()),
  commands: z.array(z.string()),
  cover: z.object({ src: z.string(), alt: z.string(), width: z.number().int(), height: z.number().int() }),
  minAgeMonths: z.number().int().nullable(),
  maxAgeMonths: z.number().int().nullable(),
  sessionCount: z.number().int().nullable(),
  place: z.enum(COURSE_PLACES).nullable(),
  /** Rial. Null when not sold at a list price. */
  price: z.number().int().nullable(),
  boardingPrice: z.number().int().nullable(),
  testPrice: z.number().int().nullable(),
  /** The courses this one requires; `hasTest` says whether passing that course's test also counts. */
  prerequisites: z.array(z.object({ slug: z.string(), title: z.string(), hasTest: z.boolean() })),
});

export const courseDetailSchema = courseSchema.extend({
  refundPolicy: z.object({ name: z.string(), description: z.string(), unheldRefundPercent: z.number().int() }),
});

export type Course = z.infer<typeof courseSchema>;
export type CourseDetail = z.infer<typeof courseDetailSchema>;

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
  .output(courseDetailSchema);

export const courseContract = {
  list: listCoursesContract,
  get: getCourseContract,
};

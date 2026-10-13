import { oc } from "@orpc/contract";
import { z } from "zod";

import { COURSE_FAMILIES, COURSE_PLACES } from "~/orpc/course/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";

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
  place: z.enum(COURSE_PLACES).nullable(),
  /** Rial. Null when the course isn't sold online (F8). */
  price: z.number().int().nullable(),
  /** Rial. Shown only: boarding isn't part of checkout. */
  boardingPrice: z.number().int().nullable(),
  /** The courses a dog must have passed before buying this one (F4). */
  prerequisites: z.array(z.object({ slug: z.string(), title: z.string() })),
});

export type Course = z.infer<typeof courseSchema>;

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

export const courseContract = {
  list: listCoursesContract,
  get: getCourseContract,
};

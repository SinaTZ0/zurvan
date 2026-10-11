import { getCourse, listCourses } from "~/orpc/course/service";
import { base } from "~/orpc/implementer.server";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";

/*===== List =====*/
export const listCoursesProcedure = base.course.list
  .use(provideDbMiddleware)
  .handler(({ context }) => listCourses({ db: context.db }));

/*===== Get =====*/
export const getCourseProcedure = base.course.get
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getCourse({ db: context.db, slug: input.slug });

    if (result.kind === "not-found") {
      throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    }

    return result.course;
  });

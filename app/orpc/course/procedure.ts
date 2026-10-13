import {
  adminCreateCourse,
  adminGetCourse,
  adminListCourses,
  adminMoveCourse,
  adminSetCourseStatus,
  adminUpdateCourse,
  getCourse,
  listCourses,
} from "~/orpc/course/service";
import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
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

/*===== Admin List =====*/
export const adminListCoursesProcedure = base.course.admin.list
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(({ context }) => adminListCourses({ db: context.db }));

/*===== Admin Get =====*/
export const adminGetCourseProcedure = base.course.admin.get
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminGetCourse({ db: context.db, slug: input.slug });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.course;
  });

/*===== Admin Create =====*/
export const adminCreateCourseProcedure = base.course.admin.create
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminCreateCourse({ db: context.db, userId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.course;
  });

/*===== Admin Update =====*/
export const adminUpdateCourseProcedure = base.course.admin.update
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminUpdateCourse({ db: context.db, userId: context.user.id, input });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.course;
  });

/*===== Admin Set Status =====*/
export const adminSetCourseStatusProcedure = base.course.admin.setStatus
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminSetCourseStatus({ db: context.db, slug: input.slug, status: input.status });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.course;
  });

/*===== Admin Move =====*/
export const adminMoveCourseProcedure = base.course.admin.move
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminMoveCourse({ db: context.db, slug: input.slug, direction: input.direction });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.courses;
  });

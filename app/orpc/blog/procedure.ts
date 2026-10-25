import {
  adminCreatePost,
  adminDeletePost,
  adminGetPost,
  adminListPosts,
  adminSetPostStatus,
  adminUpdatePost,
  getPost,
  listPosts,
} from "~/orpc/blog/service";
import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";

const NO_DATA = { data: { errors: [], fields: {} } };

/*===== List =====*/
export const listBlogPostsProcedure = base.blog.list
  .use(provideDbMiddleware)
  .handler(({ context, input }) =>
    listPosts({ db: context.db, locale: context.locale, category: input.category, q: input.q }),
  );

/*===== Get =====*/
export const getBlogPostProcedure = base.blog.get
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getPost({ db: context.db, slug: input.slug, locale: context.locale });
    if (result.kind === "not-found") throw errors.NOT_FOUND(NO_DATA);
    return result;
  });

/*===== Admin List =====*/
export const adminListBlogPostsProcedure = base.blog.admin.list
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(({ context }) => adminListPosts({ db: context.db }));

/*===== Admin Get =====*/
export const adminGetBlogPostProcedure = base.blog.admin.get
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminGetPost({ db: context.db, id: input.id });
    if (result.kind === "not-found") throw errors.NOT_FOUND(NO_DATA);
    return result.post;
  });

/*===== Admin Create =====*/
export const adminCreateBlogPostProcedure = base.blog.admin.create
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminCreatePost({ db: context.db, userId: context.user.id, input });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    return result.post;
  });

/*===== Admin Update =====*/
export const adminUpdateBlogPostProcedure = base.blog.admin.update
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminUpdatePost({ db: context.db, userId: context.user.id, input });
    if (result.kind === "not-found") throw errors.NOT_FOUND(NO_DATA);
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    return result.post;
  });

/*===== Admin Set Status =====*/
export const adminSetBlogPostStatusProcedure = base.blog.admin.setStatus
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminSetPostStatus({
      db: context.db,
      userId: context.user.id,
      id: input.id,
      status: input.status,
    });
    if (result.kind === "not-found") throw errors.NOT_FOUND(NO_DATA);
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    return result.post;
  });

/*===== Admin Delete =====*/
export const adminDeleteBlogPostProcedure = base.blog.admin.delete
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminDeletePost({ db: context.db, userId: context.user.id, id: input.id });
    if (result.kind === "not-found") throw errors.NOT_FOUND(NO_DATA);
    return { id: input.id };
  });

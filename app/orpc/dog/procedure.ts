import { createDog, getDog, listDogs, removeDog, updateDog } from "~/orpc/dog/service";
import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";

// Every procedure here is for customers and scoped to the signed-in owner's own dogs.

/*===== List =====*/
export const listDogsProcedure = base.dog.list
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(({ context }) => listDogs({ db: context.db, ownerId: context.user.id }));

/*===== Get =====*/
export const getDogProcedure = base.dog.get
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getDog({ db: context.db, ownerId: context.user.id, id: input.id });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.dog;
  });

/*===== Create =====*/
export const createDogProcedure = base.dog.create
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await createDog({ db: context.db, ownerId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.dog;
  });

/*===== Update =====*/
export const updateDogProcedure = base.dog.update
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...details } = input;
    const result = await updateDog({ db: context.db, ownerId: context.user.id, id, input: details });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.dog;
  });

/*===== Remove =====*/
export const removeDogProcedure = base.dog.remove
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await removeDog({ db: context.db, ownerId: context.user.id, id: input.id });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return { id: result.id };
  });

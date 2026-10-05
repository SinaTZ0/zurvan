import { base } from "~/orpc/implementer.server";
import { requireUserMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";
import { addPet, listPets } from "~/orpc/pet/service";

/*===== List =====*/
export const listPetsProcedure = base.pet.list
  .use(requireUserMiddleware)
  .use(provideDbMiddleware)
  .handler(({ context }) => listPets({ db: context.db, ownerId: context.user.id }));

/*===== Create =====*/
export const createPetProcedure = base.pet.create
  .use(requireUserMiddleware)
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await addPet({ db: context.db, ownerId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: [], fields: result.fields } });
    }

    return result.pet;
  });

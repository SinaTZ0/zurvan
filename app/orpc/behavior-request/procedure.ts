import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";
import {
  checkoutBehaviorPlan,
  declineBehaviorRequest,
  getBehaviorRequestOptions,
  getTrainerBehaviorRequest,
  listMyBehaviorRequests,
  listTrainerBehaviorRequests,
  proposeBehaviorPlan,
  submitBehaviorRequest,
  withdrawBehaviorRequest,
} from "~/orpc/behavior-request/service";

// The customer procedures are scoped to the signed-in customer's own requests and dogs, the trainer ones to the requests
// sent to the signed-in trainer. The Admin is the head trainer, so both roles use the trainer ones. Videos are not
// here: they are uploaded and streamed by resource routes (`/api/behavior-videos`). Paying a plan is the order flow's.

/*===== Options =====*/
export const behaviorRequestOptionsProcedure = base.behaviorRequest.options
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(({ context }) => getBehaviorRequestOptions({ db: context.db, customerId: context.user.id }));

/*===== Submit =====*/
export const submitBehaviorRequestProcedure = base.behaviorRequest.submit
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await submitBehaviorRequest({ db: context.db, customerId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-eligible") throw errors.NOT_ELIGIBLE({ data: { errors: result.errors, fields: {} } });

    return { id: result.id };
  });

/*===== List Mine =====*/
export const listMyBehaviorRequestsProcedure = base.behaviorRequest.listMine
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(({ context }) => listMyBehaviorRequests({ db: context.db, customerId: context.user.id }));

/*===== Withdraw =====*/
export const withdrawBehaviorRequestProcedure = base.behaviorRequest.withdraw
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await withdrawBehaviorRequest({ db: context.db, customerId: context.user.id, id: input.id });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-withdrawable") {
      throw errors.NOT_WITHDRAWABLE({ data: { errors: result.errors, fields: {} } });
    }

    return { id: result.id };
  });

/*===== Checkout =====*/
export const checkoutBehaviorPlanProcedure = base.behaviorRequest.checkout
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await checkoutBehaviorPlan({ db: context.db, customerId: context.user.id, id: input.id });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-payable") throw errors.NOT_PAYABLE({ data: { errors: result.errors, fields: {} } });

    return { orderId: result.orderId };
  });

/*===== Trainer: List =====*/
export const trainerListBehaviorRequestsProcedure = base.behaviorRequest.trainer.list
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await listTrainerBehaviorRequests({ db: context.db, trainerId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.requests;
  });

/*===== Trainer: Get =====*/
export const trainerGetBehaviorRequestProcedure = base.behaviorRequest.trainer.get
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getTrainerBehaviorRequest({ db: context.db, trainerId: context.user.id, id: input.id });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.request;
  });

/*===== Trainer: Propose =====*/
export const trainerProposeBehaviorPlanProcedure = base.behaviorRequest.trainer.propose
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...details } = input;
    const result = await proposeBehaviorPlan({ db: context.db, trainerId: context.user.id, id, input: details });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-answerable") {
      throw errors.NOT_ANSWERABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.request;
  });

/*===== Trainer: Decline =====*/
export const trainerDeclineBehaviorRequestProcedure = base.behaviorRequest.trainer.decline
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...details } = input;
    const result = await declineBehaviorRequest({ db: context.db, trainerId: context.user.id, id, input: details });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-answerable") {
      throw errors.NOT_ANSWERABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.request;
  });

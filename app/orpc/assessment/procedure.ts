import {
  cancelAssessmentAsTrainer,
  cancelMyAssessment,
  bookAssessment,
  closeTrainerSlot,
  completeAssessment,
  getTrainerAssessment,
  getTrainerSchedule,
  listAvailableSlots,
  listMyAssessments,
  markAssessmentNoShow,
  openTrainerSlots,
} from "~/orpc/assessment/service";
import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";

// The customer procedures are scoped to the signed-in customer's own assessments and dogs, the trainer ones to the
// signed-in trainer's own slots and assessments. The Admin is the head trainer, so both roles use the trainer ones.

/*===== Available Slots =====*/
export const availableSlotsProcedure = base.assessment.availableSlots
  .use(provideDbMiddleware)
  .handler(({ context }) => listAvailableSlots({ db: context.db }));

/*===== Book =====*/
export const bookAssessmentProcedure = base.assessment.book
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await bookAssessment({ db: context.db, customerId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "has-record") throw errors.HAS_RECORD({ data: { errors: result.errors, fields: {} } });
    if (result.kind === "already-booked") throw errors.ALREADY_BOOKED({ data: { errors: result.errors, fields: {} } });
    if (result.kind === "slot-taken") throw errors.SLOT_TAKEN({ data: { errors: result.errors, fields: {} } });

    return result.assessment;
  });

/*===== List Mine =====*/
export const listMyAssessmentsProcedure = base.assessment.listMine
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(({ context, input }) =>
    listMyAssessments({ db: context.db, customerId: context.user.id, dogId: input.dogId }),
  );

/*===== Cancel =====*/
export const cancelAssessmentProcedure = base.assessment.cancel
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...details } = input;
    const result = await cancelMyAssessment({ db: context.db, customerId: context.user.id, id, input: details });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-cancellable") {
      throw errors.NOT_CANCELLABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.assessment;
  });

/*===== Trainer: Schedule =====*/
export const trainerScheduleProcedure = base.assessment.trainer.schedule
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getTrainerSchedule({ db: context.db, trainerId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.slots;
  });

/*===== Trainer: Open Slots =====*/
export const trainerOpenSlotsProcedure = base.assessment.trainer.openSlots
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await openTrainerSlots({ db: context.db, trainerId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return { opened: result.opened, skipped: result.skipped };
  });

/*===== Trainer: Close Slot =====*/
export const trainerCloseSlotProcedure = base.assessment.trainer.closeSlot
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await closeTrainerSlot({ db: context.db, trainerId: context.user.id, slotId: input.slotId });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-open") throw errors.NOT_OPEN({ data: { errors: result.errors, fields: {} } });

    return { slotId: result.slotId };
  });

/*===== Trainer: Get =====*/
export const trainerGetAssessmentProcedure = base.assessment.trainer.get
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getTrainerAssessment({ db: context.db, trainerId: context.user.id, id: input.id });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.assessment;
  });

/*===== Trainer: Complete =====*/
export const trainerCompleteAssessmentProcedure = base.assessment.trainer.complete
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...details } = input;
    const result = await completeAssessment({ db: context.db, trainerId: context.user.id, id, input: details });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-recordable") {
      throw errors.NOT_RECORDABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.assessment;
  });

/*===== Trainer: No-Show =====*/
export const trainerMarkNoShowProcedure = base.assessment.trainer.markNoShow
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...details } = input;
    const result = await markAssessmentNoShow({ db: context.db, trainerId: context.user.id, id, input: details });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-recordable") {
      throw errors.NOT_RECORDABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.assessment;
  });

/*===== Trainer: Cancel =====*/
export const trainerCancelAssessmentProcedure = base.assessment.trainer.cancel
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...details } = input;
    const result = await cancelAssessmentAsTrainer({
      db: context.db,
      trainerId: context.user.id,
      id,
      input: details,
    });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-cancellable") {
      throw errors.NOT_CANCELLABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.assessment;
  });

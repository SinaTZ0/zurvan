import {
  cancelSession,
  getMyEnrollment,
  getTrainerEnrollment,
  listMyEnrollments,
  listTrainerEnrollments,
  listTrainerSessions,
  markSession,
  recordResult,
  rescheduleSession,
  scheduleSession,
  setPlannedSessions,
  updateSessionNote,
} from "~/orpc/enrollment/service";
import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";

// The customer procedures are scoped to the signed-in customer's own enrollments, the trainer ones to the signed-in
// trainer's own enrollments and sessions. The Admin is the head trainer, so both roles use the trainer ones. Money is
// not here: enrollments are created by the order flow and cancelled, with their refund, by the order feature.

/*===== List Mine =====*/
export const listMyEnrollmentsProcedure = base.enrollment.listMine
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(({ context, input }) =>
    listMyEnrollments({ db: context.db, customerId: context.user.id, dogId: input.dogId }),
  );

/*===== Get Mine =====*/
export const getMyEnrollmentProcedure = base.enrollment.get
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getMyEnrollment({ db: context.db, customerId: context.user.id, id: input.id });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.enrollment;
  });

/*===== Trainer: List =====*/
export const trainerListEnrollmentsProcedure = base.enrollment.trainer.list
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await listTrainerEnrollments({ db: context.db, trainerId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.enrollments;
  });

/*===== Trainer: Get =====*/
export const trainerGetEnrollmentProcedure = base.enrollment.trainer.get
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getTrainerEnrollment({ db: context.db, trainerId: context.user.id, id: input.id });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.enrollment;
  });

/*===== Trainer: Sessions =====*/
export const trainerSessionsProcedure = base.enrollment.trainer.sessions
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await listTrainerSessions({ db: context.db, trainerId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }

    return result.sessions;
  });

/*===== Trainer: Schedule Session =====*/
export const trainerScheduleSessionProcedure = base.enrollment.trainer.scheduleSession
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { enrollmentId, ...details } = input;
    const result = await scheduleSession({
      db: context.db,
      trainerId: context.user.id,
      enrollmentId,
      input: details,
    });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-schedulable") {
      throw errors.NOT_SCHEDULABLE({ data: { errors: result.errors, fields: {} } });
    }

    return { enrollment: result.enrollment, overlaps: result.overlaps };
  });

/*===== Trainer: Reschedule Session =====*/
export const trainerRescheduleSessionProcedure = base.enrollment.trainer.rescheduleSession
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { sessionId, ...details } = input;
    const result = await rescheduleSession({ db: context.db, trainerId: context.user.id, sessionId, input: details });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-schedulable") {
      throw errors.NOT_SCHEDULABLE({ data: { errors: result.errors, fields: {} } });
    }

    return { enrollment: result.enrollment, overlaps: result.overlaps };
  });

/*===== Trainer: Cancel Session =====*/
export const trainerCancelSessionProcedure = base.enrollment.trainer.cancelSession
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await cancelSession({ db: context.db, trainerId: context.user.id, sessionId: input.sessionId });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-schedulable") {
      throw errors.NOT_SCHEDULABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.enrollment;
  });

/*===== Trainer: Mark Session =====*/
export const trainerMarkSessionProcedure = base.enrollment.trainer.markSession
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { sessionId, ...details } = input;
    const result = await markSession({ db: context.db, trainerId: context.user.id, sessionId, input: details });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-recordable") {
      throw errors.NOT_RECORDABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.enrollment;
  });

/*===== Trainer: Update Session Note =====*/
export const trainerUpdateSessionNoteProcedure = base.enrollment.trainer.updateSessionNote
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { sessionId, ...details } = input;
    const result = await updateSessionNote({ db: context.db, trainerId: context.user.id, sessionId, input: details });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-recordable") {
      throw errors.NOT_RECORDABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.enrollment;
  });

/*===== Trainer: Set Planned Sessions =====*/
export const trainerSetPlannedSessionsProcedure = base.enrollment.trainer.setPlannedSessions
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...details } = input;
    const result = await setPlannedSessions({ db: context.db, trainerId: context.user.id, id, input: details });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-schedulable") {
      throw errors.NOT_SCHEDULABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.enrollment;
  });

/*===== Trainer: Record Result =====*/
export const trainerRecordResultProcedure = base.enrollment.trainer.recordResult
  .use(requireRoleMiddleware("trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...details } = input;
    const result = await recordResult({ db: context.db, trainerId: context.user.id, id, input: details });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-recordable") {
      throw errors.NOT_RECORDABLE({ data: { errors: result.errors, fields: {} } });
    }

    return result.enrollment;
  });

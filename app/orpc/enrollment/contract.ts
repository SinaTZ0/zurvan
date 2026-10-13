import { oc } from "@orpc/contract";
import { z } from "zod";

import { ENROLLMENT_STATUSES } from "~/orpc/enrollment/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { mediaSchema } from "~/orpc/media/contract";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** An enrollment as its customer sees it (F6): one dog taking one course, at the price it was bought for. Rial. */
export const enrollmentSchema = z.object({
  id: z.string(),
  status: z.enum(ENROLLMENT_STATUSES),
  course: z.object({ slug: z.string(), title: z.string(), latinName: z.string() }),
  dog: z.object({ id: z.string(), name: z.string(), photo: mediaSchema.nullable() }),
  price: z.number().int(),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
});

export type Enrollment = z.infer<typeof enrollmentSchema>;

/** The same, for the Admin: with the customer to call. */
export const adminEnrollmentSchema = enrollmentSchema.extend({
  customer: z.object({ id: z.string(), name: z.string(), phoneNumber: z.string().nullable() }),
});

export type AdminEnrollment = z.infer<typeof adminEnrollmentSchema>;

const idInputSchema = z.strictObject({ id: z.string() });
const listMineInputSchema = z.strictObject({ dogId: z.string().optional() });
const adminListInputSchema = z.strictObject({ status: z.enum(ENROLLMENT_STATUSES).optional() });

/*===== Errors =====*/
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const finishErrors = {
  ...notFoundError,
  NOT_ACTIVE: {
    message: "The enrollment is not active any more.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
/** The customer's enrollments, active ones first; `dogId` narrows them to one dog's page. */
export const listMyEnrollmentsContract = oc
  .errors(baseErrors)
  .input(listMineInputSchema)
  .output(z.array(enrollmentSchema));

export const adminListEnrollmentsContract = oc
  .errors(baseErrors)
  .input(adminListInputSchema)
  .output(z.array(adminEnrollmentSchema));

/** «تمام شد»: the training is over. The dog has passed the course, which unlocks the next ones. */
export const adminCompleteEnrollmentContract = oc
  .errors({ ...baseErrors, ...finishErrors })
  .input(idInputSchema)
  .output(adminEnrollmentSchema);

/** «لغو»: the Admin can't take the customer after all. Any refund happens outside the app. */
export const adminCancelEnrollmentContract = oc
  .errors({ ...baseErrors, ...finishErrors })
  .input(idInputSchema)
  .output(adminEnrollmentSchema);

export const enrollmentContract = {
  listMine: listMyEnrollmentsContract,
  admin: {
    list: adminListEnrollmentsContract,
    complete: adminCompleteEnrollmentContract,
    cancel: adminCancelEnrollmentContract,
  },
};

import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";
import { REFUND_STATUSES } from "~/orpc/refund/constants";

/*===== Schemas =====*/
/** A refund as the Admin sees it. All amounts are Rial. */
export const refundSchema = z.object({
  id: z.string(),
  paymentId: z.string(),
  /** The item the refund is for, or null for the payment as a whole. */
  paymentItemId: z.string().nullable(),
  amount: z.number().int(),
  status: z.enum(REFUND_STATUSES),
  /** The Admin's own words: private to him. */
  reason: z.string(),
  /** The bank transfer's reference, once it is marked paid. */
  reference: z.string().nullable(),
  createdAt: z.date(),
  paidAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
});

export type Refund = z.infer<typeof refundSchema>;

/** A refund as the customer whose payment it is sees it: the amount, the state and the reference; never the Admin's reason. */
export const myRefundSchema = refundSchema.omit({ reason: true });

export type MyRefund = z.infer<typeof myRefundSchema>;

// Structure only; the amount's meaning (a whole number of Rial above zero, within what the payment charged), the text
// limits and whether the item belongs to the payment are checked by the service.
const createInputSchema = z.strictObject({
  paymentId: z.string(),
  paymentItemId: z.string().nullish(),
  /** Rial. */
  amount: z.number(),
  reason: z.string(),
});
const markPaidInputSchema = z.strictObject({ id: z.string(), reference: z.string() });
const idInputSchema = z.strictObject({ id: z.string() });
const adminListInputSchema = z.strictObject({ paymentId: z.string().optional() });

/*===== Errors =====*/
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const createErrors = {
  ...notFoundError,
  /** Only money that was taken can be given back: the payment is not `paid`. */
  NOT_PAID: {
    message: "The payment is not paid.",
    data: errorDataSchema,
  },
};

const answerErrors = {
  ...notFoundError,
  /** The refund has already been paid or cancelled. */
  NOT_PENDING: {
    message: "The refund is not pending any more.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
/** Every refund, newest first, or those of one payment. For the Admin. */
export const adminListRefundsContract = oc.errors(baseErrors).input(adminListInputSchema).output(z.array(refundSchema));

/**
 * Records a refund the Admin has decided: for a **paid** payment, a whole number of Rial above zero, and with the refunds
 * that already stand never more than the payment charged (`INVALID_INPUT` with `fields.amount` otherwise). It starts
 * `pending`; paying it out is done outside the app.
 */
export const adminCreateRefundContract = oc
  .errors({ ...baseErrors, ...createErrors })
  .input(createInputSchema)
  .output(refundSchema);

/** The Admin has paid it out: the transfer's reference is required. `NOT_PENDING` if it was already answered. */
export const adminMarkRefundPaidContract = oc
  .errors({ ...baseErrors, ...answerErrors })
  .input(markPaidInputSchema)
  .output(refundSchema);

/** The Admin withdraws a refund that has not been paid. `NOT_PENDING` once it was paid or cancelled. */
export const adminCancelRefundContract = oc
  .errors({ ...baseErrors, ...answerErrors })
  .input(idInputSchema)
  .output(refundSchema);

/** The refunds of the signed-in customer's own payments, newest first. */
export const listMyRefundsContract = oc.errors(baseErrors).output(z.array(myRefundSchema));

export const refundContract = {
  listMine: listMyRefundsContract,
  admin: {
    list: adminListRefundsContract,
    create: adminCreateRefundContract,
    markPaid: adminMarkRefundPaidContract,
    cancel: adminCancelRefundContract,
  },
};

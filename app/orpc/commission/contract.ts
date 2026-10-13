import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** A commission as its partner sees it: paid or unpaid. All amounts are Rial. */
export const partnerCommissionSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  amount: z.number().int(),
  paidAt: z.date().nullable(),
  createdAt: z.date(),
});

export type PartnerCommission = z.infer<typeof partnerCommissionSchema>;

export const adminCommissionSchema = partnerCommissionSchema.extend({
  partner: z.object({ id: z.string(), name: z.string() }),
  customer: z.object({ id: z.string(), name: z.string() }),
  /** Rial: the total of the enrollments the customer's first payment created. */
  baseAmount: z.number().int(),
  percent: z.number().int(),
});

export type AdminCommission = z.infer<typeof adminCommissionSchema>;

/*===== Errors =====*/
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const markPaidErrors = {
  ...notFoundError,
  ALREADY_PAID: {
    message: "The commission is already marked paid.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
export const listMyCommissionsContract = oc.errors(baseErrors).output(z.array(partnerCommissionSchema));

export const adminListCommissionsContract = oc
  .errors(baseErrors)
  .input(z.strictObject({ paid: z.boolean().optional() }))
  .output(z.array(adminCommissionSchema));

export const adminMarkCommissionPaidContract = oc
  .errors({ ...baseErrors, ...markPaidErrors })
  .input(z.strictObject({ id: z.string() }))
  .output(adminCommissionSchema);

export const commissionContract = {
  listMine: listMyCommissionsContract,
  admin: {
    list: adminListCommissionsContract,
    markPaid: adminMarkCommissionPaidContract,
  },
};

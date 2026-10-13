import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
// F11: a plain overview for the Admin, not accounting. Every amount is integer Rial. Nothing is cached: each call reads
// the database.

/** How many of the newest paid payments «آخرین خریدها» shows. */
export const LATEST_PURCHASES_LIMIT = 5;

export const dashboardOverviewSchema = z.object({
  /** "Waiting for him". */
  waiting: z.object({
    /** Evaluations in `requested`. */
    evaluationRequests: z.number().int(),
    /** F5: items of a paid payment with no enrollment. `amount` is the Rial sum of their item prices. */
    paidNotEnrolled: z.object({ count: z.number().int(), amount: z.number().int() }),
    /** The newest paid payments (at most `LATEST_PURCHASES_LIMIT`), newest `paidAt` first, so he can call them. */
    latestPurchases: z.array(
      z.object({
        paymentId: z.string(),
        paidAt: z.date(),
        /** Rial. */
        amount: z.number().int(),
        customer: z.object({ id: z.string(), name: z.string(), phoneNumber: z.string().nullable() }),
        items: z.array(
          z.object({
            course: z.object({ slug: z.string(), title: z.string() }),
            dog: z.object({ id: z.string(), name: z.string() }),
            /** False for a paid, not enrolled item. */
            enrolled: z.boolean(),
          }),
        ),
      }),
    ),
  }),
  enrollments: z.object({ active: z.number().int(), completed: z.number().int(), cancelled: z.number().int() }),
  money: z.object({
    /** The Jalali month "this month" means, on the Tehran clock: `{ year: 1405, month: 7 }`. */
    month: z.object({ year: z.number().int(), month: z.number().int() }),
    /** Rial: `amount` of `paid` payments whose `paidAt` is inside that month. Refunds are not recorded, so none is subtracted. */
    salesThisMonth: z.number().int(),
    /** Rial: the same, all time. */
    salesTotal: z.number().int(),
    /** Commissions not yet marked paid. `amount` is their Rial sum. */
    unpaidCommissions: z.object({ count: z.number().int(), amount: z.number().int() }),
  }),
  /** Every course in catalogue order; an archived course appears only if it has enrollments. */
  courses: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      /** Enrollments of any status: `active + completed + cancelled`. */
      bought: z.number().int(),
      active: z.number().int(),
      completed: z.number().int(),
    }),
  ),
});

export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;

/*===== Procedures =====*/
const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

export const adminOverviewContract = oc.errors(baseErrors).output(dashboardOverviewSchema);

export const dashboardContract = {
  admin: {
    overview: adminOverviewContract,
  },
};

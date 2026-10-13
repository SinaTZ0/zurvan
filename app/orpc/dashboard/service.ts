import type { DatabaseOrTransaction } from "~/db/client.server";
import { tehranJalaliMonthRange } from "~/lib/tehran-time";
import { findPaymentsWithItems } from "~/orpc/checkout/repository";
import { LATEST_PURCHASES_LIMIT, type DashboardOverview } from "~/orpc/dashboard/contract";
import {
  countEnrollmentsByCourse,
  countEnrollmentsByStatus,
  countRequestedEvaluations,
  sumPaidNotEnrolledItems,
  sumPaidPayments,
  sumUnpaidCommissions,
} from "~/orpc/dashboard/repository";

/*===== Latest Purchases =====*/
/**
 * The newest paid payments, to call. The checkout query is newest by creation, and a payment is settled a little after
 * it is created, so the order is fixed here by `paidAt`, the date the page shows. `sort` is stable, so payments
 * with the same instant keep the repository's order.
 */
async function latestPurchases({
  db,
}: {
  db: DatabaseOrTransaction;
}): Promise<DashboardOverview["waiting"]["latestPurchases"]> {
  const paid = await findPaymentsWithItems({ db, status: "paid" });
  const settledAt = (entry: (typeof paid)[number]) => (entry.payment.paidAt ?? entry.payment.createdAt).getTime();

  // The copy keeps `paid` intact; `toSorted` isn't in the project's TypeScript lib.
  return (
    [...paid]
      // oxlint-disable-next-line unicorn/no-array-sort
      .sort((a, b) => settledAt(b) - settledAt(a))
      .slice(0, LATEST_PURCHASES_LIMIT)
      .map((entry) => ({
        paymentId: entry.payment.id,
        paidAt: entry.payment.paidAt ?? entry.payment.createdAt,
        amount: entry.payment.amount,
        customer: entry.customer,
        items: entry.items.map((row) => ({
          course: row.course,
          dog: row.dog,
          enrolled: row.enrollment !== null,
        })),
      }))
  );
}

/*===== Overview =====*/
/**
 * Everything on the Admin's dashboard (F11). Nothing is cached; the queries are independent, so they run together.
 *
 * @param now Fixed by tests; it decides which Jalali month "this month" is.
 */
export async function overview({
  db,
  now = new Date(),
}: {
  db: DatabaseOrTransaction;
  now?: Date;
}): Promise<DashboardOverview> {
  const month = tehranJalaliMonthRange(now);

  const [
    evaluationRequests,
    paidNotEnrolled,
    purchases,
    enrollmentCounts,
    salesThisMonth,
    salesTotal,
    unpaidCommissions,
    courses,
  ] = await Promise.all([
    countRequestedEvaluations({ db }),
    sumPaidNotEnrolledItems({ db }),
    latestPurchases({ db }),
    countEnrollmentsByStatus({ db }),
    sumPaidPayments({ db, range: month }),
    sumPaidPayments({ db }),
    sumUnpaidCommissions({ db }),
    countEnrollmentsByCourse({ db }),
  ]);

  return {
    waiting: { evaluationRequests, paidNotEnrolled, latestPurchases: purchases },
    enrollments: {
      active: enrollmentCounts.active ?? 0,
      completed: enrollmentCounts.completed ?? 0,
      cancelled: enrollmentCounts.cancelled ?? 0,
    },
    money: {
      month: { year: month.year, month: month.month },
      salesThisMonth,
      salesTotal,
      unpaidCommissions,
    },
    courses,
  };
}

import { and, asc, count, eq, gte, isNull, lt, or, sql, type AnyColumn } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { commission, course, enrollment, evaluation, payment, paymentItem } from "~/db/schema";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type CountAndAmount = { count: number; amount: number };
export type EnrollmentCounts = Record<string, number>;
export type CourseCountsRow = { slug: string; title: string; bought: number; active: number; completed: number };

// `sum()` of a bigint column comes back from Postgres as a string (it can exceed a JS number, which Rial never will),
// and is null over zero rows. `mapWith(Number)` converts it, and `coalesce` turns "no rows" into 0.
const sumOf = (column: AnyColumn) => sql<number>`coalesce(sum(${column}), 0)`.mapWith(Number);

/*===== Waiting =====*/
/** Evaluations the customer has requested and the Admin hasn't answered. */
export async function countRequestedEvaluations({ db }: Executor): Promise<number> {
  const [row] = await db.select({ value: count() }).from(evaluation).where(eq(evaluation.status, "requested"));
  return row?.value ?? 0;
}

/**
 * F5: items of a paid payment that made no enrollment, and the Rial that was actually taken for them. An item keeps its
 * full price, but with a deposit the gateway was charged less, so each item counts its **share of what was charged**
 * (`price × charged ÷ full price`, rounded down per item): the figure the Admin would send back, never more than the
 * payment's own charge. A payment made without a deposit, or before deposits existed, charged the full price.
 */
export async function sumPaidNotEnrolledItems({ db }: Executor): Promise<CountAndAmount> {
  const takenForItem =
    sql<number>`coalesce(sum(floor(${paymentItem.price}::numeric * ${payment.amount} / nullif(coalesce(${payment.totalAmount}, ${payment.amount}), 0))), 0)`.mapWith(
      Number,
    );
  const [row] = await db
    .select({ count: count(), amount: takenForItem })
    .from(paymentItem)
    .innerJoin(payment, eq(paymentItem.paymentId, payment.id))
    .leftJoin(enrollment, eq(enrollment.paymentItemId, paymentItem.id))
    .where(and(eq(payment.status, "paid"), isNull(enrollment.id)));
  return { count: row?.count ?? 0, amount: row?.amount ?? 0 };
}

/*===== Enrollments =====*/
/** How many enrollments each status has. A status with none is absent. */
export async function countEnrollmentsByStatus({ db }: Executor): Promise<EnrollmentCounts> {
  const rows = await db
    .select({ status: enrollment.status, value: count() })
    .from(enrollment)
    .groupBy(enrollment.status);
  return Object.fromEntries(rows.map((row) => [row.status, row.value]));
}

/*===== Money =====*/
/**
 * Rial taken in by `paid` payments (with a deposit, the deposit). With `range`, only those whose `paidAt` is in
 * `[start, end)`. Failed and pending payments are never counted. This is what was taken, not what was kept: refunds are
 * recorded on the Payments page and are not subtracted here (the dashboard is an overview, not accounting, F11).
 */
export async function sumPaidPayments({
  db,
  range,
}: Executor & { range?: { start: Date; end: Date } }): Promise<number> {
  const [row] = await db
    .select({ amount: sumOf(payment.amount) })
    .from(payment)
    .where(
      and(
        eq(payment.status, "paid"),
        range ? and(gte(payment.paidAt, range.start), lt(payment.paidAt, range.end)) : undefined,
      ),
    );
  return row?.amount ?? 0;
}

/** Commissions the Admin hasn't marked paid yet. */
export async function sumUnpaidCommissions({ db }: Executor): Promise<CountAndAmount> {
  const [row] = await db
    .select({ count: count(), amount: sumOf(commission.amount) })
    .from(commission)
    .where(isNull(commission.paidAt));
  return { count: row?.count ?? 0, amount: row?.amount ?? 0 };
}

/*===== Courses =====*/
/**
 * Enrollment counts per course in catalogue order. An approved course is always listed, even with zeros; any other
 * (archived, draft) only when someone enrolled in it, so a retired course keeps its history without cluttering the list.
 */
export function countEnrollmentsByCourse({ db }: Executor): Promise<CourseCountsRow[]> {
  const bought = count(enrollment.id);

  return db
    .select({
      slug: course.slug,
      title: course.title,
      bought,
      active: sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'active')`.mapWith(Number),
      completed: sql<number>`count(${enrollment.id}) filter (where ${enrollment.status} = 'completed')`.mapWith(Number),
    })
    .from(course)
    .leftJoin(enrollment, eq(enrollment.courseId, course.id))
    .groupBy(course.id)
    .having(or(eq(course.status, "approved"), sql`${bought} > 0`))
    .orderBy(asc(course.position), asc(course.id));
}

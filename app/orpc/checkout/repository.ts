import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { course, dog, enrollment, payment, paymentItem, user } from "~/db/schema";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type PaymentRecord = typeof payment.$inferSelect;
export type PaymentItemRecord = typeof paymentItem.$inferSelect;

/** A payment item with its course, its dog and the enrollment it created, if it did. */
export type PaymentItemRow = {
  item: PaymentItemRecord;
  course: { slug: string; title: string };
  dog: { id: string; name: string };
  enrollment: { id: string; status: string } | null;
};

/*===== Reads =====*/
/** A dog's and course's active enrollments among these, as `dogId:courseId` keys. */
export async function findActiveEnrollmentKeys({
  db,
  dogIds,
  courseIds,
}: Executor & { dogIds: string[]; courseIds: string[] }): Promise<Set<string>> {
  if (dogIds.length === 0 || courseIds.length === 0) return new Set();
  const rows = await db
    .select({ dogId: enrollment.dogId, courseId: enrollment.courseId })
    .from(enrollment)
    .where(
      and(inArray(enrollment.dogId, dogIds), inArray(enrollment.courseId, courseIds), eq(enrollment.status, "active")),
    );
  return new Set(rows.map((row) => `${row.dogId}:${row.courseId}`));
}

export async function findPaymentByAuthority({
  db,
  authority,
}: Executor & { authority: string }): Promise<PaymentRecord | undefined> {
  const [row] = await db.select().from(payment).where(eq(payment.authority, authority));
  return row;
}

/** Same, and locks the payment's row until the transaction ends, so a repeated callback waits for the first. */
export async function lockPaymentByAuthority({
  db,
  authority,
}: Executor & { authority: string }): Promise<PaymentRecord | undefined> {
  const [row] = await db.select().from(payment).where(eq(payment.authority, authority)).for("update");
  return row;
}

export function findPaymentItems({ db, paymentId }: Executor & { paymentId: string }): Promise<PaymentItemRecord[]> {
  return db
    .select()
    .from(paymentItem)
    .where(eq(paymentItem.paymentId, paymentId))
    .orderBy(asc(paymentItem.dogId), asc(paymentItem.courseId));
}

/**
 * Payments with their items and the enrollments those made, newest first. `customerId` narrows them to one customer's;
 * `status` to one status.
 */
export async function findPaymentsWithItems({
  db,
  customerId,
  status,
}: Executor & { customerId?: string; status?: string }): Promise<
  {
    payment: PaymentRecord;
    customer: { id: string; name: string; phoneNumber: string | null };
    items: PaymentItemRow[];
  }[]
> {
  const payments = await db
    .select({ payment, customer: { id: user.id, name: user.name, phoneNumber: user.phoneNumber } })
    .from(payment)
    .innerJoin(user, eq(payment.customerId, user.id))
    .where(
      and(customerId ? eq(payment.customerId, customerId) : undefined, status ? eq(payment.status, status) : undefined),
    )
    .orderBy(desc(payment.createdAt), asc(payment.id));
  if (payments.length === 0) return [];

  const items = await db
    .select({
      item: paymentItem,
      course: { slug: course.slug, title: course.title },
      dog: { id: dog.id, name: dog.name },
      enrollment: { id: enrollment.id, status: enrollment.status },
    })
    .from(paymentItem)
    .innerJoin(course, eq(paymentItem.courseId, course.id))
    .innerJoin(dog, eq(paymentItem.dogId, dog.id))
    .leftJoin(enrollment, eq(enrollment.paymentItemId, paymentItem.id))
    .where(
      inArray(
        paymentItem.paymentId,
        payments.map((row) => row.payment.id),
      ),
    )
    .orderBy(asc(paymentItem.dogId), asc(paymentItem.courseId));

  return payments.map((row) => ({
    ...row,
    items: items.filter((entry) => entry.item.paymentId === row.payment.id),
  }));
}

/*===== Writes =====*/
export async function insertPayment({
  db,
  values,
}: Executor & { values: typeof payment.$inferInsert }): Promise<PaymentRecord> {
  const [row] = await db.insert(payment).values(values).returning();
  if (!row) throw new Error("insertPayment: no row returned");
  return row;
}

export async function insertPaymentItems({
  db,
  values,
}: Executor & { values: (typeof paymentItem.$inferInsert)[] }): Promise<PaymentItemRecord[]> {
  return db.insert(paymentItem).values(values).returning();
}

/**
 * Settles a pending payment as paid or failed. A conditional update (F12): the payment settles once, so a second
 * callback finds nothing to update.
 *
 * @returns Whether this call settled it.
 */
export async function settlePendingPayment({
  db,
  id,
  values,
}: Executor & {
  id: string;
  values: Pick<typeof payment.$inferInsert, "status" | "referenceId" | "cardNumberMasked" | "failureReason" | "paidAt">;
}): Promise<boolean> {
  const rows = await db
    .update(payment)
    .set(values)
    .where(and(eq(payment.id, id), eq(payment.status, "pending")))
    .returning({ id: payment.id });
  return rows.length > 0;
}

/**
 * Creates the enrollment of a paid item, unless the dog already has an active one in the course. The partial unique
 * index is the arbiter (F12), so the loser of a race gets nothing instead of an error.
 *
 * @returns The enrollment's id, or undefined when the item stays "paid, not enrolled".
 */
export async function insertEnrollmentUnlessActive({
  db,
  values,
}: Executor & { values: typeof enrollment.$inferInsert }): Promise<string | undefined> {
  const [row] = await db
    .insert(enrollment)
    .values(values)
    .onConflictDoNothing({
      target: [enrollment.dogId, enrollment.courseId],
      where: sql`${enrollment.status} = 'active'`,
    })
    .returning({ id: enrollment.id });
  return row?.id;
}

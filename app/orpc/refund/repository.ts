import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { payment, paymentItem, refund, user } from "~/db/schema";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type RefundRecord = typeof refund.$inferSelect;

/*===== Reads =====*/
/** Every refund, newest first, or those of one payment. */
export function findRefunds({ db, paymentId }: Executor & { paymentId?: string }): Promise<RefundRecord[]> {
  return db
    .select()
    .from(refund)
    .where(paymentId ? eq(refund.paymentId, paymentId) : undefined)
    .orderBy(desc(refund.createdAt), desc(refund.id));
}

export async function findRefundById({ db, id }: Executor & { id: string }): Promise<RefundRecord | undefined> {
  const [row] = await db.select().from(refund).where(eq(refund.id, id));
  return row;
}

/** The refunds of these payments, newest first. */
export function findRefundsOfPayments({
  db,
  paymentIds,
}: Executor & { paymentIds: string[] }): Promise<RefundRecord[]> {
  if (paymentIds.length === 0) return Promise.resolve([]);
  return db
    .select()
    .from(refund)
    .where(inArray(refund.paymentId, paymentIds))
    .orderBy(desc(refund.createdAt), desc(refund.id));
}

/** Locks the payment's row until the transaction ends, so two refunds for it are checked one after the other. */
export async function lockPayment({
  db,
  paymentId,
}: Executor & { paymentId: string }): Promise<
  { id: string; customerId: string; amount: number; status: string } | undefined
> {
  const [row] = await db
    .select({ id: payment.id, customerId: payment.customerId, amount: payment.amount, status: payment.status })
    .from(payment)
    .where(eq(payment.id, paymentId))
    .for("update");
  return row;
}

/** Rial the refunds that stand (everything but cancelled ones) already add up to for a payment. */
export async function sumStandingRefunds({ db, paymentId }: Executor & { paymentId: string }): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${refund.amount}), 0)::bigint` })
    .from(refund)
    .where(and(eq(refund.paymentId, paymentId), ne(refund.status, "cancelled")));
  return Number(row?.total ?? 0);
}

/** Whether the item belongs to the payment. */
export async function itemBelongsToPayment({
  db,
  paymentId,
  paymentItemId,
}: Executor & { paymentId: string; paymentItemId: string }): Promise<boolean> {
  const [row] = await db
    .select({ id: paymentItem.id })
    .from(paymentItem)
    .where(and(eq(paymentItem.id, paymentItemId), eq(paymentItem.paymentId, paymentId)));
  return row !== undefined;
}

/** The customer's payment ids, to scope their refunds. */
export async function findPaymentIdsOfCustomer({
  db,
  customerId,
}: Executor & { customerId: string }): Promise<string[]> {
  const rows = await db.select({ id: payment.id }).from(payment).where(eq(payment.customerId, customerId));
  return rows.map((row) => row.id);
}

/** The phone number of the customer who made the payment, for the SMS that tells them a refund was paid. */
export async function findPaymentCustomerPhone({
  db,
  paymentId,
}: Executor & { paymentId: string }): Promise<string | null> {
  const [row] = await db
    .select({ phoneNumber: user.phoneNumber })
    .from(payment)
    .innerJoin(user, eq(payment.customerId, user.id))
    .where(eq(payment.id, paymentId));
  return row?.phoneNumber ?? null;
}

/*===== Writes =====*/
export async function insertRefund({
  db,
  values,
}: Executor & { values: typeof refund.$inferInsert }): Promise<RefundRecord> {
  const [row] = await db.insert(refund).values(values).returning();
  if (!row) throw new Error("insertRefund: no row returned");
  return row;
}

/** `pending` → `paid`, once: a conditional update, so a second press changes nothing. Returns whether this call did it. */
export async function markPending({
  db,
  id,
  values,
}: Executor & {
  id: string;
  values: Partial<Pick<typeof refund.$inferInsert, "status" | "reference" | "paidAt" | "cancelledAt">>;
}): Promise<boolean> {
  const rows = await db
    .update(refund)
    .set(values)
    .where(and(eq(refund.id, id), eq(refund.status, "pending")))
    .returning({ id: refund.id });
  return rows.length > 0;
}

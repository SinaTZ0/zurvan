import { and, asc, eq, exists, inArray, sql } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { cartItem, course, paymentItem } from "~/db/schema";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

/** A cart row as the API shows it: the course by its slug, the dog by its id. */
export type CartRow = { courseSlug: string; dogId: string };

/*===== Reads =====*/
/** The customer's cart, oldest first. Scoped to the user in the query, so a service cannot forget it. */
export function findCartRows({ db, userId }: Executor & { userId: string }): Promise<CartRow[]> {
  return (
    db
      .select({ courseSlug: course.slug, dogId: cartItem.dogId })
      .from(cartItem)
      .innerJoin(course, eq(cartItem.courseId, course.id))
      .where(eq(cartItem.userId, userId))
      // `courseSlug` and `dogId` break ties between items added in the same instant.
      .orderBy(asc(cartItem.createdAt), asc(course.slug), asc(cartItem.dogId))
  );
}

/** How many items the customer's cart holds. */
export async function countCartRows({ db, userId }: Executor & { userId: string }): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cartItem)
    .where(eq(cartItem.userId, userId));
  return row?.count ?? 0;
}

/** Which of these `dogId:courseId` pairs are already in the customer's cart. */
export async function findCartPairKeys({
  db,
  userId,
  courseIds,
}: Executor & { userId: string; courseIds: string[] }): Promise<Set<string>> {
  if (courseIds.length === 0) return new Set();
  const rows = await db
    .select({ dogId: cartItem.dogId, courseId: cartItem.courseId })
    .from(cartItem)
    .where(and(eq(cartItem.userId, userId), inArray(cartItem.courseId, courseIds)));
  return new Set(rows.map((row) => `${row.dogId}:${row.courseId}`));
}

/*===== Writes =====*/
/** Adds the pairs; one already there is left as it is, so adding twice is the same as adding once. */
export async function insertCartRows({
  db,
  userId,
  pairs,
}: Executor & { userId: string; pairs: { dogId: string; courseId: string }[] }): Promise<void> {
  if (pairs.length === 0) return;
  await db
    .insert(cartItem)
    .values(pairs.map((pair) => ({ userId, dogId: pair.dogId, courseId: pair.courseId })))
    .onConflictDoNothing();
}

export async function deleteCartRow({
  db,
  userId,
  dogId,
  courseId,
}: Executor & { userId: string; dogId: string; courseId: string }): Promise<void> {
  await db
    .delete(cartItem)
    .where(and(eq(cartItem.userId, userId), eq(cartItem.dogId, dogId), eq(cartItem.courseId, courseId)));
}

export async function deleteAllCartRows({ db, userId }: Executor & { userId: string }): Promise<void> {
  await db.delete(cartItem).where(eq(cartItem.userId, userId));
}

/** Takes out the items a payment bought, whichever of them are in the customer's cart. */
export async function deleteCartRowsOfPayment({
  db,
  userId,
  paymentId,
}: Executor & { userId: string; paymentId: string }): Promise<void> {
  await db.delete(cartItem).where(
    and(
      eq(cartItem.userId, userId),
      exists(
        db
          .select({ one: sql`1` })
          .from(paymentItem)
          .where(
            and(
              eq(paymentItem.paymentId, paymentId),
              eq(paymentItem.dogId, cartItem.dogId),
              eq(paymentItem.courseId, cartItem.courseId),
            ),
          ),
      ),
    ),
  );
}

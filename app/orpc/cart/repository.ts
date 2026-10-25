import { and, asc, eq, exists, inArray, sql } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { cartItem, course, paymentItem } from "~/db/schema";
import { isCoursePlace, type CoursePlace } from "~/orpc/course/constants";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

/** A cart row as the API shows it: the course by its slug, the dog by its id, and the place once picked. */
export type CartRow = { courseSlug: string; dogId: string; place?: CoursePlace };

/*===== Reads =====*/
/** The customer's cart, oldest first. Scoped to the user in the query, so a service cannot forget it. */
export async function findCartRows({ db, userId }: Executor & { userId: string }): Promise<CartRow[]> {
  const rows = await db
    .select({ courseSlug: course.slug, dogId: cartItem.dogId, place: cartItem.place })
    .from(cartItem)
    .innerJoin(course, eq(cartItem.courseId, course.id))
    .where(eq(cartItem.userId, userId))
    // `courseSlug` and `dogId` break ties between items added in the same instant.
    .orderBy(asc(cartItem.createdAt), asc(course.slug), asc(cartItem.dogId));
  // Plain text in the database: an unknown value reads as not picked. No pick leaves `place` out, the shape of a cart
  // item that never had one.
  return rows.map(({ place, ...row }) => (isCoursePlace(place) ? { ...row, place } : row));
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

/**
 * Sets where one item is taught, or clears it with null.
 *
 * @returns Whether the item was in the customer's cart.
 */
export async function updateCartRowPlace({
  db,
  userId,
  dogId,
  courseId,
  place,
}: Executor & { userId: string; dogId: string; courseId: string; place: CoursePlace | null }): Promise<boolean> {
  const rows = await db
    .update(cartItem)
    .set({ place })
    .where(and(eq(cartItem.userId, userId), eq(cartItem.dogId, dogId), eq(cartItem.courseId, courseId)))
    .returning({ dogId: cartItem.dogId });
  return rows.length > 0;
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
